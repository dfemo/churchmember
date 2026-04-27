import { toE164Digits } from "@/lib/phone-e164";
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
  defaultCountryForLeadingZero?: string;
  prependOneFor10DigitNanp?: boolean;
  /** When set, "0…" is not converted. Usually inferred from `defaultCountryForLeadingZero` when used from user-management. */
  disableLeadingZero?: boolean;
};

/**
 * Digits for `https://wa.me/{digits}` (shared rules with `lib/phone-e164.ts`).
 */
export function formatPhoneForWhatsapp(phone: string, options: WhatsappFormatOptions = {}): string | null {
  const { defaultCountryForLeadingZero, prependOneFor10DigitNanp = false, disableLeadingZero } = options;
  const r = toE164Digits(phone, {
    defaultCountryForLeadingZero,
    prependOneFor10DigitNanp,
    disableLeadingZero: disableLeadingZero ?? !defaultCountryForLeadingZero,
  });
  return r.ok ? r.digits : null;
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

/**
 * Opens the system SMS composer on phones/tablets (mailto-style). `phoneDigits` = E.164 without +.
 * On many desktops nothing happens; use a phone or SMS gateway for bulk sends.
 */
export function openSmsToPhone(phoneDigits: string, text: string): void {
  if (typeof window === "undefined") return;
  const url = `sms:${phoneDigits}?body=${encodeURIComponent(text)}`;
  window.open(url, "_self", "noopener,noreferrer");
}
