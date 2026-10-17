// Self-contained HTML results page for a survey download (inside the ZIP).
// Opens in any browser, phone or desktop, with no external resources.
export type HtmlReportQuestion = {
  text: string;
  kind: "yesno" | "scale" | "choice" | "open";
  texts: string[];
  options: { label: string; count: number; pct: number }[];
};

const DONUT_COLORS = ["#FF5A1F", "#FF9166", "#FFC9A8", "#94A3B8", "#64748B", "#475569"];

// Donut chart as inline SVG (no external resources): one circle segment per
// non-empty option, using the 100-length circumference trick.
function donutSvg(options: { label: string; count: number; pct: number }[]): string {
  const filled = options.filter((o) => o.count > 0).slice(0, DONUT_COLORS.length);
  if (!filled.length) return "";
  const total = filled.reduce((s, o) => s + o.count, 0);
  let cum = 0;
  const segs = filled
    .map((o, i) => {
      const pct = (o.count / total) * 100;
      const off = 25 - cum;
      cum += pct;
      return `<circle cx="21" cy="21" r="15.9155" fill="none" stroke="${DONUT_COLORS[i % DONUT_COLORS.length]}" stroke-width="5.5" stroke-dasharray="${pct.toFixed(2)} ${(100 - pct).toFixed(2)}" stroke-dashoffset="${off.toFixed(2)}"/>`;
    })
    .join("");
  const lead = filled[0] ?? { label: "", count: 0, pct: 0 };
  const leadPct = Math.round((lead.count / total) * 100);
  return `<div class="donutwrap" aria-hidden="true">
<svg viewBox="0 0 42 42"><circle cx="21" cy="21" r="15.9155" fill="none" stroke="rgba(255,255,255,.08)" stroke-width="5.5"/>${segs}</svg>
<span class="donutnum">${leadPct}%</span><span class="donutlbl">${esc(lead.label)}</span>
</div>`;
}

function starsFor(options: { label: string; count: number }[], lang: string): { avg: string; stars: string } {
  const votes = options.reduce((s, o) => s + o.count, 0);
  const sum = options.reduce((s, o) => s + o.count * (parseInt(o.label, 10) || 0), 0);
  const avg = votes ? sum / votes : 0;
  const shown = Math.round(avg);
  const stars = Array.from({ length: 5 }, (_, i) => `<span class="${i < shown ? "on" : "off"}">★</span>`).join("");
  return { avg: avg.toLocaleString(lang, { minimumFractionDigits: 1, maximumFractionDigits: 1 }), stars };
}

