"use client";

import type { SundayAttendanceCountPoint } from "@/types/member";
import Link from "next/link";
import { useMemo } from "react";

const VB_W = 360;
const VB_H = 140;
const PAD_L = 28;
const PAD_R = 12;
const PAD_T = 12;
const PAD_B = 40;

function labelSunday(isoDate: string): string {
  const d = new Date(isoDate + "T12:00:00");
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

/** Lightweight SVG line chart — aggregate marks per Sunday (church dashboard window). */
export function SundayAttendanceLast4Chart({ points }: { points: SundayAttendanceCountPoint[] }) {
  const sorted = useMemo(
    () => [...points].sort((a, b) => isoDateOnly(a.date).localeCompare(isoDateOnly(b.date))),
    [points]
  );

  const maxVal = useMemo(() => Math.max(1, ...sorted.map((p) => p.headcount)), [sorted]);

  const layout = useMemo(() => {
    const innerW = VB_W - PAD_L - PAD_R;
    const innerH = VB_H - PAD_T - PAD_B;
    const xAt = (i: number) =>
      sorted.length <= 1 ? PAD_L + innerW / 2 : PAD_L + (innerW / (sorted.length - 1)) * i;
    const yAt = (v: number) => PAD_T + innerH - (v / maxVal) * innerH;
    const pathD =
      sorted.length === 0
        ? ""
        : sorted
            .map((p, i) => {
              const x = xAt(i);
              const y = yAt(p.headcount);
              return `${i === 0 ? "M" : "L"} ${x} ${y}`;
            })
            .join(" ");

    return { innerW, innerH, xAt, yAt, pathD };
  }, [sorted, maxVal]);

  if (sorted.length === 0) {
    return (
      <div className="flex h-44 items-center justify-center rounded-lg bg-slate-50 px-3 text-center text-xs text-slate-500">
        No Sunday snapshots yet — record attendance on the Sunday page to see trends.
      </div>
    );
  }

  const { innerW, innerH, xAt, yAt, pathD } = layout;

  return (
    <div className="space-y-2">
      <div className="overflow-hidden rounded-lg bg-slate-50 p-1">
        <svg
          role="img"
          aria-label="Attendance headcount across the last four Sundays"
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          className="h-44 w-full"
        >
          <title>Sunday attendance (last four Sundays)</title>
          {[0, 0.25, 0.5, 0.75, 1].map((t) => {
            const y = PAD_T + innerH - t * innerH;
            const tick = Math.round(maxVal * t);
            return (
              <g key={t}>
                <line x1={PAD_L} x2={VB_W - PAD_R} y1={y} y2={y} stroke="#e2e8f8" strokeWidth={1} />
                <text x={4} y={y + 3} fill="#64748b" fontSize={9}>
                  {tick}
                </text>
              </g>
            );
          })}

          {pathD ? (
            <path
              d={pathD}
              fill="none"
              stroke="#059669"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ) : null}

          {sorted.map((p, i) => (
            <g key={`${p.date}-${i}`}>
              <circle cx={xAt(i)} cy={yAt(p.headcount)} r={5} fill="#ecfdf5" stroke="#059669" strokeWidth={2} />
              <text
                x={xAt(i)}
                y={VB_H - PAD_B / 2}
                textAnchor="middle"
                fill="#334155"
                fontSize={9}
                fontWeight={600}
              >
                {labelSunday(isoDateOnly(p.date))}
              </text>
              <text x={xAt(i)} y={VB_H - 10} textAnchor="middle" fill="#64748b" fontSize={9}>
                {p.headcount}
              </text>
            </g>
          ))}
        </svg>
      </div>
      <Link
        href="/dashboard/attendance/sunday-service"
        className="inline-block text-[11px] font-semibold text-violet-700 hover:underline"
      >
        Open Sunday attendance report →
      </Link>
    </div>
  );
}

function isoDateOnly(s: string): string {
  const t = s.indexOf("T");
  return t >= 0 ? s.slice(0, t) : s.slice(0, 10);
}
