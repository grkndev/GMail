import { authOptions } from "@/lib/auth";
import { CONSTANTS } from "@/lib/utils";
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

    // Inbox için kategori query'leri
    const getCategoryQuery = (category: string) => {
        switch (category.toLowerCase()) {
            case 'primary':
                return 'in:inbox category:primary'
            case 'social':
                return 'in:inbox category:social'
            case 'promotions':
                return 'in:inbox category:promotions'
            case 'updates':
                return 'in:inbox category:updates'
            case 'forums':
                return 'in:inbox category:forums'
            case 'unread':
                return 'in:inbox is:unread'
            case 'important':
                return 'in:inbox is:important'
            case 'starred':
                return 'in:inbox is:starred'
            default:
                return 'in:inbox category:primary'
        }
    }

    const query = getCategoryQuery(category)

    try {
        // 1. Inbox mesaj listesini al
        const fetchUrl = new URL(`${CONSTANTS.BASE_URL}/gmail/v1/users/${(session as any).user.google_id}/messages`)
        const fetchUrlQuery = new URLSearchParams()
        fetchUrlQuery.set("maxResults", maxResults)
        fetchUrlQuery.set("q", query)
        fetchUrlQuery.set("includeSpamTrash", "false") // Spam/trash'i dahil etme
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
                type: 'inbox'
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
        const formattedMessages = messages.map(message => {
            const headers = message.payload?.headers || []

            // Header'lardan gerekli bilgileri çıkar
            const getHeader = (name: string) => {
                const header = headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())
                return header?.value || ''
            }

            const fromHeader = getHeader('From')
            const subjectHeader = getHeader('Subject')
            const dateHeader = getHeader('Date')
            const toHeader = getHeader('To')
            const ccHeader = getHeader('Cc')
            const bccHeader = getHeader('Bcc')

            // From header'ından isim ve email'i ayır
            const parseEmailHeader = (emailString: string) => {
                if (!emailString) return { name: '', email: '' }

                const match = emailString.match(/^(.+?)\s*<(.+?)>$/)
                if (match) {
                    return {
                        name: match[1].replace(/"/g, '').trim(),
                        email: match[2].trim()
                    }
                }
                return {
                    name: emailString.includes('@') ? '' : emailString,
                    email: emailString.includes('@') ? emailString : ''
                }
            }

            const sender = parseEmailHeader(fromHeader)

            // Kategori belirle
            const getMessageCategory = (labelIds: string[]) => {
                if (labelIds?.includes('CATEGORY_SOCIAL')) return 'social'
                if (labelIds?.includes('CATEGORY_PROMOTIONS')) return 'promotions'
                if (labelIds?.includes('CATEGORY_UPDATES')) return 'updates'
                if (labelIds?.includes('CATEGORY_FORUMS')) return 'forums'
                return 'primary'
            }

            // Öncelik seviyesi belirle
            const getPriority = (labelIds: string[]) => {
                if (labelIds?.includes('IMPORTANT')) return 'high'
                if (labelIds?.includes('STARRED')) return 'starred'
                return 'normal'
            }

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
            type: 'inbox',
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