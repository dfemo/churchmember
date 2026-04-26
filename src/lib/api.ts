import axios, { isAxiosError } from "axios";

const baseUrl =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:5233";

export const api = axios.create({
  baseURL: baseUrl,
  headers: { "Content-Type": "application/json" },
});

export function setApiAuthToken(token: string | null) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
}

export function getApiErrorMessage(err: unknown): string {
  if (isAxiosError(err)) {
    const d = err.response?.data as
      | { detail?: string; title?: string; errors?: Record<string, string[]> }
      | undefined;
    if (d?.errors && Object.keys(d.errors).length) {
      return Object.values(d.errors)
        .flat()
        .join(" ");
    }
    if (d?.detail) return String(d.detail);
    if (d?.title) return String(d.title);
    if (err.response?.status === 401) return "Not authorized. Check your phone and password.";
    if (err.message) return err.message;
  }
  if (err instanceof Error) return err.message;
  return "Something went wrong.";
}
