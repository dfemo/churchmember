"use client";

import { api, getApiErrorMessage } from "@/lib/api";
import { parseMemberExcel } from "@/lib/parse-member-excel";
import type { BulkImportMembersRequest, BulkImportMembersResponse } from "@/types/member";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useCallback, useState } from "react";

export default function BulkUploadPage() {
  const queryClient = useQueryClient();
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [parsedPreviewCount, setParsedPreviewCount] = useState(0);
  const [pendingPayload, setPendingPayload] = useState<BulkImportMembersRequest | null>(null);
  const [defaultPassword, setDefaultPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitErr, setSubmitErr] = useState<string | null>(null);

  const bulkMut = useMutation({
    mutationFn: async (body: BulkImportMembersRequest) => {
      const { data } = await api.post<BulkImportMembersResponse>("/api/members/bulk", body);
      return data;
    },
    onSuccess: async () => {
      setSubmitErr(null);
      setPendingPayload(null);
      setParsedPreviewCount(0);
      setDefaultPassword("");
      setConfirmPassword("");
      await queryClient.invalidateQueries({ queryKey: ["members-list"] });
    },
    onError: (e: unknown) => {
      setSubmitErr(getApiErrorMessage(e));
    },
  });

  const onFile = useCallback(
    async (file: File | null) => {
      setParseErrors([]);
      setPendingPayload(null);
      setParsedPreviewCount(0);
      if (!file) return;
      const lower = file.name.toLowerCase();
      if (!lower.endsWith(".xlsx") && !lower.endsWith(".xls")) {
        setParseErrors(["Please choose an Excel file (.xlsx or .xls)."]);
        return;
      }
      const buf = await file.arrayBuffer();
      const { rows, errors } = parseMemberExcel(buf);
      if (errors.length) {
        setParseErrors(errors);
        return;
      }
      setParsedPreviewCount(rows.length);
      setPendingPayload({
        rows: rows.map((r) => ({
          firstName: r.firstName,
          lastName: r.lastName,
          phone: r.phone,
          dateOfBirth: r.dateOfBirth,
        })),
        defaultPassword: "",
      });
    },
    []
  );

  const result = bulkMut.data;

  return (
    <div className="space-y-4">
      <div>
        <nav className="mb-2 text-xs text-slate-500">
          <Link href="/dashboard/user-management" className="font-medium text-violet-700 hover:underline">
            User management
          </Link>
          <span className="mx-1.5 text-slate-400">/</span>
          <span className="text-slate-700">Bulk upload</span>
        </nav>
        <h1 className="text-2xl font-semibold text-slate-900">Bulk upload</h1>
        <p className="mt-1 text-sm text-slate-500">
          Upload an Excel file with columns: <strong>Firstname</strong>, <strong>Lastname</strong>, <strong>Phone</strong>,{" "}
          <strong>Date of birth</strong> (first row = headers). Variant names such as &quot;First name&quot;, &quot;Mobile&quot;,
          or &quot;DOB&quot; are accepted. Date cells can be Excel dates or text. All imported users are created as{" "}
          <strong>Member</strong> with <strong>Active</strong> status; they must change password after first sign-in.
        </p>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">1. Choose file</h2>
        <input
          type="file"
          accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
          className="mt-2 block w-full max-w-md text-sm text-slate-700 file:mr-3 file:rounded-md file:border file:border-slate-300 file:bg-slate-50 file:px-3 file:py-1.5 file:text-sm"
          onChange={(e) => void onFile(e.target.files?.[0] ?? null)}
        />
        {parseErrors.length ? (
          <ul className="mt-3 list-inside list-disc text-sm text-rose-700">
            {parseErrors.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        ) : null}
        {pendingPayload && !parseErrors.length ? (
          <p className="mt-3 text-sm text-slate-600">
            Parsed <strong>{parsedPreviewCount}</strong> row{parsedPreviewCount === 1 ? "" : "s"}. Enter the shared initial
            password below, then import.
          </p>
        ) : null}
      </section>

      {pendingPayload ? (
        <section className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">2. Initial password (all new users)</h2>
          <p className="mt-1 text-xs text-slate-500">Minimum 8 characters. Same rules as single user creation.</p>
          <div className="mt-3 grid max-w-md gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-slate-600">Password</label>
              <input
                type="password"
                autoComplete="new-password"
                className="mt-1 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
                value={defaultPassword}
                onChange={(e) => setDefaultPassword(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600">Confirm</label>
              <input
                type="password"
                autoComplete="new-password"
                className="mt-1 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={bulkMut.isPending}
              onClick={() => {
                setSubmitErr(null);
                if (defaultPassword.length < 8) {
                  setSubmitErr("Password must be at least 8 characters.");
                  return;
                }
                if (defaultPassword !== confirmPassword) {
                  setSubmitErr("Password and confirmation do not match.");
                  return;
                }
                bulkMut.mutate({ ...pendingPayload, defaultPassword });
              }}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {bulkMut.isPending ? "Importing…" : "Import users"}
            </button>
            <Link
              href="/dashboard/user-management"
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Cancel
            </Link>
          </div>
          {submitErr ? <p className="mt-3 text-sm text-rose-700">{submitErr}</p> : null}
        </section>
      ) : null}

      {result ? (
        <section className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">Results</h2>
          <p className="mt-1 text-sm text-slate-600">
            Created <strong>{result.createdCount}</strong>, failed <strong>{result.failedCount}</strong>.
          </p>
          <div className="mt-3 max-h-72 overflow-auto rounded-lg border border-slate-200">
            <table className="min-w-full text-xs">
              <thead className="bg-slate-50 text-left text-slate-600">
                <tr>
                  <th className="px-2 py-2 font-medium">Excel row</th>
                  <th className="px-2 py-2 font-medium">Status</th>
                  <th className="px-2 py-2 font-medium">Detail</th>
                </tr>
              </thead>
              <tbody>
                {result.results.map((r) => (
                  <tr key={r.excelRowNumber} className="border-t border-slate-100">
                    <td className="px-2 py-1.5">{r.excelRowNumber}</td>
                    <td className="px-2 py-1.5">{r.success ? "OK" : "Error"}</td>
                    <td className="px-2 py-1.5 text-slate-700">
                      {r.success ? (r.createdUserId != null ? `User #${r.createdUserId}` : "Created") : (r.error ?? "")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-slate-500">
            Row numbers match your spreadsheet (row 1 = headers).{" "}
            <Link href="/dashboard/user-management" className="font-medium text-violet-700 hover:underline">
              Back to user list
            </Link>
          </p>
        </section>
      ) : null}
    </div>
  );
}
