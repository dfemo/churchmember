"use client";

import { api, getApiErrorMessage } from "@/lib/api";
import { getE164OptionsFromEnv, toE164Digits } from "@/lib/phone-e164";
import { openSmsToPhone, personalizeWhatsappMessage } from "@/lib/whatsapp";
import type { MemberListItem, MemberProfile } from "@/types/member";
import { X } from "lucide-react";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";

type Recipient = MemberListItem | MemberProfile;

type SendWhatsappApiResponse = {
  messageId?: string | null;
  toInternationalDisplay?: string;
};

type SendMessageDialogProps = {
  open: boolean;
  onClose: () => void;
  user: Recipient | null;
  template: string;
  /** When using Open SMS, keep template saved in the browser (same as before). */
  onPersistTemplate: () => void;
  /** Meta stores recipients as digits only; display uses + here for clarity. */
  onWhatsappSent?: (info: { toInternationalDisplay: string }) => void;
};

export function SendMessageDialog({
  open,
  onClose,
  user,
  template,
  onPersistTemplate,
  onWhatsappSent,
}: SendMessageDialogProps) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const [body, setBody] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [waSending, setWaSending] = useState(false);
  const [waError, setWaError] = useState<string | null>(null);

  const e164Opts = useMemo(() => getE164OptionsFromEnv(), []);

  const e164 = useMemo(() => {
    if (!user?.phoneNumber?.trim()) return null;
    const r = toE164Digits(user.phoneNumber, e164Opts);
    return r.ok ? r.digits : null;
  }, [user, e164Opts]);

  useEffect(() => {
    if (open && user) {
      setBody(personalizeWhatsappMessage(template, user));
      setImageUrl("");
      setWaError(null);
    }
  }, [open, user, template]);

  useEffect(() => {
    if (open) closeRef.current?.focus();
  }, [open]);

  const canSend = Boolean(e164 && body.trim());
  const waDisabled = !canSend || waSending;

  const sendWhatsapp = useCallback(async () => {
    if (!user || !e164 || !body.trim()) return;
    setWaError(null);
    setWaSending(true);
    try {
      const { data } = await api.post<SendWhatsappApiResponse>("/api/messages/whatsapp", {
        toPhoneNumber: e164,
        message: body,
        imageUrl: imageUrl.trim() || null,
      });
      onPersistTemplate();
      onWhatsappSent?.({
        toInternationalDisplay: data.toInternationalDisplay?.trim() || `+${e164}`,
      });
      onClose();
    } catch (e) {
      setWaError(getApiErrorMessage(e));
    } finally {
      setWaSending(false);
    }
  }, [user, e164, body, imageUrl, onPersistTemplate, onWhatsappSent, onClose]);

  const sendSms = useCallback(() => {
    if (!user || !e164 || !body.trim()) return;
    onPersistTemplate();
    openSmsToPhone(e164, body);
    onClose();
  }, [user, e164, body, onPersistTemplate, onClose]);

  if (!open || !user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/45"
        aria-label="Close"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal
        aria-labelledby={titleId}
        className="relative z-10 flex max-h-[min(90vh,720px)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between gap-2 border-b border-slate-100 px-4 py-3 sm:px-5">
          <div>
            <h2 id={titleId} className="text-base font-semibold text-slate-900">
              Send message
            </h2>
            <p className="mt-0.5 text-sm text-slate-600">
              {user.fullName}
              {user.phoneNumber ? (
                <span className="ml-1 font-mono text-slate-500">· {user.phoneNumber}</span>
              ) : null}
            </p>
            {e164 ? (
              <p className="mt-1 text-[11px] leading-relaxed text-emerald-950">
                <span className="font-semibold">International:</span>{" "}
                <span className="font-mono">+{e164}</span>
                <span className="block text-emerald-900/90">
                  Meta&apos;s API requires the recipient as digits only (no plus)—{" "}
                  <span className="font-mono">{e164}</span> is the same number as{" "}
                  <span className="font-mono">+{e164}</span>.
                </span>
              </p>
            ) : null}
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" strokeWidth={2} />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-3 sm:px-5">
          {!e164 ? (
            <p className="text-sm text-amber-800">
              This phone can&apos;t be used until it&apos;s a valid international number (E.164) on the
              user&apos;s profile — e.g. with country code like +234, +1, or +44.
            </p>
          ) : (
            <p className="text-xs text-slate-500">
              <span className="font-medium text-slate-700">WhatsApp</span> is sent from the server
              using the Meta WhatsApp Business Cloud API (configure{" "}
              <code className="rounded bg-slate-100 px-0.5">WhatsApp:Cloud</code> on the API). The send payload uses
              digit-only E.164 (Meta specification — no + in JSON).{" "}
              <span className="font-medium text-slate-700">SMS</span> opens your device&apos;s text app
              (phones only).
            </p>
          )}

          {waError ? (
            <p className="text-sm text-rose-700" role="alert">
              {waError}
            </p>
          ) : null}

          <div>
            <label htmlFor="msg-body" className="block text-xs font-medium text-slate-600">
              Message
            </label>
            <textarea
              id="msg-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={8}
              className="mt-1 w-full resize-y rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400"
              placeholder="Write your message…"
            />
            <p className="mt-1 text-[11px] text-slate-500">
              Template placeholders (e.g. <code className="rounded bg-slate-100 px-0.5">{"{{name}}"}</code>) were
              filled from the list above. Edit the text as needed.
            </p>
          </div>

          <div>
            <label htmlFor="msg-image" className="block text-xs font-medium text-slate-600">
              Image URL (optional)
            </label>
            <input
              id="msg-image"
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400"
              placeholder="https://example.com/image.jpg"
            />
            <p className="mt-1 text-[11px] text-slate-500">
              For Twilio templates, this is sent as variable <code className="rounded bg-slate-100 px-0.5">{"{{2}}"}</code>
              by default (configurable on API).
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/80 px-4 py-3 sm:px-5">
          <button
            type="button"
            onClick={onClose}
            disabled={waSending}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!canSend || waSending}
            onClick={sendSms}
            className="rounded-lg border border-slate-400 bg-white px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Open SMS
          </button>
          <button
            type="button"
            disabled={waDisabled}
            onClick={() => void sendWhatsapp()}
            className="rounded-lg border-2 border-emerald-600 bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:border-emerald-700 hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {waSending ? "Sending…" : "Send as WhatsApp"}
          </button>
        </div>
      </div>
    </div>
  );
}
