/** Ensures the member's current value appears even if it was removed from the configured list. */
export function mergePicklistWithCurrent(
  current: string | null | undefined,
  options: string[]
): string[] {
  const set = new Set(options.map((x) => x.trim()).filter(Boolean));
  const c = current?.trim();
  if (c) set.add(c);
  return [...set].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
}
