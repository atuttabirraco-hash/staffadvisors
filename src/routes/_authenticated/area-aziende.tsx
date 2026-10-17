import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Briefcase, Copy, Plus, Trash2, FolderDown, Folder, FolderOpen, ShieldCheck, HelpCircle, Sparkles, Loader2, Play, Pause, Square, ChevronDown, QrCode } from "lucide-react";
import QRCode from "qrcode";
import JSZip from "jszip";
import { buildSurveyReport } from "@/lib/survey-report.functions";
import { surveyHtmlReport } from "@/lib/survey-html-report";
import { surveyPresets, kindCopy, kindOptions, QKINDS, type QKind } from "@/lib/survey-presets";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/lib/lang";
import { businessCopy } from "@/lib/business-copy";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/staff/Header";
import { Footer } from "@/components/staff/Sections";
import { useSiteSettings } from "@/components/staff/JobOffers";
import { DeleteAccountSection } from "@/components/staff/DeleteAccountSection";
import { BusinessReviews } from "@/components/staff/BusinessReviews";

export const Route = createFileRoute("/_authenticated/area-aziende")({
  head: () => ({
    meta: [
      { title: "Area aziende | StaffAdvisors" },
      { name: "description", content: "Gestisci i sondaggi anonimi per i tuoi dipendenti e pubblica offerte di lavoro." },
      { property: "og:title", content: "Area aziende | StaffAdvisors" },
      { property: "og:description", content: "Sondaggi interni anonimi e offerte di lavoro." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: BusinessArea,
});

type SurveyMode = "anonymous" | "individual";
type SurveyStatus = "draft" | "active" | "paused" | "ended";
type Survey = { id: string; title: string; token: string; is_active: boolean; mode: SurveyMode; status: SurveyStatus; started_at: string | null; ended_at: string | null; created_at: string };
type Q = { id?: string; text: string; optionsText: string; kind: QKind };
const inputCls = "w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40";

function BusinessArea() {
  const { lang } = useLang();
  const bc = businessCopy[lang];
  const { user } = Route.useRouteContext();
  const settings = useSiteSettings();
  const [company, setCompany] = useState<string | null | undefined>(undefined);
  const [nameInput, setNameInput] = useState("");
  const [showGuide, setShowGuide] = useState(false);
  useEffect(() => {
    try { if (!localStorage.getItem("sa_biz_guide_seen")) setShowGuide(true); } catch { /* noop */ }
  }, []);
  const closeGuide = () => {
    setShowGuide(false);
    try { localStorage.setItem("sa_biz_guide_seen", "1"); } catch { /* noop */ }
  };
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [newMode, setNewMode] = useState<SurveyMode>("anonymous");
  const [err, setErr] = useState("");
  const [pending, setPending] = useState(0);

  const loadSurveys = async () => {
    const { data } = await supabase.from("surveys").select("id,title,token,is_active,mode,status,started_at,ended_at,created_at").order("created_at", { ascending: false });
    setSurveys((data ?? []) as Survey[]);
    const { count } = await supabase.from("survey_responses").select("id", { count: "exact", head: true });
    setPending(count ?? 0);
  };

  useEffect(() => {
    void (async () => {
      const { data } = await supabase.from("company_accounts").select("company_name").eq("user_id", user.id).maybeSingle();
      if (data) { setCompany(data.company_name); void loadSurveys(); return; }
      const metaName = String(user.user_metadata?.["company_name"] ?? "").trim();
      if (user.user_metadata?.["account_type"] === "business" && metaName.length >= 2) {
        const { error } = await supabase.from("company_accounts").insert({ user_id: user.id, company_name: metaName });
        if (!error) { setCompany(metaName); void loadSurveys(); return; }
      }
      setCompany(null);
    })();
  }, [user.id]);

  const saveCompany = async () => {
    setErr("");
    const { error } = await supabase.from("company_accounts").insert({ user_id: user.id, company_name: nameInput.trim() });
    if (error) return setErr(bc.error);
    setCompany(nameInput.trim());
  };

  const createSurvey = async () => {
    setErr("");
    if (pending > 0) return setErr(bc.mustExport);
    const { data: s, error } = await supabase.from("surveys").insert({ title: newTitle.trim(), owner_id: user.id, mode: newMode, status: "draft" }).select("id").single();
    if (error || !s) return setErr(bc.error);
    await supabase.from("survey_questions").insert(surveyPresets(lang).map((q, i) => ({ survey_id: s.id, text: q.text, options: q.options, kind: q.kind, position: i })));
    setNewTitle("");
    setNewMode("anonymous");
    void loadSurveys();
  };

  if (settings.data && !settings.data.business_area_enabled) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <div className="border-b border-border bg-card px-4 py-4"><div className="mx-auto max-w-5xl"><Logo /></div></div>
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
          <p className="rounded-2xl border border-border bg-card p-6 text-muted-foreground">{bc.areaDisabled}</p>
          <DeleteAccountSection />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="border-b border-border bg-card px-4 py-4"><div className="mx-auto max-w-5xl"><Logo /></div></div>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">{bc.areaTitle}{company ? ` · ${company}` : ""}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{bc.areaSub}</p>
        <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground"><ShieldCheck className="h-4 w-4 text-primary" /> {bc.anonNote}</p>
        <button onClick={() => (showGuide ? closeGuide() : setShowGuide(true))} className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
          <HelpCircle className="h-4 w-4" /> {bc.guideOpen}
        </button>
        {showGuide && (
          <div className="mt-4 rounded-2xl border border-primary/30 bg-primary-soft p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-bold text-foreground">{bc.guideOpen}</h2>
              <Button variant="outline" size="sm" onClick={closeGuide}>{bc.guideClose}</Button>
            </div>
            <div className="mt-3 flex flex-col gap-3">
              {bc.guideSteps.map((s) => (
                <div key={s.t}>
                  <p className="text-sm font-semibold text-foreground">{s.t}</p>
                  <p className="text-sm text-muted-foreground">{s.d}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        {err && <p className="mt-4 text-sm font-medium text-destructive">{err}</p>}

        {company === null && (
          <div className="mt-8 max-w-md rounded-2xl border border-border bg-card p-6">
            <h2 className="font-bold text-foreground">{bc.setupTitle}</h2>
            <label className="mt-4 flex flex-col gap-1.5 text-sm font-medium">{bc.companyName}
              <input value={nameInput} maxLength={120} onChange={(e) => setNameInput(e.target.value)} className={inputCls} />
            </label>
            <Button variant="hero" className="mt-4" disabled={nameInput.trim().length < 2} onClick={() => void saveCompany()}>{bc.save}</Button>
          </div>
        )}

        {company && (
          <>
            <div className="mt-8 flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
              <div><p className="font-bold text-foreground">{bc.postOffer}</p><p className="text-sm text-muted-foreground">{bc.postOfferSub}</p></div>
              <Button asChild variant="outline"><Link to="/pubblica-offerta"><Briefcase className="h-4 w-4" /> {bc.postOffer}</Link></Button>
            </div>
            <BusinessReviews />
            <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-border bg-card p-5">
              <input placeholder={bc.surveyTitle} value={newTitle} maxLength={150} onChange={(e) => setNewTitle(e.target.value)} className={inputCls} />
              <div>
                <p className="text-xs font-medium text-muted-foreground">{bc.surveyMode}</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {(["anonymous", "individual"] as const).map((m) => (
                    <button key={m} type="button" onClick={() => setNewMode(m)}
                      className={`rounded-full border px-3 py-1 text-xs font-semibold ${newMode === m ? "border-primary bg-primary-soft text-primary" : "border-input text-muted-foreground hover:border-primary/50"}`}>
                      {m === "anonymous" ? bc.modeAnon : bc.modeInd}
                    </button>
                  ))}
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground">{newMode === "anonymous" ? bc.modeAnonHint : bc.modeIndHint}</p>
              </div>
              <Button variant="hero" className="sm:self-start" disabled={newTitle.trim().length < 2 || pending > 0} onClick={() => void createSurvey()}><Plus className="h-4 w-4" /> {bc.newSurvey}</Button>
            </div>
            {pending > 0 && <p className="mt-2 text-sm font-medium text-primary">{bc.mustExport}</p>}
            <div className="mt-6 flex flex-col gap-6">
              {surveys.map((s) => <SurveyCard key={s.id} survey={s} onChanged={loadSurveys} companyName={company} />)}
            </div>
          </>
        )}
        <DeleteAccountSection />
      </main>
      <Footer />
    </div>
  );
}

function SurveyCard({ survey, onChanged, companyName }: { survey: Survey; onChanged: () => Promise<void>; companyName: string | null }) {
  const { lang } = useLang();
  const bc = businessCopy[lang];
  const kcp = kindCopy(lang);
  const [qs, setQs] = useState<Q[]>([]);
  const [counts, setCounts] = useState<Record<string, number[]>>({});
  const [texts, setTexts] = useState<Record<string, string[]>>({});
  const [total, setTotal] = useState(0);
  const [respondents, setRespondents] = useState<{ name: string; birth: string | null }[]>([]);
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState("");
  const [dirty, setDirty] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [statusBusy, setStatusBusy] = useState(false);
  const resultsRef = useRef<HTMLHeadingElement>(null);
  const qrRef = useRef<HTMLCanvasElement>(null);

  const load = async () => {
    const { data: q } = await supabase.from("survey_questions").select("id,text,options,position,kind").eq("survey_id", survey.id).order("position");
    setQs((q ?? []).map((x) => ({ id: x.id, text: x.text, optionsText: x.options.join("\n"), kind: x.kind as QKind })));
    const { count } = await supabase.from("survey_responses").select("id", { count: "exact", head: true }).eq("survey_id", survey.id);
    setTotal(count ?? 0);
    if (survey.mode === "individual") {
      const { data: rs } = await supabase.from("survey_responses").select("respondent_name,respondent_birth").eq("survey_id", survey.id).order("created_at");
      setRespondents((rs ?? []).map((r) => ({ name: r.respondent_name ?? "", birth: r.respondent_birth })));
    }
    const ids = (q ?? []).map((x) => x.id);
    const c: Record<string, number[]> = {};
    const t: Record<string, string[]> = {};
    (q ?? []).forEach((x) => { c[x.id] = x.options.map(() => 0); t[x.id] = []; });
    if (ids.length) {
      const { data: a } = await supabase.from("survey_answers").select("question_id,option_index,text_answer").in("question_id", ids);
      (a ?? []).forEach((r) => {
        if (r.text_answer) { t[r.question_id]?.push(r.text_answer); return; }
        const arr = c[r.question_id]; if (arr && r.option_index < arr.length) arr[r.option_index] = (arr[r.option_index] ?? 0) + 1;
      });
    }
    setCounts(c);
    setTexts(t);
  };
  useEffect(() => { void load(); }, [survey.id]);

  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(""), 2500); };
  const link = typeof window !== "undefined" ? `${window.location.origin}/sondaggio/${survey.token}` : "";

  useEffect(() => {
    if (showQr && qrRef.current && link) void QRCode.toCanvas(qrRef.current, link, { width: 160, margin: 1 });
  }, [showQr, link]);

  const saveQuestions = async () => {
    const rows = qs.map((q, i) => ({ text: q.text.trim(), kind: q.kind, options: q.kind === "choice" ? q.optionsText.split("\n").map((o) => o.trim()).filter(Boolean) : (kindOptions(q.kind, lang) ?? []), position: i, id: q.id }));
    if (rows.some((r) => r.text.length < 2 || (r.kind === "choice" && (r.options.length < 2 || r.options.length > 8)))) return flash(bc.error);
    const keep = rows.filter((r) => r.id).map((r) => r.id as string);
    const old = Object.keys(counts).filter((id) => !keep.includes(id));
    if (old.length) await supabase.from("survey_questions").delete().in("id", old);
    for (const r of rows) {
      const { error } = r.id
        ? await supabase.from("survey_questions").update({ text: r.text, options: r.options, position: r.position, kind: r.kind }).eq("id", r.id)
        : await supabase.from("survey_questions").insert({ survey_id: survey.id, text: r.text, options: r.options, position: r.position, kind: r.kind });
      if (error) return flash(bc.error);
    }
    setDirty(false);
    flash(bc.saved);
    void load();
  };

  const [zip, setZip] = useState<Blob | null>(null);
  const [busy, setBusy] = useState(false);
  const [summary, setSummary] = useState("");
  const [summaryError, setSummaryError] = useState(false);
  const [summarySource, setSummarySource] = useState<"ai" | "local">("local");
  const prepare = async () => {
    if (busy) return;
    setBusy(true);
    setSummaryError(false);
    try {
      const r = await buildSurveyReport({ data: { surveyId: survey.id, lang } });
      setSummary(r.summary);
      setSummarySource(r.summarySource);
      setSummaryError(!r.summary.trim());
      const esc = (v: string | number | undefined) => `"${String(v).replace(/"/g, '""')}"`;
      const csv = ["\uFEFF" + ["Domanda", "Tipo", "Risposta", "Voti", "%"].map(esc).join(";")]
        .concat(r.questions.flatMap((q) => q.kind === "open"
          ? q.texts.map((t) => [q.text, kcp.kinds.open, t, "", ""].map(esc).join(";"))
          : q.options.map((o) => [q.text, kcp.kinds[q.kind], o.label, o.count, o.pct].map(esc).join(";")))).join("\n");
      const report = `${r.title}\n${new Date(r.generatedAt).toLocaleString()}\n${r.total} ${bc.responses}\n\n` +
        (r.respondents.length ? `${bc.respondents}:\n` + r.respondents.map((p) => `  - ${p.name}${p.birth ? ` (${p.birth})` : ""}`).join("\n") + "\n\n" : "") +
        r.questions.map((q) => `${q.text} [${kcp.kinds[q.kind]}]\n` + (q.kind === "open"
          ? q.texts.map((t) => `  - "${t}"`).join("\n")
          : q.options.map((o) => `  - ${o.label}: ${o.count} (${o.pct}%)`).join("\n"))).join("\n\n");
      const z = new JSZip();
      const folder = z.folder(`sondaggio-${survey.title.replace(/[^\w-]+/g, "_").slice(0, 40)}`);
      if (!folder) throw new Error("zip_folder_unavailable");
      folder.file("risultati.csv", csv);
      folder.file("riepilogo.txt", report);
      folder.file("sintesi.txt", r.summary || "-");
      folder.file("risultati.html", surveyHtmlReport({
        title: r.title, company: companyName, lang, total: r.total, generatedAt: r.generatedAt,
        mode: survey.mode === "individual" ? bc.modeInd : bc.modeAnon,
        respondents: r.respondents, questions: r.questions, summary: r.summary,
        labels: { results: bc.results, responses: bc.responses, respondents: bc.respondents, aiSummary: r.summarySource === "ai" ? bc.aiSummary : bc.localSummary },
      }));
      if (r.respondents.length) folder.file("partecipanti.txt", r.respondents.map((p) => `${p.name}${p.birth ? ` · ${p.birth}` : ""}`).join("\n"));
      setZip(await z.generateAsync({ type: "blob" }));
    } catch { setSummaryError(true); flash(bc.error); }
    finally { setBusy(false); }
  };
  const downloadAndClear = async () => {
    if (!zip) return;
    const url = URL.createObjectURL(zip);
    const a = document.createElement("a");
    a.href = url; a.download = `risultati-${survey.title.replace(/[^\w-]+/g, "_").slice(0, 40)}.zip`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30_000);
    setZip(null);
    const { error } = await supabase.from("survey_responses").delete().eq("survey_id", survey.id);
    if (error) return flash(bc.error);
    flash(bc.exported);
    void load();
    void onChanged();
  };
  const del = async () => {
    if (!window.confirm(bc.deleteConfirm)) return;
    await supabase.from("surveys").delete().eq("id", survey.id);
    void onChanged();
  };
  const setStatus = async (status: SurveyStatus) => {
    if (statusBusy) return;
    setStatusBusy(true);
    try {
    if (status === "ended") {
      if (!window.confirm(bc.endConfirm)) return;
      const { data, error } = await supabase.rpc("end_company_survey", { p_survey_id: survey.id });
      if (error || !data) return flash(bc.error);
      setZip(null);
      setSummary("");
      setSummaryError(false);
      setShowQr(false);
      setOpen(true);
      await load();
      await onChanged();
      requestAnimationFrame(() => resultsRef.current?.scrollIntoView({ block: "start", behavior: "auto" }));
      return;
    }
    const patch: { status: SurveyStatus; is_active?: boolean; started_at?: string; ended_at?: string | null } = { status };
    if (status === "active") { patch.is_active = true; if (!survey.started_at) patch.started_at = new Date().toISOString(); patch.ended_at = null; }
    if (status === "paused") patch.is_active = false;
    const { error } = await supabase.from("surveys").update(patch).eq("id", survey.id);
    if (error) return flash(bc.error);
    await onChanged();
    } finally { setStatusBusy(false); }
  };

  const statusLabel = survey.status === "active" ? bc.active : survey.status === "paused" ? bc.paused : survey.status === "ended" ? bc.ended : bc.draft;
  const dateStr = (d: string | null) => (d ? new Date(d).toLocaleDateString(lang) : "");

  return (
    <section className="rounded-2xl border border-border bg-card shadow-sm">
      <button type="button" onClick={() => setOpen(!open)} className="flex w-full flex-wrap items-center justify-between gap-2 p-5 text-start">
        <span className="flex min-w-0 items-center gap-3">
          {open ? <FolderOpen className="h-6 w-6 shrink-0 text-primary" /> : <Folder className="h-6 w-6 shrink-0 text-primary" />}
          <span className="min-w-0">
            <span className="block truncate text-lg font-bold text-foreground">{survey.title}</span>
            <span className="block text-xs text-muted-foreground">
              {survey.mode === "individual" ? bc.modeInd : bc.modeAnon}
              {survey.started_at ? ` · ${bc.startedOn} ${dateStr(survey.started_at)}` : ""}
              {survey.ended_at ? ` · ${bc.endedOn} ${dateStr(survey.ended_at)}` : ""}
              {` · ${total} ${bc.responses}`}
            </span>
          </span>
        </span>
        <span className="flex items-center gap-2">
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${survey.status === "active" ? "bg-primary-soft text-primary" : "bg-muted text-muted-foreground"}`}>{statusLabel}</span>
          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
        </span>
      </button>
      {open && <div className="border-t border-border p-5">
      <div className="flex flex-wrap gap-2" inert={statusBusy} aria-busy={statusBusy}>
        {survey.status === "draft" && <Button variant="hero" size="sm" onClick={() => void setStatus("active")}><Play className="h-4 w-4" /> {bc.start}</Button>}
        {survey.status === "active" && <Button variant="outline" size="sm" onClick={() => void setStatus("paused")}><Pause className="h-4 w-4" /> {bc.pause}</Button>}
        {survey.status === "paused" && <Button variant="hero" size="sm" onClick={() => void setStatus("active")}><Play className="h-4 w-4" /> {bc.start}</Button>}
        {(survey.status === "active" || survey.status === "paused") && <Button variant="outline" size="sm" onClick={() => void setStatus("ended")}><Square className="h-4 w-4" /> {bc.end}</Button>}
        <Button variant="hero" size="sm" disabled={survey.status !== "active"} onClick={() => { void navigator.clipboard.writeText(link); flash(bc.copied); }}><Copy className="h-4 w-4" /> {bc.copyLink}</Button>
        <Button variant="outline" size="sm" disabled={survey.status !== "active"} onClick={() => setShowQr(!showQr)}><QrCode className="h-4 w-4" /> QR</Button>
        {total > 0 && !zip && <Button variant="outline" size="sm" disabled={busy} onClick={() => void prepare()}><FolderDown className="h-4 w-4" /> {busy ? bc.preparing : bc.exportBtn}</Button>}
        {zip && <Button variant="hero" size="sm" onClick={() => void downloadAndClear()}><FolderDown className="h-4 w-4" /> {bc.downloadNow}</Button>}
        <Button variant="outline" size="sm" onClick={() => void del()}><Trash2 className="h-4 w-4" /> {bc.deleteSurvey}</Button>
      </div>
      <p className="mt-2 break-all text-xs text-muted-foreground">{link}</p>
      {showQr && (
        <div className="mt-3 inline-flex flex-col items-center gap-2 rounded-xl border border-border bg-background p-3">
          <canvas ref={qrRef} className="h-40 w-40" />
          <p className="max-w-44 text-center text-xs text-muted-foreground">{bc.qrHint}</p>
        </div>
      )}
      {msg && <p className="mt-2 text-sm font-medium text-primary">{msg}</p>}

      {survey.mode === "individual" && respondents.length > 0 && (
        <div className="mt-4 rounded-xl border border-border bg-muted/40 p-3">
          <p className="text-xs font-semibold text-foreground">{bc.respondents} ({respondents.length})</p>
          <ul className="mt-1 flex flex-col gap-0.5">
            {respondents.map((r, i) => <li key={i} className="text-xs text-muted-foreground">{r.name}{r.birth ? ` · ${new Date(r.birth).toLocaleDateString(lang)}` : ""}</li>)}
          </ul>
        </div>
      )}

      <h3 className="mt-5 font-semibold text-foreground">{bc.questions}</h3>
      <div className="mt-2 flex flex-col gap-3">
        {qs.map((q, i) => (
          <div key={q.id ?? `n${i}`} className="rounded-xl border border-border p-3">
            <input placeholder={bc.question} value={q.text} maxLength={300} onChange={(e) => { setDirty(true); setQs(qs.map((x, j) => j === i ? { ...x, text: e.target.value } : x)); }} className={inputCls} />
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">{kcp.label}:</span>
              {QKINDS.map((k) => (
                <button key={k} type="button" onClick={() => { setDirty(true); setQs(qs.map((x, j) => j === i ? { ...x, kind: k, optionsText: k === "choice" ? (x.kind === "choice" ? x.optionsText : "") : (kindOptions(k, lang) ?? []).join("\n") } : x)); }}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold ${q.kind === k ? "border-primary bg-primary-soft text-primary" : "border-input text-muted-foreground hover:border-primary/50"}`}>
                  {kcp.kinds[k]}
                </button>
              ))}
            </div>
            {q.kind === "choice" && <textarea rows={4} placeholder={bc.options} value={q.optionsText} onChange={(e) => { setDirty(true); setQs(qs.map((x, j) => j === i ? { ...x, optionsText: e.target.value } : x)); }} className={`${inputCls} mt-2`} />}
            {(q.kind === "yesno" || q.kind === "scale") && <p className="mt-2 text-xs text-muted-foreground">{(kindOptions(q.kind, lang) ?? []).join(" · ")}</p>}
            {q.kind === "open" && <p className="mt-2 text-xs text-muted-foreground">{kcp.openPh}</p>}
            <button onClick={() => { setDirty(true); setQs(qs.filter((_, j) => j !== i)); }} className="mt-1 block text-xs font-medium text-destructive hover:underline">{bc.remove}</button>
          </div>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => { setDirty(true); setQs([...qs, { text: "", optionsText: "", kind: "choice" }]); }}><Plus className="h-4 w-4" /> {bc.addQuestion}</Button>
        <Button variant="hero" size="sm" onClick={() => void saveQuestions()}>{bc.saveQuestions}</Button>
        {dirty && <p className="text-sm font-medium text-primary">{bc.unsaved}</p>}
      </div>

      <h3 ref={resultsRef} className="mt-6 scroll-mt-6 font-semibold text-foreground">{bc.results} · {total} {bc.responses}</h3>
      {total === 0 ? <p className="mt-1 text-sm text-muted-foreground">{bc.noResponses}</p> : (
        <div className="mt-2 flex flex-col gap-4">
          {qs.filter((q) => q.id).map((q) => {
            if (q.kind === "open") {
              const list = texts[q.id as string] ?? [];
              return (
                <div key={q.id}>
                  <p className="text-sm font-medium text-foreground">{q.text}</p>
                  <p className="text-xs text-muted-foreground">{kcp.openAnswers}: {list.length}</p>
                  <ul className="mt-1 flex max-h-64 flex-col gap-1 overflow-y-auto">
                    {list.map((t, k) => <li key={k} className="rounded-lg bg-muted px-3 py-2 text-sm text-foreground">{t}</li>)}
                  </ul>
                </div>
              );
            }
            const c = counts[q.id as string] ?? [];
            const sum = c.reduce((a, b) => a + b, 0) || 1;
            return (
              <div key={q.id}>
                <p className="text-sm font-medium text-foreground">{q.text}</p>
                {q.optionsText.split("\n").filter(Boolean).map((o, k) => (
                  <div key={k} className="mt-1">
                    <div className="flex justify-between text-xs text-muted-foreground"><span>{o}</span><span>{c[k] ?? 0} ({Math.round(((c[k] ?? 0) / sum) * 100)}%)</span></div>
                    <div className="h-2 rounded-full bg-muted"><div className="h-2 rounded-full bg-primary" style={{ width: `${((c[k] ?? 0) / sum) * 100}%` }} /></div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}
      {(total > 0 || summary || busy || summaryError) && (
        <div className="mt-6 border-t border-border pt-5" aria-busy={busy}>
          <h3 className="flex items-center gap-2 font-semibold text-foreground">
            <Sparkles className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" /> {summarySource === "ai" ? bc.aiSummary : bc.localSummary}
          </h3>
          <div className="mt-3 rounded-xl border border-primary/20 bg-primary-soft p-4 sm:p-5" aria-live="polite">
            {busy ? (
              <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 shrink-0 animate-spin motion-reduce:animate-none" aria-hidden="true" /> {bc.summaryLoading}
              </p>
            ) : summary ? (
              <p dir="auto" className="whitespace-pre-wrap break-words text-sm leading-7 text-foreground [overflow-wrap:anywhere]">{summary}</p>
            ) : null}
            {!busy && summaryError && <p role="alert" className="mb-3 text-sm text-destructive">{bc.summaryUnavailable}</p>}
            {!busy && !summary && total > 0 && (
              <Button variant="outline" className="h-auto min-h-10 max-w-full whitespace-normal" onClick={() => void prepare()}>
                <Sparkles className="h-4 w-4 shrink-0" aria-hidden="true" /> {bc.generateSummary}
              </Button>
            )}
          </div>
        </div>
      )}
      </div>}
    </section>
  );
}
