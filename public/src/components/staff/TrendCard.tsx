import { fmt } from "@/lib/i18n";
import { useLang } from "@/lib/lang";
import { SCORE_KEYS } from "@/lib/constants";
import type { Review } from "@/lib/company-data";

const DAY = 864e5;
const mean = (r: Review) => SCORE_KEYS.reduce((a, k) => a + r[`score_${k}` as const], 0) / SCORE_KEYS.length;
const w = (r: Review) => (r.is_verified ? 3 : 1);
function wavg(rs: Review[]) {
  const t = rs.reduce((a, r) => a + w(r), 0);
  return t ? rs.reduce((a, r) => a + mean(r) * w(r), 0) / t : null;
}

export function TrendCard({ reviews }: { reviews: Review[] }) {
  const { tr } = useLang();
  const now = Date.now();
  const age = (r: Review) => now - new Date(r.created_at).getTime();
  const last6 = reviews.filter((r) => age(r) <= 180 * DAY);
  const recent = wavg(last6.filter((r) => age(r) <= 90 * DAY));
  const prev = wavg(last6.filter((r) => age(r) > 90 * DAY));
  const enough = last6.length >= 5;
  const pct = recent != null && prev ? Math.round(((recent - prev) / prev) * 100) : 0;

  // monthly buckets, oldest first
  const months = Array.from({ length: 6 }, (_, i) => wavg(last6.filter((r) => { const a = age(r); return a > (5 - i) * 30 * DAY && a <= (6 - i) * 30 * DAY; })));
  const pts = months.map((v, i) => (v == null ? null : [i * 20, 40 - ((v - 1) / 4) * 36 - 2] as const)).filter(Boolean) as (readonly [number, number])[];

  let badge = { text: `\u27a1\ufe0f ${tr.trendStable}`, cls: "bg-muted text-foreground" };
  if (pct >= 3) badge = { text: `\ud83d\udcc8 ${tr.trendUp} +${pct}%`, cls: "bg-success/15 text-success" };
  else if (pct <= -3) badge = { text: `\ud83d\udcc9 ${tr.trendDown} ${pct}%`, cls: "bg-destructive/10 text-destructive" };

  return (
    <section className="mt-4 rounded-2xl border border-border bg-card p-5 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-bold">{tr.trendTitle}</h2>
        {enough && <span className={`rounded-full px-3 py-1 text-xs font-bold ${badge.cls}`}>{badge.text}</span>}
      </div>
      {enough ? (
        <>
          <svg viewBox="-2 0 104 42" className="mt-3 h-14 w-full" preserveAspectRatio="none" aria-hidden>
            {pts.length > 1 && <polyline points={pts.map((p) => p.join(",")).join(" ")} fill="none" stroke="var(--color-primary)" strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />}
            {pts.map(([x, y]) => <circle key={x} cx={x} cy={y} r="1.8" fill="var(--color-primary)" />)}
          </svg>
          <p className="mt-2 text-xs text-muted-foreground">{fmt(tr.trendBased, { n: last6.length })}</p>
        </>
      ) : (
        <p className="mt-2 text-sm text-muted-foreground">{tr.trendInsufficient} {"\u2022"} {fmt(tr.trendBased, { n: last6.length })}</p>
      )}
    </section>
  );
}
