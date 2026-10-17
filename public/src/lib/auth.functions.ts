import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { reviewCode } from "./review-id";

/**
 * reviews.user_id is deliberately not readable by anon/authenticated (a review must
 * stay anonymous), so ownership checks cannot be done with a plain .eq("user_id", ...).
 * They go through the SECURITY DEFINER database functions get_my_reviews() and
 * delete_my_review(p_id), which filter by auth.uid() themselves.
 */
type Rpc = (name: string, args?: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }>;
const rpcOf = (client: unknown): Rpc => (client as { rpc: Rpc }).rpc.bind(client as object);

export type MyReviewRow = {
  id: string;
  company_id: string;
  role: string | null;
  contract_type: string | null;
  period_from: string | null;
  period_to: string | null;
  pro: string | null;
  cons: string | null;
  advice: string | null;
  is_verified: boolean;
  status: string;
  helpful_count: number;
  created_at: string;
  company_name: string | null;
  company_city: string | null;
};

/** Reviews written by the signed-in user. */
export const getMyReviews = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await rpcOf(context.supabase)("get_my_reviews");
    if (error) throw new Error(error.message);
    return (data ?? []) as MyReviewRow[];
  });

/** Delete one of the signed-in user's own reviews. Fails on anyone else's. */
export const deleteMyReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: deleted, error } = await rpcOf(context.supabase)("delete_my_review", { p_id: data.id });
    if (error) throw new Error(error.message);
    if (!deleted) throw new Error("not_allowed");
    return { ok: true };
  });

export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("profiles")
      .select("display_name, notify_job_offers")
      .eq("id", context.userId)
      .maybeSingle();
    return data ?? { display_name: null, notify_job_offers: true };
  });

export const setNotifyJobs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ enabled: z.boolean() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("profiles")
      .update({ notify_job_offers: data.enabled })
      .eq("id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export type MyOfferRow = {
  id: string; title: string; city: string | null; poster_company: string | null; is_active: boolean;
  payment_status: string; paid_until: string | null; amount_cents: number | null; created_at: string;
};

export const getMyOffers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await rpcOf(context.supabase)("get_my_offers");
    if (error) throw new Error(error.message);
    return (data ?? []) as MyOfferRow[];
  });

export const closeMyOffer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { data: ok, error } = await rpcOf(context.supabase)("close_my_offer", { p_id: data.id });
    if (error) throw new Error(error.message);
    if (!ok) throw new Error("not_yours");
    return { ok: true };
  });

/**
 * Poster contacts are personal data: they are no longer part of the public offer
 * payload, so only a signed-in user can read them (RLS blocks anon reads anyway).
 */
export const getOfferContacts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data }) => {
    // poster_email is revoked from the authenticated role (0012_paid_job_offers.sql),
    // so this read must go through the admin client; sign-in is still required above.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("job_offers")
      .select("poster_email, poster_phone")
      .eq("id", data.id)
      .eq("is_active", true)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return { email: row?.poster_email ?? null, phone: row?.poster_phone ?? null };
  });

/**
 * Contact request for an availability listing: contacts are never returned to the
 * browser; both parties receive an email instead.
 */
export const contactAvailability = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({
    id: z.string().uuid(),
    requesterName: z.string().trim().min(2).max(80),
    phone: z.string().trim().min(6).max(30).regex(/^[+0-9 ().-]+$/),
    message: z.string().trim().max(1000).optional().default(""),
  }).parse(i))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { getRequestHeader } = await import("@tanstack/react-start/server");
    // Retention: contact-request log kept 60 days only
    await supabaseAdmin.from("availability_contact_requests")
      .delete().lt("created_at", new Date(Date.now() - 60 * 24 * 3600 * 1000).toISOString());
    const { data: row, error } = await supabaseAdmin.from("disponibilita")
      .select("id, user_id, nome_visualizzato, mansione, zona, email_contatto, expires_at, is_active")
      .eq("id", data.id).maybeSingle();
    if (error) throw new Error(error.message);
    if (!row?.is_active || new Date(row.expires_at).getTime() <= Date.now()) throw new Error("not_available");
    if (row.user_id === context.userId) throw new Error("own_listing");
    const { data: u } = await supabaseAdmin.auth.admin.getUserById(context.userId);
    const requesterEmail = u.user?.email ?? "";
    const requesterName = data.requesterName;
    const ip = ((getRequestHeader("cf-connecting-ip") || getRequestHeader("x-forwarded-for") || "").split(",")[0] ?? "").trim() || null;
    const requestId = crypto.randomUUID();
    const requestCode = reviewCode(requestId);
    const { error: insErr } = await supabaseAdmin.from("availability_contact_requests").insert({
      id: requestId, listing_id: row.id, owner_id: row.user_id, requester_id: context.userId,
      requester_phone: data.phone, message: data.message || null, ip,
    });
    if (insErr) throw new Error(insErr.message);
    const common = { ownerName: row.nome_visualizzato, mansione: row.mansione, zona: row.zona, requesterName, message: data.message, requestCode };
    const { sendTemplateEmail } = await import("./email-templates/send-email");
    // Phone-only listings have no email_contatto: fall back to the owner's account email,
    // otherwise the request would be saved but never delivered.
    let ownerEmail = row.email_contatto;
    if (!ownerEmail) {
      const { data: ownerUser } = await supabaseAdmin.auth.admin.getUserById(row.user_id);
      ownerEmail = ownerUser.user?.email ?? null;
    }
    if (ownerEmail) {
      try {
        await sendTemplateEmail("availability-request", ownerEmail, {
          templateData: { ...common, requesterEmail, phone: data.phone },
          idempotencyKey: `availability-request-${requestId}`, ...(requesterEmail ? { replyTo: requesterEmail } : {}),
        });
      } catch (e) { console.error("availability-request email failed", e); }
    }
    if (requesterEmail) {
      try {
        await sendTemplateEmail("availability-receipt", requesterEmail, {
          templateData: common, idempotencyKey: `availability-receipt-${requestId}`,
        });
      } catch (e) { console.error("availability-receipt email failed", e); }
    }
    return { ok: true, requestCode };
  });

