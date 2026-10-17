import { Link } from "@tanstack/react-router";
import { MapPin, Star } from "lucide-react";
import { useLang } from "@/lib/lang";
import { fmt } from "@/lib/i18n";
import { useBranches, useBrandStats } from "@/lib/company-query";

/** Brand-wide rating + other branches of the same brand in the same city. */
export function BranchesCard({ id, brand, city }: { id: string; brand: string | null; city: string | null }) {
  const { tr } = useLang();
  const stats = useBrandStats(brand);
  const branches = useBranches(brand, city);
  if (!brand) return null;
  const others = (branches.data ?? []).filter((b) => b.id !== id);
  return (
    <section className="mt-4 rounded-2xl border border-border bg-card p-5 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-extrabold">{fmt(tr.brandRating, { brand })}</h2>
        {stats.data && (
          <span className="flex items-center gap-1 text-sm font-bold">
            <Star className="h-4 w-4 fill-primary text-primary" /> {stats.data.reviews ? stats.data.avg.toFixed(1) : "-"}
            <span className="text-xs font-normal text-muted-foreground">({stats.data.reviews} {tr.reviews} {"\u2022"} {stats.data.branches} {tr.branches})</span>
          </span>
        )}
      </div>
      {others.length > 0 && city && (
        <>
          <p className="mt-3 text-xs font-semibold text-muted-foreground">{fmt(tr.branchesIn, { n: others.length + 1, brand, city })}</p>
          <ul className="mt-2 divide-y divide-border">
            {others.slice(0, 20).map((b) => (
              <li key={b.id}>
                <Link to="/azienda/$id" params={{ id: b.id }} className="flex items-center gap-2 py-2 text-sm hover:text-primary">
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 flex-1 truncate">{b.full_address ?? b.name}</span>
                  <span className="text-xs text-muted-foreground">{b.review_count ? b.avg_score.toFixed(1) : "-"}</span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
