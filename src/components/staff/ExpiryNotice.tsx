import type { ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

/** How close to the deadline the warning appears. */
export const EXPIRY_WARNING_DAYS = 3;

/**
 * Whole days left before a deadline, rounded up. Null when there is no date or
 * the deadline has already passed (other parts of the UI handle that case).
 */
export function daysUntil(expiresAt?: string | null): number | null {
  if (!expiresAt) return null;
  const until = new Date(expiresAt).getTime();
  if (!Number.isFinite(until)) return null;
  const left = until - Date.now();
  if (left <= 0) return null;
  return Math.ceil(left / 86400000);
}

/**
 * Orange band shown in the last few days of a listing so nobody loses visibility
 * by accident. `title` may contain {n}, replaced with the days remaining.
 */
export function ExpiryNotice({ expiresAt, title, children }: { expiresAt?: string | null; title: string; children?: ReactNode }) {
  const days = daysUntil(expiresAt);
  if (days === null || days > EXPIRY_WARNING_DAYS) return null;
  return (
    <div className="rounded-2xl border border-primary/40 bg-primary-soft p-4">
      <p className="flex items-start gap-2 text-sm font-bold text-foreground">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <span>{title.replace("{n}", String(days))}</span>
      </p>
      {children ? <div className="mt-3">{children}</div> : null}
    </div>
  );
}
