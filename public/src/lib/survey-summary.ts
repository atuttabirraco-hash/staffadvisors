// Internal survey summary: computed from the collected data only.
// No AI, no external services, no credits spent.
export type SummaryQuestion = {
  text: string;
  kind: "yesno" | "scale" | "choice" | "open";
  texts: string[];
  options: { label: string; count: number; pct: number }[];
};

interface Loc {
  overview: string; strengths: string; critical: string; actions: string; monitor: string;
  openSection: string; head: string; modeAnon: string; modeInd: string; noAnswers: string;
  scaleHigh: string; scaleLow: string; topAnswer: string; divided: string; openNone: string;
  themes: string; themeItem: string; openCountOnly: string; actScale: string; actNo: string;
  actNone: string; foot: string;
}

const LOC: Record<string, Loc> = {
  it: {
    overview: "Panoramica", strengths: "Punti di forza", critical: "Aspetti critici", actions: "Azioni consigliate",
    monitor: "Da monitorare", openSection: "Risposte scritte",
    head: "Il questionario «{title}» ha raccolto {n} risposte in modalità {mode} ({date}).", modeAnon: "anonima", modeInd: "individuale",
    noAnswers: "Il questionario «{title}» non ha ancora risposte: la sintesi si genera quando arriva la prima.",
    scaleHigh: "«{q}»: media {avg} su 5, {pct}% di voti alti (4-5).",
    scaleLow: "«{q}»: media {avg} su 5, {pct}% di voti bassi (1-2).",
    topAnswer: "«{q}»: {pct}% ha risposto «{opt}».",
    divided: "«{q}»: opinioni molto divise ({a}% contro {b}%).",
    openNone: "Nessuna risposta scritta ricevuta.",
    themes: "{n} risposte scritte. Temi più ricorrenti: {list}.",
    themeItem: "«{w}» ({c} volte)", openCountOnly: "{n} risposte scritte.",
    actScale: "Dai priorità a «{q}»: è il voto più basso ({avg} su 5). Chiedi direttamente al team come migliorare.",
    actNo: "Verifica «{q}»: la maggioranza ha risposto «{opt}».",
    actNone: "Nessun aspetto critico evidente: i voti restano buoni. Consolida i punti di forza emersi.",
    foot: "Sintesi calcolata automaticamente sui dati raccolti, senza servizi esterni e senza costi.",
  },
  en: {
    overview: "Overview", strengths: "Strengths", critical: "Critical issues", actions: "Suggested actions",
    monitor: "To monitor", openSection: "Written answers",
    head: "The survey “{title}” collected {n} answers in {mode} mode ({date}).", modeAnon: "anonymous", modeInd: "individual",
    noAnswers: "The survey “{title}” has no answers yet: the summary is generated once the first one arrives.",
    scaleHigh: "“{q}”: average {avg} out of 5, {pct}% high scores (4-5).",
    scaleLow: "“{q}”: average {avg} out of 5, {pct}% low scores (1-2).",
    topAnswer: "“{q}”: {pct}% answered “{opt}”.",
    divided: "“{q}”: opinions are very split ({a}% vs {b}%).",
    openNone: "No written answers received.",
    themes: "{n} written answers. Most recurring themes: {list}.",
    themeItem: "“{w}” ({c} times)", openCountOnly: "{n} written answers.",
    actScale: "Give priority to “{q}”: it has the lowest score ({avg} out of 5). Ask the team directly how to improve.",
    actNo: "Check “{q}”: the majority answered “{opt}”.",
    actNone: "No obvious critical issue: scores stay good. Consolidate the strengths that emerged.",
    foot: "Summary computed automatically on the collected data, with no external services and no cost.",
  },
  es: {
    overview: "Panorama", strengths: "Puntos fuertes", critical: "Puntos críticos", actions: "Acciones recomendadas",
    monitor: "Para vigilar", openSection: "Respuestas escritas",
    head: "La encuesta «{title}» recogió {n} respuestas en modo {mode} ({date}).", modeAnon: "anónima", modeInd: "individual",
    noAnswers: "La encuesta «{title}» aún no tiene respuestas: el resumen se genera cuando llega la primera.",
    scaleHigh: "«{q}»: media {avg} sobre 5, {pct}% de notas altas (4-5).",
    scaleLow: "«{q}»: media {avg} sobre 5, {pct}% de notas bajas (1-2).",
    topAnswer: "«{q}»: el {pct}% respondió «{opt}».",
    divided: "«{q}»: opiniones muy divididas ({a}% frente a {b}%).",
    openNone: "No se han recibido respuestas escritas.",
    themes: "{n} respuestas escritas. Temas más repetidos: {list}.",
    themeItem: "«{w}» ({c} veces)", openCountOnly: "{n} respuestas escritas.",
    actScale: "Da prioridad a «{q}»: es la nota más baja ({avg} sobre 5). Pregunta directamente al equipo cómo mejorar.",
    actNo: "Revisa «{q}»: la mayoría respondió «{opt}».",
    actNone: "Ningún punto crítico evidente: las notas siguen siendo buenas. Consolida los puntos fuertes.",
    foot: "Resumen calculado automáticamente sobre los datos recogidos, sin servicios externos y sin coste.",
  },
  fr: {
    overview: "Vue d'ensemble", strengths: "Points forts", critical: "Points critiques", actions: "Actions conseillées",
    monitor: "À surveiller", openSection: "Réponses écrites",
    head: "Le questionnaire «{title}» a recueilli {n} réponses en mode {mode} ({date}).", modeAnon: "anonyme", modeInd: "individuelle",
    noAnswers: "Le questionnaire «{title}» n'a pas encore de réponses : la synthèse est générée dès la première.",
    scaleHigh: "«{q}» : moyenne {avg} sur 5, {pct}% de notes élevées (4-5).",
    scaleLow: "«{q}» : moyenne {avg} sur 5, {pct}% de notes basses (1-2).",
    topAnswer: "«{q}» : {pct}% ont répondu «{opt}».",
    divided: "«{q}» : opinions très partagées ({a}% contre {b}%).",
    openNone: "Aucune réponse écrite reçue.",
    themes: "{n} réponses écrites. Thèmes les plus fréquents : {list}.",
    themeItem: "«{w}» ({c} fois)", openCountOnly: "{n} réponses écrites.",
    actScale: "Donnez la priorité à «{q}» : c'est la note la plus basse ({avg} sur 5). Demandez à l'équipe comment améliorer.",
    actNo: "Vérifiez «{q}» : la majorité a répondu «{opt}».",
    actNone: "Aucun point critique évident : les notes restent bonnes. Consolidez les points forts obtenus.",
    foot: "Synthèse calculée automatiquement sur les données recueillies, sans services externes et sans coût.",
  },
  de: {
    overview: "Überblick", strengths: "Stärken", critical: "Kritische Punkte", actions: "Empfohlene Maßnahmen",
    monitor: "Im Blick behalten", openSection: "Schriftliche Antworten",
    head: "Die Umfrage «{title}» hat {n} Antworten im Modus {mode} gesammelt ({date}).", modeAnon: "anonym", modeInd: "individuell",
    noAnswers: "Die Umfrage «{title}» hat noch keine Antworten: Die Zusammenfassung entsteht mit der ersten Antwort.",
    scaleHigh: "«{q}»: Durchschnitt {avg} von 5, {pct}% hohe Noten (4-5).",
    scaleLow: "«{q}»: Durchschnitt {avg} von 5, {pct}% niedrige Noten (1-2).",
    topAnswer: "«{q}»: {pct}% haben «{opt}» geantwortet.",
    divided: "«{q}»: sehr geteilte Meinungen ({a}% gegen {b}%).",
    openNone: "Keine schriftlichen Antworten erhalten.",
    themes: "{n} schriftliche Antworten. Häufigste Themen: {list}.",
    themeItem: "«{w}» ({c} Mal)", openCountOnly: "{n} schriftliche Antworten.",
    actScale: "Priorität für «{q}»: niedrigste Note ({avg} von 5). Fragen Sie das Team direkt nach Verbesserungsideen.",
    actNo: "Prüfen Sie «{q}»: die Mehrheit hat «{opt}» geantwortet.",
    actNone: "Kein offensichtlicher kritischer Punkt: Die Noten bleiben gut. Stärken weiter ausbauen.",
    foot: "Zusammenfassung automatisch aus den gesammelten Daten berechnet, ohne externe Dienste und ohne Kosten.",
  },
  pt: {
    overview: "Panorama", strengths: "Pontos fortes", critical: "Pontos críticos", actions: "Ações recomendadas",
    monitor: "A vigiar", openSection: "Respostas escritas",
    head: "O inquérito «{title}» recolheu {n} respostas em modo {mode} ({date}).", modeAnon: "anônimo", modeInd: "individual",
    noAnswers: "O inquérito «{title}» ainda não tem respostas: a síntese é gerada quando chegar a primeira.",
    scaleHigh: "«{q}»: média {avg} em 5, {pct}% de notas altas (4-5).",
    scaleLow: "«{q}»: média {avg} em 5, {pct}% de notas baixas (1-2).",
    topAnswer: "«{q}»: {pct}% respondeu «{opt}».",
    divided: "«{q}»: opiniões muito divididas ({a}% contra {b}%).",
    openNone: "Nenhuma resposta escrita recebida.",
    themes: "{n} respostas escritas. Temas mais frequentes: {list}.",
    themeItem: "«{w}» ({c} vezes)", openCountOnly: "{n} respostas escritas.",
    actScale: "Dê prioridade a «{q}»: é a nota mais baixa ({avg} em 5). Pergunte diretamente à equipa como melhorar.",
    actNo: "Verifique «{q}»: a maioria respondeu «{opt}».",
    actNone: "Nenhum ponto crítico evidente: as notas continuam boas. Reforce os pontos fortes.",
    foot: "Síntese calculada automaticamente sobre os dados recolhidos, sem serviços externos e sem custos.",
  },
  pl: {
    overview: "Przegląd", strengths: "Mocne strony", critical: "Punkty krytyczne", actions: "Zalecane działania",
    monitor: "Do obserwacji", openSection: "Odpowiedzi pisemne",
    head: "Ankieta «{title}» zebrała {n} odpowiedzi w trybie {mode} ({date}).", modeAnon: "anonimowa", modeInd: "indywidualna",
    noAnswers: "Ankieta «{title}» nie ma jeszcze odpowiedzi: podsumowanie pojawi się po pierwszej odpowiedzi.",
    scaleHigh: "«{q}»: średnia {avg} na 5, {pct}% wysokich ocen (4-5).",
    scaleLow: "«{q}»: średnia {avg} na 5, {pct}% niskich ocen (1-2).",
    topAnswer: "«{q}»: {pct}% odpowiedziało «{opt}».",
    divided: "«{q}»: bardzo podzielone opinie ({a}% przeciw {b}%).",
    openNone: "Nie otrzymano odpowiedzi pisemnych.",
    themes: "{n} odpowiedzi pisemnych. Najczęstsze tematy: {list}.",
    themeItem: "«{w}» ({c} razy)", openCountOnly: "{n} odpowiedzi pisemnych.",
    actScale: "Nadaj priorytet «{q}»: to najniższa ocena ({avg} na 5). Zapytaj zespół, jak to poprawić.",
    actNo: "Sprawdź «{q}»: większość odpowiedziała «{opt}».",
    actNone: "Brak oczywistych punktów krytycznych: oceny pozostają dobre. Wzmacniaj mocne strony.",
    foot: "Podsumowanie obliczone automatycznie na zebranych danych, bez usług zewnętrznych i bez kosztów.",
  },
  ar: {
    overview: "نظرة عامة", strengths: "نقاط القوة", critical: "نقاط حرجة", actions: "إجراءات مقترحة",
    monitor: "للمتابعة", openSection: "الإجابات المكتوبة",
    head: "جمع استبيان «{title}» {n} إجابات بوضع {mode} ({date}).", modeAnon: "مجهول", modeInd: "فردي",
    noAnswers: "استبيان «{title}» لا يحتوي بعد على إجابات: يُنشأ الملخص عند وصول أول إجابة.",
    scaleHigh: "«{q}»: المتوسط {avg} من 5، {pct}% تقييمات عالية (4-5).",
    scaleLow: "«{q}»: المتوسط {avg} من 5، {pct}% تقييمات منخفضة (1-2).",
    topAnswer: "«{q}»: أجاب {pct}% بـ«{opt}».",
    divided: "«{q}»: آراء منقسمة جدًا ({a}% مقابل {b}%).",
    openNone: "لم تصل أي إجابات مكتوبة.",
    themes: "{n} إجابات مكتوبة. أكثر المواضيع تكرارًا: {list}.",
    themeItem: "«{w}» ({c} مرات)", openCountOnly: "{n} إجابات مكتوبة.",
    actScale: "أعطِ الأولوية لـ«{q}»: إنها الأدنى ({avg} من 5). اسأل الفريق مباشرة عن طريقة التحسين.",
    actNo: "تحقق من «{q}»: الأغلبية أجابت بـ«{opt}».",
    actNone: "لا توجد نقاط حرجة واضحة: التقييمات تبقى جيدة. عزّز نقاط القوة الظاهرة.",
    foot: "ملخص محسوب تلقائيًا من البيانات المجموعة، بدون خدمات خارجية وبدون تكلفة.",
  },
};

