import { NextResponse, NextRequest } from 'next/server'
import { authOptions } from '../lib/auth'
import { getServerSession } from 'next-auth'
 
// This function can be marked `async` if using `await` inside
export async function middleware(request: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session) {
        return NextResponse.redirect(new URL('/', request.url))
    }
    return NextResponse.next()
}
 
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/:path*',
  ]
}