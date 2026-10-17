// Simple rule-based moderation. Ready to be swapped for OpenAI Moderation API.
const BLOCK_WORDS = [
  // insults (it/en)
  "idiota", "stupido", "stupida", "cretino", "cretina", "coglione", "stronzo", "stronza", "bastardo",
  "merda", "vaffanculo", "imbecille", "deficiente", "idiot", "stupid", "asshole", "bastard", "moron",
  "fuck", "shit", "bitch", "puta", "cabron", "connard", "salope", "arschloch", "scheisse", "kurwa",
  // racism / discrimination
  "negro", "negra", "terrone", "zingaro", "zingara", "frocio", "nigger", "faggot", "retard",
];

// Detects patterns like "Mr. Rossi", "il signor Bianchi", "Mario Rossi", "the manager John"
const NAME_PATTERNS: RegExp[] = [
  /\b(sig\.?|signor|signora|sig\.ra|mr\.?|mrs\.?|ms\.?|dott\.?|dottor|dottoressa|ing\.?|herr|frau|monsieur|madame|senor|senora|senhor|senhora|pan|pani)\s+[A-Z][a-z]+/i,
  /\b(il|la|lo|the|der|die|le|el|o|a)\s+(capo|manager|titolare|direttore|direttrice|responsabile|boss|owner|proprietario|chef|gerente|patron)\s+[A-Z][a-z]{2,}\b/,
  /\b[A-Z][a-z]{2,}\s+[A-Z][a-z]{2,}\b/, // Two consecutive capitalized words (likely a full name)
];

const SAFE_CAPITALIZED = new Set([
  "Emilia Romagna", "Friuli Venezia", "Venezia Giulia", "Trentino Alto", "Alto Adige", "Valle Aosta",
  "Call Center", "Smart Working", "Team Leader", "Human Resources", "Busta Paga",
]);

export type ModerationResult = { ok: true } | { ok: false; reason: "insult" | "name" };

// Word stems blocked anywhere inside a word (catches "fanculo", "stronzate", "cazzone"...).
const BLOCK_STEMS = [
  "fancul", "vaffancul", "cazz", "minchi", "stronz", "coglion", "merd", "puttan", "troi", "zoccol",
  "bastard", "porcodi", "porcamadonn", "dioporc", "diocan", "succhia", "ricchion", "culatton",
  "fuck", "shit", "bitch", "asshole", "idiot", "cretin", "imbecill", "deficient",
];

export function moderateText(...texts: (string | null | undefined)[]): ModerationResult {
  const joined = texts.filter(Boolean).join(" \n ");
  const lower = joined.toLowerCase();
  const squashed = lower.replace(/[^a-z]/g, "");
  for (const s of BLOCK_STEMS) {
    if (lower.includes(s) || squashed.includes(s)) return { ok: false, reason: "insult" };
  }
  for (const w of BLOCK_WORDS) {
    if (new RegExp(`\\b${w}\\b`, "i").test(lower)) return { ok: false, reason: "insult" };
  }
  for (const p of NAME_PATTERNS) {
    const m = joined.match(p);
    if (m && !SAFE_CAPITALIZED.has(m[0])) {
      // Ignore sentence starts: "Ambiente Familiare" style false positives are rare in reviews;
      // only block when the match is not at the very beginning of a sentence.
      const idx = joined.indexOf(m[0]);
      const before = joined.slice(Math.max(0, idx - 2), idx).trim();
      const sentenceStart = idx === 0 || before.endsWith(".") || before.endsWith("!") || before.endsWith("?") || before === "";
      if (!sentenceStart || p !== NAME_PATTERNS[2]) return { ok: false, reason: "name" };
    }
  }
  return { ok: true };
}
