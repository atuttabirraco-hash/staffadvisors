/** Default questions added to every new internal survey; companies can edit, remove or add more. */
export type QKind = "yesno" | "scale" | "choice" | "open";
export const QKINDS: QKind[] = ["yesno", "scale", "choice", "open"];
type P = { text: string; options: string[]; kind: QKind };

type KCopy = { label: string; kinds: Record<QKind, string>; yes: string; no: string; openPh: string; openAnswers: string; optional: string };
const kc: Record<string, KCopy> = {
  it: { label: "Tipo di risposta", kinds: { yesno: "Sì / No", scale: "Voto 1-5", choice: "Scelta multipla", open: "Risposta aperta" }, yes: "Sì", no: "No", openPh: "Scrivi la tua risposta (facoltativa)", openAnswers: "Risposte scritte", optional: "facoltativa" },
  en: { label: "Answer type", kinds: { yesno: "Yes / No", scale: "Score 1-5", choice: "Multiple choice", open: "Open answer" }, yes: "Yes", no: "No", openPh: "Write your answer (optional)", openAnswers: "Written answers", optional: "optional" },
  es: { label: "Tipo de respuesta", kinds: { yesno: "Sí / No", scale: "Puntuación 1-5", choice: "Opción múltiple", open: "Respuesta abierta" }, yes: "Sí", no: "No", openPh: "Escribe tu respuesta (opcional)", openAnswers: "Respuestas escritas", optional: "opcional" },
  fr: { label: "Type de réponse", kinds: { yesno: "Oui / Non", scale: "Note 1-5", choice: "Choix multiple", open: "Réponse libre" }, yes: "Oui", no: "Non", openPh: "Écris ta réponse (facultative)", openAnswers: "Réponses écrites", optional: "facultative" },
  de: { label: "Antworttyp", kinds: { yesno: "Ja / Nein", scale: "Bewertung 1-5", choice: "Mehrfachauswahl", open: "Freie Antwort" }, yes: "Ja", no: "Nein", openPh: "Schreibe deine Antwort (optional)", openAnswers: "Schriftliche Antworten", optional: "optional" },
  pt: { label: "Tipo de resposta", kinds: { yesno: "Sim / Não", scale: "Nota 1-5", choice: "Escolha múltipla", open: "Resposta aberta" }, yes: "Sim", no: "Não", openPh: "Escreve a tua resposta (opcional)", openAnswers: "Respostas escritas", optional: "opcional" },
  pl: { label: "Rodzaj odpowiedzi", kinds: { yesno: "Tak / Nie", scale: "Ocena 1-5", choice: "Wielokrotny wybór", open: "Odpowiedź otwarta" }, yes: "Tak", no: "Nie", openPh: "Napisz odpowiedź (opcjonalnie)", openAnswers: "Odpowiedzi pisemne", optional: "opcjonalnie" },
  ar: { label: "نوع الإجابة", kinds: { yesno: "نعم / لا", scale: "تقييم 1-5", choice: "اختيار متعدد", open: "إجابة مفتوحة" }, yes: "نعم", no: "لا", openPh: "اكتب إجابتك (اختيارية)", openAnswers: "الإجابات المكتوبة", optional: "اختيارية" },
};
export const kindCopy = (lang: string): KCopy => kc[lang] ?? kc["en"]!;
/** Fixed options for a kind; null means the company writes them (multiple choice). */
export const kindOptions = (kind: QKind, lang: string): string[] | null => {
  const c = kindCopy(lang);
  if (kind === "yesno") return [c.yes, c.no];
  if (kind === "scale") return ["1", "2", "3", "4", "5"];
  if (kind === "open") return [];
  return null;
};

const scale = { it: ["Per niente", "Poco", "Abbastanza", "Molto"], en: ["Not at all", "A little", "Fairly", "Very"] };
const it: P[] = [
  "Quanto sei soddisfatto del tuo lavoro in generale?",
  "Quanto ti senti valorizzato dal tuo responsabile?",
  "Quanto ritieni adeguato il tuo stipendio?",
  "Quanto sono organizzati bene i turni e gli orari?",
  "Quanto ti senti al sicuro sul posto di lavoro?",
  "Quanto è buono il clima con i colleghi?",
  "Quanto è chiara la comunicazione da parte dell'azienda?",
  "Quanto vedi possibilità di crescita professionale?",
  "Quanto riesci a conciliare lavoro e vita privata?",
  "Quanto consiglieresti questa azienda a un amico?",
].map((text) => ({ text, options: scale.it, kind: "choice" as const }));
const en: P[] = [
  "How satisfied are you with your job overall?",
  "How valued do you feel by your manager?",
  "How fair do you consider your salary?",
  "How well organized are shifts and hours?",
  "How safe do you feel at work?",
  "How good is the atmosphere with colleagues?",
  "How clear is communication from the company?",
  "How much room for professional growth do you see?",
  "How well can you balance work and private life?",
  "How likely would you recommend this company to a friend?",
].map((text) => ({ text, options: scale.en, kind: "choice" as const }));
export const surveyPresets = (lang: string): P[] => (lang === "it" ? it : en);
