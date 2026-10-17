import { useCallback, useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { SearchX } from "lucide-react";
import { useLang } from "@/lib/lang";
import { fmt } from "@/lib/i18n";
import { SECTORS } from "@/lib/constants";
import { type Company, type CompanyWithStats } from "@/lib/company-data";
import { WriteReviewModal } from "@/components/staff/WriteReviewModal";
import { useCompanyCount, useCompanyPages, useDebounced } from "@/lib/company-query";
import { createCompany } from "@/lib/staff.functions";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Logo, LangSelector } from "@/components/staff/Header";
import { SearchBox, ExternalResults } from "@/components/staff/SearchBox";
import { CardSkeletons, CompanyGrid } from "@/components/staff/CompanyGrid";
import { Footer } from "@/components/staff/Sections";

type S = { q?: string | undefined; city?: string | undefined; sector?: string | undefined; rating?: number | undefined; meal?: boolean | undefined; welfare?: boolean | undefined; trend?: string | undefined; verified?: boolean | undefined };
const str = (v: unknown) => (typeof v === "string" && v ? v : undefined);
const bool = (v: unknown) => (v === true || v === "true" || v === 1 ? true : undefined);

export const Route = createFileRoute("/aziende")({
  validateSearch: (s: Record<string, unknown>): S => ({
    q: str(s["q"])?.slice(0, 120),
    city: str(s["city"]),
    sector: str(s["sector"]),
    rating: Number(s["rating"]) || undefined,
    meal: bool(s["meal"]),
    welfare: bool(s["welfare"]),
    trend: str(s["trend"]),
    verified: bool(s["verified"]),
  }),
  head: () => ({
    meta: [
      { title: "Cerca aziende in Italia - Recensioni dei dipendenti | StaffAdvisors" },
      { name: "description", content: "Cerca tra le aziende italiane per nome, P.IVA, citta o settore. Filtra per voto, buoni pasto, welfare e recensioni verificate." },
      { property: "og:title", content: "Cerca aziende in Italia | StaffAdvisors" },
      { property: "og:description", content: "Trova come si lavora davvero in ogni azienda italiana: voti, buoni pasto, welfare." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/aziende" },

      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "/aziende" }],
  }),
  component: Aziende,
});

const selectCls = "h-10 rounded-xl border border-border bg-card px-3 text-sm font-medium outline-none focus:ring-2 focus:ring-ring";

