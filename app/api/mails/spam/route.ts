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
        fetchUrlQuery.set("labelIds", "SPAM")
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
                type: 'spam'
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
                isInInbox: true,
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
            type: 'spam',
            hasMore: !!listData.nextPageToken
        });

    } catch (error) {
        console.error('Inbox API Error:', error)
        return NextResponse.json(
            { error: "Inbox API hatası", details: (error as Error).message },
            { status: 500 }
        );
    }
}