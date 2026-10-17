import { describe, it } from "node:test";
import { strict as assert } from "node:assert";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { deleteAccountData } from "./account-deletion.server";

function fixture(type: "person" | "business", failDetach = false) {
  const reviews = [{ id: "written", user_id: "owner", status: "approved" }, { id: "received", user_id: "employee", status: "approved" }];
  const replies = [{ review_id: "received", reply_text: "Official reply" }];
  const removed: string[] = [];
  let authDeleted = false;
  const client = {
    from: (table: string) => ({
      update: (values: { user_id: null }) => ({ eq: async (column: string, uid: string) => {
        assert.equal(table, "reviews"); assert.equal(column, "user_id");
        if (failDetach) return { error: { message: "detach_failed" } };
        reviews.forEach(r => { if (r.user_id === uid) Object.assign(r, values); });
        return { error: null };
      } }),
      delete: () => ({ eq: async (column: string, uid: string) => {
        assert.equal(uid, "owner");
        assert.equal(column, table === "surveys" ? "owner_id" : "user_id");
        removed.push(table);
        return { error: null };
      } }),
    }),
    auth: { admin: { deleteUser: async (uid: string) => { assert.equal(uid, "owner"); authDeleted = true; return { error: null }; } } },
  } as unknown as SupabaseClient<Database>;
  return { type, client, reviews, replies, removed, deleted: () => authDeleted };
}

describe("account deletion preserves public contributions", () => {
  for (const type of ["person", "business"] as const) {
    it(`${type}: written and received reviews and official replies stay public`, async () => {
      const f = fixture(type);
      await deleteAccountData(f.client, "owner");
      assert.deepEqual(f.reviews, [{ id: "written", user_id: null, status: "approved" }, { id: "received", user_id: "employee", status: "approved" }]);
      assert.deepEqual(f.replies, [{ review_id: "received", reply_text: "Official reply" }]);
      assert.equal(f.removed.includes("reviews"), false);
      assert.equal(f.removed.includes("companies"), false);
      assert.equal(f.removed.includes("company_replies"), false);
      assert.equal(f.deleted(), true);
    });
  }
  it("removes owned company membership and surveys", async () => {
    const f = fixture("business");
    await deleteAccountData(f.client, "owner");
    assert.deepEqual(f.removed.sort(), ["company_accounts", "disponibilita", "job_offers", "surveys"]);
  });
  it("does not delete the account when review preservation fails", async () => {
    const f = fixture("person", true);
    await assert.rejects(deleteAccountData(f.client, "owner"), /detach_failed/);
    assert.equal(f.deleted(), false);
    assert.deepEqual(f.removed, []);
  });
});