"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { useState } from "react";
import { AuthProvider } from "@/contexts/auth-context";

const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim() ?? "";

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  const content = <AuthProvider>{children}</AuthProvider>;

  return (
    <QueryClientProvider client={client}>
      {googleClientId ? (
        <GoogleOAuthProvider clientId={googleClientId}>{content}</GoogleOAuthProvider>
      ) : (
        content
      )}
    </QueryClientProvider>
  );
}
