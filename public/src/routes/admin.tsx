import { Fragment, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { AdminSurveys } from "@/components/staff/AdminSurveys";
import { toast } from "sonner";
import { adminAction, adminLoad, adminOffer, adminSettings, adminBenefits, adminContactDelete, adminContactDeleteAll, adminReplies, adminReplyDecide, adminBacheca, adminReviewToggle, adminAdzunaCache, adminListingDelete } from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { reviewCode, reviewMatches } from "@/lib/review-id";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin | StaffAdvisors" },
      { name: "description", content: "Area riservata StaffAdvisors." },
      { property: "og:title", content: "Admin | StaffAdvisors" },
      { property: "og:description", content: "Area riservata StaffAdvisors." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Admin,
});

type Data = Awaited<ReturnType<typeof adminLoad>>;

function csv(rows: Record<string, unknown>[], name: string) {
  if (!rows.length) return;
  const keys = Object.keys(rows[0]!);
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const body = [keys.join(","), ...rows.map((r) => keys.map((k) => esc(r[k])).join(","))].join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([body], { type: "text/csv" }));
  a.download = name;
  a.click();
}

function Admin() {
  const load = useServerFn(adminLoad);
  const act = useServerFn(adminAction);
  const saveSettings = useServerFn(adminSettings);
  const offerFn = useServerFn(adminOffer);
  const benefitsFn = useServerFn(adminBenefits);
  const delMsg = useServerFn(adminContactDelete);
  const delAllMsg = useServerFn(adminContactDeleteAll);
  const delListing = useServerFn(adminListingDelete);
  const repliesFn = useServerFn(adminReplies);
  const decideFn = useServerFn(adminReplyDecide);
  const [rq, setRq] = useState<Awaited<ReturnType<typeof adminReplies>> | null>(null);
  const [search, setSearch] = useState("");
  const [reqSearch, setReqSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "yes" | "no">("all");
  const [pw, setPw] = useState("");
  const [data, setData] = useState<Data | null>(null);

  type Co = Data["companies"][number];
  const setBenefit = async (c: Co, patch: Partial<Pick<Co, "meal_override" | "welfare_override" | "meal_value_override" | "meal_provider_override">>) => {
    const next = { meal_override: c.meal_override, welfare_override: c.welfare_override, meal_value_override: c.meal_value_override, meal_provider_override: c.meal_provider_override, ...patch };
    try { await benefitsFn({ data: { password: pw, id: c.id, ...next } as never }); await refresh(); } catch { toast.error("Errore"); }
  };
  const tri = (v: boolean | null) => (v === null ? "" : v ? "1" : "0");
  const untri = (s: string) => (s === "" ? null : s === "1");
  const blank = { title: "", company_id: "", city: "", contract_type: "", salary_range: "", apply_link: "", is_premium: false, meal_vouchers: false };
  const [form, setForm] = useState(blank);

  const reviewToggleFn = useServerFn(adminReviewToggle);
  const toggleReview = async (key: "reviews_require_login" | "reviews_deletable" | "cv_enabled" | "business_area_enabled" | "survey_ai_enabled") => {
    if (!data) return;
    try { await reviewToggleFn({ data: { password: pw, key, enabled: !data[key] } }); await refresh(); toast.success("Salvato"); } catch { toast.error("Errore"); }
  };
  const cacheFn = useServerFn(adminAdzunaCache);
  const [cacheH, setCacheH] = useState<number | null>(null);
  const [cacheM, setCacheM] = useState<number | null>(null);
  const cacheTotal = data?.adzuna_cache_minutes ?? 10;
  const hVal = cacheH ?? Math.floor(cacheTotal / 60), mVal = cacheM ?? cacheTotal % 60;
  const saveCache = async () => {
    const minutes = hVal * 60 + mVal;
    if (minutes < 1 || minutes > 1440) { toast.error("Scegli un tempo tra 1 minuto e 24 ore"); return; }
    try { await cacheFn({ data: { password: pw, minutes } }); setCacheH(null); setCacheM(null); await refresh(); toast.success("Salvato"); } catch { toast.error("Errore"); }
  };
  const bachecaFn = useServerFn(adminBacheca);
  const toggleBacheca = async () => {
    if (!data) return;
    try { await bachecaFn({ data: { password: pw, enabled: !data.bacheca_enabled } }); await refresh(); toast.success("Salvato"); } catch { toast.error("Errore"); }
  };
  const refresh = async (p = pw) => {
    try {
      const [d, q] = await Promise.all([load({ data: { password: p } }), repliesFn({ data: { password: p } })]);
      setData(d); setRq(q);
      document.title = q.requests.length ? `(${q.requests.length}) Admin | StaffAdvisors` : "Admin | StaffAdvisors";
    } catch { toast.error("Password errata"); }
  };
  const run = async (action: "delete_review" | "fake_review" | "delete_company", id: string) => {
    if (!confirm("Confermi?")) return;
    try { await act({ data: { password: pw, action, id } }); await refresh(); } catch { toast.error("Errore"); }
  };

  const toggle = async (k: "offers_free" | "job_offers_enabled" | "adzuna_enabled" | "offer_auto_publish" | "offer_auto_expire") => {
    if (!data) return;
    const next = { ...data.settings, [k]: !data.settings[k] };
    try { await saveSettings({ data: { password: pw, ...next } }); await refresh(); toast.success("Salvato"); } catch { toast.error("Errore"); }
  };
  const setMode = async (mode: "admin" | "tiers") => {
    if (!data) return;
    try { await saveSettings({ data: { password: pw, ...data.settings, offer_price_mode: mode } }); await refresh(); toast.success("Salvato"); } catch { toast.error("Errore"); }
  };
  const setPublishMode = async (mode: "auto" | "approval" | "off") => {
    if (!data) return;
    try { await saveSettings({ data: { password: pw, ...data.settings, offer_publish_mode: mode } }); await refresh(); toast.success("Salvato"); } catch { toast.error("Errore"); }
  };
  const offer = async (op: "save" | "delete", o: Record<string, unknown>) => {
    if (op === "delete" && !confirm("Confermi?")) return;
    try { await offerFn({ data: { password: pw, op, offer: o as never } }); await refresh(); if (op === "save") setForm(blank); } catch { toast.error("Dati non validi"); }
  };
  const names = useMemo(() => new Map((data?.companies ?? []).map((c) => [c.id, c.name])), [data]);
  const reviews = useMemo(() => {
    const raw = data?.reviews ?? [];
    return raw.filter((r) => {
      const matchesFilter = filter === "all" || (filter === "yes") === r.is_verified;
      if (!matchesFilter) return false;
      if (!search) return true;
       const s = search.toLowerCase();
      const co = names.get(r.company_id)?.toLowerCase() ?? "";
       return reviewMatches(r.id, s) || (r.role ?? "").toLowerCase().includes(s) || co.includes(s) || (r.pro ?? "").toLowerCase().includes(s);
    });
  }, [data, filter, search, names]);

  if (!data) {
    return (
      <form onSubmit={(e) => { e.preventDefault(); refresh(); }} className="mx-auto mt-24 flex max-w-xs flex-col gap-3 px-4">
        <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Password" className="h-11 rounded-xl border border-border px-3" />
        <Button variant="hero" type="submit">Entra</Button>
      </form>
    );
  }

  const r = data.reviews;
  const counters = [
    ["Aziende", data.companies.length],
    ["Recensioni", r.length],
    ["Verificate", r.filter((x) => x.is_verified).length],
    ["Non verificate", r.filter((x) => !x.is_verified).length],
    ["False", r.filter((x) => x.status === "fake").length],
  ] as const;

  return (
    <main className="mx-auto max-w-7xl space-y-8 px-4 py-8">
      <h1 className="text-2xl font-extrabold">StaffAdvisors Admin</h1>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {counters.map(([l, n]) => (
          <div key={l} className="rounded-2xl border border-border bg-card p-4"><p className="text-xs text-muted-foreground">{l}</p><p className="text-2xl font-bold">{n}</p></div>
        ))}
      </div>

      <section className={`rounded-2xl border p-5 ${rq?.requests.length ? "border-primary bg-primary-soft" : "border-border bg-card"}`}>
        <h2 className="mb-1 text-lg font-bold">{"\ud83d\udd14"} Risposte delle aziende da approvare ({rq?.requests.length ?? 0})</h2>
        <p className="mb-3 text-xs text-muted-foreground">Prima di approvare, controlla che sia davvero l'azienda: chiama il numero ufficiale (sito o Google) oppure verifica che l'email sia del dominio aziendale.</p>
        {!rq?.requests.length ? <p className="text-sm text-muted-foreground">Nessuna risposta in attesa.</p> : (
          <div className="space-y-3">
            {rq.requests.map((q) => {
              const rv = rq.reviews.find((x) => x.id === q.review_id);
              const co = rq.companies.find((x) => x.id === q.company_id);
              return (
                <div key={q.id} className="rounded-2xl border border-border bg-card p-3 text-sm">
                  <p className="font-bold">{co?.name ?? "-"}{co?.city ? ` (${co.city})` : ""}</p>
                  <p className="text-xs">Da: <b>{q.sender_name}</b>{q.sender_role ? `, ${q.sender_role}` : ""} - <a className="text-primary underline" href={`mailto:${q.sender_email}`}>{q.sender_email}</a>{q.sender_phone ? <> - <a className="text-primary underline" href={`tel:${q.sender_phone}`}>{q.sender_phone}</a></> : null}</p>
                  <p className="text-xs text-muted-foreground">{new Date(q.created_at).toLocaleString("it-IT")}</p>
                  {rv && <p className="mt-2 rounded-xl bg-muted p-2 text-xs">Recensione #{rv.id.slice(0, 8)} ({rv.role ?? "-"}): + {rv.pro ?? ""} / - {rv.cons ?? ""}</p>}
                  <p className="mt-2 whitespace-pre-wrap"><b>Risposta:</b> {q.reply_text}</p>
                  <div className="mt-2 flex gap-2">
                    <Button size="sm" variant="hero" onClick={async () => { try { await decideFn({ data: { password: pw, id: q.id, approve: true } }); toast.success("Risposta pubblicata"); await refresh(); } catch { toast.error("Errore"); } }}>Approva e pubblica</Button>
                    <Button size="sm" variant="destructive" onClick={async () => { if (!confirm("Rifiutare?")) return; try { await decideFn({ data: { password: pw, id: q.id, approve: false } }); await refresh(); } catch { toast.error("Errore"); } }}>Rifiuta</Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="mb-3 text-lg font-bold">{"\u2699\ufe0f"} Impostazioni Sito</h2>
        {([["job_offers_enabled", "Attiva Offerte Lavoro (/lavoro)"], ["adzuna_enabled", "Usa API Adzuna"]] as const).map(([k, l]) => (
          <Fragment key={k}>
            <label className="flex items-center justify-between gap-3 border-t border-border py-3 text-sm first:border-0">
              <span className="font-semibold">{l}</span>
              <button type="button" role="switch" aria-checked={data.settings[k]} aria-label={l} onClick={() => toggle(k)}
                className={`relative h-6 w-11 rounded-full transition ${data.settings[k] ? "bg-primary" : "bg-muted"}`}>
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-background shadow transition-all ${data.settings[k] ? "left-5" : "left-0.5"}`} />
              </button>
            </label>
            {k === "adzuna_enabled" && (
              <p className="-mt-1 pb-3 text-xs text-muted-foreground">Adzuna funziona solo con entrambe le opzioni attive e le chiavi ADZUNA_APP_ID / ADZUNA_APP_KEY configurate.</p>
            )}
            {k === "adzuna_enabled" && (
              <div className="flex flex-wrap items-center gap-2 pb-3 text-sm">
                <span className="font-semibold">Aggiorna annunci Adzuna ogni</span>
                <input type="number" min={0} max={24} value={hVal} onChange={(e) => setCacheH(Math.max(0, Math.min(24, Number(e.target.value) || 0)))} aria-label="Ore" className="w-16 rounded-lg border border-border bg-background px-2 py-1" />
                <span>ore</span>
                <input type="number" min={0} max={59} value={mVal} onChange={(e) => setCacheM(Math.max(0, Math.min(59, Number(e.target.value) || 0)))} aria-label="Minuti" className="w-16 rounded-lg border border-border bg-background px-2 py-1" />
                <span>minuti</span>
                <button type="button" onClick={saveCache} className="rounded-lg bg-primary px-3 py-1 font-semibold text-primary-foreground">Salva</button>
              </div>
            )}
          </Fragment>
        ))}
        <label className="flex items-center justify-between gap-3 border-t border-border py-3 text-sm">
          <span className="font-semibold">Attiva Bacheca Disponibilità (/bacheca-disponibilita)</span>
          <button type="button" role="switch" aria-checked={data.bacheca_enabled} aria-label="Bacheca Disponibilità" onClick={toggleBacheca}
            className={`relative h-6 w-11 rounded-full transition ${data.bacheca_enabled ? "bg-primary" : "bg-muted"}`}>
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-background shadow transition-all ${data.bacheca_enabled ? "left-5" : "left-0.5"}`} />
          </button>
        </label>
        {([["reviews_require_login", "Recensioni solo con registrazione (spento = chiunque puo recensire)"], ["reviews_deletable", "Gli utenti possono cancellare le proprie recensioni"], ["cv_enabled", "CV facoltativo nella Bacheca Disponibilità (caricamento e download)"], ["business_area_enabled", "Area aziende e sondaggi interni per i dipendenti"], ["survey_ai_enabled", "Sintesi automatica AI dei sondaggi (spento = nessun costo AI)"]] as const).map(([k, l]) => (
          <label key={k} className="flex items-center justify-between gap-3 border-t border-border py-3 text-sm">
            <span className="font-semibold">{l}</span>
            <button type="button" role="switch" aria-checked={data[k]} aria-label={l} onClick={() => toggleReview(k)}
              className={`relative h-6 w-11 shrink-0 rounded-full transition ${data[k] ? "bg-primary" : "bg-muted"}`}>
              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-background shadow transition-all ${data[k] ? "left-5" : "left-0.5"}`} />
            </button>
          </label>
        ))}
        <label className="mt-2 flex items-center justify-between gap-3 border-t border-border py-3 text-sm">
          <span className="font-semibold">Pubblicazione offerte degli utenti</span>
          <select value={data.settings.offer_publish_mode} onChange={(e) => setPublishMode(e.target.value as "auto" | "approval" | "off")} className="h-9 rounded-xl border border-border px-2 text-sm">
            <option value="auto">Libera (online subito)</option>
            <option value="approval">Da approvare (prima la vedi tu)</option>
            <option value="off">Off (nessuno pubblica)</option>
          </select>
        </label>
        <label className="flex items-center justify-between gap-3 border-t border-border py-3 text-sm">
          <span className="font-semibold">Offerte gratis per tutti (spegni per farle pagare)</span>
          <button type="button" role="switch" aria-checked={data.settings.offers_free} aria-label="Offerte gratis" onClick={() => toggle("offers_free")}
            className={`relative h-6 w-11 rounded-full transition ${data.settings.offers_free ? "bg-primary" : "bg-muted"}`}>
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-background shadow transition-all ${data.settings.offers_free ? "left-5" : "left-0.5"}`} />
          </button>
        </label>
        {data.settings.offers_free ? (
          <p className="text-xs text-muted-foreground">Chi ha un account pubblica gratis e l'offerta va subito online. Le impostazioni di prezzo e pagamento sono nascoste finche non spegni questa opzione.</p>
        ) : (<>
        <form key={`${data.settings.offer_price_cents}-${data.settings.offer_days}-${data.settings.offer_premium_price_cents}`} className="mt-4 flex flex-wrap items-end gap-3 border-t border-border pt-4"
          onSubmit={async (e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            const price = Math.round(Number(String(f.get("price")).replace(",", ".")) * 100);
            const days = Number(f.get("days"));
            const premium = Math.round(Number(String(f.get("premium")).replace(",", ".")) * 100);
            try { await saveSettings({ data: { password: pw, ...data.settings, offer_price_cents: price, offer_days: days, offer_premium_price_cents: premium } }); await refresh(); toast.success("Prezzo salvato"); } catch { toast.error("Valori non validi (minimo 0,50 euro)"); }
          }}>
          <label className="text-sm font-semibold">Prezzo offerta pubblicata dagli utenti (euro)
            <input name="price" inputMode="decimal" defaultValue={(data.settings.offer_price_cents / 100).toFixed(2)} className="mt-1 block h-9 w-32 rounded-xl border border-border px-2 text-sm" />
          </label>
          <label className="text-sm font-semibold">Durata (giorni)
            <input name="days" type="number" min={1} max={365} defaultValue={data.settings.offer_days} className="mt-1 block h-9 w-24 rounded-xl border border-border px-2 text-sm" />
          </label>
          <label className="text-sm font-semibold">Prezzo offerta in evidenza (euro)
            <input name="premium" inputMode="decimal" defaultValue={(data.settings.offer_premium_price_cents / 100).toFixed(2)} className="mt-1 block h-9 w-32 rounded-xl border border-border px-2 text-sm" />
          </label>
          <Button type="submit" size="sm" variant="hero">Salva prezzo</Button>
          <p className="w-full text-xs text-muted-foreground">Le offerte che aggiungi tu qui sotto in "Gestione Offerte" sono sempre gratis.</p>
        </form>
        <div className="mt-2 border-t border-border">
          <label className="flex items-center justify-between gap-3 border-b border-border py-3 text-sm">
            <span className="font-semibold">Pubblicazione automatica dopo il pagamento</span>
            <button type="button" role="switch" aria-checked={data.settings.offer_auto_publish} aria-label="Pubblicazione automatica" onClick={() => toggle("offer_auto_publish")}
              className={`relative h-6 w-11 rounded-full transition ${data.settings.offer_auto_publish ? "bg-primary" : "bg-muted"}`}>
              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-background shadow transition-all ${data.settings.offer_auto_publish ? "left-5" : "left-0.5"}`} />
            </button>
          </label>
          <p className="py-1 text-xs text-muted-foreground">Se spento, l'offerta pagata resta in attesa e la attivi tu da "Gestione Offerte".</p>
          <label className="flex items-center justify-between gap-3 border-b border-border py-3 text-sm">
            <span className="font-semibold">Nascondi le offerte scadute automaticamente</span>
            <button type="button" role="switch" aria-checked={data.settings.offer_auto_expire} aria-label="Scadenza automatica" onClick={() => toggle("offer_auto_expire")}
              className={`relative h-6 w-11 rounded-full transition ${data.settings.offer_auto_expire ? "bg-primary" : "bg-muted"}`}>
              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-background shadow transition-all ${data.settings.offer_auto_expire ? "left-5" : "left-0.5"}`} />
            </button>
          </label>
          <label className="flex items-center justify-between gap-3 py-3 text-sm">
            <span className="font-semibold">Tipo di prezzo per chi pubblica</span>
            <select value={data.settings.offer_price_mode} onChange={(e) => setMode(e.target.value as "admin" | "tiers")} className="h-9 rounded-xl border border-border px-2 text-sm">
              <option value="admin">Un solo prezzo (deciso da admin)</option>
              <option value="tiers">Due prezzi: normale e in evidenza</option>
            </select>
          </label>
        </div>
        </>)}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">Gestione Offerte</h2>
        <form onSubmit={(e) => { e.preventDefault(); const n = (v: string) => v.trim() || null; offer("save", { ...form, company_id: n(form.company_id), city: n(form.city), contract_type: n(form.contract_type), salary_range: n(form.salary_range), apply_link: n(form.apply_link), is_active: true }); }}
          className="mb-3 grid gap-2 rounded-2xl border border-border p-3 sm:grid-cols-4">
          <input required placeholder="Titolo" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="h-9 rounded-xl border border-border px-2 text-sm" />
          <select value={form.company_id} onChange={(e) => setForm({ ...form, company_id: e.target.value })} className="h-9 rounded-xl border border-border px-2 text-sm">
            <option value="">Azienda (nessuna)</option>{data.companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input placeholder="Citta" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="h-9 rounded-xl border border-border px-2 text-sm" />
          <input placeholder="Contratto" value={form.contract_type} onChange={(e) => setForm({ ...form, contract_type: e.target.value })} className="h-9 rounded-xl border border-border px-2 text-sm" />
          <input placeholder="Stipendio (es. 1400-1600 EUR)" value={form.salary_range} onChange={(e) => setForm({ ...form, salary_range: e.target.value })} className="h-9 rounded-xl border border-border px-2 text-sm" />
          <input type="url" placeholder="Link candidatura https://..." value={form.apply_link} onChange={(e) => setForm({ ...form, apply_link: e.target.value })} className="h-9 rounded-xl border border-border px-2 text-sm sm:col-span-2" />
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.meal_vouchers} onChange={(e) => setForm({ ...form, meal_vouchers: e.target.checked })} /> Buoni pasto inclusi</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.is_premium} onChange={(e) => setForm({ ...form, is_premium: e.target.checked })} /> Premium</label>
          <Button type="submit" variant="hero" size="sm" className="sm:col-span-4">Aggiungi offerta</Button>
        </form>
        <div className="overflow-x-auto rounded-2xl border border-border">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted"><tr>{["Titolo", "Azienda", "Citta", "Fonte", "Tipo", "Stato", "Attiva", ""].map((h) => <th key={h} className="p-2">{h}</th>)}</tr></thead>
            <tbody>
              {data.offers.map((o) => (
                <tr key={o.id} className="border-t border-border">
                  <td className="p-2 font-semibold">{o.title}{o.moderation_status === "pending" ? " \u23f3" : ""}</td><td className="p-2">{o.company_id ? names.get(o.company_id) : o.poster_company ?? "-"}</td><td className="p-2">{o.city}</td><td className="p-2">{o.source}</td>
                  <td className="p-2">{o.poster_type === "agency" ? `Agenzia${o.agency_name ? `: ${o.agency_name}` : ""}` : "Privato"}</td>
                  <td className="p-2">{o.moderation_status === "pending" ? "Da approvare" : o.moderation_status === "rejected" ? "Rifiutata" : "Approvata"}</td>
                  <td className="p-2">{o.is_active ? "Si" : "No"}</td>
                  <td className="whitespace-nowrap p-2">
                    {o.moderation_status === "pending" && <Button size="sm" variant="hero" onClick={() => offer("save", { ...o, moderation_status: "approved" })}>Approva</Button>}{" "}
                    <Button size="sm" variant="outline" onClick={() => offer("save", { ...o, is_active: !o.is_active })}>{o.is_active ? "Disattiva" : "Attiva"}</Button>{" "}
                    <Button size="sm" variant="destructive" onClick={() => offer("delete", { id: o.id })}>Elimina</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">Messaggi ricevuti ({data.messages.length})</h2>
        {data.messages.length === 0 ? <p className="text-sm text-muted-foreground">Nessun messaggio.</p> : (
          <div className="space-y-2">
            {data.messages.map((m) => {
              const o = data.offers.find((x) => x.id === m.offer_id);
              return (
                <div key={m.id} className="rounded-2xl border border-border bg-card p-3 text-sm">
                  <p className="font-semibold">{m.sender_name} - <a className="text-primary underline" href={`mailto:${m.sender_email}`}>{m.sender_email}</a></p>
                  <p className="text-xs text-muted-foreground">Offerta: {o?.title ?? m.offer_id} - {new Date(m.created_at).toLocaleString("it-IT")}</p>
                  <p className="mt-1 whitespace-pre-wrap">{m.message}</p>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">Annunci Bacheca Disponibilita ({data.listings.length})</h2>
        {data.listings.length === 0 ? <p className="text-sm text-muted-foreground">Nessun annuncio.</p> : (
          <div className="space-y-2">
            {data.listings.map((l) => (
              <div key={l.id} className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-3 text-sm">
                <span className="mr-auto"><b>{l.mansione}</b> - {l.zona} ({l.nome_visualizzato}) - scade {new Date(l.expires_at).toLocaleDateString("it-IT")}</span>
                <Button size="sm" variant="destructive" onClick={async () => { if (!confirm("Cancellare questo annuncio?")) return; try { await delListing({ data: { password: pw, id: l.id } }); await refresh(); toast.success("Cancellato"); } catch { toast.error("Errore"); } }}>Cancella</Button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <h2 className="mr-auto text-lg font-bold">Richieste Bacheca Disponibilita ({data.availabilityRequests.length})</h2>
          {data.availabilityRequests.length > 0 && (
            <input placeholder="Cerca codice richiesta..." aria-label="Cerca codice richiesta" value={reqSearch} onChange={(e) => setReqSearch(e.target.value)} className="h-9 w-full rounded-xl border border-border px-3 text-sm sm:w-64" />
          )}
        </div>
        {data.availabilityRequests.length === 0 ? <p className="text-sm text-muted-foreground">Nessuna richiesta.</p> : (() => {
          const rows = data.availabilityRequests.filter((q) => reviewMatches(q.id, reqSearch));
          return rows.length === 0 ? <p className="text-sm text-muted-foreground">Nessuna richiesta con questo codice.</p> : (
          <div className="overflow-x-auto rounded-2xl border border-border bg-card">
            <table className="w-full text-xs">
              <thead><tr className="text-left text-muted-foreground"><th className="p-2">Codice</th><th className="p-2">Data/ora</th><th className="p-2">Mittente</th><th className="p-2">Destinatario</th><th className="p-2">Annuncio</th><th className="p-2">IP</th></tr></thead>
              <tbody>{rows.map((q) => (
                <tr key={q.id} className="border-t border-border"><td className="p-2 font-mono font-bold text-primary">{reviewCode(q.id)}</td><td className="p-2">{new Date(q.created_at).toLocaleString("it-IT")}</td><td className="p-2 font-mono">{q.requester_id.slice(0, 8)}</td><td className="p-2 font-mono">{q.owner_id?.slice(0, 8) ?? "-"}</td><td className="p-2 font-mono">{q.listing_id.slice(0, 8)}</td><td className="p-2">{q.ip ?? "-"}</td></tr>
              ))}</tbody>
            </table>
          </div>
          );
        })()}
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-lg font-bold">Messaggi dal sito ({data.contacts.length})</h2>
          {data.contacts.length > 0 && (
            <Button size="sm" variant="destructive" onClick={async () => {
              if (!confirm(`Eliminare tutti i ${data.contacts.length} messaggi?`)) return;
              try { await delAllMsg({ data: { password: pw } }); await refresh(); } catch { toast.error("Errore"); }
            }}>Elimina tutto</Button>
          )}
        </div>
        {data.contacts.length === 0 ? <p className="text-sm text-muted-foreground">Nessun messaggio.</p> : (
          <div className="space-y-2">
            {data.contacts.map((msg) => (
              <div key={msg.id} className="rounded-2xl border border-border bg-card p-3 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold">{msg.sender_name} - <a className="text-primary underline" href={`mailto:${msg.sender_email}`}>{msg.sender_email}</a></p>
                  <Button size="sm" variant="destructive" onClick={async () => {
                    if (!confirm("Eliminare il messaggio?")) return;
                    try { await delMsg({ data: { password: pw, id: msg.id } }); await refresh(); } catch { toast.error("Errore"); }
                  }}>Elimina</Button>
                </div>
                <p className="text-xs text-muted-foreground">{new Date(msg.created_at).toLocaleString("it-IT")}</p>
                <p className="mt-1 whitespace-pre-wrap">{msg.message}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <h2 className="mr-auto text-lg font-bold">Recensioni ({reviews.length})</h2>
          <input placeholder="Cerca codice, azienda, ruolo..." aria-label="Cerca recensioni" value={search} onChange={(e) => setSearch(e.target.value)} className="h-9 w-full rounded-xl border border-border px-3 text-sm sm:w-64" />
          <select value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)} className="h-9 rounded-xl border border-border px-2 text-sm">
            <option value="all">Tutte</option><option value="yes">Verificata</option><option value="no">Non verificata</option>
          </select>
          <Button size="sm" variant="outline" onClick={() => csv(reviews.map((x) => ({ ...x, company: names.get(x.company_id) })), "recensioni.csv")}>Export CSV</Button>
        </div>
        <div className="overflow-x-auto rounded-2xl border border-border">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted"><tr>{["Codice", "Data", "Azienda", "Ruolo", "Pro", "Stato", "Verificata", "Email (hash)", ""].map((h) => <th key={h} className="p-2">{h}</th>)}</tr></thead>
            <tbody>
              {reviews.map((x) => (
                <tr key={x.id} className="border-t border-border align-top">
                  <td className="p-2 font-mono text-[11px] font-bold text-primary">{reviewCode(x.id)}</td>
                  <td className="p-2">{x.created_at.slice(0, 10)}</td>
                  <td className="p-2 font-semibold">{names.get(x.company_id)}</td>
                  <td className="p-2">{x.role}</td>
                  <td className="max-w-xs p-2">{x.pro}</td>
                  <td className="p-2">{x.status}</td>
                  <td className="p-2">{x.is_verified ? "Si" : "No"}</td>
                  <td className="p-2 font-mono">{x.email_hash ? x.email_hash.slice(0, 12) + "..." : "-"}</td>
                  <td className="whitespace-nowrap p-2">
                    <Button size="sm" variant="outline" onClick={() => run("fake_review", x.id)}>Falsa</Button>{" "}
                    <Button size="sm" variant="destructive" onClick={() => run("delete_review", x.id)}>Elimina</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center gap-2">
          <h2 className="mr-auto text-lg font-bold">Aziende</h2>
          <Button size="sm" variant="outline" onClick={() => csv(data.companies, "aziende.csv")}>Export CSV</Button>
        </div>
        <div className="overflow-x-auto rounded-2xl border border-border">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted"><tr>{["Nome", "Ragione sociale", "Citta", "Regione", "Settore", "Buoni pasto", "Valore", "Fornitore", "Welfare", ""].map((h) => <th key={h} className="p-2">{h}</th>)}</tr></thead>
            <tbody>
              {data.companies.map((c) => (
                <tr key={c.id} className="border-t border-border">
                  <td className="p-2 font-semibold">{c.name}</td><td className="p-2">{c.legal_name}</td><td className="p-2">{c.city}</td><td className="p-2">{c.region}</td><td className="p-2">{c.sector}</td>
                  <td className="p-2"><select aria-label="Buoni pasto" value={tri(c.meal_override)} onChange={(e) => setBenefit(c, { meal_override: untri(e.target.value) })} className="h-8 rounded-lg border border-border px-1"><option value="">Auto</option><option value="1">Si</option><option value="0">No</option></select></td>
                  <td className="p-2"><select aria-label="Valore" value={c.meal_value_override ?? ""} onChange={(e) => setBenefit(c, { meal_value_override: e.target.value || null })} className="h-8 rounded-lg border border-border px-1"><option value="">Auto</option>{["5", "6", "8", "10+"].map((v) => <option key={v} value={v}>{v}</option>)}</select></td>
                  <td className="p-2"><select aria-label="Fornitore" value={c.meal_provider_override ?? ""} onChange={(e) => setBenefit(c, { meal_provider_override: e.target.value || null })} className="h-8 rounded-lg border border-border px-1"><option value="">Auto</option>{["Ticket", "Pellegrini", "Day", "Up", "Sodexo", "Altro"].map((v) => <option key={v} value={v}>{v}</option>)}</select></td>
                  <td className="p-2"><select aria-label="Welfare" value={tri(c.welfare_override)} onChange={(e) => setBenefit(c, { welfare_override: untri(e.target.value) })} className="h-8 rounded-lg border border-border px-1"><option value="">Auto</option><option value="1">Si</option><option value="0">No</option></select></td>
                  <td className="p-2"><Button size="sm" variant="destructive" onClick={() => run("delete_company", c.id)}>Elimina</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <AdminSurveys password={pw} />
    </main>
  );
}
