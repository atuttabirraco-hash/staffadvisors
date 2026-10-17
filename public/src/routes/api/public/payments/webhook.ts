import { createFileRoute } from "@tanstack/react-router";
import { type StripeEnv, verifyWebhook } from "@/lib/stripe.server";
import { activateSession, expireSession, refundPayment } from "@/lib/offers-activate.server";

export const Route = createFileRoute("/api/public/payments/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const rawEnv = new URL(request.url).searchParams.get("env");
        if (rawEnv !== "sandbox" && rawEnv !== "live") return Response.json({ received: true, ignored: "invalid env" });
        const env: StripeEnv = rawEnv;
        try {
          const event = await verifyWebhook(request, env);
          const obj = event.data.object as any;
          switch (event.type) {
            case "checkout.session.completed":
              if (obj.payment_status !== "unpaid") await activateSession(obj);
              break;
            case "checkout.session.async_payment_succeeded":
              await activateSession(obj);
              break;
            case "checkout.session.expired":
            case "checkout.session.async_payment_failed":
              await expireSession(obj);
              break;
            case "charge.refunded":
            case "charge.dispute.created":
              await refundPayment(typeof obj.payment_intent === "string" ? obj.payment_intent : obj.payment_intent?.id);
              break;
          }
          return Response.json({ received: true });
        } catch (e) {
          console.error("Webhook error:", e);
          return new Response("Webhook error", { status: 400 });
        }
      },
    },
  },
});
