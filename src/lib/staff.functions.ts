import { MEAL_FREQ, MEAL_VALUES, MEAL_PROVIDERS, WELFARE_ANSWERS, WELFARE_ITEMS } from "./constants";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { CONTRACT_TYPES } from "./constants";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const CompanyInput = z.object({
  name: z.string().trim().min(2).max(120),
  legal_name: z.string().trim().max(160).optional().nullable(),
  vat: z.string().trim().max(32).optional().nullable(),
  city: z.string().trim().max(80).optional().nullable(),
  region: z.string().trim().max(80).optional().nullable(),
  sector: z.string().trim().max(80).optional().nullable(),
  country: z.string().trim().max(80).default("Italy"),
  address: z.string().trim().max(160).optional().nullable(),
  cap: z.string().trim().max(10).optional().nullable(),
});

const normAddr = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");

export const createCompany = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => CompanyInput.parse(input))
  .handler(async ({ data }) => {
    const { moderateText } = await import("./moderation.server");
    const mod = moderateText(data.name, data.legal_name);
    if (!mod.ok && mod.reason === "insult") throw new Error("blocked");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // Brand detection: reuse an existing brand whose name starts the new name.
    const first = data.name.split(/\s+/)[0]!.replace(/[%,()]/g, "");
    const { data: brands } = await supabaseAdmin.from("companies").select("parent_brand").ilike("parent_brand", `${first}%`).not("parent_brand", "is", null).limit(50);
    const lower = data.name.toLowerCase();
    const brand = [...new Set((brands ?? []).map((b) => b.parent_brand as string))].sort((a, b) => b.length - a.length).find((b) => lower.startsWith(b.toLowerCase())) ?? data.name;
    // Duplicate check: same brand/name + same city + same address -> return existing branch.
    if (data.address && data.city) {
      const { data: same } = await supabaseAdmin.from("companies").select("*").ilike("city", data.city).or(`parent_brand.ilike.${brand.replace(/[%,()]/g, "")},name.ilike.${data.name.replace(/[%,()]/g, "")}`).limit(200);
      const hit = (same ?? []).find((c) => c.address && normAddr(c.address) === normAddr(data.address!));
      if (hit) return { ...hit, duplicate: true };
    }
    const full = data.address ? `${data.address}, ${data.cap ? data.cap + " " : ""}${data.city ?? ""}`.replace(/, $/, "") : null;
    const { data: row, error } = await supabaseAdmin
      .from("companies")
      .insert({
        name: data.name,
        legal_name: data.legal_name ?? null,
        vat: data.vat ?? null,
        city: data.city ?? null,
        region: data.region ?? null,
        sector: data.sector ?? null,
        country: data.country,
        source: "manual",
        address: data.address ?? null,
        full_address: full,
        parent_brand: brand,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { ...row, duplicate: false };
  });

const score = z.number().int().min(1).max(5);
const ReviewInput = z.object({
  company_id: z.string().uuid(),
  role: z.string().trim().min(2).max(80),
  sector: z.string().trim().max(80).optional().nullable(),
  contract_type: z.enum(CONTRACT_TYPES),
  period_from: z.string().optional().nullable(),
  period_to: z.string().optional().nullable(),
  score_salary: score,
  score_shifts: score,
  score_management: score,
  score_growth: score,
  score_safety: score,
  score_environment: score,
  // Hospitality extras: 0 = not applicable, excluded from averages.
  score_tips: z.number().int().min(0).max(5).optional().nullable(),
  score_notice: z.number().int().min(0).max(5).optional().nullable(),
  score_meal_lodging: z.number().int().min(0).max(5).optional().nullable(),
  score_overtime: z.number().int().min(0).max(5).optional().nullable(),
  meal_frequency: z.enum(MEAL_FREQ),
  meal_value: z.enum(MEAL_VALUES).optional().nullable(),
  meal_provider: z.enum(MEAL_PROVIDERS).optional().nullable(),
  welfare_answer: z.enum(WELFARE_ANSWERS),
  welfare_items: z.array(z.enum(WELFARE_ITEMS)).max(6).default([]),
  pro: z.string().trim().min(5).max(2000),
  cons: z.string().trim().min(5).max(2000),
  advice: z.string().trim().max(2000).optional().nullable(),
  is_anonymous: z.boolean().default(true),
  worked_here: z.boolean(),
  lang: z.string().max(5).default("it"),
});

export const submitReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ReviewInput.parse(input))
  .handler(async ({ data, context }) => {
    if (!data.worked_here) throw new Error("must_confirm");
    const { moderateText } = await import("./moderation.server");
    const mod = moderateText(data.pro, data.cons, data.advice, data.role);
    // Moderation pipeline: rule-based now, OpenAI Moderation API ready to plug in here.
    if (!mod.ok) return { status: "rejected" as const, reason: mod.reason };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { worked_here: _workedHere, ...rest } = data;
    void _workedHere;
    const sixMonths = new Date();
    sixMonths.setMonth(sixMonths.getMonth() - 6);
    const { count } = await supabaseAdmin.from("reviews").select("id", { count: "exact", head: true }).eq("user_id", context.userId).eq("company_id", data.company_id).gte("created_at", sixMonths.toISOString());
    if ((count ?? 0) > 0) return { status: "limit" as const, reason: null };
    const { error } = await supabaseAdmin.from("reviews").insert({
      ...rest,
      score_tips: rest.score_tips ?? null,
      score_notice: rest.score_notice ?? null,
      score_meal_lodging: rest.score_meal_lodging ?? null,
      score_overtime: rest.score_overtime ?? null,
      sector: rest.sector ?? null,
      advice: rest.advice ?? null,
      period_from: rest.period_from || null,
      period_to: rest.period_to || null,
      is_verified: true,
      meal_vouchers: rest.meal_frequency === "unknown" ? null : rest.meal_frequency !== "no",
      meal_value: rest.meal_frequency === "daily" || rest.meal_frequency === "some" ? rest.meal_value ?? null : null,
      meal_provider: rest.meal_frequency === "daily" || rest.meal_frequency === "some" ? rest.meal_provider ?? null : null,
      welfare: rest.welfare_answer === "unknown" ? null : rest.welfare_answer === "yes",
      welfare_items: rest.welfare_answer === "yes" ? rest.welfare_items : [],
      verified_via: "account",
      device_hash: null,
      user_id: context.userId,
      status: "approved", // published instantly
    });
    if (error) throw new Error(error.message);
    // Thank-you email with Trustpilot invitation (BCC); never blocks publication.
    try {
      const { data: userData } = await supabaseAdmin.auth.admin.getUserById(context.userId);
      const email = userData?.user?.email;
      if (email) {
        const { data: company } = await supabaseAdmin.from("companies").select("name").eq("id", data.company_id).single();
        const { sendReviewThanksEmail } = await import("./review-thanks.server");
        await sendReviewThanksEmail(email, company?.name ?? "l'azienda");
      }
    } catch (err) {
      console.error("Review thanks email failed:", err);
    }
    return { status: "approved" as const, reason: null };
  });

/** Guest review, allowed only when the admin switched off "reviews_require_login". Limited per device. */
export const submitReviewGuest = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => ReviewInput.extend({ device_id: z.string().min(8).max(100) }).parse(input))
  .handler(async ({ data }) => {
    if (!data.worked_here) throw new Error("must_confirm");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: st } = await supabaseAdmin.from("app_settings").select("reviews_require_login").eq("id", 1).maybeSingle();
    if (st?.reviews_require_login ?? true) throw new Error("login_required");
    const { moderateText } = await import("./moderation.server");
    const mod = moderateText(data.pro, data.cons, data.advice, data.role);
    if (!mod.ok) return { status: "rejected" as const, reason: mod.reason };
    const { createHash } = await import("crypto");
    const deviceHash = createHash("sha256").update(`${process.env["EMAIL_PEPPER"] ?? ""}:dev:${data.device_id}`).digest("hex");
    const { worked_here: _w, device_id: _d, ...rest } = data;
    void _w; void _d;
    const sixMonths = new Date(); sixMonths.setMonth(sixMonths.getMonth() - 6);
    const { count } = await supabaseAdmin.from("reviews").select("id", { count: "exact", head: true }).eq("device_hash", deviceHash).eq("company_id", data.company_id).gte("created_at", sixMonths.toISOString());
    if ((count ?? 0) > 0) return { status: "limit" as const, reason: null };
    const day = new Date(Date.now() - 86400000).toISOString();
    const { count: daily } = await supabaseAdmin.from("reviews").select("id", { count: "exact", head: true }).eq("device_hash", deviceHash).gte("created_at", day);
    if ((daily ?? 0) >= 3) return { status: "limit" as const, reason: null };
    const { error } = await supabaseAdmin.from("reviews").insert({
      ...rest,
      score_tips: rest.score_tips ?? null, score_notice: rest.score_notice ?? null,
      score_meal_lodging: rest.score_meal_lodging ?? null, score_overtime: rest.score_overtime ?? null,
      sector: rest.sector ?? null, advice: rest.advice ?? null,
      period_from: rest.period_from || null, period_to: rest.period_to || null,
      is_verified: false,
      meal_vouchers: rest.meal_frequency === "unknown" ? null : rest.meal_frequency !== "no",
      meal_value: rest.meal_frequency === "daily" || rest.meal_frequency === "some" ? rest.meal_value ?? null : null,
      meal_provider: rest.meal_frequency === "daily" || rest.meal_frequency === "some" ? rest.meal_provider ?? null : null,
      welfare: rest.welfare_answer === "unknown" ? null : rest.welfare_answer === "yes",
      welfare_items: rest.welfare_answer === "yes" ? rest.welfare_items : [],
      verified_via: null, device_hash: deviceHash, user_id: null, status: "approved",
    });
    if (error) throw new Error(error.message);
    return { status: "approved" as const, reason: null };
  });