const POS = new Set(["si", "yes", "oui", "ja", "tak", "sim", "نعم"]);
const NEG = new Set(["no", "non", "nein", "nie", "nao", "not", "لا"]);

function polarity(label: string): 1 | -1 | 0 {
  const first = label
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .split(/[^\p{L}]+/u)[0];
  if (!first) return 0;
  if (POS.has(first)) return 1;
  if (NEG.has(first)) return -1;
  return 0;
}

const COMMA_LANGS = ["it", "es", "fr", "pt", "pl"];

function num(v: number, lang: string, dp = 1): string {
  const s = v.toFixed(dp);
  return COMMA_LANGS.includes(lang) ? s.replace(".", ",") : s;
}

function fill(tpl: string | undefined, vars: Record<string, string | number>): string {
  if (!tpl) return "";
  return tpl.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? ""));
}

const STOP: Record<string, string[]> = {
  it: "a c e ed io tu lui lei noi voi loro il lo la i gli le un uno una di a da in con su per tra fra tra che chi cosa quale come più meno non si già anche sono essere ha have ho hai ha hanno ma se questo questo quella quello molto tanto poco tutto nulla niente qui lì dove quando perché perchè molto davvero sempre mai forse nostro vostro loro stato stata essere fatto cosa".split(" "),
  en: "a an the and or but if of to in on for with from by as at is are was were be been i you he she it we they this that what which how more less not so very all any nothing everything here there when why because my your their our".split(" "),
  es: "a la el los las un una y o pero si de en con por para que quien como más menos no sí ya también son ser ha he has han pero si este esta eso muy tanto poco todo nada aquí allí cuando porque porque".split(" "),
  fr: "a à au aux de des du le la les un une et ou mais si que qui quoi comment plus moins non oui aussi sont être ont j'ai tu il elle nous vous ils ce cet cette cela très beaucoup peu tout rien ici là quand pourquoi parce".split(" "),
  de: "a der die das den ein eine und oder aber wenn von zu in auf mit für durch als ist sind war waren sein habe hast haben nicht auch schon sehr viel wenig alles nichts hier dort wann warum weil".split(" "),
  pt: "a o e é de dos das um uma e ou mas se que quem como mais menos não sim já também são ser tem têm mas se este esta isso muito tanto pouco tudo nada aqui ali quando porque porque".split(" "),
  pl: "i w z na do dla o o że jak mniej więcej nie tak już też są być mam ma mają ale jeśli ten ta to bardzo dużo mało wszystko nic tutaj tam kiedy dlaczego ponieważ".split(" "),
  ar: "في من إلى على مع أو و لكن إن أن ما كيف أكثر أقل لا نعم أيضا هو هي هم نحن أنما هذا هذه ذلك جدا كثير قليل كل شيء هنا هناك متى لماذا لأن".split(" "),
};

