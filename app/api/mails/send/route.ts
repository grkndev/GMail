import { authOptions } from "@/lib/auth";
import { CONSTANTS } from "@/lib/utils";
import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    const session = await getServerSession(authOptions)
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const accessToken = (session as any).accessToken

    try {
        const body = await request.json()
        const { to, cc, bcc, subject, body: emailBody, attachments } = body

        // Validate required fields
        if (!to || !Array.isArray(to) || to.length === 0) {
            return NextResponse.json({ error: "At least one recipient is required" }, { status: 400 });
        }

        if (!subject || !subject.trim()) {
            return NextResponse.json({ error: "Subject is required" }, { status: 400 });
        }

        if (!emailBody || !emailBody.trim()) {
            return NextResponse.json({ error: "Email body is required" }, { status: 400 });
        }

        // Validate attachments if present
        if (attachments && Array.isArray(attachments)) {
            for (const attachment of attachments) {
                if (!attachment.name || !attachment.type || !attachment.data) {
                    return NextResponse.json({ 
                        error: "Invalid attachment data. Name, type, and data are required." 
                    }, { status: 400 });
                }
                
                // Check attachment size (base64 encoded size should be reasonable)
                if (attachment.data.length > 35 * 1024 * 1024) { // ~26MB original file size
                    return NextResponse.json({ 
                        error: `Attachment ${attachment.name} is too large. Maximum size is 25MB.` 
                    }, { status: 400 });
                }
            }
        }

        // Generate a unique boundary for MIME multipart
        const generateBoundary = () => {
            return `boundary_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        }

        // Build email message in RFC 2822 format with MIME multipart support
        const buildEmailMessage = () => {
            const hasAttachments = attachments && attachments.length > 0
            const boundary = hasAttachments ? generateBoundary() : null
            
            let message = ""
            
            // Recipients
            message += `To: ${to.join(', ')}\r\n`
            
            if (cc && cc.length > 0) {
                message += `Cc: ${cc.join(', ')}\r\n`
            }
            
            if (bcc && bcc.length > 0) {
                message += `Bcc: ${bcc.join(', ')}\r\n`
            }
            
            // Subject
            message += `Subject: ${subject}\r\n`
            
            // MIME Headers
            message += `MIME-Version: 1.0\r\n`
            
            if (hasAttachments) {
                message += `Content-Type: multipart/mixed; boundary="${boundary}"\r\n`
            } else {
                message += `Content-Type: text/html; charset=utf-8\r\n`
            }
            
            message += `\r\n`
            
            if (hasAttachments) {
                // Add body as first part
                message += `--${boundary}\r\n`
                message += `Content-Type: text/html; charset=utf-8\r\n`
                message += `Content-Transfer-Encoding: 7bit\r\n`
                message += `\r\n`
            }
            
            // Body - Convert markdown-like formatting to basic HTML
            let htmlBody = emailBody
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
                .replace(/\*(.*?)\*/g, '<em>$1</em>') // Italic
                .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>') // Links
                .replace(/\n/g, '<br>') // Line breaks
            
            message += htmlBody
            
            if (hasAttachments) {
                message += `\r\n`
                
                // Add each attachment
                attachments.forEach((attachment: any) => {
                    message += `--${boundary}\r\n`
                    message += `Content-Type: ${attachment.type}; name="${attachment.name}"\r\n`
                    message += `Content-Transfer-Encoding: base64\r\n`
                    message += `Content-Disposition: attachment; filename="${attachment.name}"\r\n`
                    message += `\r\n`
                    
                    // Add base64 data with line breaks every 76 characters (RFC requirement)
                    const base64Data = attachment.data
                    const chunks = base64Data.match(/.{1,76}/g) || []
                    message += chunks.join('\r\n')
                    message += `\r\n`
                })
                
                // Close boundary
                message += `--${boundary}--\r\n`
            }
            
            return message
        }

        const emailMessage = buildEmailMessage()
        
        // Encode message in base64url format
        const encodedMessage = Buffer.from(emailMessage)
            .toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '')

        // Send email via Gmail API
        const response = await fetch(
            `${CONSTANTS.BASE_URL}/gmail/v1/users/me/messages/send`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    raw: encodedMessage
                })
            }
        )

        if (!response.ok) {
            const errorData = await response.text()
            console.error('Gmail API send error:', errorData)
            throw new Error(`Gmail API error: ${response.status} - ${errorData}`)
        }

        const result = await response.json()
        
        return NextResponse.json({ 
            success: true, 
            messageId: result.id,
            message: "Email sent successfully" 
        })

    } catch (error) {
        console.error("Send email error:", error)
        return NextResponse.json(
            { 
                error: error instanceof Error ? error.message : "Failed to send email",
                details: "An error occurred while sending the email. Please try again."
            }, 
            { status: 500 }
        )
    }
} 