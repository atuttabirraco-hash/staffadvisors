import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { MapPin, Briefcase, Search, Lock, Send, CheckCircle2, FileDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Disclaimer, PageShell } from "@/components/staff/Disponibilita";
import { useSiteSettings } from "@/components/staff/JobOffers";
import { searchAvailability, type PublicAvailability } from "@/lib/public.functions";
import { contactAvailability, getAvailabilityCv } from "@/lib/auth.functions";

export const Route = createFileRoute("/bacheca-disponibilita")({
  head: () => ({
    meta: [
      { title: "Bacheca Disponibilità | StaffAdvisors" },
      { name: "description", content: "Bacheca pubblica di lavoratori autonomi che mettono a disposizione la propria professionalità: mansione, zona e contatti diretti. Nessuna intermediazione." },
      { property: "og:title", content: "Bacheca Disponibilità | StaffAdvisors" },
      { property: "og:description", content: "Lavoratori autonomi che mettono a disposizione la propria professionalità, contattabili direttamente. Nessuna intermediazione." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Bacheca,
});

const ERRORS: Record<string, string> = {
  limit_reached: "Hai raggiunto il limite di 5 richieste al giorno. Riprova domani.",
  not_available: "Questa disponibilita non e piu attiva.",
  own_listing: "Questo e il tuo annuncio.",
};

function Card({ d }: { d: PublicAvailability }) {
  const sendRequest = useServerFn(contactAvailability);
  const [state, setState] = useState<"closed" | "login" | "form" | "sent">("closed");
  const [requesterName, setRequesterName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [code, setCode] = useState("");
  const fetchCv = useServerFn(getAvailabilityCv);
  const [cvBusy, setCvBusy] = useState(false);
  const [cvErr, setCvErr] = useState("");
  const downloadCv = async () => {
    setCvErr("");
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) { setState("login"); return; }
    setCvBusy(true);
    try {
      const { url } = await fetchCv({ data: { id: d.id } });
      window.location.href = url;
    } catch { setCvErr("Download non riuscito, riprova."); }
    finally { setCvBusy(false); }
  };
  const open = async () => {
    const { data: auth } = await supabase.auth.getUser();
    setState(auth.user ? "form" : "login");
  };
  const submit = async () => {
    if (busy) return;
    setBusy(true); setErr("");
    try {
      const res = await sendRequest({ data: { id: d.id, requesterName, phone, message } });
      setCode(res?.requestCode ?? "");
      setState("sent");
    } catch (e) {
      const key = e instanceof Error ? e.message : "";
      setErr(ERRORS[key] ?? "Controlla il numero di telefono e riprova.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="flex flex-col rounded-2xl border border-border bg-card p-5 shadow-card">
      <p className="text-lg font-bold">{d.nome_visualizzato}</p>
      <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-primary"><Briefcase className="h-4 w-4" /> {d.mansione}</p>
      <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground"><MapPin className="h-4 w-4" /> {d.zona}</p>
      {d.descrizione && <p className="mt-3 flex-1 text-sm">{d.descrizione}</p>}
      {d.has_cv && (
        <div className="mt-3">
          <Button variant="outline" size="sm" className="w-full" onClick={() => void downloadCv()} disabled={cvBusy}><FileDown className="h-4 w-4" /> {cvBusy ? "..." : "Scarica curriculum"}</Button>
          {cvErr && <p className="mt-1 text-xs font-semibold text-destructive">{cvErr}</p>}
        </div>
      )}
      <div className="mt-4">
        {state === "sent" ? (
          <div className="rounded-xl bg-muted p-3 text-sm">
            <p className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> Richiesta inviata. Riceverai una email di conferma; ora sara {d.nome_visualizzato} a ricontattarti.</p>
            {code ? <p className="mt-2 text-xs">Codice richiesta: <strong className="font-mono">{code}</strong> - conservalo, serve se devi scriverci.</p> : null}
          </div>
        ) : state === "form" ? (
          <form className="space-y-2" onSubmit={(e) => { e.preventDefault(); void submit(); }}>
            <input type="text" required minLength={2} maxLength={80} value={requesterName} onChange={(e) => setRequesterName(e.target.value)} placeholder="Il tuo nome" aria-label="Nome" autoComplete="name" className="h-10 w-full rounded-xl border border-border bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
            <input type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Il tuo telefono" aria-label="Telefono" className="h-10 w-full rounded-xl border border-border bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} maxLength={1000} rows={3} placeholder="Scrivi qualcosa in piu se vuoi" aria-label="Messaggio aggiuntivo" className="w-full rounded-xl border border-border bg-card p-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
            <p className="text-xs text-muted-foreground">Telefono ed email del tuo account arrivano solo a {d.nome_visualizzato}, non vengono mai pubblicati.</p>
            {err && <p className="text-xs font-semibold text-destructive">{err}</p>}
            <Button type="submit" variant="hero" className="w-full" disabled={busy}><Send className="h-4 w-4" /> {busy ? "..." : "Invia richiesta"}</Button>
          </form>
        ) : state === "login" ? (
          <div className="rounded-xl border border-primary/40 bg-primary-soft p-3">
            <p className="flex items-center gap-1.5 text-sm font-bold"><Lock className="h-4 w-4 text-primary" /> Accedi per contattare{d.has_cv ? " o scaricare il curriculum" : ""}</p>
            <p className="mt-1 text-xs text-muted-foreground">Registrati e conferma la tua email (la ricevi da info@staffadvisors.it) per inviare una richiesta.</p>
            <Button asChild size="sm" variant="hero" className="mt-3"><Link to="/auth">Accedi o registrati</Link></Button>
          </div>
        ) : (
          <Button variant="outline" className="w-full" onClick={() => void open()}>Contatta</Button>
        )}
      </div>
    </div>
  );
}

function Bacheca() {
  const { data: settings, isLoading: sl } = useSiteSettings();
  const enabled = !!settings?.bacheca_enabled;
  const [role, setRole] = useState("");
  const [area, setArea] = useState("");
  const [applied, setApplied] = useState({ role: "", area: "" });
  useEffect(() => {
    const timer = window.setTimeout(() => setApplied({ role: role.trim(), area: area.trim() }), 500);
    return () => window.clearTimeout(timer);
  }, [role, area]);
  const search = useServerFn(searchAvailability);
  const { data, isLoading } = useQuery({
    queryKey: ["bacheca", applied.role.toLowerCase(), applied.area.toLowerCase()],
    enabled,
    queryFn: () => search({ data: applied }),
  });
  return (
    <>
      <PageShell title="Bacheca Disponibilità">
        <Disclaimer />
        {sl ? null : !enabled ? (
          <p className="rounded-2xl border border-border bg-card p-6 text-center text-muted-foreground">La bacheca non e ancora attiva. Torna presto!</p>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">Lavoratori autonomi che mettono a disposizione la propria professionalità. Contattali direttamente.</p>
              <Button variant="hero" asChild><Link to="/inserisci-disponibilita">Inserisci la tua disponibilita</Link></Button>
            </div>
            <form className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]" onSubmit={(event) => { event.preventDefault(); setApplied({ role: role.trim(), area: area.trim() }); }}>
              <div className="relative">
                <Briefcase className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input type="search" value={role} onChange={(event) => setRole(event.target.value)} placeholder="Mansione (es. badante)" aria-label="Filtra per mansione" className="h-11 w-full rounded-xl border border-border bg-card pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div className="relative">
                <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input type="search" value={area} onChange={(event) => setArea(event.target.value)} placeholder="Citta o zona (es. Verona)" aria-label="Filtra per citta o zona" className="h-11 w-full rounded-xl border border-border bg-card pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <Button type="submit" variant="hero" className="h-11"><Search className="h-4 w-4" /> Cerca</Button>
            </form>
            {isLoading ? <p className="text-sm text-muted-foreground">Caricamento...</p> : !data?.listings.length ? (
              <p className="rounded-2xl border border-border bg-card p-6 text-center text-muted-foreground">Nessuna disponibilita corrisponde alla ricerca.</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{data.listings.map((d) => <Card key={d.id} d={d} />)}</div>
            )}
          </>
        )}
      </PageShell>
    </>
  );
}
