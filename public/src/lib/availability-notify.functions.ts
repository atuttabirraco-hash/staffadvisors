import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Confirms a freshly published availability ad with an email that repeats the
 * date it stops being visible. The ad is already saved when this runs, so a
 * delivery problem is logged and swallowed instead of failing the publish.
 */
export const notifyAvailabilityPublished = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { data: row } = await context.supabase
      .from("disponibilita")
      .select("id, nome_visualizzato, mansione, zona, expires_at")
      .eq("id", data.id)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (!row) return { sent: false };
    const { data: user } = await context.supabase.auth.getUser();
    const email = user.user?.email;
    if (!email) return { sent: false };
    try {
      const { sendTemplateEmail } = await import("./email-templates/send-email");
      const res = await sendTemplateEmail("listing-published", email, {
        templateData: {
          kind: "disponibilita",
          title: row.nome_visualizzato,
          subtitle: `${row.mansione} - ${row.zona}`,
          expiresAt: row.expires_at,
        },
        idempotencyKey: `listing-published-${row.id}`,
      });
      return { sent: res.sent };
    } catch (error) {
      console.error("availability publish email failed", error);
      return { sent: false };
    }
  });
