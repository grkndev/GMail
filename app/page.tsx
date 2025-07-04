"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import Image from "next/image";

export default function Home() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <main className="flex w-full bg-gray-100 h-screen items-center justify-center">
        <div className="text-lg">Loading...</div>
      </main>
    );
  }

  return (
    <main className="flex w-full bg-gray-50 h-screen">
      <div className="bg-white w-1/2 h-full flex flex-col items-center justify-center p-8 shadow-lg">
        <div className="max-w-md w-full space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Gmail Clone</h1>
            <p className="text-gray-600">NextAuth ile Google Authentication</p>
          </div>

          {!session ? (
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-gray-700 mb-4">Devam etmek için Google hesabınızla giriş yapın</p>
                <button
                  onClick={() => signIn("google")}
                  className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 rounded-lg px-6 py-3 text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Google ile Giriş Yap
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-center">
                <div className="mb-4">
                  {session.user?.image && (
                    <Image
                      src={session.user.image}
                      alt="Profile"
                      width={80}
                      height={80}
                      className="rounded-full mx-auto mb-4"
                    />
                  )}
                  <h2 className="text-xl font-semibold text-gray-900">
                    Hoş geldiniz, {session.user?.name}!
                  </h2>
                  <p className="text-gray-600">{session.user?.email}</p>
                </div>
                <div className="space-y-3">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-green-800">✅ Google hesabınızla başarıyla giriş yaptınız!</p>
                  </div>
                  <button
                    onClick={() => signOut()}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                  >
                    Çıkış Yap
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="bg-blue-50 w-1/2 h-full flex items-center justify-center">
        <div className="text-center text-blue-600">
          <div className="text-6xl mb-4">📧</div>
          <h3 className="text-2xl font-semibold">Gmail Interface</h3>
          <p className="text-blue-500 mt-2">Authentication tamamlandıktan sonra dashboard erişimi</p>
        </div>
      </div>
    </main>
  );
}
