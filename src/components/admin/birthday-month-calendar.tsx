"use client";

import type { BirthdayPersonResponse } from "@/types/member";
import { isoDateKey } from "@/lib/iso-date-key";
import Link from "next/link";
import { useMemo, useState } from "react";

const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

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

/** Month grid pinned to dashboard church TZ month; shows birthday dots and drill-down links. */
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
      <div className="grid grid-cols-7 gap-1">
        {paddedCells.map((c) =>
          c.type === "blank" ? (
            <div key={c.key} className="aspect-square rounded-lg bg-slate-50/60" aria-hidden />
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

      <SelectedBirthdayPins dayKey={focusKey} monthHeading={monthLabel} map={byDay} />
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

  return (
    <button type="button" onClick={onPick} aria-pressed={selected} aria-label={`Day ${dayNum}`} title={people.map((p) => p.fullName).join(", ") || undefined} className={`flex aspect-square flex-col rounded-lg border p-1.5 text-left transition ${tone} ${selected ? "ring-2 ring-violet-500 ring-offset-1" : ""}`}>
      <span className={`text-[11px] font-bold ${isToday ? "text-rose-800" : "text-slate-800"}`}>{dayNum}</span>
      {hasPins ? (
        <span className="mt-auto flex gap-1" aria-hidden>
          {Array.from({ length: Math.min(people.length, 4) }).map((_, idx) => (
            <span key={idx} className="inline-block h-2 w-2 shrink-0 rounded-full bg-rose-500 shadow-sm" />
          ))}
        </span>
      ) : null}
    </button>
  );
}

function SelectedBirthdayPins({
  dayKey,
  monthHeading,
  map,
}: {
  dayKey: string | null;
  monthHeading: string;
  map: Map<string, BirthdayPersonResponse[]>;
}) {
  if (!dayKey || !map.has(dayKey))
    return (
      <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/80 px-3 py-3 text-[11px] text-slate-500">
        No birthdays pinned for {monthHeading}. Active members without date of birth are omitted.
      </div>
    );

  const rows = map.get(dayKey)!;

  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-inner">
      <p className="text-[11px] font-semibold text-slate-700">
        {dayKey}: {rows.length} birthday{rows.length === 1 ? "" : "s"}
      </p>
      <ul className="mt-2 max-h-36 space-y-1.5 overflow-y-auto text-xs">
        {rows.map((p) => (
          <li key={`${dayKey}-${p.id}`}>
            <Link
              href={`/dashboard/user-management/${p.id}`}
              className="font-medium text-violet-800 underline-offset-2 hover:underline"
            >
              {p.fullName}
            </Link>
            <span className="ml-1 text-slate-500">
              {p.kind === "Today" ? "· Today" : p.kind === "Past" ? "· Earlier this month" : "· Upcoming"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
