"use client";

import { useAuth } from "@/contexts/auth-context";
import { GoogleLogin } from "@react-oauth/google";
import { useState } from "react";

const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim() ?? "";

export function GoogleSignInButton() {
  const { loginWithGoogle } = useAuth();
  const [busy, setBusy] = useState(false);

  if (!clientId) {
    return (
      <p className="border border-amber-200 bg-amber-50 px-3 py-2 text-center text-xs text-amber-900">
        Set <code className="font-mono">NEXT_PUBLIC_GOOGLE_CLIENT_ID</code> and{" "}
        <code className="font-mono">Authentication:Google:ClientId</code> to enable Google sign-in.
      </p>
    );
  }

  return (
    <div className="flex w-full min-h-[44px] flex-col items-stretch justify-center">
      {busy && (
        <p className="mb-2 text-center text-xs text-slate-500" aria-live="polite">
          Finishing sign-in with Google…
        </p>
      )}
      <div className="flex justify-center">
        <GoogleLogin
          onSuccess={async (c) => {
            if (!c.credential) return;
            setBusy(true);
            try {
              await loginWithGoogle(c.credential);
            } catch {
              /* error via auth context */
            } finally {
              setBusy(false);
            }
          }}
          onError={() => {
            setBusy(false);
          }}
          useOneTap={false}
          type="standard"
          theme="outline"
          size="large"
          text="continue_with"
          shape="rectangular"
          width="100%"
        />
      </div>
    </div>
  );
}
