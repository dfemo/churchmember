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
        <Field label="Phone" value={m.phoneNumber || "-"} />
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
        <p className="mt-1 text-xs text-slate-500">Parents, partner, siblings, and children linked to this member.</p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <FamilyLinkCard
            title="Father"
            name={m.fatherFullName}
            phone={m.fatherPhoneNumber}
            profileId={m.fatherUserId ?? undefined}
          />
          <FamilyLinkCard
            title="Mother"
            name={m.motherFullName ?? null}
            phone={m.motherPhoneNumber ?? null}
            profileId={m.motherUserId ?? undefined}
          />
          <FamilyLinkCard
            title="Spouse / partner"
            name={m.spouse?.fullName ?? null}
            phone={m.spouse?.phoneNumber ?? null}
            profileId={m.spouse?.id}
          />
        </div>

        <div className="mt-4">
          <p className="text-xs font-medium text-slate-600">Siblings</p>
          {m.siblings && m.siblings.length > 0 ? (
            <ul className="mt-2 space-y-2">
              {m.siblings.map((s) => (
                <li key={s.id}>
                  <Link
                    href={`/dashboard/user-management/${s.id}`}
                    className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-violet-800 hover:bg-violet-50/80"
                  >
                    <span className="font-medium">{s.fullName}</span>
                    <span className="text-xs font-mono text-slate-500">{s.phoneNumber || "-"}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-slate-500">No siblings attached.</p>
          )}
        </div>

        <div className="mt-6 border-t border-slate-100 pt-4">
          <p className="text-xs font-medium text-slate-600">Children (where this member is father or mother)</p>
          {m.children && m.children.length > 0 ? (
            <ul className="mt-2 space-y-2">
              {m.children.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/dashboard/user-management/${c.id}`}
                    className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-violet-800 hover:bg-violet-50/80"
                  >
                    <span className="font-medium">{c.fullName}</span>
                    <span className="text-xs font-mono text-slate-500">{c.phoneNumber || "-"}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-slate-500">No children assigned.</p>
          )}
        </div>
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

function FamilyLinkCard({
  title,
  name,
  phone,
  profileId,
}: {
  title: string;
  name?: string | null;
  phone?: string | null;
  profileId?: number;
}) {
  const empty = !name?.trim();
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">{title}</p>
      {empty ? (
        <p className="mt-2 text-sm text-slate-500">Not linked.</p>
      ) : (
        <>
          {profileId ? (
            <Link
              href={`/dashboard/user-management/${profileId}`}
              className="mt-1 inline-block text-sm font-medium text-violet-800 underline-offset-2 hover:underline"
            >
              {name}
            </Link>
          ) : (
            <p className="mt-1 text-sm font-medium text-slate-900">{name}</p>
          )}
          {phone?.trim() ? (
            <p className="mt-0.5 text-xs font-mono text-slate-600">{phone}</p>
          ) : null}
        </>
      )}
    </div>
  );
}