export const markHelpful = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ review_id: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin
      .from("reviews")
      .select("helpful_count")
      .eq("id", data.review_id)
      .single();
    const next = (row?.helpful_count ?? 0) + 1;
    await supabaseAdmin.from("reviews").update({ helpful_count: next }).eq("id", data.review_id);
    return { helpful_count: next };
  });

/**
 * External data sources. Google Places is live via the connector gateway:
 * it is queried ONLY when the local database has no match, and every found
 * company is saved permanently so later searches are free.
 * ATOKA_API_KEY bulk import stays a TODO until the user supplies a token.
 */
export type ExternalHit = {
  placeId: string;
  name: string;
  address: string | null;
  kind: string | null;
};

export const searchExternalCompanies = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ query: z.string().min(2).max(120) }).parse(input))
  .handler(async ({ data }) => {
    const q = data.query.trim().slice(0, 120);
    try {
      const { GATEWAY, mapsAuth, cachedJson, throwIfDenied } = await import("./places.server");
      const res = (await cachedJson(`search:${q.toLowerCase()}`, async () => {
        const r = await fetch(`${GATEWAY}/places/v1/places:searchText`, {
          method: "POST",
          headers: {
            ...mapsAuth(),
            "Content-Type": "application/json",
            "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.location,places.primaryType",
          },
          body: JSON.stringify({
            textQuery: q,
            pageSize: 8,
            locationBias: { rectangle: { low: { latitude: 35.5, longitude: 6.6 }, high: { latitude: 47.1, longitude: 18.6 } } },
          }),
        });
        await throwIfDenied(r);
        if (!r.ok) throw new Error(`places search ${r.status}: ${await r.text()}`);
        return r.json();
      })) as {
        places?: Array<{
          id: string;
          displayName?: { text?: string };
          formattedAddress?: string;
          location?: { latitude: number; longitude: number };
          primaryType?: string;
        }>;
      };
      const hits: ExternalHit[] = (res.places ?? [])
        .filter((p) => p.displayName?.text)
        .map((p) => ({
          placeId: p.id,
          name: p.displayName!.text!.slice(0, 120),
          address: p.formattedAddress?.slice(0, 160) ?? null,
          kind: p.primaryType ?? null,
        }));
      return { ok: true as const, hits };
    } catch (e) {
      console.error("Google places search failed", e);
      return { ok: false as const, hits: [] as ExternalHit[] };
    }
  });

