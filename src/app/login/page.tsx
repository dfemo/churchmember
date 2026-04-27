"use client";

import { AuthShell } from "@/components/auth/auth-shell";
import { AuthTextField } from "@/components/auth/auth-text-field";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { useAuth } from "@/contexts/auth-context";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

function AuthDivider() {
  return (
    <div className="relative my-5 flex items-center">
      <div className="grow border-t border-slate-200" />
      <span className="shrink-0 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
        or
      </span>
      <div className="grow border-t border-slate-200" />
    </div>
  );
}

export default function LoginPage() {
  const { isReady, token, mustChangePassword, login, error, clearError } = useAuth();
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isReady) return;
    if (token && mustChangePassword) router.replace("/dashboard/password");
    else if (token) router.replace("/dashboard");
  }, [isReady, token, mustChangePassword, router]);

  useEffect(() => {
    clearError();
  }, [phone, password, clearError]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLocalError(null);
    if (!phone.trim() || !password) {
      setLocalError("Enter your mobile number and password.");
      return;
    }
    setSubmitting(true);
    try {
      await login(phone, password);
    } catch {
      // auth context sets error
    } finally {
      setSubmitting(false);
    }
  }

  if (!isReady) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-[#FAFAFA] p-4">
        <p className="text-sm font-medium text-slate-500">Loading…</p>
      </div>
    );
  }

  if (token) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-[#FAFAFA] p-4">
        <p className="text-sm font-medium text-slate-500">Redirecting…</p>
      </div>
    );
  }

  const showError = localError ?? error;

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Connect with your church community. Sign in to view your member profile, updates, and more."
      cardFooter={
        <p className="mt-5 text-center text-sm text-slate-600">
          New here?{" "}
          <Link
            className="font-semibold text-slate-900 underline decoration-slate-300 decoration-2 underline-offset-2 hover:bg-slate-100"
            href="/register"
          >
            Create an account
          </Link>
        </p>
      }
    >
      <div className="mb-6 text-left">
        <h2 className="text-xl font-bold text-slate-900">Sign in</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
          Use your mobile number and password, or continue with Google.
        </p>
      </div>

      <div className="mb-1">
        <GoogleSignInButton />
      </div>
      <AuthDivider />

      <form onSubmit={onSubmit} className="space-y-4">
        {showError ? (
          <p
            className="border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-medium text-red-900"
            role="alert"
          >
            {showError}
          </p>
        ) : null}

        <AuthTextField
          id="phone"
          label="Mobile number"
          type="tel"
          autoComplete="username"
          inputMode="numeric"
          value={phone}
          onChange={setPhone}
          required
        />
        <AuthTextField
          id="password"
          label="Password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={setPassword}
          required
        />

        <button
          type="submit"
          disabled={submitting}
          className="mt-1 flex h-12 w-full items-center justify-center border-2 border-slate-900 bg-slate-900 text-sm font-semibold text-white transition hover:bg-slate-800 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-slate-900 disabled:opacity-50"
        >
          {submitting ? (
            <span className="flex items-center gap-2">
              <span
                className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
                aria-hidden
              />
              Signing in…
            </span>
          ) : (
            "Sign in"
          )}
        </button>
      </form>
    </AuthShell>
  );
}
