"use client";

import { api, getApiErrorMessage } from "@/lib/api";
import { notifyErr, notifyOk } from "@/lib/notify";
import { mergePicklistWithCurrent } from "@/lib/merge-profile-picklists";
import { getE164OptionsFromEnv, toE164Digits } from "@/lib/phone-e164";
import { SearchableMemberSelect } from "@/components/user-management/searchable-member-select";
import { Eye, EyeOff } from "lucide-react";
import type { CreateMemberRequest, MemberListItem, MemberProfile } from "@/types/member";
import type { ProfileFieldOptionsBundle } from "@/types/profile-field-options";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type CreateForm = {
  fullName: string;
  phoneNumber: string;
  email: string;
  dateOfBirth: string;
  address: string;
  title: string;
  position: string;
  status: "Active" | "Inactive";
  role: "Admin" | "Member";
  fatherUserId: number | null;
  motherUserId: number | null;
  defaultPassword: string;
  confirmPassword: string;
};

const emptyForm = (): CreateForm => ({
  fullName: "",
  phoneNumber: "",
  email: "",
  dateOfBirth: "",
  address: "",
  title: "",
  position: "",
  status: "Active",
  role: "Member",
  fatherUserId: null,
  motherUserId: null,
  defaultPassword: "",
  confirmPassword: "",
});