// Google primaryType -> site sector.
const SECTOR_MAP: Array<[RegExp, string]> = [
  [/restaurant|cafe|coffee|bar\b|bakery|meal|food|pizza|deli|ice_cream|wine|pub|patisserie/i, "Restaurants"],
  [/supermarket|grocery|convenience|store|shop|clothing|department|shopping|pharmacy|drugstore|hardware|furniture|butcher/i, "Retail & Supermarkets"],
  [/hotel|lodging|motel|hostel|guest_house|resort|inn/i, "Hotels"],
  [/warehouse|storage|logistics|moving|freight|distribution|courier|shipping/i, "Logistics & Warehouses"],
  [/factory|manufacturing|industrial|plant|assembly|metal|chemical/i, "Factories & Manufacturing"],
  [/office|corporate|call_center|callcenter|bank|insurance|agency|consultant/i, "Offices & Call Centers"],
];

/** Save a Google place as a permanent company row (runs once per place). */
export const createCompanyFromPlace = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ placeId: z.string().min(8).max(200) }).parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: existing } = await supabaseAdmin.from("companies").select("id").eq("place_id", data.placeId).limit(1);
    if (existing && existing.length) return { id: existing[0]!.id, duplicate: true as const };

    const { GATEWAY, mapsAuth, throwIfDenied } = await import("./places.server");
    const r = await fetch(`${GATEWAY}/places/v1/places/${encodeURIComponent(data.placeId)}`, {
      headers: { ...mapsAuth(), "X-Goog-FieldMask": "id,displayName,formattedAddress,location,primaryType,addressComponents" },
    });
    await throwIfDenied(r);
    if (!r.ok) throw new Error(`place details ${r.status}`);
    const p = (await r.json()) as {
      id?: string;
      displayName?: { text?: string };
      formattedAddress?: string;
      location?: { latitude: number; longitude: number };
      primaryType?: string;
      addressComponents?: Array<{ longText?: string; shortText?: string; types: string[] }>;
    };
    const name = p.displayName?.text?.slice(0, 120);
    if (!name || !p.id) throw new Error("no_name");
    const comp = p.addressComponents ?? [];
    const pick = (t: string) => comp.find((c) => Array.isArray(c.types) && c.types.includes(t));
    const address = [pick("route")?.longText, pick("street_number")?.longText].filter(Boolean).join(" ").slice(0, 160) || null;
    const city = (pick("locality") ?? pick("postal_town"))?.longText?.slice(0, 80) ?? null;
    const region = pick("administrative_area_level_1")?.longText?.slice(0, 80) ?? null;
    const prov = pick("administrative_area_level_2")?.shortText ?? "";
    const cc = pick("country")?.shortText ?? "IT";
    let country = "Italy";
    try { country = new Intl.DisplayNames(["en"], { type: "region" }).of(cc) ?? "Italy"; } catch { country = "Italy"; }
    const sector = SECTOR_MAP.find(([re]) => p.primaryType && re.test(p.primaryType))?.[1] ?? null;

    // Brand detection: same rule as createCompany (existing brand that starts the name).
    const first = name.split(/\s+/)[0]!.replace(/[%,()]/g, "");
    const { data: brands } = await supabaseAdmin
      .from("companies")
      .select("parent_brand")
      .ilike("parent_brand", `${first}%`)
      .not("parent_brand", "is", null)
      .limit(50);
    const lower = name.toLowerCase();
    const brand =
      [...new Set((brands ?? []).map((b) => b.parent_brand as string))]
        .sort((a, b) => b.length - a.length)
        .find((b) => lower.startsWith(b.toLowerCase())) ?? name;

    const { data: row, error } = await supabaseAdmin
      .from("companies")
      .insert({
        name,
        city,
        region,
        province: /^[A-Z]{2}$/.test(prov) ? prov : null,
        sector,
        country,
        address,
        full_address: p.formattedAddress?.slice(0, 300) ?? null,
        place_id: p.id,
        lat: p.location?.latitude ?? null,
        lng: p.location?.longitude ?? null,
        parent_brand: brand,
        source: "google",
        is_auto_created: false,
      })
      .select()
      .single();
    if (error) {
      if ((error as { code?: string }).code === "23505") {
        const { data: dup } = await supabaseAdmin.from("companies").select("id").eq("place_id", data.placeId).limit(1);
        if (dup && dup.length) return { id: dup[0]!.id, duplicate: true as const };
      }
      throw new Error(error.message);
    }
    return { id: row.id, duplicate: false as const };
  });

