import { differenceInCalendarDays, format, parseISO } from "date-fns";
import { ApiError } from "@/lib/api";

export function fmtDate(iso: string): string {
  try {
    return format(parseISO(iso), "dd MMM yyyy");
  } catch {
    return iso;
  }
}

export function fmtDateTime(iso: string): string {
  try {
    return format(parseISO(iso), "dd MMM, h:mm a");
  } catch {
    return iso;
  }
}

export function fmtQty(q: number, unit: string): string {
  return `${Number.isInteger(q) ? q : q.toFixed(1)} ${unit}`;
}

export type Urgency = "danger" | "warn" | "ok" | "muted";

/** Display-only urgency badge for an expiry date (business "today" stays server-anchored). */
export function expiryInfo(dateStr: string): { label: string; urgency: Urgency } {
  try {
    const days = differenceInCalendarDays(parseISO(dateStr), new Date());
    if (days < 0) return { label: "Expired", urgency: "muted" };
    if (days === 0) return { label: "Expires today", urgency: "danger" };
    if (days === 1) return { label: "Expires tomorrow", urgency: "warn" };
    return { label: `Expires in ${days} days`, urgency: "ok" };
  } catch {
    return { label: "Expiry unknown", urgency: "muted" };
  }
}

export function apiErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    const detail = (error.body as { detail?: unknown } | null)?.detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) {
      const first = detail[0] as { msg?: string } | undefined;
      return first?.msg ?? error.message;
    }
    return error.message;
  }
  if (error instanceof Error) return error.message;
  return "Something went wrong";
}
