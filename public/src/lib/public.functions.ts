import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
import { REVIEW_COLS } from "./company-data";

export function publicClient() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient<Database>(process.env["SUPABASE_URL"]!, key, {
    auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

export const getCompanyPage = createServerFn({ method: "GET" })
  .inputValidator((i: unknown) => z.object({ id: z.string().min(8).max(200) }).parse(i))
  .handler(async ({ data }) => {
    const db = publicClient();
    // Accept a full id or a slug ending with the first 8 hex chars of the id.
    let id = data.id;
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      const short = id.slice(-8).toLowerCase();
      if (!/^[0-9a-f]{8}$/.test(short)) return { company: null, reviews: [], replies: [] };
      const { data: hits } = await db.from("companies").select("id")
        .gte("id", `${short}-0000-0000-0000-000000000000`).lte("id", `${short}-ffff-ffff-ffff-ffffffffffff`).limit(5);
      if (!hits?.length) return { company: null, reviews: [], replies: [] };
      id = hits[0]!.id;
    }
    data = { id };
    const [c, r, p] = await Promise.all([
      db.from("companies").select("*").eq("id", data.id).maybeSingle(),
      db.from("reviews").select(REVIEW_COLS).eq("company_id", data.id).eq("status", "approved"),
      db.from("company_replies").select("*").eq("company_id", data.id),
    ]);
    if (c.error) throw new Error(c.error.message);
    return { company: c.data, reviews: r.data ?? [], replies: p.data ?? [] };
  });

export type JobOffer = {
  id: string; company_id: string | null; title: string; city: string | null; contract_type: string | null;
  salary_range: string | null; meal_vouchers: boolean; apply_link: string | null; source: "manual" | "adzuna"; is_premium: boolean; attribution?: string;
  poster_type?: "private" | "agency"; description?: string | null; salary_min?: number | null; salary_max?: number | null;
  salary_visible?: boolean; positions?: number; agency_name?: string | null; client_anonymous?: boolean; poster_company?: string | null;
  address?: string | null;
};

export const getSiteSettings = createServerFn({ method: "GET" }).handler(async () => {
  const { data } = await publicClient().from("app_settings").select("job_offers_enabled, adzuna_enabled, offer_price_cents, offer_days, offer_price_mode, offer_premium_price_cents, offers_free, offer_publish_mode, bacheca_enabled, reviews_require_login, reviews_deletable, cv_enabled, business_area_enabled").eq("id", 1).maybeSingle();
  return { business_area_enabled: data?.business_area_enabled ?? true, reviews_require_login: data?.reviews_require_login ?? true, reviews_deletable: data?.reviews_deletable ?? true, bacheca_enabled: !!data?.bacheca_enabled, cv_enabled: !!data?.cv_enabled, job_offers_enabled: !!data?.job_offers_enabled, adzuna_enabled: !!data?.adzuna_enabled, offer_price_cents: data?.offer_price_cents ?? 1900, offer_days: data?.offer_days ?? 30, offer_price_mode: (data?.offer_price_mode ?? "admin") as "admin" | "tiers", offer_premium_price_cents: data?.offer_premium_price_cents ?? 3900, offers_free: data?.offers_free ?? true, offer_publish_mode: (data?.offer_publish_mode ?? "auto") as "auto" | "approval" | "off" };
});

export type PublicAvailability = {
  id: string;
  nome_visualizzato: string;
  mansione: string;
  zona: string;
  descrizione: string;
  created_at: string;
  expires_at: string;
  has_cv: boolean;
};

/** Public availability search. Contact details are deliberately excluded. */
export const searchAvailability = createServerFn({ method: "GET" })
  .inputValidator((i: unknown) => z.object({ role: z.string().max(80), area: z.string().max(80) }).parse(i))
  .handler(async ({ data }) => {
    const db = publicClient();
    const { data: settings } = await db.from("app_settings").select("bacheca_enabled, cv_enabled").eq("id", 1).maybeSingle();
    if (!settings?.bacheca_enabled) return { enabled: false, listings: [] as PublicAvailability[] };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let query = supabaseAdmin
      .from("disponibilita")
      .select("id, nome_visualizzato, mansione, zona, descrizione, created_at, expires_at, cv_path")
      .eq("is_active", true)
      .gt("expires_at", new Date().toISOString());
    const role = data.role.trim().replace(/[%,]/g, " ");
    const area = data.area.trim().replace(/[%,]/g, " ");
    if (role) query = query.ilike("mansione", `%${role}%`);
    if (area) query = query.ilike("zona", `%${area}%`);
    const { data: listings, error } = await query.order("created_at", { ascending: false }).limit(500);
    if (error) throw new Error(error.message);
    return { enabled: true, listings: (listings ?? []).map(({ cv_path, ...l }) => ({ ...l, has_cv: !!settings.cv_enabled && !!cv_path })) as PublicAvailability[] };
  });

const adzunaCache = new Map<string, { at: number; offers: JobOffer[] }>();
const ADZUNA_TTL_MS = 10 * 60 * 1000;

async function fetchAdzuna(what: string, where?: string | null, ttlMin = 10, page = 1): Promise<JobOffer[]> {
  const id = process.env["ADZUNA_APP_ID"], key = process.env["ADZUNA_APP_KEY"];
  if (!id || !key) return [];
  const cacheKey = `${what.toLowerCase()}::${(where ?? "").toLowerCase()}::${page}`;
  const hit = adzunaCache.get(cacheKey);
  if (hit && Date.now() - hit.at < (ttlMin > 0 ? ttlMin * 60 * 1000 : ADZUNA_TTL_MS)) return hit.offers;
  const u = new URL(`https://api.adzuna.com/v1/api/jobs/it/search/${page}`);
  u.searchParams.set("app_id", id); u.searchParams.set("app_key", key);
  u.searchParams.set("results_per_page", "50");
  if (what) u.searchParams.set("what", what);
  if (where) u.searchParams.set("where", where);
  try {
    const r = await fetch(u); if (!r.ok) return hit?.offers ?? [];
    const j = (await r.json()) as { results?: any[] };
    const offers = (j.results ?? []).map((x) => ({
      id: `adzuna-${x.id}`, company_id: null, title: String(x.title ?? "").replace(/<[^>]+>/g, ""),
      city: x.location?.display_name ?? null, contract_type: x.contract_time ?? null,
      salary_range: x.salary_min ? `${Math.round(x.salary_min)}-${Math.round(x.salary_max ?? x.salary_min)} EUR` : null,
      meal_vouchers: false, apply_link: x.redirect_url ?? null, source: "adzuna" as const, is_premium: false,
      attribution: `${x.company?.display_name ?? ""} - Adzuna`,
    }));
    adzunaCache.set(cacheKey, { at: Date.now(), offers });
    if (adzunaCache.size > 50) adzunaCache.delete(adzunaCache.keys().next().value!);
    return offers;
  } catch { return hit?.offers ?? []; }
}

export const getJobOffers = createServerFn({ method: "GET" })
  .inputValidator((i: unknown) => z.object({ company_id: z.string().uuid().optional(), skip_adzuna: z.boolean().optional() }).parse(i ?? {}))
  .handler(async ({ data }) => {
    const db = publicClient();
    const { data: s } = await db.from("app_settings").select("job_offers_enabled, adzuna_enabled, offer_auto_expire, adzuna_cache_minutes").eq("id", 1).maybeSingle();
    if (!s?.job_offers_enabled) return { enabled: false, offers: [] as JobOffer[] };
    let q = db.from("job_offers").select("id, company_id, title, city, address, contract_type, salary_range, meal_vouchers, apply_link, source, is_premium, poster_type, description, salary_min, salary_max, salary_visible, positions, agency_name, client_anonymous, poster_company").eq("is_active", true);
    if (s.offer_auto_expire ?? true) q = q.or(`paid_until.is.null,paid_until.gt.${new Date().toISOString()}`);
    if (data.company_id) q = q.eq("company_id", data.company_id);
    const { data: manual } = await q.order("created_at", { ascending: false }).limit(200);
    let offers = (manual ?? []) as JobOffer[];
    if (s.adzuna_enabled && !data.skip_adzuna) {
      let what = "", where: string | null = null;
      if (data.company_id) {
        const { data: c } = await db.from("companies").select("name, city").eq("id", data.company_id).maybeSingle();
        what = c?.name ?? ""; where = c?.city ?? null;
      }
      offers = offers.concat(await fetchAdzuna(what, where, s.adzuna_cache_minutes ?? 10));
    }
    offers.sort((a, b) => Number(b.is_premium) - Number(a.is_premium));
    return { enabled: true, offers };
  });


export const getOfferById = createServerFn({ method: "GET" })
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data }) => {
    const db = publicClient();
    const { data: s } = await db.from("app_settings").select("job_offers_enabled, offer_auto_expire").eq("id", 1).maybeSingle();
    if (!s?.job_offers_enabled) return null;
    let q = db.from("job_offers").select("id, company_id, title, city, address, contract_type, salary_range, meal_vouchers, apply_link, source, is_premium, poster_type, description, salary_min, salary_max, salary_visible, positions, agency_name, client_anonymous, poster_company").eq("is_active", true);
    if (s.offer_auto_expire ?? true) q = q.or(`paid_until.is.null,paid_until.gt.${new Date().toISOString()}`);
    const { data: row } = await q.eq("id", data.id).maybeSingle();
    return (row as JobOffer | null) ?? null;
  });

/** Adzuna search driven by the user's role + city; called only after a search. */
export const searchAdzuna = createServerFn({ method: "GET" })
  .inputValidator((i: unknown) => z.object({ what: z.string().max(100), where: z.string().max(100), page: z.number().int().min(1).max(20) }).parse(i))
  .handler(async ({ data }) => {
    const { data: s } = await publicClient().from("app_settings").select("job_offers_enabled, adzuna_enabled, adzuna_cache_minutes").eq("id", 1).maybeSingle();
    if (!s?.job_offers_enabled || !s.adzuna_enabled) return { offers: [] as JobOffer[] };
    const what = data.what.trim(), where = data.where.trim();
    return { offers: await fetchAdzuna(what, where || null, s.adzuna_cache_minutes ?? 10, data.page) };
  });
