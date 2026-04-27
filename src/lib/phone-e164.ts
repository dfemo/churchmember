/**
 * Shared E.164-style digit string (no +) for sign-in, registration, and WhatsApp links.
 * Align with `NEXT_PUBLIC_WHATSAPP_*` and backend `Auth:Phone:*`.
 */
export type E164Options = {
  defaultCountryForLeadingZero?: string;
  /** US/Canada NANP 10 → 11 digits; off by default */
  prependOneFor10DigitNanp?: boolean;
  /** If true, "07…" local is not converted; user must use +E.164 */
  disableLeadingZero?: boolean;
};

function readWhatsappDefaultCountry(): string {
  return process.env.NEXT_PUBLIC_WHATSAPP_DEFAULT_COUNTRY?.replace(/\D/g, "") || "234";
}

/** Options aligned with Vercel env for WhatsApp + auth (same list). */
export function getE164OptionsFromEnv(): E164Options {
  return {
    defaultCountryForLeadingZero:
      process.env.NEXT_PUBLIC_WHATSAPP_DISABLE_LEADING_ZERO === "true"
        ? undefined
        : readWhatsappDefaultCountry(),
    prependOneFor10DigitNanp: process.env.NEXT_PUBLIC_WHATSAPP_PREPEND_1_US === "true",
    disableLeadingZero: process.env.NEXT_PUBLIC_WHATSAPP_DISABLE_LEADING_ZERO === "true",
  };
}

/**
 * @returns Digits only, suitable for `wa.me` and to store as canonical phone in the API.
 */
export function toE164Digits(phone: string, options: E164Options = {}): { ok: true; digits: string } | { ok: false; error: string } {
  const { defaultCountryForLeadingZero, prependOneFor10DigitNanp = false, disableLeadingZero = false } = options;
  if (!phone?.trim()) {
    return { ok: false, error: "Enter a phone number." };
  }
  let d = phone.replace(/\D/g, "");
  if (!d) {
    return { ok: false, error: "Use digits with country code, e.g. +234 803 123 4567, +44 7700 900123, or +1 202 555 1234." };
  }
  if (d.startsWith("00") && d.length > 2) d = d.slice(2);

  if (!d.startsWith("0")) {
    if (d.length === 10 && prependOneFor10DigitNanp) {
      const a = d[0];
      if (a >= "2" && a <= "9") d = `1${d}`;
    }
    if (d.length >= 8 && d.length <= 15) {
      return { ok: true, digits: d };
    }
    return {
      ok: false,
      error: "Check the full international number (country + national) — usually 8 to 15 digits after +.",
    };
  }

  if (disableLeadingZero || !defaultCountryForLeadingZero) {
    return {
      ok: false,
      error: "Start with the country code (e.g. +44 for UK) instead of 0, or set phone policy in admin.",
    };
  }
  const cc = defaultCountryForLeadingZero.replace(/\D/g, "");
  if (cc && d.length >= 10 && d.length <= 14) {
    return { ok: true, digits: cc + d.slice(1) };
  }
  return { ok: false, error: "That number could not be normalized. Use international format with +." };
}

/**
 * @returns Digits, or the original trimmed string if you need a legacy exact DB match (rare).
 */
export function toE164DigitsOrEmpty(phone: string, options: E164Options = getE164OptionsFromEnv()) {
  return toE164Digits(phone, options);
}
