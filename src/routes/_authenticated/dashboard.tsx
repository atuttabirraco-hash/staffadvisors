import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { DisponibilitaForm, PageShell, type Disp } from "@/components/staff/Disponibilita";
import { ExpiryNotice } from "@/components/staff/ExpiryNotice";
import { useSiteSettings } from "@/components/staff/JobOffers";
import { getMyAvailability } from "@/lib/auth.functions";

/** Maximum number of simultaneously active ads per user, mirrored by the DB trigger. */
const MAX_ADS = 5;

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Il mio profilo | StaffAdvisors" },
      { name: "description", content: "Gestisci i tuoi annunci di disponibilita nella bacheca StaffAdvisors." },
      { property: "og:title", content: "Il mio profilo | StaffAdvisors" },
      { property: "og:description", content: "Gestisci i tuoi annunci di disponibilita." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Dashboard,
});

const isActive = (d: Disp) => d.is_active && new Date(d.expires_at) > new Date();

function Dashboard() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const cvOn = !!useSiteSettings().data?.cv_enabled;
  const [editId, setEditId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const key = ["mie-disp", user.id];
  const loadMyAvailability = useServerFn(getMyAvailability);
  const { data: list, isLoading } = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await supabase.from("disponibilita").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
      if (!error) return data ?? [];
      return (await loadMyAvailability()) as Disp[];
    },
    retry: 3,
  });
  const reload = () => { void qc.invalidateQueries({ queryKey: key }); void qc.invalidateQueries({ queryKey: ["bacheca"] }); };
  const del = async (id: string) => {
    const cv = ads.find((a) => a.id === id)?.cv_path;
    if (!confirm("Vuoi cancellare definitivamente questo annuncio? L'operazione non si puo annullare.")) return;
    const { error } = await supabase.from("disponibilita").delete().eq("id", id);
    if (error) { toast.error("Errore, riprova"); return; }
    if (cv) void supabase.storage.from("cv").remove([cv]);
    toast.success("Annuncio cancellato");
    reload();
  };
  /**
   * Keeps the ad visible for another window. The new deadline is set by the
   * database (renew_availability), which also checks the ad belongs to the
   * signed-in user, so the 15-day rule lives in one place only.
   */
  const renew = async (id: string) => {
    if (busyId) return;
    setBusyId(id);
    const { data, error } = await supabase.rpc("renew_availability", { p_id: id });
    setBusyId(null);
    if (error) { toast.error("Rinnovo non riuscito, riprova"); return; }
    const until = (data as { expires_at: string }[] | null)?.[0]?.expires_at;
    toast.success(`Annuncio rinnovato: visibile fino al ${until ? new Date(until).toLocaleDateString("it-IT") : "oggi"}`);
    reload();
  };

  const ads = list ?? [];
  const activeCount = ads.filter(isActive).length;

  return (
    <PageShell title="Il mio profilo">
      <p className="text-sm text-muted-foreground">{user.email} {"\u2022"} <Link to="/account" className="text-primary underline">Il mio account</Link></p>
      {isLoading ? null : !ads.length ? (
        <div className="space-y-3 rounded-2xl border border-border bg-card p-6 shadow-card">
          <p>Non hai ancora pubblicato la tua disponibilita.</p>
          <Button variant="hero" asChild><Link to="/inserisci-disponibilita">Inserisci disponibilita</Link></Button>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm font-semibold text-muted-foreground">
            {activeCount === 1 ? "1 annuncio attivo" : `${activeCount} annunci attivi`} su un massimo di {MAX_ADS}
          </p>
          {ads.map((d) => {
            const expired = !isActive(d);
            return (
              <div key={d.id} className="rounded-2xl border border-border bg-card p-6 shadow-card">
                {editId === d.id ? (
                  <DisponibilitaForm initial={d} submitLabel="Salva modifiche" onSaved={() => { setEditId(null); toast.success("Salvato"); reload(); }} />
                ) : (
                  <div className="space-y-2">
                    <p className="text-lg font-bold">{d.nome_visualizzato}</p>
                    <p className="font-semibold text-primary">{d.mansione} {"\u2022"} {d.zona}</p>
                    {d.descrizione && <p className="text-sm">{d.descrizione}</p>}
                    {cvOn && d.cv_path && <p className="text-xs font-semibold text-muted-foreground">Curriculum allegato</p>}
                    <p className="text-sm text-muted-foreground">{d.telefono} {d.telefono && d.email_contatto ? "\u2022" : ""} {d.email_contatto}</p>
                    <p className={`text-xs font-semibold ${expired ? "text-destructive" : "text-muted-foreground"}`}>
                      {expired ? "Scaduto: non e piu visibile in bacheca." : `Visibile fino al ${new Date(d.expires_at).toLocaleDateString("it-IT")}`}
                    </p>
                    {!expired && (
                      <ExpiryNotice expiresAt={d.expires_at} title="Il tuo annuncio scade tra {n} giorni: alla scadenza verra cancellato.">
                        <Button variant="hero" size="sm" onClick={() => void renew(d.id)} disabled={busyId === d.id}>
                          {busyId === d.id ? "..." : "Rinnova ora"}
                        </Button>
                      </ExpiryNotice>
                    )}
                    <div className="flex flex-wrap gap-2 pt-2">
                      {!expired && <Button variant="outline" onClick={() => setEditId(d.id)}>Modifica</Button>}
                      <Button variant="destructive" onClick={() => void del(d.id)}>Cancella definitivamente</Button>
                    </div>
                    {expired && <p className="text-xs text-muted-foreground">Per ripubblicarti, cancella questo annuncio e inseriscine uno nuovo.</p>}
                  </div>
                )}
              </div>
            );
          })}
          {activeCount < MAX_ADS ? (
            <Button variant="hero" asChild><Link to="/inserisci-disponibilita">Inserisci un'altra disponibilita</Link></Button>
          ) : (
            <p className="rounded-xl border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
              Hai raggiunto il massimo di {MAX_ADS} annunci attivi: attendi la scadenza di uno o cancellalo per inserirne uno nuovo.
            </p>
          )}
        </div>
      )}
    </PageShell>
  );
}
