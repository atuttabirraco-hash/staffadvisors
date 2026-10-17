// Server-only helpers: check that a company reply really comes from the
// company's own email domain, so verified answers can publish themselves.
// The .server suffix keeps this file out of client bundles.

/** Common two-part public suffixes so "barilla.co.uk" resolves to itself. */
const MULTI_SUFFIXES = [
  "co.uk", "org.uk", "ac.uk", "gov.uk", "com.au", "net.au", "edu.au", "co.nz",
  "co.in", "net.in", "org.in", "com.br", "com.mx", "com.ar", "com.co", "com.pe",
  "com.uy", "com.ec", "com.bo", "com.py", "com.gt", "com.do", "co.za", "com.tr",
  "com.sg", "com.hk", "com.my", "com.ph", "co.jp", "co.kr", "com.tw", "com.vn",
  "co.id", "com.sa", "com.eg", "com.ng", "com.gh", "co.il", "com.pl", "com.pt",
  "com.ua", "com.gr", "com.cu", "com.pa", "com.ni", "com.sv", "com.hn", "com.cr",
];

/** "Mario@Barilla.it" -> "barilla.it" */
export function emailDomain(email: string): string {
  return (email.split("@").pop() ?? "").trim().toLowerCase();
}

/** "https://www.barilla.it/it-it/prodotti" -> "barilla.it" */
export function baseDomain(value: string): string {
  const host = value
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split("/")[0]!
    .split("?")[0]!
    .split("#")[0]!
    .replace(/:\d+$/, "");
  const parts = host.split(".").filter(Boolean);
  if (parts.length <= 2) return parts.join(".");
  const last2 = parts.slice(-2).join(".");
  if (MULTI_SUFFIXES.includes(last2)) return parts.slice(-3).join(".");
  return last2;
}

/**
 * True when the sender writes from the company's own domain.
 * Subdomains count (hr.barilla.it, sede.barilla.it); "gmail.com" never does.
 */
export function emailMatchesCompanyDomain(
  email: string,
  companyDomain: string | null | undefined,
): boolean {
  if (!companyDomain) return false;
  const sender = baseDomain(emailDomain(email));
  const company = baseDomain(companyDomain);
  return !!sender && !!company && sender === company;
}

/**
 * Official domain of a company: the stored one when we already know it,
 * otherwise read from Google Places (website) and saved for next time.
 * Returns null when the company has no website on record.
 */
export async function companyWebsiteDomain(companyId: string): Promise<string | null> {
  const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
  const { data: comp } = await db.from("companies").select("website_domain, place_id").eq("id", companyId).maybeSingle();
  if (!comp) return null;
  if (comp.website_domain) return comp.website_domain;
  const placeId = comp.place_id;
  if (!placeId) return null;
  try {
    const { GATEWAY, mapsAuth, cachedJson, throwIfDenied } = await import("./places.server");
    const p = (await cachedJson(`gweb:${placeId}`, async () => {
      const r = await fetch(`${GATEWAY}/places/v1/places/${encodeURIComponent(placeId)}`, {
        headers: { ...mapsAuth(), "X-Goog-FieldMask": "id,websiteUri" },
      });
      await throwIfDenied(r);
      if (!r.ok) throw new Error(`place website ${r.status}`);
      return r.json();
    })) as { websiteUri?: string };
    const domain = p.websiteUri ? baseDomain(p.websiteUri) : null;
    if (domain) await db.from("companies").update({ website_domain: domain }).eq("id", companyId);
    return domain;
  } catch (e) {
    console.error("Company website lookup failed", e);
    return null;
  }
}
