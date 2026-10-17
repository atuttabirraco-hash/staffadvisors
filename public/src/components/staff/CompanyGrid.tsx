import { LoaderCircle } from "lucide-react";
import type { CompanyWithStats } from "@/lib/company-data";
import { useLang } from "@/lib/lang";
import { Button } from "@/components/ui/button";
import { CompanyCard } from "./CompanyCard";

export function CardSkeletons({ n = 6 }: { n?: number }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className="h-96 animate-pulse rounded-2xl bg-muted" />
      ))}
    </div>
  );
}

/** Grid with manual pagination so the footer remains reachable. */
export function CompanyGrid({
  items, onOpen, hasMore, loadingMore, loadMore,
}: {
  items: CompanyWithStats[]; onOpen: (c: CompanyWithStats) => void;
  hasMore: boolean; loadingMore: boolean; loadMore: () => void;
}) {
  const { tr } = useLang();
  return (
    <>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((c) => <CompanyCard key={c.id} company={c} onOpen={onOpen} />)}
      </div>
      {loadingMore && <div className="mt-5"><CardSkeletons n={3} /></div>}
      {hasMore && (
        <div className="flex justify-center py-8">
          <Button variant="outline" size="lg" onClick={loadMore} disabled={loadingMore}>
            {loadingMore && <LoaderCircle className="animate-spin" />}
            {tr.loadMoreCompanies}
          </Button>
        </div>
      )}
    </>
  );
}