/** All availability listings of the signed-in owner, newest first. */
export const getMyAvailability = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("disponibilita")
      .select("*")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export type MyOfferDetails = {
  id: string; title: string; poster_company: string | null; poster_email: string | null; poster_phone: string | null;
  city: string | null; address: string | null; contract_type: string | null; salary_min: number | null; salary_max: number | null;
  salary_visible: boolean; positions: number; description: string | null; apply_link: string | null;
  meal_vouchers: boolean; poster_type: string; agency_name: string | null; is_active: boolean; moderation_status: string;
};

/**
 * A published ad belongs to whoever created it: reads and writes are always scoped
 * to auth.uid() (context.userId), so one person can never touch another person's ad.
 */
export const getMyOffer = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("job_offers")
      .select("id, title, poster_company, poster_email, poster_phone, city, address, contract_type, salary_min, salary_max, salary_visible, positions, description, apply_link, meal_vouchers, poster_type, agency_name, is_active, moderation_status")
      .eq("id", data.id)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("not_yours");
    return row as MyOfferDetails;
  });

const EditInput = z.object({
  id: z.string().uuid(),
  title: z.string().trim().min(2).max(200),
  poster_company: z.string().trim().min(2).max(200),
  poster_email: z.string().trim().email().max(200),
  poster_phone: z.string().trim().max(30).regex(/^[0-9+()\-\s]*$/, "Numero non valido").nullable().default(null),
  city: z.string().trim().max(100).nullable().default(null),
  address: z.string().trim().max(200).nullable().default(null),
  contract_type: z.string().trim().max(50).nullable().default(null),
  salary_min: z.number().int().min(0).max(1000000).nullable().default(null),
  salary_max: z.number().int().min(0).max(1000000).nullable().default(null),
  salary_visible: z.boolean().default(true),
  positions: z.number().int().min(1).max(999).default(1),
  description: z.string().trim().max(2000).nullable().default(null),
  apply_link: z.string().trim().max(500).nullable().default(null),
  meal_vouchers: z.boolean().default(false),
});

export const updateMyOffer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => EditInput.parse(i))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const link = data.apply_link?.trim() || null;
    if (link && !/^https?:\/\//i.test(link)) throw new Error("Link non valido");
    const { data: s } = await supabaseAdmin.from("app_settings").select("offer_publish_mode").eq("id", 1).maybeSingle();
    const needsReview = s?.offer_publish_mode === "approval";
    const { data: updated, error } = await supabaseAdmin
      .from("job_offers")
      .update({
        title: data.title,
        poster_company: data.poster_company,
        poster_email: data.poster_email,
        poster_phone: data.poster_phone,
        city: data.city,
        address: data.address,
        contract_type: data.contract_type,
        salary_min: data.salary_min,
        salary_max: data.salary_max,
        salary_visible: data.salary_visible,
        positions: data.positions,
        description: data.description,
        apply_link: link,
        meal_vouchers: data.meal_vouchers,
        ...(needsReview ? { moderation_status: "pending" } : {}),
      })
      .eq("id", data.id)
      .eq("user_id", context.userId)
      .select("id")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!updated) throw new Error("not_yours");
    return { ok: true, needsReview };
  });

/**
 * Permanently deletes the signed-in user's own account: private data is removed,
 * while public reviews, company pages and official replies remain.
 * Everything is scoped to context.userId, so nobody can delete another account.
 */
export const deleteMyAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { deleteAccountData } = await import("./account-deletion.server");
    await deleteAccountData(supabaseAdmin, context.userId);
    return { ok: true };
  });

export const deleteMyOffer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: gone, error } = await supabaseAdmin
      .from("job_offers")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId)
      .select("id")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!gone) throw new Error("not_yours");
    return { ok: true };
  });

/** Short-lived download link for a listing's optional CV; signed-in users only. */
export const getAvailabilityCv = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin.from("disponibilita").select("cv_path, is_active, expires_at, nome_visualizzato").eq("id", data.id).maybeSingle();
    const { data: st } = await supabaseAdmin.from("app_settings").select("cv_enabled").eq("id", 1).maybeSingle();
    if (!st?.cv_enabled) throw new Error("not_available");
    if (!row?.cv_path || !row.is_active || new Date(row.expires_at) <= new Date()) throw new Error("not_available");
    const { data: signed, error } = await supabaseAdmin.storage.from("cv").createSignedUrl(row.cv_path, 120, { download: `CV-${row.nome_visualizzato.replace(/[^\w.-]+/g, "_")}.pdf` });
    if (error || !signed) throw new Error("cv_error");
    return { url: signed.signedUrl };
  });
