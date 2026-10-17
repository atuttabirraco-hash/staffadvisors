import { test } from "node:test";
import assert from "node:assert/strict";
import { localSurveySummary } from "./survey-summary";

const questions = [
  { text: "Siete soddisfatti del turno?", kind: "scale" as const, texts: [], options: [
    { label: "1", count: 0, pct: 0 }, { label: "2", count: 0, pct: 0 }, { label: "3", count: 0, pct: 0 },
    { label: "4", count: 2, pct: 20 }, { label: "5", count: 8, pct: 80 },
  ] },
  { text: "Lo stipendio è adeguato?", kind: "scale" as const, texts: [], options: [
    { label: "1", count: 6, pct: 60 }, { label: "2", count: 3, pct: 30 }, { label: "3", count: 1, pct: 10 },
    { label: "4", count: 0, pct: 0 }, { label: "5", count: 0, pct: 0 },
  ] },
  { text: "Consiglieresti l'azienda?", kind: "yesno" as const, texts: [], options: [
    { label: "Sì", count: 9, pct: 90 }, { label: "No", count: 1, pct: 10 },
  ] },
  { text: "Perché?", kind: "open" as const, texts: [
    "I turni sono pesanti e i turni cambiano spesso",
    "Vorrei più stabilità sui turni",
    "Lo stipendio è basso",
  ], options: [] },
];

test("riepilogo interno in italiano: voti, azioni e temi", () => {
  const out = localSurveySummary({
    title: "Clima estate", total: 10, mode: "anonima", lang: "it", dateLabel: "17 ottobre 2026", questions,
  });
  assert.match(out, /«Clima estate»/);
  assert.match(out, /10 risposte/);
  assert.match(out, /17 ottobre 2026/);
  assert.match(out, /PUNTI DI FORZA/);
  assert.match(out, /ASPETTI CRITICI/);
  assert.match(out, /media 4,8 su 5/);
  assert.match(out, /media 1,5 su 5/);
  assert.match(out, /90% ha risposto «Sì»/);
  assert.match(out, /Dai priorità a «Lo stipendio è adeguato\?»/);
  assert.match(out, /«turni» \(2 volte\)/);
  assert.match(out, /senza servizi esterni/);
});

test("i nomi dei partecipanti non finiscono nei temi", () => {
  const out = localSurveySummary({
    title: "Privacy", total: 2, mode: "individuale", lang: "it", dateLabel: "oggi",
    respondentNames: ["Marco Rossi"],
    questions: [{ text: "Note", kind: "open", texts: [
      "marco è stato gentilissimo, marco aiuta",
      "marco è disponibile e gentile con marco",
    ], options: [] }],
  });
  assert.doesNotMatch(out, /marco/);
  assert.match(out, /2 risposte scritte/);
});

test("nessuna risposta: testo di attesa", () => {
  const out = localSurveySummary({ title: "Vuoto", total: 0, mode: "anonima", lang: "it", dateLabel: "", questions: [] });
  assert.equal(out, "Il questionario «Vuoto» non ha ancora risposte: la sintesi si genera quando arriva la prima.");
});

test("arabo e inglese usano le proprie etichette", () => {
  const ar = localSurveySummary({ title: "اختبار", total: 3, mode: "مجهول", lang: "ar", dateLabel: "اليوم", questions: [questions[2]!] });
  assert.match(ar, /نقاط القوة/);
  assert.match(ar, /أجاب 90% بـ«Sì»/);
  const en = localSurveySummary({ title: "Test", total: 3, mode: "anonymous", lang: "en", dateLabel: "today", questions: [questions[0]!] });
  assert.match(en, /STRENGTHS/);
  assert.match(en, /average 4\.8 out of 5/);
});
