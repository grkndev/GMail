"use client";

import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";

export function AuthProvider({ children }: { children: ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
        {children}
    </SessionProvider>
  );
} 