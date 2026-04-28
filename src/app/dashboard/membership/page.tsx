"use client";

import { useAuth } from "@/contexts/auth-context";
import { api, getApiErrorMessage } from "@/lib/api";
import Link from "next/link";
import { mergePicklistWithCurrent } from "@/lib/merge-profile-picklists";
import { notifyErr, notifyOk } from "@/lib/notify";
import { DEFAULT_BIRTH_YEAR } from "@/lib/profile-field-options";
import type { MemberProfile, UpdateProfileRequest } from "@/types/member";
import type { ProfileFieldOptionsBundle } from "@/types/profile-field-options";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

const MONTHS: { value: string; label: string }[] = [
  { value: "01", label: "January" },
  { value: "02", label: "February" },
  { value: "03", label: "March" },
  { value: "04", label: "April" },
  { value: "05", label: "May" },
  { value: "06", label: "June" },
  { value: "07", label: "July" },
  { value: "08", label: "August" },
  { value: "09", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

function daysInMonth(month: number, year: number) {
  return new Date(year, month, 0).getDate();
}

function parseIsoToParts(iso: string | null | undefined): { m: string; d: string; y: string } {
  if (!iso) {
    return { m: "", d: "", y: String(DEFAULT_BIRTH_YEAR) };
  }
  const [ys, ms, ds] = iso.slice(0, 10).split("-");
  if (!ys || !ms || !ds) {
    return { m: "", d: "", y: String(DEFAULT_BIRTH_YEAR) };
  }
  return { y: ys, m: ms.padStart(2, "0"), d: ds.padStart(2, "0") };
}

function isValidCalendarDate(y: number, m: number, d: number) {
  if (m < 1 || m > 12 || d < 1) return false;
  const max = daysInMonth(m, y);
  if (d > max) return false;
  const t = new Date(y, m - 1, d);
  return t.getFullYear() === y && t.getMonth() === m - 1 && t.getDate() === d;
}

function buildIso(m: string, d: string, y: string): string | null {
  if (!m || !d) return null;
  const year = y ? Number.parseInt(y, 10) : DEFAULT_BIRTH_YEAR;
  if (Number.isNaN(year)) return null;
  const month = Number.parseInt(m, 10);
  const day = Number.parseInt(d, 10);
  if (!isValidCalendarDate(year, month, day)) return null;
  return `${year}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
}

export default function MembershipDetailsPage() {
  const { user } = useAuth();
  const isAdmin = Boolean(user?.roles?.includes("Admin"));
  const queryClient = useQueryClient();
  const [form, setForm] = useState<{
    fullName: string;
    email: string;
    address: string;
    dobMonth: string;
    dobDay: string;
    dobYear: string;
    yearSelectedByUser: boolean;
    title: string;
    position: string;
  } | null>(null);
  const q = useQuery({
    queryKey: ["me"],
    queryFn: async () => (await api.get<MemberProfile>("/api/members/me")).data,
  });

  const optionsQ = useQuery({
    queryKey: ["profile-field-options-bundle"],
    queryFn: async () => (await api.get<ProfileFieldOptionsBundle>("/api/profile-field-options")).data,
    staleTime: 60_000,
    enabled: isAdmin,
  });

  useEffect(() => {
    if (!q.data) return;
    const parts = parseIsoToParts(q.data.dateOfBirth);
    const hasStoredDob = Boolean(q.data.dateOfBirth);
    setForm({
      fullName: q.data.fullName,
      email: q.data.email ?? "",
      address: q.data.address ?? "",
      dobMonth: parts.m,
      dobDay: parts.d,
      dobYear: parts.y,
      yearSelectedByUser: hasStoredDob,
      title: q.data.title ?? "",
      position: q.data.position ?? "",
    });
  }, [q.data]);

  const maxDay = useMemo(() => {
    if (!form) return 31;
    const m = Number.parseInt(form.dobMonth, 10);
    if (Number.isNaN(m) || m < 1 || m > 12) return 31;
    const y = Number.parseInt(form.dobYear, 10) || DEFAULT_BIRTH_YEAR;
    return daysInMonth(m, y);
  }, [form?.dobMonth, form?.dobYear]);

  const yearOptions = useMemo(() => {
    const end = new Date().getFullYear();
    const start = 1920;
    const list: number[] = [];
    for (let y = end; y >= start; y -= 1) list.push(y);
    return list;
  }, []);

  const dayOptions = useMemo(() => {
    return Array.from({ length: maxDay }, (_, i) => String(i + 1).padStart(2, "0"));
  }, [maxDay]);

  const mutation = useMutation({
    mutationFn: async (body: UpdateProfileRequest) => {
      await api.put<MemberProfile>("/api/members/me", body);
    },
    onSuccess: () => {
      notifyOk("Membership details updated.");
      queryClient.invalidateQueries({ queryKey: ["me"] });
    },
    onError: (e) => notifyErr("Could not save profile", getApiErrorMessage(e)),
  });

  const titleChoices = useMemo(
    () => mergePicklistWithCurrent(q.data?.title, optionsQ.data?.titles ?? []),
    [q.data?.title, optionsQ.data?.titles]
  );
  const positionChoices = useMemo(
    () => mergePicklistWithCurrent(q.data?.position, optionsQ.data?.positions ?? []),
    [q.data?.position, optionsQ.data?.positions]
  );

  if (q.isError) return <p className="text-sm text-rose-700">{getApiErrorMessage(q.error)}</p>;
  if (q.isLoading || !q.data || !form) return <p className="text-sm text-slate-500">Loading membership…</p>;

  const profile = q.data;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white/85 p-6 shadow-sm backdrop-blur-xl">
      <h1 className="text-xl font-semibold text-slate-900">View membership details</h1>
      <p className="mt-1 text-sm text-slate-500">
        {isAdmin
          ? "Update your name, email, address, date of birth, title, and position. Departments are listed below and are edited in User management."
          : "Update your name, email, address, and date of birth. Title, position, and departments are set by an administrator and shown below."}
      </p>
      <p className="mt-3 text-sm">
        <Link
          href="/dashboard/membership/pictures"
          className="font-medium text-violet-700 underline-offset-2 hover:underline"
        >
          Picture catalog
        </Link>
        <span className="text-slate-500"> — upload profile and birthday photos (mobile-friendly).</span>
      </p>
      {isAdmin && optionsQ.isError ? (
        <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Could not load title/position lists ({getApiErrorMessage(optionsQ.error)}). You can still edit other fields;
          title and position choices may be incomplete.
        </p>
      ) : null}
      <section className="mt-4 grid gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3 sm:grid-cols-2">
        <p className="text-sm text-slate-700">
          <span className="font-medium">Status:</span> {profile.status}
        </p>
        <p className="text-sm text-slate-700">
          <span className="font-medium">Role(s):</span> {profile.roles.join(", ")}
        </p>
      </section>

      <form
        className="mt-5 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!form) return;

          let dateOfBirth: string;
          if (form.dobMonth && form.dobDay) {
            const built = buildIso(form.dobMonth, form.dobDay, form.dobYear);
            if (!built) {
              notifyErr(
                "Invalid date",
                "That day does not exist in the selected month. Check your date of birth."
              );
              return;
            }
            dateOfBirth = built;
          } else if (form.yearSelectedByUser) {
            const y = Number.parseInt(form.dobYear, 10);
            if (Number.isNaN(y)) {
              notifyErr("Birth year required", "Please choose a birth year.");
              return;
            }
            dateOfBirth = `${y}-01-01`;
          } else {
            notifyErr(
              "Date of birth incomplete",
              "Select month and day, or pick a year from the list first if you only know the year."
            );
            return;
          }

          const title = isAdmin
            ? form.title.trim() || null
            : (profile.title?.trim() || null);
          const position = isAdmin
            ? form.position.trim() || null
            : (profile.position?.trim() || null);

          mutation.mutate({
            fullName: form.fullName.trim(),
            email: form.email.trim() || null,
            dateOfBirth,
            address: form.address.trim() || null,
            title,
            position,
          });
        }}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-700">Phone</label>
            <p className="mt-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-600">
              {profile.phoneNumber}
            </p>
          </div>
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-slate-700">
              Full name
            </label>
            <input
              id="fullName"
              value={form.fullName}
              onChange={(e) => setForm((f) => (f ? { ...f, fullName: e.target.value } : f))}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-cyan-400 focus:bg-white focus:outline-none"
              required
            />
          </div>
        </div>
        <div className="grid items-start gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => (f ? { ...f, email: e.target.value } : f))}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-cyan-400 focus:bg-white focus:outline-none"
            />
          </div>
          <div>
            <fieldset>
              <legend className="text-sm font-medium text-slate-700">Date of birth</legend>
              <div className="mt-1 grid grid-cols-1 gap-2 sm:grid-cols-3">
                <div>
                  <label htmlFor="dobMonth" className="sr-only">
                    Month
                  </label>
                  <select
                    id="dobMonth"
                    value={form.dobMonth}
                    onChange={(e) => {
                      const v = e.target.value;
                      setForm((f) => {
                        if (!f) return f;
                        const next = { ...f, dobMonth: v };
                        const d = Number.parseInt(f.dobDay, 10);
                        const m = Number.parseInt(v, 10);
                        const y = Number.parseInt(f.dobYear, 10) || DEFAULT_BIRTH_YEAR;
                        if (!Number.isNaN(m) && !Number.isNaN(d) && d > daysInMonth(m, y)) {
                          next.dobDay = String(daysInMonth(m, y)).padStart(2, "0");
                        }
                        return next;
                      });
                    }}
                    className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 focus:border-cyan-400 focus:bg-white focus:outline-none"
                  >
                    <option value="">Month *</option>
                    {MONTHS.map((x) => (
                      <option key={x.value} value={x.value}>
                        {x.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="dobDay" className="sr-only">
                    Day
                  </label>
                  <select
                    id="dobDay"
                    value={form.dobDay}
                    onChange={(e) => setForm((f) => (f ? { ...f, dobDay: e.target.value } : f))}
                    className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 focus:border-cyan-400 focus:bg-white focus:outline-none"
                  >
                    <option value="">Day *</option>
                    {dayOptions.map((d) => (
                      <option key={d} value={d}>
                        {Number.parseInt(d, 10)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="dobYear" className="sr-only">
                    Year
                  </label>
                  <select
                    id="dobYear"
                    value={form.dobYear}
                    onChange={(e) => {
                      const v = e.target.value;
                      setForm((f) => {
                        if (!f) return f;
                        const next = { ...f, dobYear: v, yearSelectedByUser: true };
                        const m = Number.parseInt(f.dobMonth, 10);
                        const d = Number.parseInt(f.dobDay, 10);
                        const y = Number.parseInt(v, 10) || DEFAULT_BIRTH_YEAR;
                        if (!Number.isNaN(m) && !Number.isNaN(d) && d > daysInMonth(m, y)) {
                          next.dobDay = String(daysInMonth(m, y)).padStart(2, "0");
                        }
                        return next;
                      });
                    }}
                    className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 focus:border-cyan-400 focus:bg-white focus:outline-none"
                  >
                    {yearOptions.map((y) => (
                      <option key={y} value={String(y)}>
                        {y}
                        {y === DEFAULT_BIRTH_YEAR && !form.yearSelectedByUser ? " (default)" : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                Month and day are required unless you pick a year from the list (then we store 1 January for that
                year). Year otherwise defaults to {DEFAULT_BIRTH_YEAR}.
              </p>
            </fieldset>
          </div>
        </div>
        <div>
          <label htmlFor="address" className="block text-sm font-medium text-slate-700">
            Address
          </label>
          <textarea
            id="address"
            rows={3}
            value={form.address}
            onChange={(e) => setForm((f) => (f ? { ...f, address: e.target.value } : f))}
            className="mt-1 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-cyan-400 focus:bg-white focus:outline-none"
          />
        </div>
        {isAdmin ? (
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-slate-700">
                Title
              </label>
              <select
                id="title"
                value={form.title}
                onChange={(e) => setForm((f) => (f ? { ...f, title: e.target.value } : f))}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 focus:border-cyan-400 focus:bg-white focus:outline-none"
              >
                <option value="">None</option>
                {titleChoices.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-slate-500">
                Admins maintain this list under{" "}
                <Link href="/dashboard/profile-field-options" className="font-medium text-violet-700 underline-offset-2 hover:underline">
                  Title &amp; position lists
                </Link>
                .
              </p>
            </div>
            <div>
              <label htmlFor="position" className="block text-sm font-medium text-slate-700">
                Position
              </label>
              <select
                id="position"
                value={form.position}
                onChange={(e) => setForm((f) => (f ? { ...f, position: e.target.value } : f))}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 focus:border-cyan-400 focus:bg-white focus:outline-none"
              >
                <option value="">None</option>
                {positionChoices.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <span className="block text-sm font-medium text-slate-700">Title</span>
              <p className="mt-1 rounded-lg border border-slate-200 bg-slate-100 px-3 py-2.5 text-sm text-slate-800">
                {profile.title?.trim() ? profile.title : "—"}
              </p>
            </div>
            <div>
              <span className="block text-sm font-medium text-slate-700">Position</span>
              <p className="mt-1 rounded-lg border border-slate-200 bg-slate-100 px-3 py-2.5 text-sm text-slate-800">
                {profile.position?.trim() ? profile.position : "—"}
              </p>
            </div>
          </div>
        )}
        <div>
          <span className="block text-sm font-medium text-slate-700">Department(s)</span>
          <p className="mt-1 rounded-lg border border-slate-200 bg-slate-100 px-3 py-2.5 text-sm text-slate-800">
            {profile.departments?.length ? profile.departments.join(", ") : "—"}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {isAdmin ? (
              <>
                Assign departments in{" "}
                <Link href="/dashboard/user-management" className="font-medium text-violet-700 underline-offset-2 hover:underline">
                  User management
                </Link>
                . Options come from{" "}
                <Link href="/dashboard/profile-field-options" className="font-medium text-violet-700 underline-offset-2 hover:underline">
                  Title &amp; position lists
                </Link>{" "}
                (department list).
              </>
            ) : (
              "Ask an administrator if these should change."
            )}
          </p>
        </div>
        <button
          type="submit"
          disabled={mutation.isPending}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {mutation.isPending ? "Saving…" : "Update records"}
        </button>
      </form>
    </div>
  );
}