// Recurring themes: words repeated by at least two different people.
function themes(texts: string[], lang: string, names: string[]): { word: string; count: number }[] {
  const stop = new Set([...(STOP[lang] ?? STOP["en"]!), ...STOP["en"]!, ...STOP["it"]!]);
  const blocked = new Set<string>();
  names.forEach((n) => n.toLowerCase().split(/[^\p{L}]+/u).filter(Boolean).forEach((w) => blocked.add(w)));
  const map = new Map<string, Set<number>>();
  texts.forEach((t, idx) => {
    t.toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .split(/[^\p{L}]+/u)
      .filter((w) => w.length >= 4 && !stop.has(w) && !blocked.has(w))
      .forEach((w) => {
        if (!map.has(w)) map.set(w, new Set());
        map.get(w)!.add(idx);
      });
  });
  return [...map.entries()]
    .filter(([, people]) => people.size >= 2)
    .sort((a, b) => b[1].size - a[1].size || a[0].localeCompare(b[0]))
    .slice(0, 5)
    .map(([word, people]) => ({ word, count: people.size }));
}

function avgOf(options: { label: string; count: number }[]): { avg: number; votes: number; low: number; high: number } {
  let votes = 0, sum = 0, low = 0, high = 0;
  options.forEach((o) => {
    const v = parseInt(o.label, 10);
    if (!Number.isFinite(v) || !o.count) return;
    votes += o.count; sum += v * o.count;
    if (v <= 2) low += o.count;
    if (v >= 4) high += o.count;
  });
  return { avg: votes ? sum / votes : 0, votes, low, high };
}

