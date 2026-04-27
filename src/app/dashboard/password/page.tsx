"use client";

import { useAuth } from "@/contexts/auth-context";
import { api, getApiErrorMessage } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DashboardPasswordPage() {
  const { mustChangePassword, refreshMe, logout } = useAuth();
  const router = useRouter();
  const [current, setCurrent] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (newPw.length < 8) return setError("New password must be at least 8 characters.");
    if (newPw !== confirm) return setError("New passwords do not match.");
    setSaving(true);
    try {
      await api.post("/api/auth/change-password", {
        currentPassword: current,
        newPassword: newPw,
      });
      await refreshMe();
      router.replace("/dashboard");
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-xl rounded-2xl border border-white/20 bg-white/10 p-5 shadow-sm backdrop-blur-xl">
      <h1 className="text-xl font-semibold text-white">Update password</h1>
      <p className="mt-1 text-sm text-slate-200">
        {mustChangePassword
          ? "Your account requires a new password before continuing."
          : "Set a stronger password to secure your account."}
      </p>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        {error ? (
          <p className="rounded-lg border border-rose-300/40 bg-rose-500/20 px-3 py-2 text-sm text-rose-100">{error}</p>
        ) : null}
        <div>
          <label className="block text-sm font-medium text-slate-100">Current password</label>
          <input
            type="password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            className="mt-1 w-full rounded-lg border border-white/30 bg-white/10 px-3 py-2.5 text-sm text-white"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-100">New password</label>
          <input
            type="password"
            value={newPw}
            onChange={(e) => setNewPw(e.target.value)}
            className="mt-1 w-full rounded-lg border border-white/30 bg-white/10 px-3 py-2.5 text-sm text-white"
            minLength={8}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-100">Confirm new password</label>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="mt-1 w-full rounded-lg border border-white/30 bg-white/10 px-3 py-2.5 text-sm text-white"
            required
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg border border-white/40 bg-white/20 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {saving ? "Updating…" : "Update password"}
        </button>
        {mustChangePassword ? (
          <button
            type="button"
            onClick={() => {
              logout();
              router.push("/login");
            }}
            className="ml-3 text-sm text-slate-200 underline"
          >
            Use a different account
          </button>
        ) : null}
      </form>
    </div>
  );
}
