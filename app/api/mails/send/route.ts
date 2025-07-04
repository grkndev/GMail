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

        // Build email message in RFC 2822 format
        const buildEmailMessage = () => {
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
            
            // Headers
            message += `Content-Type: text/html; charset=utf-8\r\n`
            message += `MIME-Version: 1.0\r\n`
            message += `\r\n`
            
            // Body - Convert markdown-like formatting to basic HTML
            let htmlBody = emailBody
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
                .replace(/\*(.*?)\*/g, '<em>$1</em>') // Italic
                .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>') // Links
                .replace(/\n/g, '<br>') // Line breaks
            
            message += htmlBody
            
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