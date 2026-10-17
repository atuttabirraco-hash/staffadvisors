import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Pw = z.object({ password: z.string().min(1).max(200) });

async function authorize(password: string) {
  const { safeEqual } = await import("./otp.server");
  const expected = process.env["ADMIN_PASSWORD"] ?? "";
  if (!expected || !safeEqual(password, expected)) throw new Error("forbidden");
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export const adminLoad = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => Pw.parse(i))
  .handler(async ({ data }) => {
    const db = await authorize(data.password);
    await db.from("availability_contact_requests")
      .delete().lt("created_at", new Date(Date.now() - 60 * 24 * 3600 * 1000).toISOString());
    const [r, c, s, o, m, ct, ar, dp] = await Promise.all([
      db.from("reviews").select("id, company_id, role, pro, cons, is_verified, status, email_hash, created_at").order("created_at", { ascending: false }).limit(2000),
      db.from("companies").select("id, name, legal_name, city, region, sector, created_at, meal_override, welfare_override, meal_value_override, meal_provider_override").order("name").limit(5000),
      db.from("app_settings").select("job_offers_enabled, adzuna_enabled, offer_price_cents, offer_days, offer_auto_publish, offer_price_mode, offer_premium_price_cents, offer_auto_expire, offers_free, offer_publish_mode, bacheca_enabled, reviews_require_login, reviews_deletable, adzuna_cache_minutes, cv_enabled, business_area_enabled, survey_ai_enabled").eq("id", 1).maybeSingle(),
      db.from("job_offers").select("*").order("created_at", { ascending: false }).limit(2000),
      db.from("job_offer_messages").select("id, offer_id, sender_name, sender_email, message, created_at").order("created_at", { ascending: false }).limit(500),
      db.from("contact_messages").select("id, sender_name, sender_email, message, created_at").order("created_at", { ascending: false }).limit(500),
      db.from("availability_contact_requests").select("id, listing_id, owner_id, requester_id, ip, created_at").order("created_at", { ascending: false }).limit(500),
      db.from("disponibilita").select("id, nome_visualizzato, mansione, zona, created_at, expires_at").order("created_at", { ascending: false }).limit(1000),
    ]);
    if (r.error) throw new Error(r.error.message);
    if (c.error) throw new Error(c.error.message);
    return { reviews: r.data, companies: c.data, settings: { job_offers_enabled: !!s.data?.job_offers_enabled, adzuna_enabled: !!s.data?.adzuna_enabled, offer_price_cents: s.data?.offer_price_cents ?? 1900, offer_days: s.data?.offer_days ?? 30, offer_auto_publish: s.data?.offer_auto_publish ?? true, offer_price_mode: (s.data?.offer_price_mode ?? "admin") as "admin" | "tiers", offer_premium_price_cents: s.data?.offer_premium_price_cents ?? 3900, offer_auto_expire: s.data?.offer_auto_expire ?? true, offers_free: s.data?.offers_free ?? true, offer_publish_mode: (s.data?.offer_publish_mode ?? "auto") as "auto" | "approval" | "off" }, bacheca_enabled: !!s.data?.bacheca_enabled, reviews_require_login: s.data?.reviews_require_login ?? true, reviews_deletable: s.data?.reviews_deletable ?? true, adzuna_cache_minutes: s.data?.adzuna_cache_minutes ?? 10, cv_enabled: !!s.data?.cv_enabled, business_area_enabled: s.data?.business_area_enabled ?? true, survey_ai_enabled: s.data?.survey_ai_enabled ?? true, offers: o.data ?? [], messages: m.data ?? [], contacts: ct.data ?? [], availabilityRequests: ar.data ?? [], listings: dp.data ?? [] };
  });

