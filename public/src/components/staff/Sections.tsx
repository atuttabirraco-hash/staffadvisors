import { Link } from "@tanstack/react-router";
import { TrendingDown, TrendingUp, ShieldCheck, ArrowLeft, Mail } from "lucide-react";
import { useLang } from "@/lib/lang";
import { contractLabel, initials, type CompanyWithStats, type Review } from "@/lib/company-data";
import { ScorePill } from "./ScoreBars";
import { HomeLink } from "./HomeLink";

export function BestWorst({ companies, onOpen }: { companies: CompanyWithStats[]; onOpen: (c: CompanyWithStats) => void }) {
  const { tr } = useLang();
  const rated = companies.filter((c) => c.reviewCount > 0).sort((a, b) => b.overall - a.overall);
  const best = rated.slice(0, 3);
  const worst = [...rated].reverse().slice(0, 3);
  const Col = ({ title, list, icon, tone }: { title: string; list: CompanyWithStats[]; icon: React.ReactNode; tone: string }) => (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
      <h3 className={`flex items-center gap-2 text-sm font-bold uppercase tracking-wide ${tone}`}>{icon} {title}</h3>
      <ul className="mt-3 divide-y divide-border">
        {list.map((c, i) => (
          <li key={c.id}>
            <button onClick={() => onOpen(c)} className="flex w-full items-center gap-3 py-3 text-left hover:opacity-80">
              <span className="w-5 text-sm font-bold text-muted-foreground">{i + 1}</span>
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-xs font-bold text-secondary-foreground">{initials(c.name)}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">{c.name}</span>
                <span className="block truncate text-xs text-muted-foreground">{c.city} {"\u2022"} {c.reviewCount} {tr.reviews}</span>
              </span>
              <ScorePill value={c.overall} size="sm" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
  return (
    <section className="mx-auto max-w-7xl px-4 py-12">
      <h2 className="text-2xl font-extrabold tracking-tight">{tr.bestWorst}</h2>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <Col title={tr.best} list={best} icon={<TrendingUp className="h-4 w-4" />} tone="text-success" />
        <Col title={tr.worst} list={worst} icon={<TrendingDown className="h-4 w-4" />} tone="text-destructive" />
      </div>
    </section>
  );
}

export function LatestTicker({ reviews, companies }: { reviews: Review[]; companies: CompanyWithStats[] }) {
  const { tr } = useLang();
  const byId = new Map(companies.map((c) => [c.id, c]));
  const latest = [...reviews].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 10);
  if (!latest.length) return null;
  const items = [...latest, ...latest];
  return (
    <section className="border-y border-border bg-card py-6">
      <div className="mx-auto max-w-7xl px-4">
        <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">{tr.latest}</h2>
      </div>
      <div className="mt-3 overflow-hidden">
        <div className="flex w-max gap-3 animate-ticker">
          {items.map((r, i) => {
            const c = byId.get(r.company_id);
            const score = (r.score_salary + r.score_shifts + r.score_management + r.score_growth + r.score_safety + r.score_environment) / 6;
            return (
              <div key={`${r.id}-${i}`} className="w-72 shrink-0 rounded-2xl border border-border bg-background p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-bold">{c?.name}</span>
                  <span className="rounded-lg bg-primary px-2 py-0.5 text-xs font-bold text-primary-foreground">{score.toFixed(1)}</span>
                </div>
                <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                  {r.role} {"\u2022"} {contractLabel(r.contract_type, tr)}
                  {r.is_verified && <ShieldCheck className="h-3 w-3 text-success" />}
                </p>
                <p className="mt-2 line-clamp-2 text-xs text-foreground/80">{r.pro}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  const { tr } = useLang();
  return (
    <footer className="bg-secondary text-secondary-foreground">
      <div className="bg-background text-foreground">
        <div className="mx-auto max-w-7xl px-4 py-6">
          <HomeLink className="inline-flex items-center gap-2 py-2 text-sm font-semibold text-primary hover:underline">
            <ArrowLeft className="h-4 w-4" /> {tr.backHome}
          </HomeLink>
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-secondary-foreground text-sm font-extrabold text-secondary">
                SA
                <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-primary" />
              </span>
              <span className="font-bold">Staff Advisors</span>
            </div>
            <p className="mt-2 text-xs text-secondary-foreground/60">staffadvisors.it</p>
          </div>
          <p className="max-w-2xl text-sm leading-relaxed text-secondary-foreground/75">{tr.footer}</p>
          <div className="shrink-0 rounded-2xl border border-secondary-foreground/15 bg-secondary-foreground/5 p-4">
            <p className="text-sm font-semibold text-secondary-foreground">{tr.contactFooter}</p>
            <Link to="/contatti" className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">
              <Mail className="h-4 w-4" /> {tr.contactFooterCta}
            </Link>
          </div>
        </div>
        <p className="mt-8 border-t border-secondary-foreground/10 pt-4 text-xs text-secondary-foreground/50">
          &copy; {new Date().getFullYear()} StaffAdvisors {"\u2022"}{" "}
          <Link to="/privacy" className="hover:underline">{tr.privacy}</Link> {"\u2022"}{" "}
          <Link to="/termini" className="hover:underline">{tr.terms}</Link> {"\u2022"}{" "}
          <Link to="/cookie" className="hover:underline">{tr.cookies}</Link> {"\u2022"}{" "}
          <Link to="/contatti" className="hover:underline">{tr.contact}</Link>
        </p>
      </div>
    </footer>
  );
}
