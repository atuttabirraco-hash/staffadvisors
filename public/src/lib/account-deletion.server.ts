import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

/** Remove account-owned data without removing public reviews, pages or replies. */
export async function deleteAccountData(client: SupabaseClient<Database>, userId: string) {
  const detached = await client.from("reviews").update({ user_id: null }).eq("user_id", userId);
  if (detached.error) throw new Error(detached.error.message);
  for (const table of ["disponibilita", "job_offers", "company_accounts"] as const) {
    const result = await client.from(table).delete().eq("user_id", userId);
    if (result.error) throw new Error(result.error.message);
  }
  const surveys = await client.from("surveys").delete().eq("owner_id", userId);
  if (surveys.error) throw new Error(surveys.error.message);
  const result = await client.auth.admin.deleteUser(userId);
  if (result.error) throw new Error(result.error.message);
}
