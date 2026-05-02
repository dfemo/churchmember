"use client";

import type { BirthdayPersonResponse } from "@/types/member";
import { isoDateKey } from "@/lib/iso-date-key";
import Link from "next/link";
import { useMemo, useState } from "react";

const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

const MAX_NAMES_VISIBLE = 6;

function birthdaysByDay(entries: BirthdayPersonResponse[]): Map<string, BirthdayPersonResponse[]> {
  const m = new Map<string, BirthdayPersonResponse[]>();
  for (const p of entries) {
    const k = isoDateKey(p.date);
    const prev = m.get(k);
    if (prev) prev.push(p);
    else m.set(k, [p]);
  }
  for (const list of m.values()) {
    list.sort((a, b) => a.fullName.localeCompare(b.fullName));
  }
  return m;
}

/** Month grid pinned to dashboard church TZ month; names appear per day with profile links. */
export function BirthdayMonthCalendar({
  displayYear,
  displayMonth,
  birthdays,
}: {
  displayYear: number;
  displayMonth: number;
  birthdays: BirthdayPersonResponse[];
}) {
  const byDay = useMemo(() => birthdaysByDay(birthdays), [birthdays]);

  const monthLabel = useMemo(
    () =>
      new Date(displayYear, displayMonth - 1, 1).toLocaleString(undefined, {
        month: "long",
        year: "numeric",
      }),
    [displayYear, displayMonth]
  );

  const todayKey = useMemo(() => {
    const t = birthdays.find((b) => b.kind === "Today");
    return t ? isoDateKey(t.date) : null;
  }, [birthdays]);

  const firstPinnedKey = useMemo(() => {
    const keys = [...byDay.keys()].sort();
    return keys.length ? keys[0]! : null;
  }, [byDay]);

  const inferredFocusKey = todayKey ?? firstPinnedKey;

  const [clickedKey, setClickedKey] = useState<string | null>(null);
  const focusKey = clickedKey ?? inferredFocusKey;

  const cells = useMemo(() => {
    const firstWeekday = new Date(displayYear, displayMonth - 1, 1).getDay();
    const daysInMonth = new Date(displayYear, displayMonth, 0).getDate();
    const blanks = Array.from({ length: firstWeekday }, (_, i) => ({ type: "blank" as const, key: `b-${i}` }));
    const days = Array.from({ length: daysInMonth }, (_, i) => {
      const dom = i + 1;
      const key = `${displayYear}-${String(displayMonth).padStart(2, "0")}-${String(dom).padStart(2, "0")}`;
      return { type: "day" as const, key, dom };
    });
    return [...blanks, ...days];
  }, [displayYear, displayMonth]);

  const trailing = cells.length % 7 === 0 ? 0 : 7 - (cells.length % 7);
  const paddedCells = [...cells, ...Array.from({ length: trailing }, (_, i) => ({ type: "blank" as const, key: `trail-${i}` }))];

  return (
    <div className="space-y-3">
      <p className="text-xs uppercase tracking-wide text-slate-500">{monthLabel}</p>
      <div className="grid grid-cols-7 gap-1 text-[10px] font-semibold text-slate-500">
        {weekdayLabels.map((d) => (
          <div key={d} className="text-center pb-1">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1 items-stretch">
        {paddedCells.map((c) =>
          c.type === "blank" ? (
            <div key={c.key} className="min-h-[4rem] rounded-lg bg-slate-50/60" aria-hidden />
          ) : (
            <DayPinCell
              key={c.key}
              dayNum={c.dom}
              dayKey={c.key}
              people={byDay.get(c.key) ?? []}
              selected={focusKey === c.key}
              onPick={() => setClickedKey(c.key)}
              isPastOnly={(byDay.get(c.key) ?? []).length > 0 && (byDay.get(c.key) ?? []).every((p) => p.kind === "Past")}
            />
          )
        )}
      </div>
    </div>
  );
}

function DayPinCell({
  dayNum,
  dayKey,
  people,
  selected,
  onPick,
  isPastOnly,
}: {
  dayNum: number;
  dayKey: string;
  people: BirthdayPersonResponse[];
  selected: boolean;
  onPick: () => void;
  isPastOnly: boolean;
}) {
  const hasPins = people.length > 0;
  const isToday = people.some((p) => p.kind === "Today");

  let tone = "border-slate-200 bg-white hover:bg-violet-50/70";
  if (isToday) tone = "border-rose-500 bg-gradient-to-br from-rose-50 to-amber-50 shadow-sm";
  else if (hasPins && !isPastOnly) tone = "border-violet-300 bg-violet-50/70 hover:bg-violet-100/70";
  else if (isPastOnly) tone = "border-slate-200 bg-slate-50/95 text-slate-500 hover:bg-slate-100";

  const visible = people.slice(0, MAX_NAMES_VISIBLE);
  const overflow = people.length - visible.length;

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onPick();
    }
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onPick}
      onKeyDown={onKeyDown}
      aria-pressed={selected}
      aria-label={`Day ${dayNum}${hasPins ? `, ${people.length} birthday${people.length === 1 ? "" : "s"}` : ""}`}
      className={`flex min-h-[4rem] flex-col rounded-lg border p-1 text-left outline-none transition focus-visible:ring-2 focus-visible:ring-violet-400 ${tone} ${selected ? "ring-2 ring-violet-500 ring-offset-1" : ""}`}
    >
      <span className={`shrink-0 text-[11px] font-bold leading-none ${isToday ? "text-rose-800" : "text-slate-800"}`}>
        {dayNum}
      </span>

      {hasPins ? (
        <ul className="mt-1 flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto pr-0.5">
          {visible.map((p) => (
            <li key={p.id} className="min-w-0 leading-tight">
              <Link
                href={`/dashboard/user-management/${p.id}`}
                onClick={(e) => e.stopPropagation()}
                className={`block truncate text-[9px] font-semibold underline-offset-2 hover:underline ${
                  isPastOnly ? "text-slate-600 hover:text-slate-900" : "text-violet-900 hover:text-violet-950"
                }`}
                title={p.fullName}
              >
                {p.fullName}
              </Link>
            </li>
          ))}
          {overflow > 0 ? (
            <li className="text-[9px] font-medium text-slate-600">+{overflow} more</li>
          ) : null}
        </ul>
      ) : (
        <span className="flex-1" aria-hidden />
      )}
    </div>
  );
}