function Aziende() {
  const { tr } = useLang();
  const raw = Route.useSearch();
  const s = { q: raw.q ?? "", city: raw.city ?? "", sector: raw.sector ?? "", rating: raw.rating ?? 0, meal: !!raw.meal, welfare: !!raw.welfare, trend: raw.trend ?? "", verified: !!raw.verified };
  const navigate = useNavigate({ from: "/aziende" });
  const set = (patch: Record<string, string | number | boolean>) =>
    navigate({ search: (prev) => {
      const next: Record<string, unknown> = { ...prev, ...patch };
      for (const k of Object.keys(next)) if (!next[k]) delete next[k];
      return next as S;
    }, replace: true });
  const qc = useQueryClient();
  const create = useServerFn(createCompany);
  const [busy, setBusy] = useState(false);
  const [writeFor, setWriteFor] = useState<Company | null>(null);

  const [cityText, setCityText] = useState(s.city);
  const city = useDebounced(cityText, 400);
  const { data: all = 0 } = useCompanyCount();
  const pages = useCompanyPages({ q: s.q, city, sector: s.sector, rating: s.rating, meal: s.meal, welfare: s.welfare, trend: s.trend, verified: s.verified });
  const results = useMemo(() => pages.data?.pages.flatMap((p) => p.items) ?? [], [pages.data]);
  const total = pages.data?.pages[0]?.count ?? 0;
  const isLoading = pages.isLoading;
  const branchInfo = useMemo(() => {
    const b = results[0]?.parent_brand;
    const c = results[0]?.city;
    if (!b || !c || results.length < 2 || !results.every((x) => x.parent_brand === b && x.city === c)) return null;
    return { brand: b, city: c };
  }, [results]);
  const loadMore = useCallback(() => { void pages.fetchNextPage(); }, [pages]);
  const openCo = useCallback((c: CompanyWithStats) => navigate({ to: "/azienda/$id", params: { id: c.id } }), [navigate]);

  const addNow = async () => {
    const name = s.q.trim();
    if (name.length < 2) return;
    setBusy(true);
    try {
      const row = await create({ data: { name, city: s.city || null, sector: s.sector || null, country: "Italy" } });
      await qc.invalidateQueries({ queryKey: ["companies-page"] });
      toast.success(tr.companyAdded);
      navigate({ to: "/azienda/$id", params: { id: row.id } });
    } catch {
      toast.error(tr.errorGeneric);
    } finally {
      setBusy(false);
    }
  };

  const toggle = (label: string, value: boolean, key: "meal" | "welfare" | "verified") => (
    <label className="flex items-center gap-2 text-sm font-medium">
      <Switch checked={value} onCheckedChange={(v) => set({ [key]: v })} /> {label}
    </label>
  );

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="bg-gradient-hero">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4">
          <div className="[&_span]:text-secondary-foreground [&>a>span:first-child]:bg-secondary-foreground [&>a>span:first-child]:text-secondary"><Logo /></div>
          <LangSelector dark />
        </div>
        <div className="mx-auto max-w-7xl px-4 pb-8">
          <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-secondary-foreground/15 bg-secondary-foreground/10 px-3 py-1 text-xs font-medium text-secondary-foreground">
            <span className="h-2 w-2 rounded-full bg-primary" /> {fmt(tr.stats, { n: all.toLocaleString("it-IT") })}
          </span>
          <div className="max-w-3xl"><SearchBox key={s.q} initial={s.q} onWriteFor={(c) => setWriteFor(c as Company)} /></div>
        </div>
      </header>

      <div className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-2 px-4 py-3 sm:gap-3">
          <input className={selectCls} value={cityText} onChange={(e) => { setCityText(e.target.value); set({ city: e.target.value }); }} placeholder={tr.allCities} aria-label={tr.city} />
          <select className={selectCls} value={s.sector} onChange={(e) => set({ sector: e.target.value })} aria-label={tr.sector}>
            <option value="">{tr.allSectors}</option>
            {SECTORS.map((x) => <option key={x} value={x}>{tr.sectors[x]}</option>)}
          </select>
          <select className={selectCls} value={s.rating} onChange={(e) => set({ rating: Number(e.target.value) })} aria-label={tr.rating}>
            <option value={0}>{tr.anyRating}</option>
            {[4, 3, 2].map((n) => <option key={n} value={n}>{n}+ {"\u2605"}</option>)}
          </select>
          <select className={selectCls} value={s.trend} onChange={(e) => set({ trend: e.target.value })} aria-label={tr.improving}>
            <option value="">{tr.anyTrend}</option>
            <option value="up">{tr.improving}</option>
            <option value="down">{tr.worsening}</option>
          </select>
          {toggle("\ud83c\udfab " + tr.onlyMeal, s.meal, "meal")}
          {toggle("\u2764\ufe0f " + tr.onlyWelfare, s.welfare, "welfare")}
          {toggle(tr.verifiedOnly, s.verified, "verified")}
          <span className="ml-auto text-xs text-muted-foreground">{total.toLocaleString("it-IT")}</span>
        </div>
      </div>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8">
        <h1 className="mb-2 text-xl font-extrabold">{s.q ? `${tr.resultsTitle} "${s.q}"` : tr.allCompanies}</h1>
        {branchInfo && <p className="mb-5 inline-flex rounded-full bg-primary-soft px-3 py-1 text-sm font-semibold text-primary">{fmt(tr.branchesIn, { n: total, brand: branchInfo.brand, city: branchInfo.city })}</p>}
        {!branchInfo && <div className="mb-3" />}
        {isLoading ? (
          <CardSkeletons />
        ) : results.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-soft text-primary"><SearchX className="h-8 w-8" /></div>
            <p className="text-muted-foreground">{tr.noResults}</p>
            {s.q.trim().length >= 2 && (
              <Button variant="hero" size="lg" onClick={addNow} disabled={busy}>
                {"\u2795"} {fmt(tr.addCompanyNow, { name: s.q.trim() })}
              </Button>
            )}
            {s.q.trim().length >= 3 && (
              <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-border bg-card text-left">
                <ExternalResults q={s.q.trim()} />
              </div>
            )}
          </div>
        ) : (
          <CompanyGrid items={results} onOpen={openCo} hasMore={!!pages.hasNextPage} loadingMore={pages.isFetchingNextPage} loadMore={loadMore} />
        )}
      </main>
      <Footer />
      {writeFor && (
        <WriteReviewModal
          open
          preselected={writeFor}
          onClose={() => setWriteFor(null)}
          onCreateCompany={() => setWriteFor(null)}
          onSubmitted={() => setWriteFor(null)}
        />
      )}
    </div>
  );
}
