import { useCallback, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { SearchX } from "lucide-react";
import { useCompanyPages, useReviewedData } from "@/lib/company-query";
import { useLang } from "@/lib/lang";
import { type Company, type CompanyWithStats } from "@/lib/company-data";
import { Button } from "@/components/ui/button";
import { Header } from "./Header";
import { FiltersBar, type Filters } from "./FiltersBar";
import { CardSkeletons, CompanyGrid } from "./CompanyGrid";
import { BestWorst, Footer, LatestTicker } from "./Sections";
import { CompanyModal } from "./CompanyModal";
import { WriteReviewModal } from "./WriteReviewModal";
import { AddCompanyModal } from "./AddCompanyModal";

export function PlatformHome() {
  const { tr } = useLang(); const qc = useQueryClient(); const { data } = useReviewedData();
  const [filters, setFilters] = useState<Filters>({ country: "", region: "", sector: "", verifiedOnly: false });
  const [selected, setSelected] = useState<CompanyWithStats | null>(null); const [writeOpen, setWriteOpen] = useState(false); const [writeFor, setWriteFor] = useState<Company | null>(null); const [addOpen, setAddOpen] = useState(false); const [addName, setAddName] = useState(""); const [writeKey, setWriteKey] = useState(0);
  const pages = useCompanyPages({ ...(filters.country ? { country: filters.country } : {}), region: filters.region, sector: filters.sector, verified: filters.verifiedOnly, meal: !!filters.meal, welfare: !!filters.welfare });
  const visible = useMemo(() => pages.data?.pages.flatMap((p) => p.items) ?? [], [pages.data]); const total = pages.data?.pages[0]?.count ?? 0; const all = data?.companies ?? [];
  const loadMore = useCallback(() => { void pages.fetchNextPage(); }, [pages]);
  const refresh = () => { void qc.invalidateQueries({ queryKey: ["companies-page"] }); void qc.invalidateQueries({ queryKey: ["reviewed-data"] }); void qc.invalidateQueries({ queryKey: ["companies-count"] }); };
  const openWrite = (c: Company | null) => { setWriteFor(c); setWriteKey((k) => k + 1); setSelected(null); setWriteOpen(true); };
  return <div className="flex min-h-screen flex-col bg-background"><Header onWrite={() => openWrite(null)} onWriteFor={(c) => openWrite(c as Company)} showShare /><main id="results" className="mx-auto w-full max-w-7xl flex-1 px-4"><FiltersBar filters={filters} onChange={setFilters} count={total} />{pages.isLoading ? <div className="py-8"><CardSkeletons /></div> : visible.length === 0 ? <div className="flex flex-col items-center gap-4 py-20 text-center"><div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-soft text-primary"><SearchX className="h-8 w-8" /></div><p className="text-muted-foreground">{tr.noResults}</p><Button variant="hero" size="lg" onClick={() => setAddOpen(true)}>{tr.companyNotFound}</Button></div> : <div className="py-8"><CompanyGrid items={visible} onOpen={setSelected} hasMore={!!pages.hasNextPage} loadingMore={pages.isFetchingNextPage} loadMore={loadMore} /></div>}</main><LatestTicker reviews={data?.reviews ?? []} companies={all} /><BestWorst companies={all} onOpen={setSelected} /><Footer /><CompanyModal company={selected} replies={data?.replies ?? []} onClose={() => setSelected(null)} onWrite={openWrite} />{writeOpen && <WriteReviewModal key={writeKey} open={writeOpen} preselected={writeFor} onClose={() => setWriteOpen(false)} onCreateCompany={(name) => { setAddName(name); setAddOpen(true); }} onSubmitted={() => { setWriteOpen(false); refresh(); }} />}{addOpen && <AddCompanyModal open={addOpen} initialName={addName} onClose={() => setAddOpen(false)} onCreated={(c) => { setAddOpen(false); refresh(); openWrite(c); }} />}</div>;
}