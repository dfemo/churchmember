import { toast } from "sonner";

/** Success confirmation (green, icon). */
export function notifyOk(title: string, description?: string) {
  toast.success(title, {
    description: description?.trim() || undefined,
    duration: 5_000,
  });
}

/** Error / failure (red). */
export function notifyErr(title: string, description?: string) {
  toast.error(title, {
    description: description?.trim() || undefined,
    duration: 8_000,
  });
}

/** Neutral info (e.g. long Meta/WhatsApp notes). */
export function notifyInfo(title: string, description?: string) {
  toast.info(title, {
    description: description?.trim() || undefined,
    duration: 10_000,
  });
}
