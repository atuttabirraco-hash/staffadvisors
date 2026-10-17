import { describe, it } from "node:test";
import { strict as assert } from "node:assert";
import { surveyHtmlReport } from "./survey-html-report";

const base = {
  title: "Sondaggio «Diego il mito»",
  company: "À Tutto Birra",
  lang: "it",
  mode: "Anonimo",
  total: 3,
  generatedAt: "2026-10-17T07:00:00.000Z",
  respondents: [] as { name: string; birth: string | null }[],
  summary: "Clima positivo. Da monitorare la comunicazione interna.",
  labels: { results: "Risultati", responses: "risposte", respondents: "Partecipanti", aiSummary: "Sintesi AI" },
  questions: [
    {
      text: "Consiglieresti l'azienda come buon posto di lavoro?",
      kind: "yesno" as const,
      texts: [],
      options: [
        { label: "Sì", count: 2, pct: 67 },
        { label: "No", count: 1, pct: 33 },
      ],
    },
    {
      text: "Suggerimenti <aperti>",
      kind: "open" as const,
      texts: ['Più pause "<pomeridiane>"'],
      options: [],
    },
  ],
};

describe("surveyHtmlReport", () => {
  it("includes title, counts, options, percentages and summary", () => {
    const html = surveyHtmlReport(base);
    assert.ok(html.includes("Sondaggio «Diego il mito»"));
    assert.ok(html.includes("À Tutto Birra"));
    assert.ok(html.includes("3 risposte"));
    assert.ok(html.includes("Consiglieresti l&#39;azienda come buon posto di lavoro?"));
    assert.ok(html.includes("67%"));
    assert.ok(html.includes("Sintesi AI"));
    assert.ok(html.includes("Clima positivo"));
    assert.ok(html.includes("viewport"));
  });

  it("escapes HTML in answers and open texts", () => {
    const html = surveyHtmlReport(base);
    assert.ok(html.includes("Suggerimenti &lt;aperti&gt;"));
    assert.ok(html.includes("&quot;&lt;pomeridiane&gt;&quot;"));
    assert.ok(!html.includes("<pomeridiane>"));
    assert.ok(!html.includes("<script"));
  });

  it("lists individual respondents with localized birth dates", () => {
    const html = surveyHtmlReport({ ...base, respondents: [{ name: "Maria Rossi", birth: "1990-05-04" }] });
    assert.ok(html.includes("Maria Rossi"));
    assert.ok(html.includes("04/05/1990"));
  });
});
