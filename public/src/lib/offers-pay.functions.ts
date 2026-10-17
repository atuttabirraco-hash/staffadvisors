import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const Input = z.object({
  title: z.string().trim().min(2).max(200),
  poster_company: z.string().trim().min(2).max(200),
  poster_email: z.string().trim().email().max(200),
  poster_phone: z.string().trim().max(30).regex(/^[0-9+()\-\s]*$/, "Numero non valido").nullable().default(null),
  city: z.string().trim().max(100).nullable(),
  address: z.string().trim().max(200).nullable().default(null),
  contract_type: z.string().trim().max(50).nullable(),
  salary_range: z.string().trim().max(100).nullable(),
  apply_link: z.string().trim().url().max(500).nullable().default(null),
  meal_vouchers: z.boolean().default(false),
  poster_type: z.enum(["private", "agency"]).default("private"),
  description: z.string().trim().max(2000).nullable(),
  salary_min: z.number().int().min(0).max(1000000).nullable(),
  salary_max: z.number().int().min(0).max(1000000).nullable(),
  salary_visible: z.boolean().default(true),
  positions: z.number().int().min(1).max(999).default(1),
  agency_name: z.string().trim().max(200).nullable(),
  agency_auth_code: z.string().trim().max(100).nullable(),
  client_anonymous: z.boolean().default(false),
  company_id: z.string().uuid().nullable().default(null),
  tier: z.enum(["standard", "premium"]).default("standard"),
  returnUrl: z.string().url().max(500),
  environment: z.enum(["sandbox", "live"]),
});

type CheckoutResult = { clientSecret: string } | { error: string };

async function openSession(env: "sandbox" | "live", offerId: string, price: number, days: number, email: string, returnUrl: string, renew: boolean) {
  const { createStripeClient } = await import("./stripe.server");
  const name = `${renew ? "Rinnovo offerta" : "Offerta di lavoro"} StaffAdvisors (${days} giorni)`;
  return createStripeClient(env).checkout.sessions.create({
    line_items: [{ price_data: { currency: "eur", unit_amount: price, product_data: { name, tax_code: "txcd_10000000" } }, quantity: 1 }],
    mode: "payment",
    ui_mode: "embedded_page",
    return_url: returnUrl.replace("OFFER_ID", offerId) + "&session_id={CHECKOUT_SESSION_ID}",
    customer_email: email,
    payment_intent_data: { description: name },
    metadata: { offer_id: offerId, days: String(days), renew: renew ? "1" : "0", managed_payments: "true" },
    managed_payments: { enabled: true },
  } as never);
}

