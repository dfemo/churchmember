"use client";

import { useAuth } from "@/contexts/auth-context";
import { api, getApiErrorMessage } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function ChangePasswordPage() {
  const { isReady, token, mustChangePassword, refreshMe, logout } = useAuth();
  const router = useRouter();
  const [current, setCurrent] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isReady) return;
    if (!token) router.replace("/login");
  }, [isReady, token, router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (newPw.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    if (newPw !== confirm) {
      setError("New passwords do not match.");
      return;
    }
    setSaving(true);
    try {
      await api.post("/api/auth/change-password", {
        currentPassword: current,
        newPassword: newPw,
      });
      await refreshMe();
      router.replace("/member");
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  if (!isReady || !token) {
    return (
      <div className="flex min-h-svh items-center justify-center p-4">
        <p className="text-stone-500">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-svh flex flex-col justify-center px-4 py-8">
      <div className="mx-auto w-full max-w-sm">
        <h1 className="text-center text-2xl font-semibold text-stone-800">
          Set a new password
        </h1>
        <p className="mt-1 text-center text-sm text-stone-500">
          {mustChangePassword
            ? "Your account requires a new password before you continue."
            : "Update your password."}
        </p>
        <form
          onSubmit={onSubmit}
          className="mt-8 space-y-4 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm"
        >
          {error ? (
            <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800" role="alert">
              {error}
            </p>
          ) : null}
          <div>
            <label htmlFor="cur" className="block text-sm font-medium text-stone-700">
              Current password
            </label>
            <input
              id="cur"
              name="cur"
              type="password"
              autoComplete="current-password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2.5 text-base outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600"
              required
            />
          </div>
          <div>
            <label htmlFor="np" className="block text-sm font-medium text-stone-700">
              New password
            </label>
            <input
              id="np"
              name="np"
              type="password"
              autoComplete="new-password"
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2.5 text-base outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600"
              minLength={8}
              required
            />
            <p className="mt-1 text-xs text-stone-500">At least 8 characters</p>
          </div>
          <div>
            <label htmlFor="cf" className="block text-sm font-medium text-stone-700">
              Confirm new password
            </label>
            <input
              id="cf"
              name="cf"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2.5 text-base outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600"
              required
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-xl bg-amber-700 py-3 text-sm font-medium text-white shadow-sm hover:bg-amber-800 disabled:opacity-60"
          >
            {saving ? "Saving…" : "Update password"}
          </button>
          {mustChangePassword ? (
            <button
              type="button"
              onClick={() => {
                logout();
                router.push("/login");
              }}
              className="w-full text-sm text-stone-500 underline"
            >
              Use a different account
            </button>
          ) : null}
        </form>
      </div>
    </div>
  );
}
