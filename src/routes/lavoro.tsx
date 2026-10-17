import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { searchAdzuna } from "@/lib/public.functions";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { useLang } from "@/lib/lang";
import { useBenefitIds } from "@/lib/company-query";
import { Switch } from "@/components/ui/switch";
import { OfferList, useJobOffers, useSiteSettings } from "@/components/staff/JobOffers";
import { Footer } from "@/components/staff/Sections";
import { ITALIAN_CITIES } from "@/lib/constants";
import { HomeLink } from "@/components/staff/HomeLink";
import { BusinessReturnButton } from "@/components/staff/BusinessReturnButton";


export const Route = createFileRoute("/lavoro")({
  head: () => ({
    meta: [
      { title: "Offerte di lavoro in Italia | StaffAdvisors" },
      { name: "description", content: "Offerte di lavoro dalle aziende recensite su StaffAdvisors: scopri come si lavora prima di candidarti." },
      { property: "og:title", content: "Offerte di lavoro in Italia | StaffAdvisors" },
      { property: "og:description", content: "Offerte di lavoro dalle aziende recensite su StaffAdvisors." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Lavoro,
});

function Lavoro() {
  const { tr } = useLang();
  const { data, isLoading } = useJobOffers(undefined, true);
  const settings = useSiteSettings();
  const [q, setQ] = useState("");
  const [city, setCity] = useState("");
  // Applied search: updated 500ms after typing stops, or immediately on Search.
  const [applied, setApplied] = useState({ what: "", where: "" });
  useEffect(() => {
    const t = setTimeout(() => setApplied({ what: q.trim(), where: city }), 500);
    return () => clearTimeout(t);
  }, [q, city]);
  const adzunaFn = useServerFn(searchAdzuna);
  const adz = useInfiniteQuery({
    queryKey: ["adzuna-search", applied.what.toLowerCase(), applied.where.toLowerCase()],
    queryFn: ({ pageParam }) => adzunaFn({ data: { what: applied.what, where: applied.where, page: pageParam } }),
    initialPageParam: 1,
    getNextPageParam: (last, all) => (last.offers.length >= 50 && all.length < 20 ? all.length + 1 : undefined),
    enabled: !!settings.data?.adzuna_enabled,
    staleTime: 5 * 60_000,
  });
  const adzOffers = useMemo(() => {
    const seen = new Set<string>();
    return (adz.data?.pages ?? []).flatMap((p) => p.offers).filter((o) => (seen.has(o.id) ? false : (seen.add(o.id), true)));
  }, [adz.data]);
  const [meal, setMeal] = useState(false);
  const [welfare, setWelfare] = useState(false);
  const [contract, setContract] = useState("");
  const [minSalary, setMinSalary] = useState("");
  const [poster, setPoster] = useState<"" | "private" | "agency">("");
  const offerIds = useMemo(() => Array.from(new Set((data?.offers ?? []).map((o) => o.company_id).filter((x): x is string => !!x))), [data]);
  const ben = useBenefitIds(offerIds, meal || welfare);
  const mealIds = ben.data?.meal ?? new Set<string>();
  const welfareIds = ben.data?.welfare ?? new Set<string>();
  const contracts = useMemo(
    () => [
      { value: "Permanent", label: tr.permanent },
      { value: "Fixed-term", label: tr.fixedTerm },
      { value: "Seasonal", label: tr.seasonal },
      { value: "Internship", label: tr.internship },
    ],
    [tr],
  );
  const cities = useMemo(
    () => Array.from(new Set<string>([
      ...ITALIAN_CITIES,
      ...(data?.offers ?? []).map((o) => o.city).filter((x): x is string => !!x),
    ])).sort((a, b) => a.localeCompare(b, "it")),
    [data],
  );
  const min = Number(minSalary) || 0;
  const query = applied.what.toLowerCase();
  const offers = (data?.offers ?? []).filter((o) => {
    if (meal && !(o.meal_vouchers || (o.company_id && mealIds.has(o.company_id)))) return false;
    if (welfare && !(o.company_id && welfareIds.has(o.company_id))) return false;
    if (contract && o.contract_type !== contract) return false;
    if (min && (o.salary_max ?? o.salary_min ?? 0) < min) return false;
    if (poster && (o.source !== "manual" || (o.poster_type ?? "private") !== poster)) return false;
    if (applied.where) {
      const want = applied.where.toLowerCase();
      const got = (o.city ?? "").toLowerCase();
      const gotMain = (got.split(",")[0] ?? "").trim();
      if (gotMain !== want && !got.includes(want)) return false;
    }
    if (query) {
      const hay = [o.title, o.city, o.poster_company, o.contract_type, o.description].filter((x): x is string => !!x).join(" ").toLowerCase();
      if (!hay.includes(query)) return false;
    }
    return true;
  });
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
        <HomeLink className="text-sm font-semibold text-primary">{"\u2190"} {tr.backHome}</HomeLink>
        <nav className="mt-4 flex flex-wrap items-center gap-2 text-sm font-semibold">
          <Link to="/lavoro" className="rounded-xl px-3 py-2 text-primary">{tr.jobsTitle}</Link>
          <Link to="/bacheca-disponibilita" className="rounded-xl px-3 py-2 text-primary">{tr.bacheca}</Link>
          <BusinessReturnButton />
        </nav>
        <h1 className="mt-4 text-2xl font-extrabold">{tr.jobsTitle}</h1>
        <div className="mt-6">
          {isLoading ? null : data?.enabled ? (
            <>
              <form className="mb-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); setApplied({ what: q.trim(), where: city }); }}>
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="search"
                  aria-label={tr.searchOffer}
                  placeholder={tr.searchOffer}
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  className="h-11 w-full rounded-xl border border-border bg-card pl-9 pr-3 text-sm font-medium outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <Button type="submit" variant="hero" className="h-11 rounded-xl">{tr.search}</Button>
              </form>
              <div className="mb-4 flex flex-wrap gap-2">
                <select aria-label={tr.allCities} value={city} onChange={(e) => setCity(e.target.value)} className="h-10 rounded-xl border border-border bg-card px-3 text-sm font-medium">
                  <option value="">{tr.allCities}</option>
                  {cities.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <label className="flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-border bg-card px-3 text-sm font-medium"><Switch checked={meal} onCheckedChange={setMeal} /> {"\ud83c\udfab"} {tr.onlyMeal}</label>
                <label className="flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-border bg-card px-3 text-sm font-medium"><Switch checked={welfare} onCheckedChange={setWelfare} /> {"\u2764\ufe0f"} {tr.onlyWelfare}</label>
                <select aria-label={tr.contractType} value={contract} onChange={(e) => setContract(e.target.value)} className="h-10 rounded-xl border border-border bg-card px-3 text-sm font-medium">
                  <option value="">{tr.contractType}</option>
                  {contracts.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
                <input aria-label={tr.salaryMin} inputMode="numeric" placeholder={tr.salaryMin} value={minSalary} onChange={(e) => setMinSalary(e.target.value.replace(/[^0-9]/g, ""))} className="h-10 w-40 rounded-xl border border-border bg-card px-3 text-sm font-medium" />
                <select aria-label={tr.filterPoster} value={poster} onChange={(e) => setPoster(e.target.value as typeof poster)} className="h-10 rounded-xl border border-border bg-card px-3 text-sm font-medium">
                  <option value="">{tr.filterPoster}</option>
                  <option value="private">{tr.directHire}</option>
                  <option value="agency">{tr.viaAgency}</option>
                </select>
              </div>
              <OfferList offers={offers} />
              {settings.data?.adzuna_enabled && (
                <section className="mt-8">
                  <h2 className="mb-3 text-lg font-bold">{tr.adzunaMore}</h2>
                  {adz.isPending ? (
                    <p className="text-sm text-muted-foreground">...</p>
                  ) : (
                    <>
                      <OfferList offers={adzOffers} showCta={false} />
                      {adz.hasNextPage && (
                        <Button variant="soft" className="mt-4" disabled={adz.isFetchingNextPage} onClick={() => void adz.fetchNextPage()}>
                          {adz.isFetchingNextPage ? "..." : tr.adzunaLoadMore}
                        </Button>
                      )}
                    </>
                  )}
                </section>
              )}
            </>
          ) : (
            <div className="rounded-2xl border border-border bg-card p-10 text-center shadow-card">
              <p className="text-4xl">{"\ud83d\ude80"}</p>
              <p className="mt-3 text-lg font-bold">{tr.jobsSoon}</p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
