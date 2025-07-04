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
            { error: "Çok fazla mesaj", details: "Maksimum 100 mesaj aynı anda kalıcı olarak silinebilir" },
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
        // Use Gmail API batchDelete endpoint for permanent bulk deletion
        const fetchUrl = new URL(`${CONSTANTS.BASE_URL}/gmail/v1/users/${(session as any).user.google_id}/messages/batchDelete`)
        
        const requestBody = {
            ids: messageIds
        };

        const response = await fetch(fetchUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        })

        if (!response.ok) {
            const errorData = await response.text();
            throw new Error(`Gmail API error: ${response.status} - ${errorData}`)
        }

        // batchDelete returns empty response on success
        return NextResponse.json({
            success: true,
            message: `${messageIds.length} mesaj kalıcı olarak silindi`,
            deletedCount: messageIds.length,
            deletedIds: messageIds,
            permanent: true
        });

    } catch (error) {
        console.error('Batch Delete API Error:', error)
        return NextResponse.json(
            { 
                error: "Kalıcı silme hatası", 
                details: (error as Error).message,
                success: false
            },
            { status: 500 }
        );
    }
}