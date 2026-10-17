import type { Tables } from "@/integrations/supabase/types";
import { SCORE_KEYS, EXTRA_SCORE_KEYS, EXTRA_SCORE_COLS, type ScoreKey, type ExtraScoreKey } from "./constants";
import { fmt, type Translations } from "./i18n";

export type Company = Tables<"companies">;
export type Review = Omit<Tables<"reviews">, "email_hash">;
export const REVIEW_COLS = "id, company_id, role, sector, contract_type, period_from, period_to, score_salary, score_shifts, score_management, score_growth, score_safety, score_environment, score_tips, score_notice, score_meal_lodging, score_overtime, pro, cons, advice, is_anonymous, is_verified, verified_via, lang, helpful_count, status, created_at, meal_vouchers, welfare, meal_frequency, meal_value, meal_provider, welfare_answer, welfare_items";

/** Reviews are displayed newest first. Email-verified reviews still count 3x toward scores. */
export const weight = (r: Review) => (r.is_verified ? 3 : 1);
export function sortByTrust(rs: Review[]) {
  return [...rs].sort((a, b) => b.created_at.localeCompare(a.created_at));
}
export type Reply = Tables<"company_replies">;

export type CompanyWithStats = Company & {
  reviews: Review[];
  reviewCount: number;
  verifiedCount: number;
  overall: number;
  scores: Record<ScoreKey, number>;
  /** hospitality extras; 0 means no applicable votes yet */
  extraScores: Record<ExtraScoreKey, number>;
  mealVouchers: boolean;
  welfare: boolean;
  benefits: Benefits;
  /** recent (90d) weighted overall minus older overall; 0 when not enough data */
  trend: number;
};

