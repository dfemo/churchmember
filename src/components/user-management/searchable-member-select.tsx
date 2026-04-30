"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

export type SearchableMemberOption = { id: number; fullName: string };

type SearchableMemberSelectProps = {
  /** For <label htmlFor> */
  fieldId?: string;
  label: string;
  members: SearchableMemberOption[];
  value: number | null;
  onChange: (id: number | null) => void;
  excludeIds?: ReadonlySet<number> | number[];
  hint?: string;
  disabled?: boolean;
};

export function SearchableMemberSelect({
  fieldId,
  label,
  members,
  value,
  onChange,
  excludeIds,
  hint,
  disabled = false,
}: SearchableMemberSelectProps) {
  const exclude = useMemo(() => {
    if (!excludeIds) return new Set<number>();
    return excludeIds instanceof Set ? excludeIds : new Set(excludeIds);
  }, [excludeIds]);

  const selectable = useMemo(
    () => members.filter((m) => !exclude.has(m.id)).sort((a, b) => a.fullName.localeCompare(b.fullName)),
    [members, exclude]
  );

  const selectedInList = value != null ? selectable.find((m) => m.id === value) : undefined;
  const selectedAnywhere = value != null ? members.find((m) => m.id === value) : undefined;
  const displayName =
    selectedInList?.fullName ??
    (value != null ? selectedAnywhere?.fullName ?? `User #${value}` : null);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return selectable;
    return selectable.filter((m) => m.fullName.toLowerCase().includes(q));
  }, [selectable, query]);

  return (
    <div ref={rootRef} className="relative">
      <label htmlFor={fieldId} className="mt-2 block text-xs font-medium text-slate-700">
        {label}
      </label>
      <button
        id={fieldId}
        type="button"
        disabled={disabled}
        onClick={() => {
          if (disabled) return;
          setOpen((o) => {
            const next = !o;
            if (next) setQuery("");
            return next;
          });
        }}
        className="mt-1 flex w-full items-center justify-between gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-left text-sm text-slate-900 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span className={displayName ? "text-slate-900" : "text-slate-500"}>{displayName ?? "None"}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-slate-500 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open ? (
        <div
          className="absolute left-0 right-0 z-50 mt-1 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg"
          role="listbox"
        >
          <input
            type="search"
            autoComplete="off"
            autoFocus
            placeholder="Search by name…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full border-b border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-violet-400/40"
          />
          <ul className="max-h-52 overflow-y-auto py-1">
            <li>
              <button
                type="button"
                role="option"
                className="w-full px-3 py-2 text-left text-sm text-slate-600 hover:bg-violet-50 hover:text-violet-950"
                onClick={() => {
                  onChange(null);
                  setOpen(false);
                  setQuery("");
                }}
              >
                None
              </button>
            </li>
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-xs text-slate-500">No matching members.</li>
            ) : (
              filtered.map((m) => (
                <li key={m.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={value === m.id}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-violet-50 ${
                      value === m.id ? "bg-violet-50 font-medium text-violet-950" : "text-slate-800"
                    }`}
                    onClick={() => {
                      onChange(m.id);
                      setOpen(false);
                      setQuery("");
                    }}
                  >
                    {m.fullName}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      ) : null}

      {hint ? <p className="mt-1 text-[11px] text-slate-600">{hint}</p> : null}
    </div>
  );
}
