"use client";

import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";
import { NavigationProvider } from "./navigation-provider";

export function AuthProvider({ children }: { children: ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <NavigationProvider>
        {children}
      </NavigationProvider>
    </SessionProvider>
  );
} 