import { NextAuthOptions } from "next-auth";
import Google from "next-auth/providers/google";


// Check if the required environment variables are set
if (!process.env.NEXTAUTH_SECRET) {
    console.error("Warning: NEXTAUTH_SECRET is not set in the environment variables");
}

export const authOptions: NextAuthOptions = {
    providers: [
        Google({
            clientId: process.env.AUTH_GOOGLE_ID!,
            clientSecret: process.env.AUTH_GOOGLE_SECRET!,
            authorization: {
                params: {
                    scope: "openid profile email https://mail.google.com/"
                }
            }
        })
    ],


    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60, // 30 gün
    },

    callbacks: {
        async jwt({ token, user, account }) {
            if (account) {
                token.accessToken = account.access_token
                token.id_token = account.id_token
            }
            return token
        },
        async session({ session, token }) {
            (session as any).accessToken = token.accessToken as string
            (session as any).id_token = token.id_token as string
            (session as any).user.google_id = token.sub as string
            return session
        }
    },
    debug: process.env.NODE_ENV === "development",
    secret: process.env.NEXTAUTH_SECRET,
}; 