export const adminAction = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) =>
    Pw.extend({
      action: z.enum(["delete_review", "fake_review", "delete_company"]),
      id: z.string().uuid(),
    }).parse(i),
  )
  .handler(async ({ data }) => {
    const db = await authorize(data.password);
    if (data.action === "delete_review") {
      await db.from("company_replies").delete().eq("review_id", data.id);
      const { error } = await db.from("reviews").delete().eq("id", data.id);
      if (error) throw new Error(error.message);
    } else if (data.action === "fake_review") {
      const { error } = await db.from("reviews").update({ status: "fake" }).eq("id", data.id);
      if (error) throw new Error(error.message);
    } else {
      await db.from("company_replies").delete().eq("company_id", data.id);
      await db.from("reviews").delete().eq("company_id", data.id);
      const { error } = await db.from("companies").delete().eq("id", data.id);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const adminSettings = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => Pw.extend({ job_offers_enabled: z.boolean(), adzuna_enabled: z.boolean(), offer_price_cents: z.number().int().min(50).max(100000), offer_days: z.number().int().min(1).max(365), offer_auto_publish: z.boolean(), offer_price_mode: z.enum(["admin", "tiers"]), offer_premium_price_cents: z.number().int().min(50).max(100000), offer_auto_expire: z.boolean(), offers_free: z.boolean(), offer_publish_mode: z.enum(["auto", "approval", "off"]) }).parse(i))
  .handler(async ({ data }) => {
    const db = await authorize(data.password);
    const { error } = await db.from("app_settings").upsert({ id: 1, job_offers_enabled: data.job_offers_enabled, adzuna_enabled: data.adzuna_enabled, offer_price_cents: data.offer_price_cents, offer_days: data.offer_days, offer_auto_publish: data.offer_auto_publish, offer_price_mode: data.offer_price_mode, offer_premium_price_cents: data.offer_premium_price_cents, offer_auto_expire: data.offer_auto_expire, offers_free: data.offers_free, offer_publish_mode: data.offer_publish_mode, updated_at: new Date().toISOString() });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const Offer = z.object({
  id: z.string().uuid().optional(),
  company_id: z.string().uuid().nullable(),
  title: z.string().trim().min(2).max(200),
  city: z.string().trim().max(100).nullable(),
  contract_type: z.string().trim().max(50).nullable(),
  salary_range: z.string().trim().max(100).nullable(),
  meal_vouchers: z.boolean().default(false),
  apply_link: z.string().trim().url().max(500).nullable(),
  is_premium: z.boolean(),
  is_active: z.boolean(),
  moderation_status: z.enum(["pending", "approved", "rejected"]).optional(),
});

export const adminOffer = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => Pw.extend({ op: z.enum(["save", "delete"]), offer: Offer.partial().extend({ id: z.string().uuid().optional() }) }).parse(i))
  .handler(async ({ data }) => {
    const db = await authorize(data.password);
    if (data.op === "delete") {
      const { error } = await db.from("job_offers").delete().eq("id", data.offer.id!);
      if (error) throw new Error(error.message);
    } else {
      const { id, moderation_status, ...rest } = Offer.parse(data.offer);
      const o = { ...rest, ...(moderation_status ? { moderation_status } : {}) };
      const { error } = id
        ? await db.from("job_offers").update(o).eq("id", id)
        : await db.from("job_offers").insert({ ...o, source: "manual" });
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const adminBenefits = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) =>
    Pw.extend({
      id: z.string().uuid(),
      meal_override: z.boolean().nullable(),
      welfare_override: z.boolean().nullable(),
      meal_value_override: z.enum(["5", "6", "8", "10+"]).nullable(),
      meal_provider_override: z.enum(["Ticket", "Pellegrini", "Day", "Up", "Sodexo", "Altro"]).nullable(),
    }).parse(i),
  )
  .handler(async ({ data }) => {
    const db = await authorize(data.password);
    const { password: _p, id, ...patch } = data;
    void _p;
    const { error } = await db.from("companies").update(patch).eq("id", id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminContactDelete = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => Pw.extend({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data }) => {
    const db = await authorize(data.password);
    const { error } = await db.from("contact_messages").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminContactDeleteAll = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => Pw.parse(i))
  .handler(async ({ data }) => {
    const db = await authorize(data.password);
    const { error } = await db.from("contact_messages").delete().not("id", "is", null);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminReplies = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => Pw.parse(i))
  .handler(async ({ data }) => {
    const db = await authorize(data.password);
    const { data: rows, error } = await db.from("reply_requests").select("*").eq("status", "pending").order("created_at", { ascending: false }).limit(200);
    if (error) throw new Error(error.message);
    const ids = [...new Set((rows ?? []).map((r) => r.review_id))];
    const cids = [...new Set((rows ?? []).map((r) => r.company_id))];
    const [rv, co] = await Promise.all([
      ids.length ? db.from("reviews").select("id, role, pro, cons").in("id", ids) : Promise.resolve({ data: [] as { id: string; role: string | null; pro: string | null; cons: string | null }[] }),
      cids.length ? db.from("companies").select("id, name, city").in("id", cids) : Promise.resolve({ data: [] as { id: string; name: string; city: string | null }[] }),
    ]);
    return { requests: rows ?? [], reviews: rv.data ?? [], companies: co.data ?? [] };
  });

export const adminReplyDecide = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => Pw.extend({ id: z.string().uuid(), approve: z.boolean() }).parse(i))
  .handler(async ({ data }) => {
    const db = await authorize(data.password);
    const { data: req } = await db.from("reply_requests").select("*").eq("id", data.id).maybeSingle();
    if (!req) throw new Error("not found");
    if (data.approve) {
      await db.from("company_replies").delete().eq("review_id", req.review_id);
      const { error } = await db.from("company_replies").insert({ review_id: req.review_id, company_id: req.company_id, reply_text: req.reply_text });
      if (error) throw new Error(error.message);
    }
    await db.from("reply_requests").update({ status: data.approve ? "approved" : "rejected" }).eq("id", data.id);
    return { ok: true };
  });

export const adminBacheca = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => Pw.extend({ enabled: z.boolean() }).parse(i))
  .handler(async ({ data }) => {
    const db = await authorize(data.password);
    const { error } = await db.from("app_settings").update({ bacheca_enabled: data.enabled, updated_at: new Date().toISOString() }).eq("id", 1);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminReviewToggle = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => Pw.extend({ key: z.enum(["reviews_require_login", "reviews_deletable", "cv_enabled", "business_area_enabled", "survey_ai_enabled"]), enabled: z.boolean() }).parse(i))
  .handler(async ({ data }) => {
    const db = await authorize(data.password);
    const { error } = await db.from("app_settings").update({ [data.key]: data.enabled } as { reviews_require_login?: boolean; reviews_deletable?: boolean; cv_enabled?: boolean; business_area_enabled?: boolean; survey_ai_enabled?: boolean }).eq("id", 1);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminAdzunaCache = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => Pw.extend({ minutes: z.number().int().min(1).max(1440) }).parse(i))
  .handler(async ({ data }) => {
    const db = await authorize(data.password);
    const { error } = await db.from("app_settings").update({ adzuna_cache_minutes: data.minutes }).eq("id", 1);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminListingDelete = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => Pw.extend({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data }) => {
    const db = await authorize(data.password);
    const { error } = await db.from("disponibilita").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminSurveys = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => Pw.parse(i))
  .handler(async ({ data }) => {
    const db = await authorize(data.password);
    const [c, s, q, r, a] = await Promise.all([
      db.from("company_accounts").select("user_id, company_name, created_at").order("created_at", { ascending: false }),
      db.from("surveys").select("id, owner_id, title, is_active, created_at").order("created_at", { ascending: false }),
      db.from("survey_questions").select("id, survey_id, text, options, position").order("position"),
      db.from("survey_responses").select("id, survey_id"),
      db.from("survey_answers").select("question_id, option_index"),
    ]);
    return { companies: c.data ?? [], surveys: s.data ?? [], questions: q.data ?? [], responses: r.data ?? [], answers: a.data ?? [] };
  });
