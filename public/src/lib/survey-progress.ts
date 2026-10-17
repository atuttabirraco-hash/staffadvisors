export type ProgressQuestion = { id: string; kind?: string };
export function surveyProgressPayload(questions: ProgressQuestion[], answers: Record<string, number>, texts: Record<string, string>) {
  return questions.flatMap((q): { q: string; t?: string; o?: number }[] => {
    if (q.kind === "open") return texts[q.id] !== undefined ? [{ q: q.id, t: (texts[q.id] ?? "").trim().slice(0, 2000) }] : [];
    const option = answers[q.id];
    return option === undefined ? [] : [{ q: q.id, o: option }];
  });
}