export function localSurveySummary(input: {
  title: string;
  total: number;
  mode: string;
  lang: string;
  dateLabel: string;
  questions: SummaryQuestion[];
  respondentNames?: string[];
}): string {
  const lang = LOC[input.lang] ? input.lang : "it";
  const L: Loc = LOC[lang] ?? LOC["it"]!;
  if (!input.total) return fill(L.noAnswers, { title: input.title });

  const strengths: { s: string; k: number }[] = [];
  const criticals: { s: string; k: number }[] = [];
  const acts: string[] = [];
  const monitor: string[] = [];

  for (const q of input.questions) {
    if (q.kind === "open") continue;
    const filled = q.options.filter((o) => o.count > 0);
    if (!filled.length) continue;

    if (q.kind === "scale") {
      const { avg, votes, low, high } = avgOf(q.options);
      const pctHigh = Math.round((high / (votes || 1)) * 100);
      const pctLow = Math.round((low / (votes || 1)) * 100);
      if (avg >= 4) strengths.push({ s: fill(L.scaleHigh, { q: q.text, avg: num(avg, lang), pct: pctHigh }), k: avg });
      else if (avg <= 3) {
        criticals.push({ s: fill(L.scaleLow, { q: q.text, avg: num(avg, lang), pct: pctLow }), k: -avg });
        acts.push(fill(L.actScale, { q: q.text, avg: num(avg, lang) }));
      }
      continue;
    }

    const sorted = [...q.options].sort((a, b) => b.count - a.count);
    const top = sorted[0];
    const second = sorted[1];
    if (!top) continue;
    const pos = polarity(top.label);
    if (pos === 1 && top.pct >= 60) strengths.push({ s: fill(L.topAnswer, { q: q.text, pct: top.pct, opt: top.label }), k: top.pct });
    if (pos === -1 && top.pct >= 50) {
      criticals.push({ s: fill(L.topAnswer, { q: q.text, pct: top.pct, opt: top.label }), k: top.pct });
      acts.push(fill(L.actNo, { q: q.text, opt: top.label }));
    }
    if (second && second.count > 0 && top.pct - second.pct <= 15) {
      monitor.push(fill(L.divided, { q: q.text, a: top.pct, b: second.pct }));
    }
  }

  const openTexts = input.questions.flatMap((q) => (q.kind === "open" ? q.texts : []));
  const th = themes(openTexts, lang, input.respondentNames ?? []);

  const modeLabel = /ind/i.test(input.mode) ? L.modeInd : L.modeAnon;
  const out: string[] = [L.overview.toUpperCase(), fill(L.head, { title: input.title, n: input.total, mode: modeLabel, date: input.dateLabel }), ""];
  if (strengths.length) out.push(L.strengths.toUpperCase(), ...strengths.sort((a, b) => b.k - a.k).slice(0, 3).map((x) => x.s), "");
  if (criticals.length) out.push(L.critical.toUpperCase(), ...criticals.sort((a, b) => b.k - a.k).slice(0, 3).map((x) => x.s), "");
  out.push(L.actions.toUpperCase(), ...(acts.length ? acts.slice(0, 3) : [L.actNone]), "");
  if (monitor.length) out.push(L.monitor.toUpperCase(), ...monitor.slice(0, 2), "");
  out.push(L.openSection.toUpperCase());
  out.push(
    openTexts.length
      ? th.length
        ? fill(L.themes, { n: openTexts.length, list: th.map((t) => fill(L.themeItem, { w: t.word, c: t.count })).join(", ") })
        : fill(L.openCountOnly, { n: openTexts.length })
      : L.openNone,
  );
  out.push("", L.foot);
  return out.join("\n");
}
