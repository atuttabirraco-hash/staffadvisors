import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/lib/lang";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/staff/Header";
import { PasswordInput } from "@/components/staff/PasswordInput";
import { Footer } from "@/components/staff/Sections";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Reimposta password | StaffAdvisors" },
      { name: "description", content: "Scegli una nuova password per il tuo account StaffAdvisors." },
      { property: "og:title", content: "Reimposta password | StaffAdvisors" },
      { property: "og:description", content: "Scegli una nuova password per il tuo account StaffAdvisors." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPage,
});

function ResetPage() {
  const { tr } = useLang();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) setReady(true);
    });
    void supabase.auth.getSession().then(({ data }) => { if (data.session) setReady(true); });
    return () => sub.subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    const { error: err } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (err) return setError(err.message);
    navigate({ to: "/account" });
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="border-b border-border bg-card px-4 py-4"><div className="mx-auto max-w-7xl"><Logo /></div></div>
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-sm">
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">{tr.newPassword}</h1>
          {!ready ? (
            <p className="mt-4 text-sm text-muted-foreground">{tr.resetInvalid}</p>
          ) : (
            <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
              <PasswordInput value={password} onChange={setPassword} autoComplete="new-password" />
              {error && <p className="text-sm font-medium text-destructive">{error}</p>}
              <Button variant="hero" size="lg" type="submit" disabled={busy}>{tr.savePassword}</Button>
            </form>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
