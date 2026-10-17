import type { Lang } from "./i18n";

export type SeasonalTheme = "halloween" | "christmas" | "carnival" | "easter";

type SeasonalContent = {
  label: string;
  message: string;
};

const copy: Record<Lang, Record<SeasonalTheme, SeasonalContent>> = {
  it: {
    halloween: { label: "Halloween", message: "Niente scherzi: scopri cosa c'e davvero dietro ogni lavoro." },
    christmas: { label: "Buone feste", message: "Il lavoro migliore inizia da una scelta piu consapevole." },
    carnival: { label: "Carnevale", message: "Giu la maschera: scopri come si lavora davvero." },
    easter: { label: "Buona Pasqua", message: "Nuove opportunita crescono da informazioni sincere." },
  },
  en: {
    halloween: { label: "Halloween", message: "No tricks: discover what really lies behind every workplace." },
    christmas: { label: "Happy holidays", message: "A better job starts with a more informed choice." },
    carnival: { label: "Carnival", message: "Drop the mask: discover what work is really like." },
    easter: { label: "Happy Easter", message: "New opportunities grow from honest information." },
  },
  es: {
    halloween: { label: "Halloween", message: "Sin trucos: descubre que hay realmente detras de cada trabajo." },
    christmas: { label: "Felices fiestas", message: "Un trabajo mejor empieza con una decision mas consciente." },
    carnival: { label: "Carnaval", message: "Fuera mascaras: descubre como se trabaja de verdad." },
    easter: { label: "Feliz Pascua", message: "Las nuevas oportunidades nacen de informacion sincera." },
  },
  fr: {
    halloween: { label: "Halloween", message: "Pas de mauvais tour : decouvrez la realite de chaque emploi." },
    christmas: { label: "Joyeuses fetes", message: "Un meilleur emploi commence par un choix plus eclaire." },
    carnival: { label: "Carnaval", message: "Bas les masques : decouvrez la realite du travail." },
    easter: { label: "Joyeuses Paques", message: "Les nouvelles opportunites naissent d'informations sinceres." },
  },
  de: {
    halloween: { label: "Halloween", message: "Keine Tricks: Entdecke, was wirklich hinter jedem Arbeitsplatz steckt." },
    christmas: { label: "Frohe Feiertage", message: "Ein besserer Job beginnt mit einer bewussteren Wahl." },
    carnival: { label: "Karneval", message: "Maske ab: Entdecke, wie die Arbeit wirklich ist." },
    easter: { label: "Frohe Ostern", message: "Neue Chancen wachsen aus ehrlichen Informationen." },
  },
  pt: {
    halloween: { label: "Halloween", message: "Sem truques: descubra o que realmente existe por tras de cada trabalho." },
    christmas: { label: "Boas festas", message: "Um trabalho melhor comeca com uma escolha mais consciente." },
    carnival: { label: "Carnaval", message: "Tire a mascara: descubra como e realmente trabalhar." },
    easter: { label: "Feliz Pascoa", message: "Novas oportunidades crescem com informacoes sinceras." },
  },
  pl: {
    halloween: { label: "Halloween", message: "Bez sztuczek: sprawdz, co naprawde kryje sie za kazda praca." },
    christmas: { label: "Wesolych Swiat", message: "Lepsza praca zaczyna sie od bardziej swiadomego wyboru." },
    carnival: { label: "Karnawal", message: "Zdejmij maske: sprawdz, jak naprawde wyglada praca." },
    easter: { label: "Wesolej Wielkanocy", message: "Nowe mozliwosci wyrastaja ze szczerych informacji." },
  },
  ar: {
    halloween: { label: "هالوين", message: "بلا خدع: اكتشف حقيقة العمل خلف كل وظيفة." },
    christmas: { label: "أعياد سعيدة", message: "العمل الأفضل يبدأ باختيار أكثر وعيا." },
    carnival: { label: "الكرنفال", message: "انزع القناع واكتشف حقيقة بيئة العمل." },
    easter: { label: "فصح سعيد", message: "الفرص الجديدة تنمو من المعلومات الصادقة." },
  },
};

const DAY_MS = 86_400_000;

function dateOnly(year: number, month: number, day: number) {
  return Date.UTC(year, month, day);
}

export function gregorianEaster(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(dateOnly(year, month - 1, day));
}

function italianDateParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Rome",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((part) => part.type === type)?.value ?? 0);
  return { year: value("year"), month: value("month"), day: value("day") };
}

export function getSeasonalTheme(date = new Date()): SeasonalTheme | null {
  const { year, month, day } = italianDateParts(date);
  const today = dateOnly(year, month - 1, day);

  if ((month === 10 && day >= 24) || (month === 11 && day <= 2)) return "halloween";
  if ((month === 12 && day >= 1) || (month === 1 && day <= 6)) return "christmas";

  const easter = gregorianEaster(year).getTime();
  const easterStart = easter - 7 * DAY_MS;
  const easterEnd = easter + 9 * DAY_MS;
  if (today >= easterStart && today <= easterEnd) return "easter";

  const shroveTuesday = easter - 47 * DAY_MS;
  if (today >= shroveTuesday - 7 * DAY_MS && today <= shroveTuesday) return "carnival";

  return null;
}

export function getSeasonalContent(lang: Lang, theme: SeasonalTheme) {
  return copy[lang][theme];
}