/** Calendar helpers for DOB (ISO yyyy-mm-dd). Aligns with dashboard “today’s birthdays” (month/day; Feb 29 → Feb 28 on non-leap years). */

function parseDobParts(iso: string | null | undefined): { month: number; day: number } | null {
  if (!iso?.trim()) return null;
  const m = iso.trim().slice(0, 10).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const month = Number(m[2]);
  const day = Number(m[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return { month, day };
}

function isLeapYear(y: number): boolean {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
}

/** True when profile DOB matches the system calendar’s today (local date). */
export function isBirthdayCalendarToday(dateOfBirth: string | null | undefined): boolean {
  const p = parseDobParts(dateOfBirth);
  if (!p) return false;
  const now = new Date();
  const cy = now.getFullYear();
  const cm = now.getMonth() + 1;
  const cd = now.getDate();
  if (p.month === cm && p.day === cd) return true;
  return p.month === 2 && p.day === 29 && cm === 2 && cd === 28 && !isLeapYear(cy);
}

/** e.g. "Apr 27" from stored ISO date (year ignored for display). */
export function formatBirthdayListColumn(dateOfBirth: string | null | undefined): string {
  const p = parseDobParts(dateOfBirth);
  if (!p) return "—";
  const dt = new Date(2000, p.month - 1, p.day);
  return dt.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
