import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Search, Star, UtensilsCrossed, PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLang } from "@/lib/lang";
import { useCompanySearch, useExternalSearch, useAddPlace, type ExternalHit } from "@/lib/company-query";
import { sectorLabel } from "@/lib/company-data";

export function SearchBox({ initial = "", onWriteFor }: { initial?: string; onWriteFor?: ((c: { id: string; name?: string | undefined }) => void) | undefined }) {
  const { tr } = useLang();
  const navigate = useNavigate();
  const [q, setQ] = useState(initial);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);

  const search = useCompanySearch(q);
  const qTrim = q.trim();
  const hits = qTrim.length < 2 ? [] : (search.data ?? []);
  // Google-backed results appear only when the local database has nothing.
  const extVisible = qTrim.length >= 3 && !search.isPending && hits.length === 0;

  const go = () => {
    setOpen(false);
    const activeHit = active >= 0 ? hits[active] : undefined;
    if (activeHit) {
      navigate({ to: "/azienda/$id", params: { id: activeHit.id } });
      return;
    }
    navigate({ to: "/aziende", search: qTrim ? { q: qTrim } : {} });
  };

  return (
    <div className="relative">
      <form
        onSubmit={(e) => { e.preventDefault(); go(); }}
        className="flex min-w-0 items-center gap-2 rounded-2xl bg-card p-1.5 shadow-card-hover sm:p-2"
      >
        <Search className="ml-2 h-5 w-5 shrink-0 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true); setActive(-1); }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, hits.length - 1)); }
            if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, -1)); }
          }}
          placeholder={tr.searchPh}
          className="h-11 min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground sm:text-base"
          aria-label={tr.search}
          role="combobox"
          aria-expanded={open && (hits.length > 0 || extVisible)}
        />
        <Button type="submit" variant="hero" size="lg" className="h-11 w-11 shrink-0 rounded-xl px-0 sm:w-auto sm:px-6">
          <span className="hidden sm:inline">{tr.search}</span>
          <Search className="h-4 w-4 sm:hidden" />
        </Button>
      </form>
      {open && (hits.length > 0 || extVisible) && (
        <div role="listbox" className="absolute left-0 right-0 top-full z-30 mt-2 max-h-[28rem] overflow-y-auto overflow-hidden rounded-2xl border border-border bg-popover text-foreground shadow-card-hover">
          {hits.map((c, i) => (
            <div key={c.id} role="option" aria-selected={i === active}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => { setOpen(false); navigate({ to: "/azienda/$id", params: { id: c.id } }); }}
                className={`flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted ${i === active ? "bg-muted" : ""}`}
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">{c.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{c.full_address ?? c.city} {"\u2022"} {sectorLabel(c.sector, tr)}</p>
                </div>
                {c.mealVouchers && (
                  <span className="hidden items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[11px] font-semibold text-success sm:inline-flex">
                    <UtensilsCrossed className="h-3 w-3" /> {tr.mealVouchers}
                  </span>
                )}
                <span className="flex shrink-0 items-center gap-1 text-sm font-bold">
                  <Star className="h-4 w-4 fill-primary text-primary" /> {c.reviewCount ? c.overall.toFixed(1) : "-"}
                  <span className="text-xs font-normal text-muted-foreground">({c.reviewCount})</span>
                </span>
              </button>
              {onWriteFor && (
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => { setOpen(false); onWriteFor(c); }}
                  aria-label={tr.writeReview}
                  title={tr.writeReview}
                  className="flex items-center gap-1 border-t border-border px-4 py-2 text-xs font-semibold text-primary hover:bg-primary-soft"
                >
                  <PenLine className="h-3.5 w-3.5" /> {tr.writeReview}
                </button>
              )}
            </div>
          ))}
          {extVisible && <ExternalResults q={qTrim} onPicked={() => setOpen(false)} onWriteFor={onWriteFor} />}
        </div>
      )}
    </div>
  );
}

/** Google results shown when the local database has no match; picking one saves the company for good. */
export function ExternalResults({ q, onPicked, onWriteFor }: { q: string; onPicked?: () => void; onWriteFor?: ((c: { id: string; name?: string | undefined }) => void) | undefined }) {
  const { tr } = useLang();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const ext = useExternalSearch(q);
  const addPlace = useAddPlace();
  const [busy, setBusy] = useState<string | null>(null);

  const pick = async (placeId: string, write = false) => {
    setBusy(placeId);
    try {
      const res = await addPlace.mutateAsync(placeId);
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["companies-page"] }),
        qc.invalidateQueries({ queryKey: ["companies-search"] }),
        qc.invalidateQueries({ queryKey: ["companies-count"] }),
      ]);
      if (write && onWriteFor) onWriteFor(res);
      else navigate({ to: "/azienda/$id", params: { id: res.id } });
      onPicked?.();
    } catch {
      toast.error(tr.extError);
    } finally {
      setBusy(null);
    }
  };

  if (ext.isPending || (ext.data ?? []).length === 0) return null;
  return (
    <div className="border-t border-border">
      <p className="px-4 pb-1 pt-3 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">{tr.googleResults}</p>
      <div className="pb-2">
        {(ext.data ?? []).map((h: ExternalHit) => (
          <div key={h.placeId} role="option" aria-selected={false}>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              disabled={!!busy}
              onClick={() => void pick(h.placeId)}
              className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">{h.name}</p>
                {h.address && <p className="truncate text-xs text-muted-foreground">{h.address}</p>}
              </div>
              <span className="shrink-0 text-xs font-semibold text-primary">
                {busy === h.placeId ? tr.adding : tr.extAdd}
              </span>
            </button>
            {onWriteFor && (
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                disabled={!!busy}
                onClick={() => void pick(h.placeId, true)}
                aria-label={tr.writeReview}
                title={tr.writeReview}
                className="flex items-center gap-1 border-t border-border px-4 py-2 text-xs font-semibold text-primary hover:bg-primary-soft"
              >
                <PenLine className="h-3.5 w-3.5" /> {busy === h.placeId ? tr.adding : tr.writeReview}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
