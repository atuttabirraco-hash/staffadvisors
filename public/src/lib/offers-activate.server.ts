// Shared, idempotent payment state transitions for job offers (webhook + status poll).
type Session = { id: string; metadata?: Record<string, string> | null; payment_intent?: unknown };

const piOf = (s: Session) =>
  typeof s.payment_intent === "string" ? s.payment_intent : (s.payment_intent as { id?: string } | null)?.id ?? null;

export async function activateSession(session: Session): Promise<boolean> {
  const offerId = session.metadata?.["offer_id"];
  if (!offerId) return false;
  const days = Number(session.metadata?.["days"]) || 30;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: row } = await supabaseAdmin.from("job_offers")
    .select("payment_status, paid_until, is_active, stripe_session_id").eq("id", offerId).maybeSingle();
  if (!row || row.stripe_session_id !== session.id) return false;
  if (row.payment_status === "paid") return true; // already applied
  if (row.payment_status !== "pending" && row.payment_status !== "renewing") return false;
  const { data: s } = await supabaseAdmin.from("app_settings").select("offer_auto_publish").eq("id", 1).maybeSingle();
  const auto = s?.offer_auto_publish ?? true;
  const renewing = row.payment_status === "renewing";
  const base = renewing && row.paid_until && new Date(row.paid_until).getTime() > Date.now() ? new Date(row.paid_until).getTime() : Date.now();
  await supabaseAdmin.from("job_offers").update({
    is_active: renewing ? (auto || row.is_active) : auto,
    payment_status: "paid",
    paid_until: new Date(base + days * 86400000).toISOString(),
    stripe_payment_intent: piOf(session),
  }).eq("id", offerId).eq("stripe_session_id", session.id).eq("payment_status", row.payment_status);
  return true;
}

export async function expireSession(session: Session) {
  const offerId = session.metadata?.["offer_id"];
  if (!offerId) return;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await supabaseAdmin.from("job_offers").delete().eq("id", offerId).eq("stripe_session_id", session.id).eq("payment_status", "pending");
  await supabaseAdmin.from("job_offers").update({ payment_status: "paid" }).eq("id", offerId).eq("stripe_session_id", session.id).eq("payment_status", "renewing");
}

export async function refundPayment(paymentIntent: string | null | undefined) {
  if (!paymentIntent) return;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await supabaseAdmin.from("job_offers").update({ is_active: false, payment_status: "refunded", refunded_at: new Date().toISOString() })
    .eq("stripe_payment_intent", paymentIntent);
}
