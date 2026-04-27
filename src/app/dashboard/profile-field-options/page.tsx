"use client";

import { useAuth } from "@/contexts/auth-context";
import { api, getApiErrorMessage } from "@/lib/api";
import type {
  AddProfileFieldOptionRequest,
  ProfileFieldOptionAdminRow,
} from "@/types/profile-field-options";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export default function ProfileFieldOptionsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [kind, setKind] = useState<"Title" | "Position">("Title");
  const [value, setValue] = useState("");
  const [banner, setBanner] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    if (user && !user.roles?.includes("Admin")) router.replace("/dashboard/member");
  }, [user, router]);

  const list = useQuery({
    queryKey: ["profile-field-options-admin"],
    queryFn: async () =>
      (await api.get<ProfileFieldOptionAdminRow[]>("/api/profile-field-options/admin")).data,
    enabled: Boolean(user?.roles?.includes("Admin")),
  });

  const titles = useMemo(
    () => (list.data ?? []).filter((r) => r.kind === "Title").sort((a, b) => a.sortOrder - b.sortOrder || a.value.localeCompare(b.value)),
    [list.data]
  );
  const positions = useMemo(
    () =>
      (list.data ?? [])
        .filter((r) => r.kind === "Position")
        .sort((a, b) => a.sortOrder - b.sortOrder || a.value.localeCompare(b.value)),
    [list.data]
  );

  const add = useMutation({
    mutationFn: async (body: AddProfileFieldOptionRequest) => api.post("/api/profile-field-options", body),
    onSuccess: async () => {
      setBanner({ type: "ok", text: "Option added." });
      setValue("");
      await queryClient.invalidateQueries({ queryKey: ["profile-field-options-admin"] });
      await queryClient.invalidateQueries({ queryKey: ["profile-field-options-bundle"] });
    },
    onError: (e) => setBanner({ type: "err", text: getApiErrorMessage(e) }),
  });

  const remove = useMutation({
    mutationFn: async (id: number) => api.delete(`/api/profile-field-options/${id}`),
    onSuccess: async () => {
      setBanner({ type: "ok", text: "Option removed." });
      await queryClient.invalidateQueries({ queryKey: ["profile-field-options-admin"] });
      await queryClient.invalidateQueries({ queryKey: ["profile-field-options-bundle"] });
    },
    onError: (e) => setBanner({ type: "err", text: getApiErrorMessage(e) }),
  });

  if (!user?.roles?.includes("Admin")) {
    return <p className="text-sm text-slate-500">Checking access…</p>;
  }

  if (list.isError) {
    return <p className="text-sm text-rose-700">{getApiErrorMessage(list.error)}</p>;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Title &amp; position lists</h1>
        <p className="mt-1 text-sm text-slate-500">
          These values populate dropdowns on{" "}
          <Link href="/dashboard/membership" className="font-medium text-violet-700 underline-offset-2 hover:underline">
            My profile
          </Link>{" "}
          and in user management. Members can only pick values you define here.
        </p>
      </div>

      {banner ? (
        <p
          className={`rounded-lg px-3 py-2 text-sm ${
            banner.type === "ok"
              ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border border-rose-200 bg-rose-50 text-rose-800"
          }`}
        >
          {banner.text}
        </p>
      ) : null}

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">Add option</h2>
        <form
          className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end"
          onSubmit={(e) => {
            e.preventDefault();
            setBanner(null);
            const v = value.trim();
            if (!v) {
              setBanner({ type: "err", text: "Enter a value." });
              return;
            }
            add.mutate({ kind, value: v });
          }}
        >
          <div className="sm:w-40">
            <label className="block text-xs font-medium text-slate-600">Kind</label>
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value as "Title" | "Position")}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
            >
              <option value="Title">Title</option>
              <option value="Position">Position</option>
            </select>
          </div>
          <div className="min-w-0 flex-1">
            <label className="block text-xs font-medium text-slate-600">Label</label>
            <input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={kind === "Title" ? "e.g. Engr." : "e.g. Elder"}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={add.isPending}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {add.isPending ? "Adding…" : "Add"}
          </button>
        </form>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <OptionTable
          title="Titles"
          rows={titles}
          onDelete={(id) => {
            setBanner(null);
            remove.mutate(id);
          }}
          deleting={remove.isPending}
        />
        <OptionTable
          title="Positions"
          rows={positions}
          onDelete={(id) => {
            setBanner(null);
            remove.mutate(id);
          }}
          deleting={remove.isPending}
        />
      </div>

      {list.isLoading ? <p className="text-sm text-slate-500">Loading options…</p> : null}
    </div>
  );
}

function OptionTable({
  title,
  rows,
  onDelete,
  deleting,
}: {
  title: string;
  rows: ProfileFieldOptionAdminRow[];
  onDelete: (id: number) => void;
  deleting: boolean;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
        <p className="text-xs text-slate-500">{rows.length} option{rows.length === 1 ? "" : "s"}</p>
      </div>
      <ul className="divide-y divide-slate-100">
        {rows.length === 0 ? (
          <li className="px-4 py-6 text-center text-sm text-slate-500">No options yet.</li>
        ) : (
          rows.map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-2 px-4 py-2.5">
              <span className="text-sm text-slate-800">{r.value}</span>
              <button
                type="button"
                disabled={deleting}
                onClick={() => onDelete(r.id)}
                className="rounded-md border border-rose-200 px-2 py-1 text-xs font-medium text-rose-700 hover:bg-rose-50 disabled:opacity-50"
              >
                Remove
              </button>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
