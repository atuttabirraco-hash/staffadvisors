import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const SAFE_REVIEW_COLS = "id, role, contract_type, score_salary, score_shifts, score_management, score_growth, score_safety, score_environment, pro, cons, advice, is_verified, created_at";

async function myAccount(userId: string) {
  const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
  const { data } = await db.from("company_accounts").select("company_id").eq("user_id", userId).maybeSingle();
  return { db, account: data };
}

/** Search the public directory to find the company's own page. */
export const searchMyCompany = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ q: z.string().trim().min(2).max(80) }).parse(i))
  .handler(async ({ data }) => {
    const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
    const q = data.q.replace(/[%,()]/g, "");
    const { data: rows } = await db.from("companies").select("id, name, city, address").ilike("name", `%${q}%`).order("review_count", { ascending: false }).limit(10);
    return rows ?? [];
  });

export const linkMyCompany = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ company_id: z.string().uuid().nullable() }).parse(i))
  .handler(async ({ data, context }) => {
    const { db, account } = await myAccount(context.userId);
    if (!account) throw new Error("no_business_account");
    await db.from("company_accounts").update({ company_id: data.company_id }).eq("user_id", context.userId);
    return { ok: true };
  });

/** Linked company, its reviews, official replies and replies still waiting for a check. */
export const getMyCompanyReviews = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { db, account } = await myAccount(context.userId);
    if (!account?.company_id) return { company: null, reviews: [], canPublish: false };
    const cid = account.company_id;
    const [{ data: company }, { data: reviews }, { data: replies }, { data: reqs }, userRes] = await Promise.all([
      db.from("companies").select("id, name, city, avg_score, review_count").eq("id", cid).maybeSingle(),
      db.from("reviews").select(SAFE_REVIEW_COLS).eq("company_id", cid).eq("status", "approved").order("created_at", { ascending: false }).limit(200),
      db.from("company_replies").select("review_id, reply_text, created_at").eq("company_id", cid),
      db.from("reply_requests").select("review_id, status").eq("company_id", cid).in("status", ["pending", "awaiting_confirmation"]),
      db.auth.admin.getUserById(context.userId),
    ]);
    const { companyWebsiteDomain, emailMatchesCompanyDomain } = await import("./reply-verify.server");
    const email = userRes.data.user?.email ?? "";
    const canPublish = emailMatchesCompanyDomain(email, await companyWebsiteDomain(cid));
    const rep = new Map((replies ?? []).map((r) => [r.review_id, r]));
    const pend = new Set((reqs ?? []).map((r) => r.review_id));
    return {
      company,
      canPublish,
      reviews: (reviews ?? []).map((r) => ({ ...r, reply: rep.get(r.id)?.reply_text ?? null, pending: pend.has(r.id) })),
    };
  });

/**
 * Official reply from the business area. It goes online at once only when the
 * signed-in account email matches the company's official website domain;
 * otherwise it waits for the admin check, so nobody can speak for another company.
 */
export const replyAsCompany = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ review_id: z.string().uuid(), reply: z.string().trim().min(10).max(2000) }).parse(i))
  .handler(async ({ data, context }) => {
    const { db, account } = await myAccount(context.userId);
    if (!account?.company_id) throw new Error("no_company");
    const cid = account.company_id;
    const { data: review } = await db.from("reviews").select("id").eq("id", data.review_id).eq("company_id", cid).maybeSingle();
    if (!review) throw new Error("not_found");
    const { moderateText } = await import("./moderation.server");
    if (!moderateText(data.reply).ok) return { status: "rejected" as const };
    const { data: u } = await db.auth.admin.getUserById(context.userId);
    const email = u.user?.email ?? "";
    const { data: acc } = await db.from("company_accounts").select("company_name").eq("user_id", context.userId).maybeSingle();
    const { companyWebsiteDomain, emailMatchesCompanyDomain } = await import("./reply-verify.server");
    const verified = emailMatchesCompanyDomain(email, await companyWebsiteDomain(cid));
    if (verified) {
      await db.from("company_replies").delete().eq("review_id", data.review_id);
      const { error } = await db.from("company_replies").insert({ review_id: data.review_id, company_id: cid, reply_text: data.reply, is_verified: true });
      if (error) throw new Error(error.message);
      return { status: "published" as const };
    }
    const { error } = await db.from("reply_requests").insert({
      review_id: data.review_id, company_id: cid, sender_name: acc?.company_name ?? "Azienda",
      sender_role: "Area aziende", sender_email: email, reply_text: data.reply,
    });
    if (error) throw new Error(error.message);
    try {
      const { sendTemplateEmail } = await import("./email-templates/send-email");
      await sendTemplateEmail("reply-request-notification", "avvisi@staffadvisors.it", {
        templateData: { name: acc?.company_name ?? "Azienda", role: "Area aziende", email, phone: "", reply: data.reply, verified: false },
        idempotencyKey: `reply-request-area-${data.review_id}-${Date.now()}`,
        replyTo: "info@staffadvisors.it",
      });
    } catch (e) {
      console.error("Reply notification failed", e);
    }
    return { status: "pending" as const };
  });
