import { memo } from "react";
import { MapPin, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLang } from "@/lib/lang";
import { aiSummary, initials, sectorLabel, tags, type CompanyWithStats } from "@/lib/company-data";
import { ScoreBars, ScorePill } from "./ScoreBars";

function CompanyCardImpl({ company, onOpen }: { company: CompanyWithStats; onOpen: (c: CompanyWithStats) => void }) {
  const { tr } = useLang();
  const tg = tags(company, tr);
  return (
    <article className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-card transition-all hover:-translate-y-1 hover:shadow-card-hover sm:p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-bold text-secondary-foreground">
          {initials(company.name)}
        </div>
        <div className="min-w-0 flex-1">
           <h3 className="break-words text-base font-bold leading-tight">{company.name}</h3>
          {company.legal_name && <p className="truncate text-xs text-muted-foreground">{company.legal_name}</p>}
          <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3 shrink-0" /> <span className="truncate">{company.full_address ?? `${company.city ?? ""}${company.region ? ` \u2022 ${company.region}` : ""}`}</span>
          </p>
        </div>
        <ScorePill value={company.overall} />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold">{sectorLabel(company.sector, tr)}</span>
        <span className="text-xs text-muted-foreground">
          {company.reviewCount} {company.reviewCount === 1 ? tr.review : tr.reviews}
        </span>
        {company.verifiedCount > 0 && (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-success">
            <ShieldCheck className="h-3 w-3" /> {company.verifiedCount} {tr.verified.toLowerCase()}
          </span>
        )}
      </div>

       <div className="mt-4 min-w-0">
        <ScoreBars scores={company.scores} compact />
      </div>

      <div className="mt-4 rounded-xl bg-primary-soft p-3">
        <p className="mb-1 flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-primary">
          <Sparkles className="h-3 w-3" /> {tr.aiSummary}
        </p>
        <p className="text-xs leading-relaxed text-foreground/80">{aiSummary(company, tr)}</p>
      </div>

      {tg.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {tg.map((x) => (
            <span
              key={x.label}
              className={
                x.positive
                  ? "rounded-full bg-success/10 px-2 py-0.5 text-[11px] font-medium text-success"
                  : "rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] font-medium text-destructive"
              }
            >
              {x.label}
            </span>
          ))}
        </div>
      )}

      <Button variant="secondary" className="mt-4 w-full group-hover:bg-secondary group-hover:text-secondary-foreground" onClick={() => onOpen(company)}>
        {tr.readReviews}
      </Button>
    </article>
  );
}

export const CompanyCard = memo(CompanyCardImpl);