export const createOfferCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => Input.parse(i))
  .handler(async ({ data, context }): Promise<CheckoutResult> => {
    const { getStripeErrorMessage } = await import("./stripe.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: s } = await supabaseAdmin.from("app_settings").select("offer_price_cents, offer_days, offer_price_mode, offer_premium_price_cents, offers_free").eq("id", 1).maybeSingle();
    if (s?.offers_free ?? true) return { error: "Pubblicazione gratuita attiva" };
    const tiers = s?.offer_price_mode === "tiers";
    const isPremium = data.tier === "premium" && tiers;
    const price = isPremium ? (s?.offer_premium_price_cents ?? 3900) : (s?.offer_price_cents ?? 1900);
    const days = s?.offer_days ?? 30;
    if (price < 50) return { error: "Prezzo non valido" };
    const { returnUrl, environment, tier, ...o } = data;
    o.apply_link = o.apply_link?.trim() || null;
    const { data: row, error } = await supabaseAdmin.from("job_offers").insert({
      ...o, source: "manual", is_premium: !tiers || isPremium, is_active: false, payment_status: "pending",
      amount_cents: price, user_id: context.userId,
    }).select("id").single();
    if (error || !row) return { error: "Impossibile salvare l'offerta" };
    try {
      const session = await openSession(environment, row.id, price, days, o.poster_email, returnUrl, false);
      await supabaseAdmin.from("job_offers").update({ stripe_session_id: session.id }).eq("id", row.id);
      return { clientSecret: session.client_secret ?? "" };
    } catch (e) {
      await supabaseAdmin.from("job_offers").delete().eq("id", row.id);
      return { error: getStripeErrorMessage(e) };
    }
  });

export const createRenewCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid(), returnUrl: z.string().url().max(500), environment: z.enum(["sandbox", "live"]) }).parse(i))
  .handler(async ({ data, context }): Promise<CheckoutResult> => {
    const { getStripeErrorMessage } = await import("./stripe.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin.from("job_offers").select("id, user_id, payment_status, is_premium, poster_email").eq("id", data.id).maybeSingle();
    if (!row || row.user_id !== context.userId) return { error: "Offerta non trovata" };
    if (row.payment_status !== "paid" && row.payment_status !== "renewing") return { error: "Questa offerta non si puo rinnovare" };
    const { data: s } = await supabaseAdmin.from("app_settings").select("offer_price_cents, offer_days, offer_price_mode, offer_premium_price_cents").eq("id", 1).maybeSingle();
    const price = s?.offer_price_mode === "tiers" && row.is_premium ? (s?.offer_premium_price_cents ?? 3900) : (s?.offer_price_cents ?? 1900);
    const days = s?.offer_days ?? 30;
    try {
      const session = await openSession(data.environment, row.id, price, days, row.poster_email ?? "", data.returnUrl, true);
      await supabaseAdmin.from("job_offers").update({ stripe_session_id: session.id, payment_status: "renewing", amount_cents: price }).eq("id", row.id);
      return { clientSecret: session.client_secret ?? "" };
    } catch (e) {
      return { error: getStripeErrorMessage(e) };
    }
  });

export const getOfferStatus = createServerFn({ method: "GET" })
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid(), environment: z.enum(["sandbox", "live"]) }).parse(i))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: r } = await supabaseAdmin.from("job_offers").select("payment_status, stripe_session_id").eq("id", data.id).maybeSingle();
    if (!r) return { paid: false };
    if (r.payment_status === "paid") return { paid: true };
    if (!r.stripe_session_id) return { paid: false };
    try {
      const { createStripeClient } = await import("./stripe.server");
      const ses = await createStripeClient(data.environment).checkout.sessions.retrieve(r.stripe_session_id);
      if (ses.payment_status === "paid" || ses.payment_status === "no_payment_required") {
        const { activateSession } = await import("./offers-activate.server");
        return { paid: await activateSession(ses as never) };
      }
    } catch (e) { console.error(e); }
    return { paid: false };
  });

export const createFreeOffer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => Input.omit({ tier: true, returnUrl: true, environment: true }).parse(i))
  .handler(async ({ data, context }): Promise<{ ok: true; pending: boolean; id: string; expiresAt: string } | { error: string }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: s } = await supabaseAdmin.from("app_settings").select("offers_free, offer_days, job_offers_enabled, offer_publish_mode").eq("id", 1).maybeSingle();
    if (!s?.job_offers_enabled) return { error: "Offerte non attive" };
    if (s.offer_publish_mode === "off") return { error: "La pubblicazione di offerte e sospesa" };
    if (!(s.offers_free ?? true)) return { error: "La pubblicazione gratuita non e attiva" };
    if (data.poster_type === "agency" && (!data.agency_name || !data.agency_auth_code)) return { error: "Dati agenzia mancanti" };
    // Free ads always last 15 days and are then deleted, then they expire and disappear from the list.
    const days = 15;
    const pending = s.offer_publish_mode === "approval";
    const { data: row, error } = await supabaseAdmin.from("job_offers").insert({
      ...data, apply_link: data.apply_link?.trim() || null, source: "manual", is_premium: false, is_active: true, payment_status: "free",
      moderation_status: pending ? "pending" : "approved",
      amount_cents: 0, user_id: context.userId, paid_until: new Date(Date.now() + days * 86400000).toISOString(),
    }).select("id").single();
    if (error || !row) return { error: "Impossibile salvare l'offerta" };
    const expiresAt = new Date(Date.now() + days * 86400000).toISOString();
    // Confirmation email repeating the expiry date. Best-effort on purpose: the ad
    // is already saved, so a delivery problem must never fail the publish.
    if (!pending) {
      try {
        const { sendTemplateEmail } = await import("./email-templates/send-email");
        await sendTemplateEmail("listing-published", data.poster_email, {
          templateData: { kind: "offerta", title: data.title, subtitle: data.city ?? "", expiresAt },
          idempotencyKey: `listing-published-${row.id}`,
        });
      } catch (e) { console.error("offer publish email failed", e); }
    }
    return { ok: true, pending, id: row.id, expiresAt };
  });
