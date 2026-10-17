import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useLang } from "@/lib/lang";
import { deleteMyAccount } from "@/lib/auth.functions";
import { supabase } from "@/integrations/supabase/client";

export function DeleteAccountSection() {
  const { tr } = useLang();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const remove = useServerFn(deleteMyAccount);
  const [busy, setBusy] = useState(false);
  const handleDelete = async () => {
    if (busy || !window.confirm(tr.deleteAccountConfirm)) return;
    setBusy(true);
    try {
      await queryClient.cancelQueries();
      await remove();
      queryClient.clear();
      await supabase.auth.signOut({ scope: "local" });
      toast.success(tr.accountDeleted);
      await navigate({ to: "/auth", replace: true });
    } catch {
      toast.error(tr.errorGeneric);
      setBusy(false);
    }
  };
  return (
    <section className="mt-10 border-t border-destructive/30 pt-5">
      <h2 className="font-semibold text-foreground">{tr.deleteAccount}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{tr.deleteAccountDesc}</p>
      <Button variant="destructive" size="sm" className="mt-3" disabled={busy} onClick={() => void handleDelete()}>
        <Trash2 className="h-4 w-4" /> {tr.deleteAccount}
      </Button>
    </section>
  );
}
