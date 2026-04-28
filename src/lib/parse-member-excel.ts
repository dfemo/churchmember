import * as XLSX from "xlsx";

export type ParsedBulkRow = {
  firstName: string;
  lastName: string;
  phone: string;
  dateOfBirth: string | null;
};

/** Normalize header for comparison: lowercase, collapse spaces. */
function normalizeHeader(h: string): string {
  return h.trim().toLowerCase().replace(/[\s_\u00a0]+/g, "");
}

/** Canonical column keys and accepted header aliases (after normalizeHeader). */
const COLUMN_ALIASES: Record<string, string[]> = {
  firstname: ["firstname", "fname", "givenname", "first"],
  lastname: ["lastname", "lname", "surname", "familyname", "last"],
  phone: ["phone", "phonenumber", "mobile", "tel", "cell"],
  dateofbirth: ["dateofbirth", "dob", "birthdate", "birthday", "datebirth"],
};

function findColumnIndex(normHeaders: string[], canonical: string): number {
  const aliases = COLUMN_ALIASES[canonical];
  if (!aliases) return -1;
  for (let i = 0; i < normHeaders.length; i++) {
    const h = normHeaders[i];
    if (aliases.includes(h)) return i;
  }
  return -1;
}

function cellToDateIso(val: unknown): string | null {
  if (val == null || val === "") return null;
  if (val instanceof Date && !Number.isNaN(val.getTime())) {
    return val.toISOString().slice(0, 10);
  }
  if (typeof val === "number") {
    const ssf = (XLSX as unknown as { SSF?: { parse_date_code: (n: number) => { y: number; m?: number; d?: number } } })
      .SSF;
    if (ssf?.parse_date_code) {
      const utc = ssf.parse_date_code(val);
      if (utc && typeof utc.y === "number") {
        const d = new Date(Date.UTC(utc.y, (utc.m ?? 1) - 1, utc.d ?? 1));
        if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
      }
    }
    const epoch = Date.UTC(1899, 11, 30);
    const ms = epoch + Math.round(val * 86400000);
    const d2 = new Date(ms);
    if (!Number.isNaN(d2.getTime())) return d2.toISOString().slice(0, 10);
  }
  const s = String(val).trim();
  if (!s) return null;
  const p = Date.parse(s);
  if (!Number.isNaN(p)) return new Date(p).toISOString().slice(0, 10);
  return s;
}

/**
 * Reads the first worksheet; row 1 = headers (First name, Last name, Phone, Date of birth).
 * Returns one entry per non-empty data row.
 */
export function parseMemberExcel(buffer: ArrayBuffer): { rows: ParsedBulkRow[]; errors: string[] } {
  const errors: string[] = [];
  let wb: XLSX.WorkBook;
  try {
    wb = XLSX.read(buffer, { type: "array", cellDates: true });
  } catch {
    return { rows: [], errors: ["Could not read this file. Use .xlsx or .xls format."] };
  }

  const sheetName = wb.SheetNames[0];
  if (!sheetName) {
    return { rows: [], errors: ["The workbook has no sheets."] };
  }

  const sheet = wb.Sheets[sheetName];
  const aoa = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: true, defval: "" });

  if (!aoa.length || aoa.length < 2) {
    return { rows: [], errors: ["Add a header row and at least one data row."] };
  }

  const headerRow = (aoa[0] ?? []).map((h) => normalizeHeader(String(h ?? "")));
  const col: Record<string, number> = {};
  for (const key of Object.keys(COLUMN_ALIASES)) {
    const idx = findColumnIndex(headerRow, key);
    if (idx === -1) {
      const hint = COLUMN_ALIASES[key]?.join(", ") ?? key;
      return {
        rows: [],
        errors: [
          `Missing column for "${key}". Use one of these header names: ${hint} (e.g. Firstname, Lastname, Phone, Date of birth).`,
        ],
      };
    }
    col[key] = idx;
  }

  const rows: ParsedBulkRow[] = [];
  for (let r = 1; r < aoa.length; r++) {
    const row = (aoa[r] ?? []) as unknown[];
    const firstName = String(row[col.firstname] ?? "").trim();
    const lastName = String(row[col.lastname] ?? "").trim();
    const phone = String(row[col.phone] ?? "").trim();
    const dobRaw = row[col.dateofbirth];
    const dateOfBirth = cellToDateIso(dobRaw);

    if (!firstName && !lastName && !phone && (dobRaw === "" || dobRaw === undefined || dobRaw === null)) {
      continue;
    }

    rows.push({
      firstName,
      lastName,
      phone,
      dateOfBirth,
    });
  }

  if (!rows.length) {
    errors.push("No data rows found under the header.");
  }

  return { rows, errors };
}
