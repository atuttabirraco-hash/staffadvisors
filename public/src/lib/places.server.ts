// Server-only helpers for the Google Maps Platform connector gateway.
// Never import from client code; the .server suffix blocks client bundles.

export const GATEWAY = "https://connector-gateway.lovable.dev/google_maps";

export function mapsAuth(): { Authorization: string; "X-Connection-Api-Key": string } {
  const key = process.env["LOVABLE_API_KEY"];
  const conn = process.env["GOOGLE_MAPS_API_KEY"];
  if (!key || !conn) throw new Error("maps_not_configured");
  return { Authorization: `Bearer ${key}`, "X-Connection-Api-Key": conn };
}

// In-memory cache: identical searches within 10 minutes are answered locally,
// so repeated lookups never reach Google twice.
const cache = new Map<string, { at: number; data: unknown }>();
const TTL = 10 * 60 * 1000;

export async function cachedJson(key: string, fn: () => Promise<unknown>): Promise<unknown> {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL) return hit.data;
  const data = await fn();
  cache.set(key, { at: Date.now(), data });
  if (cache.size > 500) {
    for (const k of cache.keys()) {
      cache.delete(k);
      if (cache.size <= 400) break;
    }
  }
  return data;
}

/** Forward Google's 403 key-restriction reasons into actionable messages. */
export async function throwIfDenied(r: Response): Promise<void> {
  if (r.status !== 403) return;
  let reason = "";
  try {
    const body = await r.json();
    const details = (body?.error?.details ?? []) as Array<{ reason?: string }>;
    reason = details.find((d) => d.reason)?.reason ?? "";
  } catch {
    reason = "";
  }
  if (reason === "API_KEY_HTTP_REFERRER_BLOCKED") throw new Error("maps_referrer_restricted");
  if (reason === "API_KEY_SERVICE_BLOCKED") throw new Error("maps_api_blocked");
  throw new Error("maps_denied");
}