export default function CreateUserPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<CreateForm>(emptyForm);
  const [showDefaultPassword, setShowDefaultPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const bundleQ = useQuery({
    queryKey: ["profile-field-options-bundle"],
    queryFn: async () => (await api.get<ProfileFieldOptionsBundle>("/api/profile-field-options")).data,
    staleTime: 60_000,
  });
  const membersQ = useQuery({
    queryKey: ["members-list"],
    queryFn: async () => (await api.get<MemberListItem[]>("/api/members")).data,
  });

  const titleChoices = useMemo(
    () => mergePicklistWithCurrent(null, bundleQ.data?.titles ?? []),
    [bundleQ.data?.titles]
  );
  const positionChoices = useMemo(
    () => mergePicklistWithCurrent(null, bundleQ.data?.positions ?? []),
    [bundleQ.data?.positions]
  );

  const create = useMutation({
    mutationFn: async (body: CreateMemberRequest) => {
      const { data } = await api.post<MemberProfile>("/api/members", body);
      return data;
    },
    onSuccess: async () => {
      notifyOk("User created successfully.");
      await queryClient.invalidateQueries({ queryKey: ["members-list"] });
      router.push("/dashboard/user-management");
    },
    onError: (e: unknown) => {
      notifyErr("Could not create user", getApiErrorMessage(e));
    },
  });

  return (
    <div className="space-y-4">
      <div>
        <nav className="mb-2 text-xs text-slate-500">
          <Link href="/dashboard/user-management" className="font-medium text-violet-700 hover:underline">
            User management
          </Link>
          <span className="mx-1.5 text-slate-400">/</span>
          <span className="text-slate-700">Create new user</span>
        </nav>
        <h1 className="text-2xl font-semibold text-slate-900">Create new user</h1>
        <p className="mt-1 text-sm text-slate-500">
          Add a member or admin with the same profile fields as when editing a user. They must sign in with phone and the
          initial password you set (they will be prompted to change it).
        </p>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm">
        <form
          className="grid gap-3 md:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (form.defaultPassword !== form.confirmPassword) {
              notifyErr("Password mismatch", "Password and confirmation do not match.");
              return;
            }
            if (form.defaultPassword.length < 8) {
              notifyErr("Password too short", "Initial password must be at least 8 characters.");
              return;
            }
            const trimmedPhone = form.phoneNumber.trim();
            let phoneDigits = "";
            if (!trimmedPhone) {
              if (!form.fatherUserId && !form.motherUserId) {
                notifyErr("Mobile number required", "Set father and/or mother if this member has no phone number.");
                return;
              }
            } else {
              const opt = getE164OptionsFromEnv();
              const e164 = toE164Digits(trimmedPhone, opt);
              if (!e164.ok) {
                notifyErr("Invalid phone number", e164.error);
                return;
              }
              phoneDigits = e164.digits;
            }
            const body: CreateMemberRequest = {
              fullName: form.fullName.trim(),
              phoneNumber: phoneDigits,
              email: form.email.trim() || null,
              dateOfBirth: form.dateOfBirth || null,
              address: form.address.trim() || null,
              title: form.title.trim() || null,
              position: form.position.trim() || null,
              status: form.status,
              role: form.role,
              fatherUserId: form.fatherUserId,
              motherUserId: form.motherUserId,
              defaultPassword: form.defaultPassword,
            };
            create.mutate(body);
          }}
        >
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-slate-600">Full name</label>
            <input
              required
              className="mt-1 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
              value={form.fullName}
              onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
            />
          </div>
          <div className="md:col-span-2 rounded-lg border border-violet-200 bg-violet-50/70 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-violet-700">Family link</p>
            <SearchableMemberSelect
              fieldId="create-family-father"
              label="Father (optional)"
              members={membersQ.data ?? []}
              value={form.fatherUserId}
              onChange={(id) => setForm((f) => ({ ...f, fatherUserId: id }))}
              hint="Type to filter by name."
            />
            <SearchableMemberSelect
              fieldId="create-family-mother"
              label="Mother (optional)"
              members={membersQ.data ?? []}
              value={form.motherUserId}
              onChange={(id) => setForm((f) => ({ ...f, motherUserId: id }))}
              hint="Type to filter by name."
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600">Email</label>
            <input
              type="email"
              autoComplete="email"
              className="mt-1 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-slate-600">
              Mobile (international)
              {!form.fatherUserId && !form.motherUserId ? <span className="text-rose-600"> *</span> : null}
            </label>
            <input
              type="tel"
              required={!form.fatherUserId && !form.motherUserId}
              autoComplete="tel"
              placeholder="e.g. +234 803 123 4567"
              className="mt-1 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
              value={form.phoneNumber}
              onChange={(e) => setForm((f) => ({ ...f, phoneNumber: e.target.value }))}
            />
            <p className="mt-1.5 text-[11px] leading-relaxed text-slate-500">
              Use country code with <span className="font-medium">+</span>. Stored as E.164 digits (same as sign-in).
            </p>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600">Date of birth</label>
            <input
              type="date"
              className="mt-1 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
              value={form.dateOfBirth}
              onChange={(e) => setForm((f) => ({ ...f, dateOfBirth: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600">Title</label>
            <select
              className="mt-1 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            >
              <option value="">None</option>
              {titleChoices.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600">Position</label>
            <select
              className="mt-1 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
              value={form.position}
              onChange={(e) => setForm((f) => ({ ...f, position: e.target.value }))}
            >
              <option value="">None</option>
              {positionChoices.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600">Role</label>
            <select
              className="mt-1 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as "Admin" | "Member" }))}
            >
              <option value="Member">Member</option>
              <option value="Admin">Admin</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600">Account status</label>
            <select
              className="mt-1 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as "Active" | "Inactive" }))}
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-slate-600">Address</label>
            <textarea
              rows={2}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600">Initial password</label>
            <div className="mt-1 flex w-full items-center rounded-lg border border-slate-300 bg-slate-50 px-3 py-2">
              <input
                type={showDefaultPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                minLength={8}
                className="w-full bg-transparent text-sm outline-none"
                value={form.defaultPassword}
                onChange={(e) => setForm((f) => ({ ...f, defaultPassword: e.target.value }))}
              />
              <button
                type="button"
                onClick={() => setShowDefaultPassword((v) => !v)}
                className="rounded-md p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                aria-label={showDefaultPassword ? "Hide initial password" : "Show initial password"}
              >
                {showDefaultPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="mt-1 text-[11px] text-slate-500">Minimum 8 characters. User must change password after first sign-in.</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600">Confirm password</label>
            <div className="mt-1 flex w-full items-center rounded-lg border border-slate-300 bg-slate-50 px-3 py-2">
              <input
                type={showConfirmPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                minLength={8}
                className="w-full bg-transparent text-sm outline-none"
                value={form.confirmPassword}
                onChange={(e) => setForm((f) => ({ ...f, confirmPassword: e.target.value }))}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((v) => !v)}
                className="rounded-md p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="md:col-span-2 flex flex-wrap items-center gap-2">
            <button
              type="submit"
              disabled={create.isPending || bundleQ.isLoading}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {create.isPending ? "Creating…" : "Create user"}
            </button>
            <Link
              href="/dashboard/user-management"
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Cancel
            </Link>
            <button
              type="button"
              onClick={() => setForm(emptyForm())}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Clear form
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
