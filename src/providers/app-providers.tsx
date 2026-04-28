"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { useState } from "react";
import { Toaster } from "sonner";
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
      <Toaster
        position="top-center"
        richColors
        closeButton
        visibleToasts={5}
        toastOptions={{
          classNames: {
            // Do not force bg-white here — it overrides richColors and makes success/error toasts unreadable.
            toast: "group rounded-xl font-sans shadow-lg",
            title: "text-sm font-semibold",
            description: "text-sm opacity-90",
          },
        }}
      />
    </QueryClientProvider>
  );
}
