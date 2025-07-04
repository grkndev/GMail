import { authOptions } from "@/lib/auth";
import { CONSTANTS } from "@/lib/utils";
import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ messageID: string; attachmentId: string }> }
) {
    const { messageID, attachmentId } = await params
    const session = await getServerSession(authOptions)
    
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const accessToken = (session as any).accessToken

    try {
        // Fetch attachment from Gmail API
        const response = await fetch(
            `${CONSTANTS.BASE_URL}/gmail/v1/users/${(session as any).user.google_id}/messages/${messageID}/attachments/${attachmentId}`,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            }
        )

        if (!response.ok) {
            throw new Error(`Gmail API error: ${response.status}`)
        }

        const attachmentData = await response.json()
        
        // Return the attachment data
        return NextResponse.json({
            attachmentId: attachmentData.attachmentId,
            size: attachmentData.size,
            data: attachmentData.data // Base64 encoded data
        })

    } catch (error) {
        console.error("Fetch attachment error:", error)
        return NextResponse.json(
            { 
                error: error instanceof Error ? error.message : "Failed to fetch attachment",
                details: "An error occurred while fetching the attachment."
            }, 
            { status: 500 }
        )
    }
} 