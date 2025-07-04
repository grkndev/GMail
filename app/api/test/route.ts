import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";




const BASE_URL = "https://gmail.googleapis.com"
export async function GET(request: Request) {
    const session = await getServerSession(authOptions)
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // return NextResponse.json({ session });

    //TESTING GOOGLE API
    const accessToken = session.accessToken
    const response = await fetch(`${BASE_URL}/gmail/v1/users/me/messages`, {
        headers: {
            Authorization: `Bearer ${accessToken}`
        }
    })
    const data = await response.json()
    return NextResponse.json({ data });
}