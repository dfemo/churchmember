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
            toast:
              "group rounded-xl border border-slate-200/80 bg-white shadow-lg backdrop-blur-sm dark:bg-slate-950",
            title: "text-sm font-semibold text-slate-900 dark:text-slate-100",
            description: "text-sm text-slate-600 dark:text-slate-400",
            success: "border-emerald-200/90 dark:border-emerald-900",
            error: "border-rose-200/90 dark:border-rose-900",
            info: "border-sky-200/90 dark:border-sky-900",
          },
        }}
      />
    </QueryClientProvider>
  );
}