function overallOf(rs: Review[]) {
  return rs.length ? avg(Object.values(computeScores(rs))) : 0;
}
export type Benefits = {
  mealKnown: number; mealYes: number; mealPct: number; mealValue: string | null; mealProvider: string | null; mealFrequency: string | null;
  welfareKnown: number; welfareYes: number; welfarePct: number; welfareItems: string[]; overridden: boolean;
};
function mode(vals: (string | null | undefined)[]) {
  const m = new Map<string, number>();
  for (const v of vals) if (v) m.set(v, (m.get(v) ?? 0) + 1);
  return [...m.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
}
export function computeBenefits(c: Company, rs: Review[]): Benefits {
  const mk = rs.filter((r) => r.meal_vouchers !== null);
  const my = mk.filter((r) => r.meal_vouchers);
  const wk = rs.filter((r) => r.welfare !== null);
  const wy = wk.filter((r) => r.welfare);
  const counts = new Map<string, number>();
  for (const r of wy) for (const i of r.welfare_items ?? []) counts.set(i, (counts.get(i) ?? 0) + 1);
  return {
    mealKnown: mk.length, mealYes: my.length, mealPct: mk.length ? Math.round((my.length / mk.length) * 100) : 0,
    mealValue: c.meal_value_override ?? mode(my.map((r) => r.meal_value)),
    mealProvider: c.meal_provider_override ?? mode(my.map((r) => r.meal_provider)),
    mealFrequency: mode(my.map((r) => r.meal_frequency)),
    welfareKnown: wk.length, welfareYes: wy.length, welfarePct: wk.length ? Math.round((wy.length / wk.length) * 100) : 0,
    welfareItems: c.welfare_items_override ?? [...counts.entries()].filter(([, n]) => n * 3 >= wy.length).sort((a, b) => b[1] - a[1]).map(([k]) => k),
    overridden: c.meal_override !== null || c.welfare_override !== null,
  };
}
function majority(rs: Review[], k: "meal_vouchers" | "welfare") {
  const known = rs.filter((r) => r[k] !== null);
  return known.length > 0 && known.filter((r) => r[k]).length * 2 >= known.length;
}

export function avg(nums: number[]) {
  return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
}

export function computeScores(reviews: Review[]): Record<ScoreKey, number> {
  const out = {} as Record<ScoreKey, number>;
  for (const k of SCORE_KEYS) {
    const w = reviews.reduce((a, r) => a + weight(r), 0);
    out[k] = w ? reviews.reduce((a, r) => a + r[`score_${k}` as const] * weight(r), 0) / w : 0;
  }
  return out;
}

/** Hospitality extras: votes of 0 ("not applicable") are excluded from the average. */
export function computeExtraScores(reviews: Review[]): Record<ExtraScoreKey, number> {
  const out = {} as Record<ExtraScoreKey, number>;
  for (const k of EXTRA_SCORE_KEYS) {
    const col = EXTRA_SCORE_COLS[k] as keyof Review;
    const votes = reviews.filter((r) => ((r[col] as number | null) ?? 0) > 0);
    const w = votes.reduce((a, r) => a + weight(r), 0);
    out[k] = w ? votes.reduce((a, r) => a + (r[col] as number) * weight(r), 0) / w : 0;
  }
  return out;
}

export function buildCompanies(companies: Company[], reviews: Review[]): CompanyWithStats[] {
  const byCompany = new Map<string, Review[]>();
  for (const r of reviews) {
    const list = byCompany.get(r.company_id) ?? [];
    list.push(r);
    byCompany.set(r.company_id, list);
  }
  return companies.map((c) => {
    const rs = byCompany.get(c.id) ?? [];
    const scores = computeScores(rs);
    return {
      ...c,
      reviews: sortByTrust(rs),
      reviewCount: rs.length,
      verifiedCount: rs.filter((r) => r.is_verified).length,
      overall: rs.length ? avg(Object.values(scores)) : 0,
      scores,
      extraScores: computeExtraScores(rs),
      mealVouchers: c.meal_override ?? majority(rs, "meal_vouchers"),
      welfare: c.welfare_override ?? majority(rs, "welfare"),
      benefits: computeBenefits(c, rs),
      trend: (() => {
        const cut = new Date(Date.now() - 90 * 864e5).toISOString();
        const recent = rs.filter((r) => r.created_at >= cut);
        const old = rs.filter((r) => r.created_at < cut);
        return recent.length && old.length ? overallOf(recent) - overallOf(old) : 0;
      })(),
    };
  });
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export function bestWorstKeys(scores: Record<ScoreKey, number>) {
  const entries = SCORE_KEYS.map((k) => [k, scores[k]] as const);
  const sorted = [...entries].sort((a, b) => b[1] - a[1]);
  return { best: sorted[0]![0], worst: sorted[sorted.length - 1]![0] };
}

export function aiSummary(c: CompanyWithStats, tr: Translations) {
  if (!c.reviewCount) return tr.summaryEmpty;
  const { best, worst } = bestWorstKeys(c.scores);
  return fmt(tr.summaryTpl, {
    best: tr[best].toLowerCase(),
    worst: tr[worst].toLowerCase(),
    score: c.overall.toFixed(1),
    n: c.reviewCount,
  });
}

export function tags(c: CompanyWithStats, tr: Translations) {
  const out: { label: string; positive: boolean }[] = [];
  for (const k of SCORE_KEYS) {
    if (c.scores[k] >= 4) out.push({ label: fmt(tr.tagTop, { label: tr[k] }), positive: true });
    else if (c.scores[k] > 0 && c.scores[k] <= 2) out.push({ label: fmt(tr.tagLow, { label: tr[k] }), positive: false });
  }
  return out.slice(0, 3);
}

export function contractLabel(ct: string | null, tr: Translations) {
  switch (ct) {
    case "Permanent": return tr.permanent;
    case "Fixed-term": return tr.fixedTerm;
    case "Seasonal": return tr.seasonal;
    case "Internship": return tr.internship;
    default: return ct ?? "";
  }
}

export function sectorLabel(s: string | null, tr: Translations) {
  return (s && tr.sectors[s]) || s || "";
}
