"use client";

import { api, getApiErrorMessage } from "@/lib/api";
import type { MemberProfile } from "@/types/member";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

type MediaKind = "profile" | "birthday1" | "birthday2" | "birthday3";

function toDataUrl(bytes: ArrayBuffer, contentType: string) {
  let binary = "";
  const arr = new Uint8Array(bytes);
  const chunk = 0x8000;
  for (let i = 0; i < arr.length; i += chunk) binary += String.fromCharCode(...arr.subarray(i, i + chunk));
  return `data:${contentType};base64,${btoa(binary)}`;
}

export default function UserProfileViewPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params?.id);
  const [mediaUrls, setMediaUrls] = useState<Partial<Record<MediaKind, string>>>({});

  const memberQ = useQuery({
    queryKey: ["member", id, "profile-view"],
    enabled: Number.isFinite(id) && id > 0,
    queryFn: async () => (await api.get<MemberProfile>(`/api/members/${id}`)).data,
  });

  useEffect(() => {
    if (!Number.isFinite(id) || id <= 0) return;
    let mounted = true;
    async function loadMedia() {
      const kinds: MediaKind[] = ["profile", "birthday1", "birthday2", "birthday3"];
      const next: Partial<Record<MediaKind, string>> = {};
      for (const kind of kinds) {
        try {
          const res = await api.get<ArrayBuffer>(`/api/members/${id}/media/${kind}`, { responseType: "arraybuffer" });
          next[kind] = toDataUrl(res.data, String(res.headers["content-type"] ?? "image/jpeg"));
        } catch {
          // missing image
        }
      }
      if (mounted) setMediaUrls(next);
    }
    void loadMedia();
    return () => {
      mounted = false;
    };
  }, [id]);

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
        <Field label="Parent user" value={m.parentFullName || "-"} />
        <Field label="Parent phone" value={m.parentPhoneNumber || "-"} />
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

      <section className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">Family relationship</h2>
        {!m.children?.length ? (
          <p className="mt-2 text-sm text-slate-500">No children assigned.</p>
        ) : (
          <div className="mt-3 space-y-2">
            {m.children.map((c) => (
              <div key={c.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                <span className="text-sm font-medium text-slate-800">{c.fullName}</span>
                <span className="text-xs font-mono text-slate-500">{c.phoneNumber || "-"}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">Uploaded pictures</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {([
            ["profile", "Profile"],
            ["birthday1", "Birthday 1"],
            ["birthday2", "Birthday 2"],
            ["birthday3", "Birthday 3"],
          ] as [MediaKind, string][]).map(([kind, label]) => (
            <div key={kind} className="rounded-lg border border-slate-200 p-2">
              <p className="text-xs font-medium text-slate-600">{label}</p>
              {mediaUrls[kind] ? (
                <img src={mediaUrls[kind]} alt={label} className="mt-2 h-36 w-full rounded object-cover" />
              ) : (
                <div className="mt-2 flex h-36 w-full items-center justify-center rounded bg-slate-100 text-xs text-slate-500">
                  No image
                </div>
              )}
            </div>
          ))}
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

