import type { MemberListItem, MemberProfile } from "@/types/member";

const STORAGE_KEY = "cm_whatsapp_message_template";
const DEFAULT_TEMPLATE = "Hi {{name}},\n\nThis is a message from the church. If you have questions, reply to this number.\n\n— Church office";

export function getStoredWhatsappTemplate(): string {
  if (typeof window === "undefined") return DEFAULT_TEMPLATE;
  const s = localStorage.getItem(STORAGE_KEY);
  return s?.trim() ? s : DEFAULT_TEMPLATE;
}

export function setStoredWhatsappTemplate(v: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, v);
}

export type WhatsappFormatOptions = {
  /** Digits for `00` local-legacy: national number starts with 0, e.g. 0803… → 234 + 803… */
  defaultCountryForLeadingZero?: string;
  /**
   * 10 digits, first 2-9: prepend `1` (US/Canada NANP). **Opt in only** — default false, because 10-digit numbers can be national numbers in other countries.
   * @default false
   */
  prependOneFor10DigitNanp?: boolean;
};

/**
 * Digits for `https://wa.me/{digits}` (no +, no spaces).
 *
 * - **Any country in full international form (recommended)**: e.g. `+234 803 123 4567`, `+44 7700 900123`,
 *   `+1 202 555 1234` → we keep digits: `234803...`, `447700...`, `1202555...` so Nigeria, UK, and US all work
 *   from the same list.
 * - **`00` prefix** (common outside North America) is removed once, then the rest is used as the full international number.
 * - **10 digits, first digit 2-9 (no leading 0)**: if {@link WhatsappFormatOptions.prependOneFor10DigitNanp} is
 *   `true`, a leading **1** is added (US/Canada NANP only; opt in, default off).
 * - **Local numbers starting with `0`** (e.g. `0803…` or `07000…` UK): that format is **country-specific**.
 *   We only convert when `defaultCountryForLeadingZero` is set (e.g. `234` for Nigeria). For **UK 07…**, do **not**
 *   use local `0` — store **`+44…` / full international** in the profile instead, so the first branch matches.
 */
export function formatPhoneForWhatsapp(phone: string, options: WhatsappFormatOptions = {}): string | null {
  const { defaultCountryForLeadingZero, prependOneFor10DigitNanp = false } = options;
  if (!phone?.trim()) return null;
  let d = phone.replace(/\D/g, "");
  if (!d) return null;
  if (d.startsWith("00") && d.length > 2) d = d.slice(2);

  // Full international: already has country code (2–4 digits) + national, no leading 0.
  if (!d.startsWith("0")) {
    if (d.length === 10 && prependOneFor10DigitNanp) {
      const a = d[0];
      if (a >= "2" && a <= "9") d = `1${d}`;
    }
    if (d.length >= 8 && d.length <= 15) return d;
    return null;
  }

  // Leading 0 = local; must match ONE country. Only use for legacy (e.g. 0803… with default 234). Not for mixed UK+NG+US in one list unless everyone uses E.164 except one country.
  const cc = (defaultCountryForLeadingZero ?? "").replace(/\D/g, "");
  if (cc && d.length >= 10 && d.length <= 14) {
    return cc + d.slice(1);
  }

  return null;
}

function placeholderMap(u: MemberListItem | MemberProfile) {
  const profile = u as MemberProfile;
  const hasProfileEmail = "email" in u;
  return {
    name: u.fullName,
    phone: u.phoneNumber,
    title: (u.title ?? "").trim(),
    position: (u.position ?? "").trim(),
    status: u.status,
    role: u.roles.join(", "),
    email: hasProfileEmail ? (profile.email ?? "") : "",
    address: hasProfileEmail ? (profile.address ?? "") : "",
    dob: u.dateOfBirth ? u.dateOfBirth.slice(0, 10) : "",
  };
}

/**
 * Replaces e.g. `{{name}}`, `{{phone}}`, `{{title}}`, `{{position}}`, `{{status}}`, `{{role}}`, `{{email}}`, `{{address}}`, `{{dob}}` (and `dateOfBirth`).
 * `{{email}}` / `{{address}}` are only filled on the user detail drawer; they are empty in the table.
 */
export function personalizeWhatsappMessage(template: string, u: MemberListItem | MemberProfile): string {
  const m = placeholderMap(u);
  const norm: Record<string, string> = {
    name: m.name,
    phone: m.phone,
    title: m.title,
    position: m.position,
    status: m.status,
    role: m.role,
    email: m.email,
    address: m.address,
    dob: m.dob,
    dateofbirth: m.dob,
    date_of_birth: m.dob,
  };
  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_full, k: string) => {
    const key = k.toLowerCase();
    if (key in norm) return norm[key] ?? "";
    return _full;
  });
}

export { DEFAULT_TEMPLATE, STORAGE_KEY };

export function openWhatsappToPhone(phoneDigits: string, text: string): void {
  const url = `https://wa.me/${phoneDigits}?text=${encodeURIComponent(text)}`;
  window.open(url, "_blank", "noopener,noreferrer");
}
