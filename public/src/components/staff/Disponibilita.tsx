import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { notifyAvailabilityPublished } from "@/lib/availability-notify.functions";
import type { Database } from "@/integrations/supabase/types";
import { useLang } from "@/lib/lang";
import { Footer } from "./Sections";
import { useSiteSettings } from "./JobOffers";
import { HomeLink } from "./HomeLink";
import { BusinessReturnButton } from "./BusinessReturnButton";

export type Disp = Database["public"]["Tables"]["disponibilita"]["Row"];
export type DispInput = Pick<Disp, "nome_visualizzato" | "mansione" | "zona" | "descrizione" | "telefono" | "email_contatto">;

export const DISCLAIMER = "StaffAdvisors non svolge attivita di intermediazione, offre esclusivamente spazio per annunci. Non verifica i contenuti.";

export function Disclaimer() {
  return (
    <div className="rounded-2xl border border-primary/30 bg-primary-soft p-4 text-sm font-medium text-foreground">
      {DISCLAIMER}
    </div>
  );
}

const inputCls = "h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary/40";

export function DisponibilitaForm({ initial, onSaved, submitLabel }: { initial?: Disp | null; onSaved: () => void; submitLabel: string }) {
  const { tr } = useLang();
  const [f, setF] = useState<DispInput>({
    nome_visualizzato: initial?.nome_visualizzato ?? "",
    mansione: initial?.mansione ?? "",
    zona: initial?.zona ?? "",
    descrizione: initial?.descrizione ?? "",
    telefono: initial?.telefono ?? "",
    email_contatto: initial?.email_contatto ?? "",
  });
  const [ok, setOk] = useState(!!initial);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [removeCv, setRemoveCv] = useState(false);
  const notify = useServerFn(notifyAvailabilityPublished);
  const cvEnabled = !!useSiteSettings().data?.cv_enabled;
  const set = (k: keyof DispInput) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    if (!f.telefono?.trim() && !f.email_contatto?.trim()) return setErr("Inserisci almeno un telefono o un'email.");
    if (!ok) return setErr("Devi accettare il consenso per pubblicare.");
    setBusy(true);
    const { data: authData } = await supabase.auth.getUser();
    if (!authData.user) { setBusy(false); return setErr("Accedi di nuovo per continuare."); }
    let cv_path: string | null | undefined = undefined;
    if (cvEnabled && cvFile) {
      if (cvFile.type !== "application/pdf" && !cvFile.name.toLowerCase().endsWith(".pdf")) { setBusy(false); return setErr("Il curriculum deve essere un file PDF."); }
      if (cvFile.size > 5 * 1024 * 1024) { setBusy(false); return setErr("Il curriculum non può superare 5 MB."); }
      const path = `${authData.user.id}/${crypto.randomUUID()}.pdf`;
      const up = await supabase.storage.from("cv").upload(path, cvFile, { contentType: "application/pdf", upsert: false });
      if (up.error) { setBusy(false); return setErr("Caricamento del curriculum non riuscito, riprova."); }
      cv_path = path;
    } else if (cvEnabled && removeCv) cv_path = null;
    const payload = { ...f, ...(cv_path !== undefined ? { cv_path } : {}), telefono: f.telefono?.trim() || null, email_contatto: f.email_contatto?.trim() || null, descrizione: (f.descrizione ?? "").trim() };
    let error: { code?: string; message?: string } | null = null;
    let newId: string | null = null;
    if (initial) {
      const res = await supabase.from("disponibilita").update(payload).eq("id", initial.id);
      error = res.error;
    } else {
      const res = await supabase.from("disponibilita").insert(payload).select("id").single();
      error = res.error;
      newId = res.data?.id ?? null;
    }
    setBusy(false);
    if (error && cv_path) void supabase.storage.from("cv").remove([cv_path]);
    if (!error && cv_path !== undefined && initial?.cv_path) void supabase.storage.from("cv").remove([initial.cv_path]);
    if (error) {
      if (error.message?.includes("availability_limit_reached")) return setErr("Hai raggiunto il massimo di 5 annunci attivi: cancellane uno o attendi la scadenza.");
      return setErr(error.code === "23505" ? "Hai gia un annuncio: puoi modificarlo dalla tua area personale." : "Controlla i dati inseriti e riprova.");
    }
    // The ad is saved: the confirmation email (with the expiry date) is best-effort
    // and must never make a successful publish look like a failure.
    if (newId) {
      try { await notify({ data: { id: newId } }); } catch { /* delivery problem: the ad is online either way */ }
    }
    onSaved();
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <input required minLength={2} maxLength={60} value={f.nome_visualizzato} onChange={set("nome_visualizzato")} placeholder="Nome visualizzato (es. Marco R.)" aria-label="Nome visualizzato" className={inputCls} />
      <input required minLength={2} maxLength={80} value={f.mansione} onChange={set("mansione")} placeholder="Mansione (es. Cameriere, Magazziniere)" aria-label="Mansione" className={inputCls} />
      <input required minLength={2} maxLength={80} value={f.zona} onChange={set("zona")} placeholder="Zona (es. Padova, Milano)" aria-label="Zona" className={inputCls} />
      <div>
        <textarea maxLength={2000} rows={5} value={f.descrizione} onChange={set("descrizione")} placeholder="Descrizione (es. esperienze, turni, patenti, strumenti che sai usare)" aria-label="Descrizione" className="w-full rounded-xl border border-border bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-primary/40" />
        <p className="text-right text-xs text-muted-foreground">{f.descrizione.length}/2000</p>
      </div>
      <input type="tel" maxLength={30} value={f.telefono ?? ""} onChange={set("telefono")} placeholder="Telefono" aria-label="Telefono" className={inputCls} />
      <input type="email" maxLength={200} value={f.email_contatto ?? ""} onChange={set("email_contatto")} placeholder="Email di contatto" aria-label="Email di contatto" className={inputCls} />
      {cvEnabled && <div className="space-y-2 rounded-xl border border-border p-3">
        <label htmlFor="cv-file" className="block text-sm font-semibold">Carica curriculum (facoltativo)</label>
        <p className="text-xs text-muted-foreground">Solo PDF, massimo 5 MB. Non viene mostrato in pagina: potranno scaricarlo solo gli utenti registrati che hanno effettuato l'accesso. Evita dati sensibili o documenti d'identità; puoi rimuoverlo quando vuoi, ma le copie già scaricate non si possono ritirare.</p>
        {initial?.cv_path && !removeCv && !cvFile && (
          <p className="text-xs">Curriculum già caricato. <button type="button" className="font-semibold text-destructive underline" onClick={() => setRemoveCv(true)}>Rimuovi curriculum</button></p>
        )}
        {removeCv && <p className="text-xs text-destructive">Il curriculum verrà rimosso al salvataggio. <button type="button" className="underline" onClick={() => setRemoveCv(false)}>Annulla</button></p>}
        <input id="cv-file" type="file" accept="application/pdf,.pdf" onChange={(e) => { setCvFile(e.target.files?.[0] ?? null); setRemoveCv(false); }} className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-2 file:text-sm file:font-semibold file:text-primary-foreground" />
      </div>}
      <label className="flex items-start gap-3 rounded-xl border border-border bg-muted/40 p-3 text-xs leading-relaxed">
        <input type="checkbox" required checked={ok} onChange={(e) => setOk(e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-primary" />
        <span>
          {tr.availabilityConsentBefore} <Link to="/privacy" className="font-semibold text-primary underline">Privacy Policy</Link> {tr.availabilityConsentAfter}
        </span>
      </label>
      {err && <p className="text-sm font-medium text-destructive">{err}</p>}
      <Button variant="hero" size="lg" type="submit" disabled={busy} className="w-full sm:w-auto">{busy ? "..." : submitLabel}</Button>
    </form>
  );
}

export function PageShell({ title, children }: { title: string; children: React.ReactNode }) {
  const { tr } = useLang();
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="bg-gradient-hero text-secondary-foreground">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <HomeLink className="text-lg font-bold">Staff<span className="text-primary">Advisors</span></HomeLink>
          <nav className="flex flex-wrap items-center gap-1 text-sm font-semibold">
            <Link to="/lavoro" className="rounded-xl px-3 py-2 hover:bg-secondary-foreground/10">{tr.jobsTitle}</Link>
            <Link to="/bacheca-disponibilita" className="rounded-xl px-3 py-2 hover:bg-secondary-foreground/10">{tr.bacheca}</Link>
            <BusinessReturnButton />
            <Link to="/dashboard" className="rounded-xl px-3 py-2 hover:bg-secondary-foreground/10">Il mio profilo</Link>
          </nav>
        </div>
        <h1 className="mx-auto max-w-5xl px-4 pb-8 pt-2 text-2xl font-extrabold sm:text-4xl">{title}</h1>
      </div>
      <main className="mx-auto w-full max-w-5xl flex-1 space-y-6 px-4 py-8">{children}</main>
      <Footer />
    </div>
  );
}
