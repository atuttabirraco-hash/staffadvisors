import { useLang } from "@/lib/lang";
import type { CompanyWithStats } from "@/lib/company-data";
import type { WelfareItem } from "@/lib/constants";

export function BenefitsCard({ c }: { c: CompanyWithStats }) {
  const { tr } = useLang();
  const b = c.benefits;
  const freq = b.mealFrequency === "daily" ? tr.mealDaily : b.mealFrequency === "some" ? tr.mealSome : null;
  const mealPct = c.mealVouchers ? b.mealPct : 100 - b.mealPct;
  const hasMealData = b.mealKnown > 0 || c.meal_override !== null;
  const wItems = b.welfareItems.map((i) => tr.wf[i as WelfareItem] ?? i);
  return (
    <section className="mt-4 rounded-2xl border border-border bg-card p-5 shadow-card">
      <h2 className="font-bold">{"\ud83c\udfab"} {tr.benefitsTitle}</h2>
      {hasMealData ? (
        <div className="mt-3">
          <p className={`inline-flex flex-wrap items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${c.mealVouchers ? "bg-success/15 text-success" : "bg-destructive/10 text-destructive"}`}>
            {c.mealVouchers ? `\u2705 ${tr.givesMeal}` : `\u274c ${tr.noMeal}`}
            {b.mealKnown > 0 && ` - ${mealPct}% (${b.mealKnown} ${tr.employeesShort})`}
            {c.mealVouchers && b.mealValue && ` \u20ac${b.mealValue}`}
            {c.mealVouchers && b.mealProvider && ` ${b.mealProvider}`}
            {c.mealVouchers && freq && ` ${freq}`}
          </p>
          {b.mealKnown > 0 && (
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
              <div className={`h-full rounded-full ${c.mealVouchers ? "bg-success" : "bg-destructive"}`} style={{ width: `${mealPct}%` }} />
            </div>
          )}
        </div>
      ) : (
        <p className="mt-2 text-sm text-muted-foreground">{tr.trendInsufficient}</p>
      )}
      {c.welfare && (
        <p className="mt-3 inline-flex rounded-full bg-primary-soft px-3 py-1 text-xs font-bold text-primary">
          {"\u2764\ufe0f"} {tr.welfare}{wItems.length ? `: ${wItems.join(" + ")}` : ""}
        </p>
      )}
    </section>
  );
}