export type GoogleReview = { author: string; rating: number; text: string; when: string };

/** Up to 2 customer reviews from Google for a company (used only when it has no employee reviews yet). */
export const getGoogleReviews = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ companyId: z.string().uuid() }).parse(input))
  .handler(async ({ data }): Promise<{ reviews: GoogleReview[]; mapsUrl: string | null }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: comp } = await supabaseAdmin.from("companies").select("place_id").eq("id", data.companyId).maybeSingle();
    const placeId = comp?.place_id as string | null;
    if (!placeId) return { reviews: [], mapsUrl: null };
    try {
      const { GATEWAY, mapsAuth, cachedJson, throwIfDenied } = await import("./places.server");
      const p = (await cachedJson(`grev:${placeId}`, async () => {
        const r = await fetch(`${GATEWAY}/places/v1/places/${encodeURIComponent(placeId)}`, {
          headers: { ...mapsAuth(), "X-Goog-FieldMask": "id,reviews" },
        });
        await throwIfDenied(r);
        if (!r.ok) throw new Error(`place reviews ${r.status}`);
        return r.json();
      })) as {
        reviews?: Array<{
          rating?: number;
          relativePublishTimeDescription?: string;
          text?: { text?: string };
          authorAttribution?: { displayName?: string };
        }>;
      };
      const reviews: GoogleReview[] = (p.reviews ?? [])
        .filter((rv) => rv.text?.text && rv.rating)
        .slice(0, 2)
        .map((rv) => ({
          author: (rv.authorAttribution?.displayName ?? "Google user").slice(0, 60),
          rating: Math.round((rv.rating ?? 0) * 10) / 10,
          text: (rv.text?.text ?? "").slice(0, 400),
          when: rv.relativePublishTimeDescription ?? "",
        }));
      return { reviews, mapsUrl: `https://www.google.com/maps/place/?q=place_id:${encodeURIComponent(placeId)}` };
    } catch (e) {
      console.error("Google reviews fetch failed", e);
      return { reviews: [], mapsUrl: null };
    }
  });
