import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Disclaimer, DisponibilitaForm, PageShell } from "@/components/staff/Disponibilita";
import { useSiteSettings } from "@/components/staff/JobOffers";

export const Route = createFileRoute("/inserisci-disponibilita")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/registrati" });
    return { user: data.user };
  },
  head: () => ({
    meta: [
      { title: "Inserisci disponibilita | StaffAdvisors" },
      { name: "description", content: "Pubblica la tua disponibilita a lavorare nella bacheca StaffAdvisors." },
      { property: "og:title", content: "Inserisci disponibilita | StaffAdvisors" },
      { property: "og:description", content: "Pubblica la tua disponibilita a lavorare nella bacheca StaffAdvisors." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Inserisci,
});

function Inserisci() {
  const navigate = useNavigate();
  const { user } = Route.useRouteContext();
  const { data: settings } = useSiteSettings();
  const { data: mine, isLoading } = useQuery({
    queryKey: ["mie-disp", user.id],
    queryFn: async () => (await supabase.from("disponibilita").select("id, expires_at, is_active").eq("user_id", user.id)).data ?? [],
  });
  const active = (mine ?? []).filter((d) => d.is_active && new Date(d.expires_at) > new Date());
  return (
    <PageShell title="Inserisci la tua disponibilita">
      <Disclaimer />
      <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
        {settings && !settings.bacheca_enabled ? (
          <p className="text-muted-foreground">La bacheca non e ancora attiva.</p>
        ) : isLoading ? null : active.length >= 5 ? (
          <p className="text-sm">
            Hai raggiunto il massimo di 5 annunci attivi. <button className="font-semibold text-primary underline" onClick={() => navigate({ to: "/dashboard" })}>Gestiscili dal tuo profilo</button>: cancellane uno o attendi la scadenza.
          </p>
        ) : (
          <DisponibilitaForm submitLabel="Pubblica annuncio" onSaved={() => navigate({ to: "/dashboard" })} />
        )}
      </div>
    </PageShell>
  );
}
