import { authOptions } from "@/lib/auth";
import { buildEmailMessage, CONSTANTS, generateBoundary } from "@/lib/utils";
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





        const emailMessage = buildEmailMessage(attachments, to, cc, bcc, subject, emailBody)

        // Encode message in base64url format
        const encodedMessage = Buffer.from(emailMessage)
            .toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '')

        // Send email via Gmail API
        const response = await fetch(
            `${CONSTANTS.BASE_URL}/gmail/v1/users/${(session as any).user.google_id}/messages/send`,
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