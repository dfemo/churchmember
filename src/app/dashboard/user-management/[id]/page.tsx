"use client";

import { api, getApiErrorMessage } from "@/lib/api";
import type { MemberProfile } from "@/types/member";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function UserProfileViewPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params?.id);

  const memberQ = useQuery({
    queryKey: ["member", id, "profile-view"],
    enabled: Number.isFinite(id) && id > 0,
    queryFn: async () => (await api.get<MemberProfile>(`/api/members/${id}`)).data,
  });

  if (!Number.isFinite(id) || id <= 0) {
    return <p className="text-sm text-rose-700">Invalid member id.</p>;
  }
  if (memberQ.isLoading) return <p className="text-sm text-slate-500">Loading profile…</p>;
  if (memberQ.isError) return <p className="text-sm text-rose-700">{getApiErrorMessage(memberQ.error)}</p>;
  if (!memberQ.data) return <p className="text-sm text-slate-500">Member not found.</p>;

  const m = memberQ.data;
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Member profile</h1>
          <p className="mt-1 text-sm text-slate-500">Read-only profile details for this member.</p>
        </div>
        <Link
          href="/dashboard/user-management"
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Back to users
        </Link>
      </div>

      <section className="grid gap-3 rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm md:grid-cols-2">
        <Field label="Full name" value={m.fullName} />
        <Field label="Phone" value={m.phoneNumber} />
        <Field label="Email" value={m.email || "-"} />
        <Field label="Date of birth" value={m.dateOfBirth ? m.dateOfBirth.slice(0, 10) : "-"} />
        <Field label="Role(s)" value={m.roles.join(", ")} />
        <Field label="Status" value={m.status} />
        <Field label="Title" value={m.title || "-"} />
        <Field label="Position" value={m.position || "-"} />
        <Field label="Department(s)" value={m.departments?.length ? m.departments.join(", ") : "-"} />
        <div className="md:col-span-2">
          <p className="text-xs font-medium text-slate-600">Address</p>
          <p className="mt-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">{m.address || "-"}</p>
        </div>
      </section>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-slate-600">{label}</p>
      <p className="mt-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">{value}</p>
    </div>
  );
}

