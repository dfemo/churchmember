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

export default function RegisterPage() {
  const { isReady, token, mustChangePassword, register, error, clearError } = useAuth();
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isReady) return;
    if (token && mustChangePassword) router.replace("/dashboard/password");
    else if (token) router.replace("/dashboard");
  }, [isReady, token, mustChangePassword, router]);

  useEffect(() => {
    clearError();
  }, [fullName, email, phone, password, confirm, clearError]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLocalError(null);
    if (!fullName.trim()) {
      setLocalError("Enter your full name.");
      return;
    }
    if (!phone.trim() || !password) {
      setLocalError("Enter your mobile number and a password.");
      return;
    }
    if (password.length < 8) {
      setLocalError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setLocalError("Passwords do not match.");
      return;
    }
    setSubmitting(true);
    try {
      await register({
        fullName,
        phoneNumber: phone,
        password,
        email: email.trim() || undefined,
      });
    } catch {
      // context
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
      title="Create your account"
      subtitle="Join the member portal in a few steps. You will use this account to sign in and manage your details."
      cardFooter={
        <p className="mt-5 text-center text-sm text-slate-600">
          Already have an account?{" "}
          <Link
            className="font-semibold text-slate-900 underline decoration-slate-300 decoration-2 underline-offset-2 hover:bg-slate-100"
            href="/login"
          >
            Sign in
          </Link>
        </p>
      }
    >
      <div className="mb-5 text-left">
        <h2 className="text-xl font-bold text-slate-900">Register</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
          Continue with Google, or register with your mobile number and password.
        </p>
      </div>

      <div className="mb-1">
        <GoogleSignInButton />
      </div>
      <AuthDivider />

      <form onSubmit={onSubmit} className="space-y-3">
        {showError ? (
          <p
            className="border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-medium text-red-900"
            role="alert"
          >
            {showError}
          </p>
        ) : null}

        <AuthTextField
          id="fullName"
          label="Full name"
          autoComplete="name"
          value={fullName}
          onChange={setFullName}
          required
        />
        <AuthTextField
          id="email"
          label="Email (optional)"
          type="email"
          autoComplete="email"
          value={email}
          onChange={setEmail}
        />
        <AuthTextField
          id="registerPhone"
          label="Mobile number"
          type="tel"
          autoComplete="tel"
          inputMode="numeric"
          value={phone}
          onChange={setPhone}
          required
        />
        <AuthTextField
          id="registerPassword"
          label="Password (min. 8 characters)"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={setPassword}
          required
        />
        <AuthTextField
          id="confirm"
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={setConfirm}
          required
        />

        <button
          type="submit"
          disabled={submitting}
          className="mt-1 flex h-12 w-full items-center justify-center border-2 border-slate-900 bg-slate-900 text-sm font-semibold text-white transition hover:bg-slate-800 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-slate-900 disabled:opacity-50"
        >
          {submitting ? "Creating account…" : "Create account"}
        </button>
      </form>
    </AuthShell>
  );
}
