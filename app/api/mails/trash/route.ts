import { authOptions } from "@/lib/auth";
import { CONSTANTS, getHeader, getMessageCategory, getPriority, parseEmailHeader } from "@/lib/utils";
import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const session = await getServerSession(authOptions)
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const accessToken = (session as any).accessToken
    const url = new URL(request.url)
    const pageToken = url.searchParams.get('pageToken')
    const maxResults = url.searchParams.get('maxResults') || '20'
    const category = url.searchParams.get('category') || 'primary'


    try {
        // 1. Inbox mesaj listesini al
        const fetchUrl = new URL(`${CONSTANTS.BASE_URL}/gmail/v1/users/${(session as any).user.google_id}/messages`)
        const fetchUrlQuery = new URLSearchParams()
        fetchUrlQuery.set("maxResults", maxResults)
        fetchUrlQuery.set("labelIds", "TRASH")
        if (pageToken) {
            fetchUrlQuery.set("pageToken", pageToken)
        }
        fetchUrl.search = fetchUrlQuery.toString()

        const listResponse = await fetch(fetchUrl, {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        })

        if (!listResponse.ok) {
            throw new Error(`Gmail API error: ${listResponse.status}`)
        }

        const listData = await listResponse.json()

        if (!listData.messages || listData.messages.length === 0) {
            return NextResponse.json({
                messages: [],
                nextPageToken: listData.nextPageToken,
                resultSizeEstimate: listData.resultSizeEstimate || 0,
                category: category,
                type: 'trash'
            });
        }

        // 2. Her mesaj için metadata al (paralel)
        const messagePromises = listData.messages.map((message: any) =>
            fetch(`${CONSTANTS.BASE_URL}/gmail/v1/users/${(session as any).user.google_id}/messages/${message.id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date&metadataHeaders=To&metadataHeaders=Cc&metadataHeaders=Bcc`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            }).then(res => {
                if (!res.ok) {
                    throw new Error(`Message fetch error: ${res.status}`)
                }
                return res.json()
            })
        )

        const messages = await Promise.all(messagePromises)

        // 3. Inbox mesajlarını frontend için formatla
        const formattedMessages = messages.map((message: any) => {
            const headers = message.payload?.headers || []

            const fromHeader = getHeader('From', headers)
            const subjectHeader = getHeader('Subject', headers)
            const dateHeader = getHeader('Date', headers)
            const toHeader = getHeader('To', headers)
            const ccHeader = getHeader('Cc', headers)
            const bccHeader = getHeader('Bcc', headers)

            const sender = parseEmailHeader(fromHeader)

            return {
                id: message.id,
                threadId: message.threadId,
                labelIds: message.labelIds || [],
                snippet: message.snippet || '',
                historyId: message.historyId,
                internalDate: message.internalDate,
                sizeEstimate: message.sizeEstimate,

                // Formatlanmış veriler
                from_name: sender.name,
                from_email: sender.email,
                subject: subjectHeader || '(Konu yok)',
                date: dateHeader,
                to: toHeader,
                cc: ccHeader,
                bcc: bccHeader,

                // Tarih formatları
                rawDate: dateHeader,
                formattedDate: dateHeader ? new Date(dateHeader).toLocaleString('tr-TR') : '',
                timestamp: dateHeader ? new Date(dateHeader).getTime() : 0,

                // Kategori ve etiketler
                category: getMessageCategory(message.labelIds),
                priority: getPriority(message.labelIds),

                // Durumlar
                isUnread: message.labelIds?.includes('UNREAD') || false,
                isImportant: message.labelIds?.includes('IMPORTANT') || false,
                isStarred: message.labelIds?.includes('STARRED') || false,

                // Inbox'a özel özellikler
                isInInbox: false,
                hasAttachments: message.payload?.parts?.some((part: any) => part.filename) || false,

                // Thread bilgisi
                threadLength: 1 // Bu değer thread detayından alınabilir
            }
        })

        // Tarihe göre sırala (en yeni üstte)
        const sortedMessages = formattedMessages.sort((a, b) => b.timestamp - a.timestamp)

        return NextResponse.json({
            messages: sortedMessages,
            nextPageToken: listData.nextPageToken,
            resultSizeEstimate: listData.resultSizeEstimate || 0,
            category: category,
            type: 'trash',
            hasMore: !!listData.nextPageToken
        });

    } catch (error) {
        console.error('Trash API Error:', error)
        return NextResponse.json(
            { error: "Trash API hatası", details: (error as Error).message },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    const session = await getServerSession(authOptions)
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const accessToken = (session as any).accessToken
    const body = await request.json()
    const { messageIds }: { messageIds: string[] } = body

    // Validation for message IDs
    if (!Array.isArray(messageIds) || messageIds.length === 0) {
        return NextResponse.json(
            { error: "Geçersiz istek", details: "En az bir mesaj ID'si gereklidir" },
            { status: 400 }
        );
    }

    if (messageIds.length > 100) {
        return NextResponse.json(
            { error: "Çok fazla mesaj", details: "Maksimum 100 mesaj aynı anda silinebilir" },
            { status: 400 }
        );
    }

    // Validate that all IDs are strings and not empty
    const invalidIds = messageIds.filter(id => !id || typeof id !== 'string' || id.trim() === '');
    if (invalidIds.length > 0) {
        return NextResponse.json(
            { error: "Geçersiz mesaj ID'leri", details: "Tüm mesaj ID'leri geçerli string değerler olmalıdır" },
            { status: 400 }
        );
    }

    try {
        // Use Gmail API trash endpoint for each message (parallel calls)
        // Note: Gmail API doesn't have batch trash operation, so we use parallel individual calls
        const trashPromises = messageIds.map(messageId =>
            fetch(`${CONSTANTS.BASE_URL}/gmail/v1/users/${(session as any).user.google_id}/messages/${messageId}/trash`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            }).then(async (response) => {
                if (!response.ok) {
                    const errorData = await response.text();
                    throw new Error(`Gmail API error for message ${messageId}: ${response.status} - ${errorData}`)
                }
                return { messageId, success: true };
            }).catch(error => {
                console.error(`Error trashing message ${messageId}:`, error);
                return { messageId, success: false, error: error.message };
            })
        );

        const results = await Promise.all(trashPromises);

        // Separate successful and failed operations
        const successful = results.filter(result => result.success);
        const failed = results.filter(result => !result.success);

        // Return response with detailed results
        return NextResponse.json({
            success: successful.length > 0,
            message: failed.length === 0
                ? `${successful.length} mesaj başarıyla çöp kutusuna taşındı`
                : `${successful.length} mesaj çöp kutusuna taşındı, ${failed.length} mesaj başarısız`,
            totalCount: messageIds.length,
            successCount: successful.length,
            failedCount: failed.length,
            successfulIds: successful.map(r => r.messageId),
            failedIds: failed.map(r => r.messageId),
            errors: failed.length > 0 ? failed.map(r => ({ messageId: r.messageId, error: (r as any).error })) : undefined
        });

    } catch (error) {
        console.error('Trash API Error:', error)
        return NextResponse.json(
            {
                error: "Çöp kutusuna taşıma hatası",
                details: (error as Error).message,
                success: false
            },
            { status: 500 }
        );
    }
}