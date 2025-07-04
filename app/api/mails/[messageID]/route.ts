import { authOptions } from "@/lib/auth";
import { CONSTANTS } from "@/lib/utils";
import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ messageID: string }> }
) {
    const { messageID } = await params
    const session = await getServerSession(authOptions)
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const accessToken = (session as any).accessToken

    try {
        // Fetch full message content including body
        const response = await fetch(
            `${CONSTANTS.BASE_URL}/gmail/v1/users/${(session as any).user.google_id}/messages/${messageID}?format=full`,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            }
        )

        if (!response.ok) {
            throw new Error(`Gmail API error: ${response.status}`)
        }

        const message = await response.json()

        // Parse headers
        const headers = message.payload?.headers || []
        const getHeader = (name: string) => {
            const header = headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())
            return header?.value || ''
        }

        // Parse email addresses
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

        // Extract email body
        const extractBody = (payload: any): { text: string; html: string } => {
            let textBody = ''
            let htmlBody = ''

            const extractFromParts = (parts: any[]): void => {
                for (const part of parts) {
                    if (part.parts) {
                        extractFromParts(part.parts)
                    } else if (part.body?.data) {
                        const decodedData = Buffer.from(part.body.data, 'base64').toString('utf-8')
                        
                        if (part.mimeType === 'text/plain') {
                            textBody = decodedData
                        } else if (part.mimeType === 'text/html') {
                            htmlBody = decodedData
                        }
                    }
                }
            }

            if (payload.parts) {
                extractFromParts(payload.parts)
            } else if (payload.body?.data) {
                const decodedData = Buffer.from(payload.body.data, 'base64').toString('utf-8')
                if (payload.mimeType === 'text/plain') {
                    textBody = decodedData
                } else if (payload.mimeType === 'text/html') {
                    htmlBody = decodedData
                }
            }

            return { text: textBody, html: htmlBody }
        }

        const sender = parseEmailHeader(getHeader('From'))
        const recipient = parseEmailHeader(getHeader('To'))
        const body = extractBody(message.payload)

        // Extract attachments
        const extractAttachments = (payload: any): any[] => {
            const attachments: any[] = []

            const extractFromParts = (parts: any[]): void => {
                for (const part of parts) {
                    if (part.parts) {
                        extractFromParts(part.parts)
                    } else if (part.filename && part.body?.attachmentId) {
                        attachments.push({
                            filename: part.filename,
                            mimeType: part.mimeType,
                            size: part.body.size,
                            attachmentId: part.body.attachmentId
                        })
                    }
                }
            }

            if (payload.parts) {
                extractFromParts(payload.parts)
            }

            return attachments
        }

        const formattedMessage = {
            id: message.id,
            threadId: message.threadId,
            labelIds: message.labelIds || [],
            snippet: message.snippet || '',
            historyId: message.historyId,
            internalDate: message.internalDate,
            sizeEstimate: message.sizeEstimate,

            // Headers
            from_name: sender.name,
            from_email: sender.email,
            to_name: recipient.name,
            to_email: recipient.email || getHeader('To'),
            subject: getHeader('Subject') || '(Konu yok)',
            date: getHeader('Date'),
            cc: getHeader('Cc'),
            bcc: getHeader('Bcc'),

            // Body content
            body: {
                text: body.text,
                html: body.html
            },

            // Attachments
            attachments: extractAttachments(message.payload),

            // Formatted date
            formattedDate: getHeader('Date') ? new Date(getHeader('Date')).toLocaleString('tr-TR') : '',

            // Status flags
            isUnread: message.labelIds?.includes('UNREAD') || false,
            isImportant: message.labelIds?.includes('IMPORTANT') || false,
            isStarred: message.labelIds?.includes('STARRED') || false,
            isSpam: message.labelIds?.includes('SPAM') || false,
            isTrash: message.labelIds?.includes('TRASH') || false,

            // Category
            category: message.labelIds?.includes('CATEGORY_SOCIAL') ? 'social' :
                     message.labelIds?.includes('CATEGORY_PROMOTIONS') ? 'promotions' :
                     message.labelIds?.includes('CATEGORY_UPDATES') ? 'updates' :
                     message.labelIds?.includes('CATEGORY_FORUMS') ? 'forums' : 'primary'
        }

        return NextResponse.json({ message: formattedMessage })

    } catch (error) {
        console.error('Fetch Message API Error:', error)
        return NextResponse.json(
            { 
                error: "Email yüklenirken hata oluştu", 
                details: (error as Error).message 
            },
            { status: 500 }
        )
    }
} 