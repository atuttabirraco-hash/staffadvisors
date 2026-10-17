import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/lib/lang";
import { businessCopy } from "@/lib/business-copy";
import type { Json } from "@/integrations/supabase/types";
import { kindCopy, type QKind } from "@/lib/survey-presets";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/staff/Header";
import { Footer } from "@/components/staff/Sections";
import { useSiteSettings } from "@/components/staff/JobOffers";
import { surveyProgressPayload } from "@/lib/survey-progress";

export const Route = createFileRoute("/sondaggio/$token")({
  head: () => ({
    meta: [
      { title: "Sondaggio anonimo per i dipendenti | StaffAdvisors" },
      { name: "description", content: "Rispondi in forma anonima al sondaggio interno della tua azienda." },
      { property: "og:title", content: "Sondaggio anonimo | StaffAdvisors" },
      { property: "og:description", content: "Rispondi in forma anonima al sondaggio della tua azienda." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SurveyPage,
});

type PublicSurvey = { title: string; company: string; mode?: "anonymous" | "individual"; started_at?: string | null; questions: { id: string; text: string; options: string[]; kind?: QKind }[] };

function SurveyPage() {
  const { token } = Route.useParams();
  const { lang } = useLang();
  const bc = businessCopy[lang];
  const kcp = kindCopy(lang);
  const settings = useSiteSettings();
  const [survey, setSurvey] = useState<PublicSurvey | null | undefined>(undefined);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [texts, setTexts] = useState<Record<string, string>>({});
  const [fullName, setFullName] = useState("");
  const [birth, setBirth] = useState("");
  const [state, setState] = useState<"" | "ok" | "already" | "error" | "identity">("");
  const [busy, setBusy] = useState(false);
  const [progressState, setProgressState] = useState<"" | "saving" | "saved" | "error">("");
  const writes = useRef<Promise<unknown>>(Promise.resolve());
  const device = () => {
    let d = localStorage.getItem("sa_device");
    if (!d) { d = crypto.randomUUID(); localStorage.setItem("sa_device", d); }
    return d;
  };

  useEffect(() => {
    void supabase.rpc("get_public_survey", { p_token: token }).then(({ data }) => setSurvey((data as PublicSurvey | null) ?? null));
  }, [token]);

  useEffect(() => {
    if (!survey || state === "ok" || state === "already") return;
    const poll = window.setInterval(() => {
      void supabase.rpc("get_public_survey", { p_token: token }).then(({ data, error }) => { if (!error && !data) setSurvey(null); });
    }, 3000);
    return () => window.clearInterval(poll);
  }, [token, survey, state]);

  useEffect(() => {
    if (!survey || busy || state === "ok" || state === "already") return;
    const payload = surveyProgressPayload(survey.questions, answers, texts);
    if (!payload.length || (survey.mode === "individual" && (fullName.trim().length < 3 || !birth))) return;
    const timer = window.setTimeout(() => {
      setProgressState("saving");
      writes.current = writes.current.catch(() => undefined).then(async () => {
        const { data, error } = await supabase.rpc("save_survey_progress", { p_token: token, p_device: device(), p_answers: payload as Json, p_name: fullName.trim(), p_birth: birth, p_complete: false });
        if (data === "not_found") setSurvey(null);
        else if (data === "already") setState("already");
        else setProgressState(!error && data === "ok" ? "saved" : "error");
      }).catch(() => setProgressState("error"));
    }, 250);
    return () => window.clearTimeout(timer);
  }, [survey, answers, texts, fullName, birth, token, busy, state]);

  const submit = async () => {
    if (!survey || survey.questions.some((q) => q.kind !== "open" && answers[q.id] === undefined)) return setState("error");
    if (survey.mode === "individual" && (fullName.trim().length < 3 || !birth)) return setState("identity");
    setBusy(true);
    await writes.current;
    const payload = surveyProgressPayload(survey.questions, answers, texts);
    const { data } = await supabase.rpc("submit_survey", { p_token: token, p_device: device(), p_answers: payload as Json, p_name: fullName.trim() || null, p_birth: birth || null });
    setBusy(false);
    if (data === "not_found") { setSurvey(null); return; }
    setState(data === "ok" ? "ok" : data === "already" ? "already" : data === "invalid" ? "identity" : "error");
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="border-b border-border bg-card px-4 py-4"><div className="mx-auto max-w-2xl"><Logo /></div></div>
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10">
        {settings.data && !settings.data.business_area_enabled ? <p className="text-muted-foreground">{bc.notFound}</p> : survey === undefined ? null : survey === null ? <p className="text-muted-foreground">{bc.notFound}</p> : state === "ok" || state === "already" ? (
          <p className="rounded-2xl border border-border bg-card p-6 text-foreground">{state === "ok" ? (survey.mode === "individual" ? bc.thanksInd : bc.thanks) : bc.already}</p>
        ) : (
          <>
            <p className="text-sm font-semibold text-primary">{survey.company}</p>
            <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-foreground">{survey.title}</h1>
            {survey.started_at && <p className="mt-1 text-xs text-muted-foreground">{bc.startedOn} {new Date(survey.started_at).toLocaleDateString(lang)}</p>}
            <p className="mt-3 flex items-start gap-2 rounded-xl bg-primary-soft p-3 text-sm text-foreground"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {survey.mode === "individual" ? bc.survInd : bc.survAnon}</p>
            <p className="mt-2 text-xs text-muted-foreground">{bc.partialNotice}</p>
            {survey.mode === "individual" && (
              <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-border bg-card p-5">
                <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">{bc.fullName}
                  <input value={fullName} maxLength={120} onChange={(e) => setFullName(e.target.value)} className="rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40" />
                </label>
                <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">{bc.birthDate}
                  <input type="date" value={birth} max={new Date().toISOString().slice(0, 10)} onChange={(e) => setBirth(e.target.value)} className="rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40" />
                </label>
              </div>
            )}
            <div className="mt-6 flex flex-col gap-5">
              {survey.questions.map((q) => (
                <fieldset key={q.id} className="rounded-2xl border border-border bg-card p-5">
                  <legend className="px-1 font-semibold text-foreground">{q.text}{q.kind === "open" && <span className="ml-1 text-xs font-normal text-muted-foreground">({kcp.optional})</span>}</legend>
                  {q.kind === "open" ? (
                    <textarea rows={4} maxLength={2000} placeholder={kcp.openPh} value={texts[q.id] ?? ""} onChange={(e) => setTexts({ ...texts, [q.id]: e.target.value })}
                      className="mt-2 w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40" />
                  ) : (
                    <div className={`mt-2 flex gap-2 ${q.kind === "yesno" || q.kind === "scale" ? "flex-row flex-wrap" : "flex-col"}`}>
                      {q.options.map((o, i) => (
                        <label key={i} className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm ${q.kind === "scale" || q.kind === "yesno" ? "flex-1 justify-center" : ""} ${answers[q.id] === i ? "border-primary bg-primary-soft" : "border-input"}`}>
                          <input type="radio" name={q.id} checked={answers[q.id] === i} onChange={() => setAnswers({ ...answers, [q.id]: i })} className="accent-primary" /> {o}
                        </label>
                      ))}
                    </div>
                  )}
                </fieldset>
              ))}
            </div>
            {state === "error" && <p className="mt-4 text-sm font-medium text-destructive">{bc.answerAll}</p>}
            {state === "identity" && <p className="mt-4 text-sm font-medium text-destructive">{bc.identityRequired}</p>}
            {progressState && <p role="status" className={`mt-4 text-xs ${progressState === "error" ? "text-destructive" : "text-muted-foreground"}`}>{progressState === "saving" ? bc.progressSaving : progressState === "saved" ? bc.progressSaved : bc.progressError}</p>}
            <Button variant="hero" size="lg" className="mt-6 w-full" disabled={busy || survey.questions.length === 0} onClick={() => void submit()}>{bc.send}</Button>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
