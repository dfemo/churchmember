"use client";

import { api, getApiErrorMessage } from "@/lib/api";
import { mergePicklistWithCurrent } from "@/lib/merge-profile-picklists";
import {
  DEFAULT_TEMPLATE,
  formatPhoneForWhatsapp,
  getStoredWhatsappTemplate,
  openWhatsappToPhone,
  personalizeWhatsappMessage,
  setStoredWhatsappTemplate,
} from "@/lib/whatsapp";
import type { MemberListItem, MemberProfile, UpdateMemberRequest } from "@/types/member";
import type { ProfileFieldOptionsBundle } from "@/types/profile-field-options";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

function toDateInput(v: string | null | undefined) {
  return v ? v.slice(0, 10) : "";
}

function buildFormData(profile: MemberProfile): UpdateMemberRequest {
  return {
    fullName: profile.fullName,
    email: profile.email ?? null,
    dateOfBirth: toDateInput(profile.dateOfBirth) || null,
    address: profile.address ?? null,
    title: profile.title ?? null,
    position: profile.position ?? null,
    status: profile.status,
    role: profile.roles.includes("Admin") ? "Admin" : "Member",
  };
}

export default function UserManagementPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [form, setForm] = useState<UpdateMemberRequest | null>(null);
  const [waTemplate, setWaTemplate] = useState(DEFAULT_TEMPLATE);
  const [waNote, setWaNote] = useState<string | null>(null);

  const users = useQuery({
    queryKey: ["members-list"],
    queryFn: async () => (await api.get<MemberListItem[]>("/api/members")).data,
  });

  const bundleQ = useQuery({
    queryKey: ["profile-field-options-bundle"],
    queryFn: async () => (await api.get<ProfileFieldOptionsBundle>("/api/profile-field-options")).data,
    staleTime: 60_000,
  });

  const selected = useQuery({
    queryKey: ["member", selectedId],
    enabled: selectedId !== null,
    queryFn: async () => (await api.get<MemberProfile>(`/api/members/${selectedId}`)).data,
  });

  useEffect(() => {
    if (!selected.data) return;
    setForm(buildFormData(selected.data));
  }, [selected.data]);

  useEffect(() => {
    setWaTemplate(getStoredWhatsappTemplate());
  }, []);

  const update = useMutation({
    mutationFn: async (payload: { id: number; body: UpdateMemberRequest }) =>
      api.put(`/api/members/${payload.id}`, payload.body),
    onSuccess: async () => {
      setErr(null);
      setOk("User updated successfully.");
      await queryClient.invalidateQueries({ queryKey: ["members-list"] });
      if (selectedId !== null) await queryClient.invalidateQueries({ queryKey: ["member", selectedId] });
    },
    onError: (e) => {
      setOk(null);
      setErr(getApiErrorMessage(e));
    },
  });

  const filteredUsers = useMemo(() => {
    const source = users.data ?? [];
    if (!search.trim()) return source;
    const q = search.toLowerCase();
    return source.filter(
      (u) =>
        u.fullName.toLowerCase().includes(q) ||
        u.phoneNumber.toLowerCase().includes(q)
    );
  }, [users.data, search]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const pagedUsers = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [filteredUsers, page]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const titleChoices = useMemo(
    () => mergePicklistWithCurrent(selected.data?.title, bundleQ.data?.titles ?? []),
    [selected.data?.title, bundleQ.data?.titles]
  );
  const positionChoices = useMemo(
    () => mergePicklistWithCurrent(selected.data?.position, bundleQ.data?.positions ?? []),
    [selected.data?.position, bundleQ.data?.positions]
  );

  if (users.isError) return <p className="text-sm text-rose-700">{getApiErrorMessage(users.error)}</p>;

  /** One country for legacy "0…" local numbers (e.g. 0803… → 234803…). For mixed UK/US/NG, use +E.164 on each profile. */
  const defaultWaCountry = process.env.NEXT_PUBLIC_WHATSAPP_DEFAULT_COUNTRY?.replace(/\D/g, "") || "234";
  const applyLeadingZeroRule = process.env.NEXT_PUBLIC_WHATSAPP_DISABLE_LEADING_ZERO !== "true";
  /** Off by default: 10 digits could be a national number in another country; opt in for US/Canada–only data. */
  const prepend1Us = process.env.NEXT_PUBLIC_WHATSAPP_PREPEND_1_US === "true";

  const waOptions = {
    defaultCountryForLeadingZero: applyLeadingZeroRule ? defaultWaCountry : undefined,
    prependOneFor10DigitNanp: prepend1Us,
  } as const;

  function openWhatsappForListUser(u: MemberListItem) {
    setWaNote(null);
    const phone = formatPhoneForWhatsapp(u.phoneNumber, waOptions);
    if (!phone) {
      setWaNote(
        "Could not build a WhatsApp link. Use full international numbers with country code in the user profile, e.g. +234 803 123 4567, +44 7700 900123, +1 202 555 1234. " +
          (applyLeadingZeroRule
            ? `For one country you may also store local 0… numbers and set NEXT_PUBLIC_WHATSAPP_DEFAULT_COUNTRY (e.g. 234).`
            : `Leading-zero local is disabled; use +country code.`)
      );
      return;
    }
    setStoredWhatsappTemplate(waTemplate);
    const text = personalizeWhatsappMessage(waTemplate, u);
    openWhatsappToPhone(phone, text);
  }

  function openWhatsappForProfile(p: MemberProfile) {
    setWaNote(null);
    const phone = formatPhoneForWhatsapp(p.phoneNumber, waOptions);
    if (!phone) {
      setWaNote(
        "Could not build a WhatsApp link. Save the number with country code (+44…, +1…, +234…) or a supported local 0… format (see help below)."
      );
      return;
    }
    setStoredWhatsappTemplate(waTemplate);
    const text = personalizeWhatsappMessage(waTemplate, p);
    openWhatsappToPhone(phone, text);
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">User management</h1>
        <p className="mt-1 text-sm text-slate-500">
          View all users and edit profile, role, status, title, and position.{" "}
          <Link href="/dashboard/profile-field-options" className="font-medium text-violet-700 underline-offset-2 hover:underline">
            Configure title &amp; position lists
          </Link>
          .
        </p>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">WhatsApp message</h2>
        <p className="mt-1 text-xs text-slate-500">
          Compose one template; each row&rsquo;s <span className="font-medium">WhatsApp</span> button opens a chat
          to that person with placeholders filled. Saved in this browser.
        </p>
        <p className="mt-1 text-[11px] text-slate-400">
          Placeholders:{" "}
          <code className="rounded bg-slate-100 px-0.5">
            {`{{name}} {{phone}} {{title}} {{position}} {{status}} {{role}} {{dob}} {{email}} {{address}}`}
          </code>{" "}
          (<code className="rounded bg-slate-100 px-0.5">{"{{email}}"}</code> / <code className="rounded bg-slate-100 px-0.5">{"{{address}}"}</code>{" "}
          only in the edit drawer; empty in the table)
        </p>
        {waNote ? <p className="mt-2 text-xs text-rose-600">{waNote}</p> : null}
        <label htmlFor="waTemplate" className="sr-only">
          Message template
        </label>
        <textarea
          id="waTemplate"
          rows={5}
          value={waTemplate}
          onChange={(e) => setWaTemplate(e.target.value)}
          onBlur={() => setStoredWhatsappTemplate(waTemplate)}
          placeholder={DEFAULT_TEMPLATE}
          className="mt-2 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400"
        />
        <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
          <span className="font-medium text-slate-600">All countries (recommended):</span> save each phone in{" "}
          <strong>international form with country code</strong> in the user profile, e.g. <code className="rounded bg-slate-100 px-0.5">+234 803 123 4567</code>,{" "}
          <code className="rounded bg-slate-100 px-0.5">+44 7700 900123</code>, <code className="rounded bg-slate-100 px-0.5">+1 202 555 1234</code> — the same
          list can mix Nigeria, UK, and US. Optional <code className="rounded bg-slate-100 px-0.5">00</code> dialling
          prefix is supported.
        </p>
        <p className="mt-1 text-[11px] text-slate-500">
          <span className="font-medium">US/Canada, 10 digits only:</span> if every such number in your list is North American, set{" "}
          <code className="rounded bg-slate-100 px-0.5">NEXT_PUBLIC_WHATSAPP_PREPEND_1_US=true</code> to prepend{" "}
          <code className="rounded bg-slate-100 px-0.5">1</code> to 10-digit NANP. Otherwise use{" "}
          <code className="rounded bg-slate-100 px-0.5">+1…</code> in the profile. Off by default so UK and other 10-digit national forms are not misread as US.
        </p>
        <p className="mt-1 text-[11px] text-slate-500">
          <span className="font-medium">Local numbers starting with 0</span> (e.g. <code className="rounded bg-slate-100 px-0.5">0803…</code>) are converted using{" "}
          <code className="rounded bg-slate-100 px-0.5">NEXT_PUBLIC_WHATSAPP_DEFAULT_COUNTRY</code> (default{" "}
          <code className="rounded bg-slate-100 px-0.5">{defaultWaCountry}</code>) — that only matches{" "}
          <strong>one</strong> country&rsquo;s local format. For <strong>UK 07…</strong>, do not rely on 0: use <code className="rounded bg-slate-100 px-0.5">+44…</code> in the
          profile. Set <code className="rounded bg-slate-100 px-0.5">NEXT_PUBLIC_WHATSAPP_DISABLE_LEADING_ZERO=true</code> to ignore all <code className="rounded bg-slate-100 px-0.5">0…</code> local numbers and require international form only.
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white/90 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-4">
          <p className="text-sm font-semibold text-slate-900">All users</p>
          <div className="w-full max-w-sm">
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
              }}
              placeholder="Search by name, phone, or email"
              className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-cyan-400 focus:bg-white"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Name</th>
                <th className="px-4 py-3 text-left font-medium">Phone</th>
                <th className="px-4 py-3 text-left font-medium">Role</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Title</th>
                <th className="px-4 py-3 text-left font-medium">Position</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pagedUsers.map((u) => (
                <tr key={u.id} className="border-t border-slate-100 text-slate-700 hover:bg-slate-50/80">
                  <td className="px-4 py-3 font-medium text-slate-900">{u.fullName}</td>
                  <td className="px-4 py-3">{u.phoneNumber}</td>
                  <td className="px-4 py-3">{u.roles.join(", ")}</td>
                  <td className="px-4 py-3">{u.status}</td>
                  <td className="px-4 py-3">{u.title ?? "-"}</td>
                  <td className="px-4 py-3">{u.position ?? "-"}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex flex-wrap items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedId(u.id);
                          setErr(null);
                          setOk(null);
                          setDrawerOpen(true);
                        }}
                        className="rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => openWhatsappForListUser(u)}
                        className="inline-flex items-center gap-1 rounded-md border border-emerald-600 bg-emerald-50 px-2.5 py-1.5 text-xs font-medium text-emerald-900 hover:bg-emerald-100"
                        title="Open WhatsApp Web or app with a personalized message"
                      >
                        <MessageCircle className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
                        WhatsApp
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!pagedUsers.length ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-500">
                    No users found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-xs text-slate-500">
          <p>
            Showing {(page - 1) * pageSize + (pagedUsers.length ? 1 : 0)}-
            {(page - 1) * pageSize + pagedUsers.length} of {filteredUsers.length}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-md border border-slate-300 px-2 py-1 disabled:opacity-40"
            >
              Prev
            </button>
            <span>
              Page {page} / {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="rounded-md border border-slate-300 px-2 py-1 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </section>

      {drawerOpen ? <div className="fixed inset-0 z-30 bg-slate-900/35 lg:hidden" onClick={() => setDrawerOpen(false)} /> : null}
      <aside
        className={`fixed right-0 top-0 z-40 h-svh w-full max-w-xl border-l border-slate-200 bg-white p-5 shadow-2xl transition-transform duration-200 ${
          drawerOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="mb-4 flex items-center justify-between gap-2">
          <div>
            <p className="text-base font-semibold text-slate-900">Edit user</p>
            <p className="text-xs text-slate-500">Update user information, role, status, title, and position.</p>
          </div>
          <div className="flex flex-shrink-0 items-center gap-1.5">
            {selected.data ? (
              <button
                type="button"
                onClick={() => openWhatsappForProfile(selected.data!)}
                className="inline-flex items-center gap-1 rounded-md border border-emerald-600 bg-emerald-50 px-2.5 py-1.5 text-xs font-medium text-emerald-900 hover:bg-emerald-100"
                title="Uses the WhatsApp message template from the list above"
              >
                <MessageCircle className="h-3.5 w-3.5" strokeWidth={2} />
                WhatsApp
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              className="rounded-md border border-slate-300 px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-50"
            >
              Close
            </button>
          </div>
        </div>

        {!selectedId ? (
          <p className="text-sm text-slate-500">Select a user from the table.</p>
        ) : selected.isLoading ? (
          <p className="text-sm text-slate-500">Loading user…</p>
        ) : selected.isError ? (
          <p className="text-sm text-rose-700">{getApiErrorMessage(selected.error)}</p>
        ) : selected.data && form ? (
          <form
            className="grid gap-3 md:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (!selectedId) return;
              update.mutate({ id: selectedId, body: form });
            }}
          >
            {err ? <p className="md:col-span-2 text-sm text-rose-700">{err}</p> : null}
            {ok ? <p className="md:col-span-2 text-sm text-emerald-700">{ok}</p> : null}
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-600">Full name</label>
              <input
                className="mt-1 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
                value={form.fullName}
                onChange={(e) => setForm((f) => (f ? { ...f, fullName: e.target.value } : f))}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600">Email</label>
              <input
                className="mt-1 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
                value={form.email ?? ""}
                onChange={(e) => setForm((f) => (f ? { ...f, email: e.target.value || null } : f))}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600">Date of birth</label>
              <input
                type="date"
                className="mt-1 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
                value={form.dateOfBirth ?? ""}
                onChange={(e) => setForm((f) => (f ? { ...f, dateOfBirth: e.target.value || null } : f))}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600">Title</label>
              <select
                className="mt-1 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
                value={form.title ?? ""}
                onChange={(e) => setForm((f) => (f ? { ...f, title: e.target.value || null } : f))}
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
                value={form.position ?? ""}
                onChange={(e) => setForm((f) => (f ? { ...f, position: e.target.value || null } : f))}
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
                onChange={(e) => setForm((f) => (f ? { ...f, role: e.target.value as "Admin" | "Member" } : f))}
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
                onChange={(e) => setForm((f) => (f ? { ...f, status: e.target.value as "Active" | "Inactive" } : f))}
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
                value={form.address ?? ""}
                onChange={(e) => setForm((f) => (f ? { ...f, address: e.target.value || null } : f))}
              />
            </div>
            <div className="md:col-span-2 flex items-center gap-2">
              <button
                type="submit"
                disabled={update.isPending}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
              >
                {update.isPending ? "Saving…" : "Save changes"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setForm(buildFormData(selected.data));
                  setErr(null);
                  setOk(null);
                }}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Reset
              </button>
            </div>
          </form>
        ) : null}
      </aside>
    </div>
  );
}
