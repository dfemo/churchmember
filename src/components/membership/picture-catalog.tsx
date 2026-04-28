"use client";

import { api, getApiErrorMessage } from "@/lib/api";
import { notifyErr, notifyOk } from "@/lib/notify";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

export type MediaKind = "profile" | "birthday1" | "birthday2" | "birthday3";

function toDataUrl(bytes: ArrayBuffer, contentType: string) {
  let binary = "";
  const arr = new Uint8Array(bytes);
  const chunk = 0x8000;
  for (let i = 0; i < arr.length; i += chunk) {
    binary += String.fromCharCode(...arr.subarray(i, i + chunk));
  }
  return `data:${contentType};base64,${btoa(binary)}`;
}

const SLOTS: { kind: MediaKind; label: string; hint: string }[] = [
  { kind: "profile", label: "Profile picture", hint: "Shown on your member card and lists." },
  { kind: "birthday1", label: "Birthday picture 1", hint: "Optional greeting image for celebrations." },
  { kind: "birthday2", label: "Birthday picture 2", hint: "Optional second image." },
  { kind: "birthday3", label: "Birthday picture 3", hint: "Optional third image." },
];

export function PictureCatalog() {
  const queryClient = useQueryClient();
  const [mediaUrls, setMediaUrls] = useState<Partial<Record<MediaKind, string>>>({});

  const me = useQuery({
    queryKey: ["me"],
    queryFn: async () => (await api.get<{ id: number }>("/api/members/me")).data,
  });

  useEffect(() => {
    let alive = true;
    async function loadMedia() {
      const kinds: MediaKind[] = ["profile", "birthday1", "birthday2", "birthday3"];
      const next: Partial<Record<MediaKind, string>> = {};
      for (const kind of kinds) {
        try {
          const res = await api.get<ArrayBuffer>(`/api/members/me/media/${kind}`, { responseType: "arraybuffer" });
          const ct = String(res.headers["content-type"] ?? "image/jpeg");
          next[kind] = toDataUrl(res.data, ct);
        } catch {
          // no image
        }
      }
      if (alive) setMediaUrls(next);
    }
    void loadMedia();
    return () => {
      alive = false;
    };
  }, [me.data?.id]);

  const uploadMedia = useMutation({
    mutationFn: async ({ kind, file }: { kind: MediaKind; file: File }) => {
      const fd = new FormData();
      fd.append("kind", kind);
      fd.append("file", file);
      await api.post("/api/members/me/media", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const res = await api.get<ArrayBuffer>(`/api/members/me/media/${kind}`, { responseType: "arraybuffer" });
      return { kind, data: res.data, ct: String(res.headers["content-type"] ?? "image/jpeg") };
    },
    onSuccess: ({ kind, data, ct }) => {
      setMediaUrls((m) => ({ ...m, [kind]: toDataUrl(data, ct) }));
      notifyOk("Image saved.");
      queryClient.invalidateQueries({ queryKey: ["me"] });
    },
    onError: (e) => notifyErr("Upload failed", getApiErrorMessage(e)),
  });

  if (me.isError) {
    return <p className="text-sm text-rose-700">{getApiErrorMessage(me.error)}</p>;
  }
  if (me.isLoading) {
    return <p className="text-sm text-slate-500">Loading…</p>;
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">
        JPEG, PNG, GIF, or WebP — max 4 MB each. On phones, use <span className="font-medium">Tap to upload</span>{" "}
        for a larger touch target.
      </p>
      <ul className="space-y-5">
        {SLOTS.map(({ kind, label, hint }) => (
          <li
            key={kind}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
          >
            <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="text-base font-semibold text-slate-900">{label}</h3>
                <p className="text-xs text-slate-500">{hint}</p>
              </div>
            </div>
            <div className="mt-4">
              {mediaUrls[kind] ? (
                <img
                  src={mediaUrls[kind]}
                  alt=""
                  className="mx-auto max-h-72 w-full max-w-md rounded-xl object-contain sm:max-h-80"
                />
              ) : (
                <div className="flex min-h-44 w-full items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
                  No image yet
                </div>
              )}
            </div>
            <div className="mt-4">
              <label className="flex min-h-[48px] w-full cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-slate-300 bg-slate-50 px-4 py-3 text-center text-sm font-medium text-slate-800 transition hover:border-violet-400 hover:bg-violet-50/60 active:scale-[0.99]">
                <span className="text-base">Tap to upload</span>
                <span className="text-xs font-normal text-slate-500">or choose a file</span>
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  disabled={uploadMedia.isPending}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    e.target.value = "";
                    if (!file) return;
                    uploadMedia.mutate({ kind, file });
                  }}
                />
              </label>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
