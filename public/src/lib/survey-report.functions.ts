import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { localSurveySummary } from "./survey-summary";

const LANGS = ["it", "en", "es", "fr", "de", "pt", "pl", "ar"];

// Builds aggregated (anonymous) results + a summary for one survey owned by the caller.
// The summary is the AI one when the admin switch is on and the call works; otherwise it is
// computed locally on the collected data, so the company always gets a readable synthesis.
export const buildSurveyReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ surveyId: z.string().uuid(), lang: z.string().max(5) }).parse(d))
  .handler(async ({ data, context }) => {
    const sb = context.supabase;
    const { data: survey } = await sb.from("surveys").select("id,title,owner_id,mode").eq("id", data.surveyId).maybeSingle();
    if (!survey || survey.owner_id !== context.userId) throw new Error("not_found");
    const { data: qs } = await sb.from("survey_questions").select("id,text,options,position,kind").eq("survey_id", survey.id).order("position");
    const { count } = await sb.from("survey_responses").select("id", { count: "exact", head: true }).eq("survey_id", survey.id);
    let respondents: { name: string; birth: string | null }[] = [];
    if (survey.mode === "individual") {
      const { data: rs } = await sb.from("survey_responses").select("respondent_name,respondent_birth").eq("survey_id", survey.id).order("created_at");
      respondents = (rs ?? []).map((r) => ({ name: r.respondent_name ?? "", birth: r.respondent_birth }));
    }
    const ids = (qs ?? []).map((q) => q.id);
    const { data: ans } = ids.length ? await sb.from("survey_answers").select("question_id,option_index,text_answer").in("question_id", ids) : { data: [] };
    const questions = (qs ?? []).map((q) => {
      const c = q.options.map(() => 0);
      const texts: string[] = [];
      (ans ?? []).forEach((a) => {
        if (a.question_id !== q.id) return;
        if (a.text_answer) { texts.push(a.text_answer); return; }
        if (a.option_index < c.length) c[a.option_index] = (c[a.option_index] ?? 0) + 1;
      });
      const sum = c.reduce((x, y) => x + y, 0) || 1;
      return { text: q.text, kind: q.kind as "yesno" | "scale" | "choice" | "open", texts, options: q.options.map((o, i) => ({ label: o, count: c[i] ?? 0, pct: Math.round(((c[i] ?? 0) / sum) * 100) })) };
    });
    const total = count ?? 0;
    const lang = LANGS.includes(data.lang) ? data.lang : "it";
    const dateLabel = new Intl.DateTimeFormat(lang, { day: "numeric", month: "long", year: "numeric" }).format(new Date());
    const local = localSurveySummary({
      title: survey.title, total, mode: survey.mode, lang, dateLabel, questions,
      respondentNames: respondents.map((r) => r.name),
    });

    let summary = "";
    let summarySource: "ai" | "local" = "local";
    const { data: st } = await sb.from("app_settings").select("survey_ai_enabled").eq("id", 1).maybeSingle();
    const key = process.env["LOVABLE_API_KEY"];
    if (key && total > 0 && (st?.survey_ai_enabled ?? true)) {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
        method: "POST",
        headers: { "Lovable-API-Key": key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", "X-Lovable-AIG-SDK": "fetch" },
        body: JSON.stringify({
          model: "openai/gpt-6-astra",
          stream: true,
          store: false,
          reasoning: { effort: "low" },
          instructions: `You are an HR analyst. Write a detailed, practical summary of an anonymous internal employee survey, in the language with code "${data.lang}". Sections: overview, strengths, critical issues, concrete improvement actions, what to monitor in the next survey. Plain text, no markdown tables. Questions may be yes/no, 1-5 scores, multiple choice or open text answers (in 'texts'); summarize recurring themes of open answers without quoting anything that could identify a person. Never guess identities.`,
          input: JSON.stringify({ title: survey.title, responses: total, questions }),
        }),
      }).catch(() => null);
      if (res && res.ok && res.body) {
        const reader = res.body.getReader();
        const dec = new TextDecoder();
        let buf = "";
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += dec.decode(value, { stream: true });
          let i: number;
          while ((i = buf.indexOf("\n")) >= 0) {
            const line = buf.slice(0, i).trim();
            buf = buf.slice(i + 1);
            if (!line.startsWith("data:")) continue;
            try {
              const ev = JSON.parse(line.slice(5)) as { type?: string; delta?: string };
              if (ev.type === "response.output_text.delta" && ev.delta) summary += ev.delta;
            } catch { /* partial or non-JSON frame */ }
          }
        }
      } else {
        console.error("AI summary failed", res ? res.status : "no response");
      }
      if (summary.trim()) summarySource = "ai";
    }
    if (!summary.trim()) { summary = local; summarySource = "local"; }
    return { title: survey.title, total, questions, summary, summarySource, respondents, generatedAt: new Date().toISOString() };
  });
