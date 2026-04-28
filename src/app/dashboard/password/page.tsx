"use client";

import { useAuth } from "@/contexts/auth-context";
import { api, getApiErrorMessage } from "@/lib/api";
import { notifyErr, notifyOk } from "@/lib/notify";
import { Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DashboardPasswordPage() {
  const { mustChangePassword, refreshMe, logout } = useAuth();
  const router = useRouter();
  const [current, setCurrent] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (newPw.length < 8) {
      notifyErr("Password too short", "New password must be at least 8 characters.");
      return;
    }
    if (newPw !== confirm) {
      notifyErr("Password mismatch", "New passwords do not match.");
      return;
    }
    setSaving(true);
    try {
      await api.post("/api/auth/change-password", {
        currentPassword: current,
        newPassword: newPw,
      });
      await refreshMe();
      notifyOk("Password updated successfully.");
      router.replace("/dashboard");
    } catch (err) {
      notifyErr("Could not update password", getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-xl rounded-2xl border border-slate-200 bg-white/85 p-6 shadow-sm backdrop-blur-xl">
      <h1 className="text-xl font-semibold text-slate-900">Update password</h1>
      <p className="mt-1 text-sm text-slate-500">
        {mustChangePassword
          ? "Your account requires a new password before continuing."
          : "Set a stronger password to secure your account."}
      </p>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700">Current password</label>
          <div className="mt-1 flex w-full items-center rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 focus-within:border-cyan-400 focus-within:bg-white">
            <input
              type={showCurrent ? "text" : "password"}
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              className="w-full bg-transparent text-sm text-slate-900 outline-none"
              required
            />
            <button
              type="button"
              onClick={() => setShowCurrent((v) => !v)}
              className="rounded-md p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
              aria-label={showCurrent ? "Hide current password" : "Show current password"}
            >
              {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">New password</label>
          <div className="mt-1 flex w-full items-center rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 focus-within:border-cyan-400 focus-within:bg-white">
            <input
              type={showNew ? "text" : "password"}
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              className="w-full bg-transparent text-sm text-slate-900 outline-none"
              minLength={8}
              required
            />
            <button
              type="button"
              onClick={() => setShowNew((v) => !v)}
              className="rounded-md p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
              aria-label={showNew ? "Hide new password" : "Show new password"}
            >
              {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Confirm new password</label>
          <div className="mt-1 flex w-full items-center rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 focus-within:border-cyan-400 focus-within:bg-white">
            <input
              type={showConfirm ? "text" : "password"}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full bg-transparent text-sm text-slate-900 outline-none"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="rounded-md p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
              aria-label={showConfirm ? "Hide confirm password" : "Show confirm password"}
            >
              {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
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
            className="ml-3 text-sm text-slate-500 underline"
          >
            Use a different account
          </button>
        ) : null}
      </form>
    </div>
  );
}
