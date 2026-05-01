/** Normalizes API date/datetime strings to YYYY-MM-DD for map keys and comparisons. */
export function isoDateKey(iso: string): string {
  const t = iso.indexOf("T");
  return t >= 0 ? iso.slice(0, t) : iso.slice(0, 10);
}
