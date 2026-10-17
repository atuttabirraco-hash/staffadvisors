import { createServerFn } from "@tanstack/react-start";
import { reviewCode } from "./review-id";
import { z } from "zod";
import { publicClient } from "./public.functions";

const Input = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(200),
  message: z.string().trim().min(10).max(4000),
});

export const sendSiteMessage = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => Input.parse(i))
  .handler(async ({ data }) => {
    const db = publicClient();
    const messageId = crypto.randomUUID();
    const { error } = await db.from("contact_messages").insert({
      id: messageId,
      sender_name: data.name,
      sender_email: data.email,
      message: data.message,
    });
    if (error) throw new Error(error.message);
    try {
      const { sendTemplateEmail } = await import("./email-templates/send-email");
      await sendTemplateEmail("contact-notification", "avvisi@staffadvisors.it", {
        templateData: { name: data.name, email: data.email, message: data.message },
        idempotencyKey: `contact-notification-${messageId}`,
        replyTo: "info@staffadvisors.it",
      });
    } catch (notificationError) {
      console.error("Contact notification email failed", notificationError);
    }
    return { ok: true };
  });

const ReplyInput = z.object({
  review_id: z.string().uuid(),
  company_id: z.string().uuid(),
  name: z.string().trim().min(2).max(100),
  role: z.string().trim().max(100).optional().default(""),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().max(40).optional().default(""),
  reply: z.string().trim().min(10).max(2000),
});

export const requestCompanyReply = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => ReplyInput.parse(i))
  .handler(async ({ data }) => {
    const requestId = crypto.randomUUID();
    const { error } = await publicClient().from("reply_requests").insert({
      id: requestId,
      review_id: data.review_id, company_id: data.company_id, sender_name: data.name,
      sender_role: data.role || null, sender_email: data.email, sender_phone: data.phone || null, reply_text: data.reply,
    });
    if (error) throw new Error(error.message);

    // A reply sent from the company's own email domain is trusted and published
    // straight away; anything else stays pending so it never goes live by mistake.
    let verified = false;
    let awaitingConfirmation = false;
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { companyWebsiteDomain, emailMatchesCompanyDomain } = await import("./reply-verify.server");
      const domain = await companyWebsiteDomain(data.company_id);
      verified = emailMatchesCompanyDomain(data.email, domain);
      if (verified) {
        // Domain matches: ask the mailbox owner to confirm before publishing.
        await supabaseAdmin.from("reply_requests").update({ status: "awaiting_confirmation" }).eq("id", requestId);
        const { sendTemplateEmail } = await import("./email-templates/send-email");
        await sendTemplateEmail("reply-confirmation", data.email, {
          templateData: { name: data.name, reply: data.reply, link: `https://www.staffadvisors.it/conferma-replica?t=${requestId}` },
          idempotencyKey: `reply-confirmation-${requestId}`,
        });
        awaitingConfirmation = true;
      }
    } catch (verificationError) {
      console.error("Company reply verification failed", verificationError);
    }

    try {
      const { sendTemplateEmail } = await import("./email-templates/send-email");
      await sendTemplateEmail("reply-request-notification", "avvisi@staffadvisors.it", {
        templateData: { name: data.name, role: data.role, email: data.email, phone: data.phone, reply: data.reply, verified },
        idempotencyKey: `reply-request-notification-${requestId}`,
        replyTo: "info@staffadvisors.it",
      });
    } catch (notificationError) {
      console.error("Reply request notification email failed", notificationError);
    }
    return { ok: true, verified, awaitingConfirmation };
  });

/** Company confirms (or denies) from the link sent to its official mailbox. */
export const confirmCompanyReply = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => z.object({ token: z.string().uuid(), accept: z.boolean() }).parse(i))
  .handler(async ({ data }) => {
    const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
    const { data: req } = await db.from("reply_requests").select("*").eq("id", data.token).maybeSingle();
    if (!req) return { status: "invalid" as const };
    if (req.status === "approved") return { status: "published" as const };
    if (req.status !== "awaiting_confirmation") return { status: "invalid" as const };
    if (!data.accept) {
      await db.from("reply_requests").update({ status: "rejected" }).eq("id", req.id);
      return { status: "rejected" as const };
    }
    await db.from("company_replies").delete().eq("review_id", req.review_id);
    const { error } = await db.from("company_replies").insert({
      review_id: req.review_id, company_id: req.company_id, reply_text: req.reply_text, is_verified: true,
    });
    if (error) throw new Error(error.message);
    await db.from("reply_requests").update({ status: "approved" }).eq("id", req.id);
    return { status: "published" as const, companyId: req.company_id };
  });

/** "Segnala" on a review: email the moderation mailbox with the review text. */
export const reportReview = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => z.object({ review_id: z.string().uuid() }).parse(i))
  .handler(async ({ data }) => {
    const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
    const { data: r } = await db.from("reviews").select("id, company_id, role, pro, cons, advice").eq("id", data.review_id).maybeSingle();
    if (!r) return { ok: false };
    const { data: c } = await db.from("companies").select("name, city").eq("id", r.company_id).maybeSingle();
    const message = [
      `SEGNALAZIONE RECENSIONE`,
      `Azienda: ${c?.name ?? "-"} (${c?.city ?? ""})`,
      `Pagina: https://www.staffadvisors.it/azienda/${r.company_id}`,
      `Codice recensione: ${reviewCode(r.id)}`,
      `ID completo: ${r.id}`,
      `Ruolo: ${r.role ?? "-"}`,
      `Pro: ${r.pro ?? ""}`,
      `Contro: ${r.cons ?? ""}`,
      r.advice ? `Consiglio: ${r.advice}` : "",
      ``,
      `Per eliminarla vai in /admin, sezione recensioni.`,
    ].join("\n");
    try {
      const { sendTemplateEmail } = await import("./email-templates/send-email");
      await sendTemplateEmail("contact-notification", "avvisi@staffadvisors.it", {
        templateData: { name: "Segnalazione recensione", email: "sito", message },
        idempotencyKey: `review-report-${r.id}-${Math.floor(Date.now() / 3600000)}`,
      });
    } catch (e) {
      console.error("Review report email failed", e);
    }
    return { ok: true };
  });
