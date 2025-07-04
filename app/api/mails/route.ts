import { authOptions } from "@/lib/auth";
import { CONSTANTS } from "@/lib/utils";
import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const session = await getServerSession(authOptions)
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const accessToken = session.accessToken
    const url = new URL(request.url)
    const pageToken = url.searchParams.get('pageToken')
    const maxResults = url.searchParams.get('maxResults') || '20'
    const category = url.searchParams.get('category') || 'primary'
    
    // Gmail kategorileri için query'leri tanımla
    const getCategoryQuery = (category) => {
        switch (category.toLowerCase()) {
            case 'primary':
                return 'category:primary'
            case 'social':
                return 'category:social'
            case 'promotions':
                return 'category:promotions'
            case 'updates':
                return 'category:updates'
            case 'forums':
                return 'category:forums'
            case 'unread':
                return 'is:unread'
            case 'sent':
                return 'in:sent'
            case 'drafts':
                return 'in:drafts'
            case 'trash':
                return 'in:trash'
            case 'spam':
                return 'in:spam'
            default:
                return 'category:primary'
        }
    }
    
    const query = getCategoryQuery(category)

    try {
        // 1. Mesaj listesini al
        const fetchUrl = new URL(`${CONSTANTS.BASE_URL}/gmail/v1/users/${session.user.google_id}/messages`)
        const fetchUrlQuery = new URLSearchParams()
        fetchUrlQuery.set("maxResults", maxResults)
        fetchUrlQuery.set("q", query)
        fetchUrlQuery.set("includeSpamTrash", "false")
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
                resultSizeEstimate: listData.resultSizeEstimate || 0
            });
        }

        // 2. Her mesaj için metadata al (paralel)
        const messagePromises = listData.messages.map(message => 
            fetch(`${CONSTANTS.BASE_URL}/gmail/v1/users/${session.user.google_id}/messages/${message.id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date&metadataHeaders=To&metadataHeaders=Cc`, {
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

        // 3. Mesajları frontend için uygun formata çevir
        const formattedMessages = messages.map(message => {
            const headers = message.payload?.headers || []
            
            // Header'lardan gerekli bilgileri çıkar
            const getHeader = (name) => {
                const header = headers.find(h => h.name.toLowerCase() === name.toLowerCase())
                return header?.value || ''
            }

            const fromHeader = getHeader('From')
            const subjectHeader = getHeader('Subject')
            const dateHeader = getHeader('Date')
            const toHeader = getHeader('To')
            const ccHeader = getHeader('Cc')

            // From header'ından isim ve email'i ayır
            const parseFromHeader = (from) => {
                if (!from) return { name: '', email: '' }
                
                const match = from.match(/^(.+?)\s*<(.+?)>$/)
                if (match) {
                    return {
                        name: match[1].replace(/"/g, '').trim(),
                        email: match[2].trim()
                    }
                }
                return {
                    name: from.includes('@') ? '' : from,
                    email: from.includes('@') ? from : ''
                }
            }

            const sender = parseFromHeader(fromHeader)

            // Kategoriye göre sınıflandır
            const getMessageCategory = (labelIds) => {
                if (labelIds?.includes('CATEGORY_SOCIAL')) return 'social'
                if (labelIds?.includes('CATEGORY_PROMOTIONS')) return 'promotions'
                if (labelIds?.includes('CATEGORY_UPDATES')) return 'updates'
                if (labelIds?.includes('CATEGORY_FORUMS')) return 'forums'
                return 'primary'
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
                from: sender,
                subject: subjectHeader || '(Konu yok)',
                date: dateHeader,
                to: toHeader,
                cc: ccHeader,
                // Tarih formatı
                formattedDate: dateHeader ? new Date(dateHeader).toLocaleString('tr-TR') : '',
                // Kategori
                category: getMessageCategory(message.labelIds),
                // Okunmamış mı?
                isUnread: message.labelIds?.includes('UNREAD') || false,
                // Önemli mi?
                isImportant: message.labelIds?.includes('IMPORTANT') || false,
                // Spam/Trash kontrolü
                isSpam: message.labelIds?.includes('SPAM') || false,
                isTrash: message.labelIds?.includes('TRASH') || false
            }
        })

        return NextResponse.json({ 
            messages: formattedMessages,
            nextPageToken: listData.nextPageToken,
            resultSizeEstimate: listData.resultSizeEstimate || 0,
            category: category
        });

    } catch (error) {
        console.error('Gmail API Error:', error)
        return NextResponse.json(
            { error: "Gmail API hatası", details: error.message }, 
            { status: 500 }
        );
    }
}