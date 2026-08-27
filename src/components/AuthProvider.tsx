"use client";
import { SessionProvider } from "next-auth/react";
export default function AuthProvider({ children }: { children: React.ReactNode }) {
  // basePath ensures SessionProvider doesn't need NEXTAUTH_URL at build time
  return <SessionProvider basePath="/api/auth">{children}</SessionProvider>;
}