const esc = (v: string | number) =>
  String(v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

export function surveyHtmlReport(args: {
  title: string;
  company: string | null;
  lang: string;
  mode: string;
  total: number;
  generatedAt: string;
  respondents: { name: string; birth: string | null }[];
  questions: HtmlReportQuestion[];
  summary: string;
  labels: { results: string; responses: string; respondents: string; aiSummary: string };
}): string {
  const questionBlock = (q: HtmlReportQuestion) => {
    const head = `<section class="card"><p class="tag">${esc(q.kind === "open" ? "…" : q.kind === "scale" ? "★" : "%")}</p><p class="q">${esc(q.text)}</p>`;
    if (q.kind === "open") {
      const list = q.texts.length
        ? q.texts.map((t) => `<p class="open">${esc(t)}</p>`).join("")
        : `<p class="open">–</p>`;
      return `${head}${list}</section>`;
    }
    const rows = q.options
      .map(
        (o) =>
          `<div class="row"><div class="rowtop"><span>${esc(o.label)}</span><span>${o.count} · ${o.pct}%</span></div><div class="track"><div class="fill" style="width:${Math.max(0, Math.min(100, o.pct))}%"></div></div></div>`
      )
      .join("");
    if (q.kind === "scale") {
      const { avg, stars } = starsFor(q.options, args.lang);
      return `${head}<div class="scalehead"><span class="bigstars">${stars}</span><span class="avg">${esc(avg)} / 5</span></div>${rows}</section>`;
    }
    const donut = donutSvg(q.options);
    return `${head}${donut ? `<div class="split">${donut}<div class="rows">${rows}</div></div>` : rows}</section>`;
  };

  const respondents = args.respondents.length
    ? `<section class="card"><p class="q">${esc(args.labels.respondents)} (${args.respondents.length})</p>${args.respondents
        .map((p) => `<p class="open">${esc(p.name)}${p.birth ? ` · ${esc(new Date(p.birth).toLocaleDateString(args.lang))}` : ""}</p>`)
        .join("")}</section>`
    : "";

  const summary = args.summary.trim()
    ? `<section class="card summary"><h2><span>✦</span>${esc(args.labels.aiSummary)}</h2><p>${esc(args.summary.trim())}</p></section>`
    : "";

  const when = new Date(args.generatedAt).toLocaleDateString(args.lang);

  return `<!doctype html>
<html lang="${esc(args.lang)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(args.title)} — StaffAdvisors</title>
<style>
:root{color-scheme:dark}
*{box-sizing:border-box}
body{margin:0;background:#0F172A;color:#F8FAFC;font:16px/1.6 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
.wrap{max-width:760px;margin:0 auto;padding:8px 16px 48px}
header{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:16px 0;border-bottom:1px solid rgba(255,255,255,.08)}
.brand{font-weight:800;font-size:15px;letter-spacing:.2px;color:#F8FAFC;text-decoration:none}
.brand b{color:#FF5A1F}
.date{font-size:12px;color:#94A3B8}
h1{font-size:26px;line-height:1.25;margin:24px 0 4px;overflow-wrap:anywhere}
h2{font-size:18px;margin:26px 0 0}
.meta{color:#94A3B8;font-size:14px;margin:0 0 4px}
.card{background:#16233C;border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:18px;margin:14px 0}
.q{font-weight:600;font-size:15px;margin:0 0 12px;overflow-wrap:anywhere}
.tag{display:inline-block;font-size:11px;font-weight:600;color:#94A3B8;border:1px solid rgba(255,255,255,.14);border-radius:999px;padding:2px 10px;margin:0 0 10px}
.split{display:flex;gap:18px;align-items:center;flex-wrap:wrap}
.rows{flex:1;min-width:200px}
.donutwrap{position:relative;width:118px;height:118px;flex:none;margin:0 auto}
.donutwrap svg{width:100%;height:100%;transform:rotate(0deg)}
.donutnum{position:absolute;top:38px;left:0;right:0;text-align:center;font-size:22px;font-weight:800;color:#F8FAFC}
.donutlbl{position:absolute;top:66px;left:0;right:0;text-align:center;font-size:10px;color:#94A3B8;padding:0 14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:block}
.row{margin:10px 0}
.rowtop{display:flex;justify-content:space-between;gap:8px;font-size:13px;color:#CBD5E1;overflow-wrap:anywhere}
.track{height:10px;border-radius:999px;background:rgba(255,255,255,.08);margin-top:4px;overflow:hidden}
.fill{height:100%;border-radius:999px;background:linear-gradient(90deg,#FF5A1F,#FF8A5C);animation:grow .9s ease-out}
@keyframes grow{from{width:0}}
.scalehead{display:flex;align-items:center;gap:10px;margin:2px 0 10px}
.bigstars{font-size:24px;letter-spacing:3px;line-height:1}
.bigstars .on{color:#FF5A1F}
.bigstars .off{color:rgba(255,255,255,.18)}
.avg{font-size:13px;color:#94A3B8}
.open{background:rgba(255,255,255,.05);border-radius:10px;padding:10px 12px;font-size:14px;margin:6px 0;white-space:pre-wrap;overflow-wrap:anywhere}
.summary{border-color:rgba(255,90,31,.35);background:rgba(255,90,31,.08)}
.summary h2{display:flex;align-items:center;gap:8px;font-size:16px;margin:0 0 10px}
.summary h2 span{color:#FF5A1F}
.summary p{white-space:pre-wrap;margin:0;font-size:14px}
footer{margin-top:28px;text-align:center;color:#64748B;font-size:12px}
footer b{color:#FF5A1F}
@media print{
body{background:#fff;color:#0f172a}
.card{background:#fff;border-color:#e2e8f0}
.track{background:#e2e8f0}
.open{background:#f1f5f9}
.summary{background:#fff7f3}
.fill{print-color-adjust:exact;-webkit-print-color-adjust:exact}
header{border-color:#e2e8f0}
.fill{animation:none}
.bigstars .off{color:#cbd5e1}
}
</style>
</head>
<body><div class="wrap">
<header><a class="brand" href="https://staffadvisors.it"><b>Staff</b>Advisors</a><span class="date">${esc(when)}</span></header>
<main>
<h1>${esc(args.title)}</h1>
<p class="meta">${esc(args.company ?? "")}</p>
<p class="meta">${esc(args.labels.results)} · ${args.total} ${esc(args.labels.responses)} · ${esc(args.mode)}</p>
${respondents}
<h2>${esc(args.labels.results)}</h2>
${args.questions.map(questionBlock).join("\n")}
${summary}
</main>
<footer>${esc(args.labels.aiSummary)} — <b>Staff</b>Advisors</footer>
</div></body>
</html>`;
}
