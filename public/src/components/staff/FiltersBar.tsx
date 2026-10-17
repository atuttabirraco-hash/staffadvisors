import { REGIONS, SECTORS, COUNTRY_CODES, countryEn } from "@/lib/constants";
import { useLang } from "@/lib/lang";
import { Switch } from "@/components/ui/switch";
import { fmt } from "@/lib/i18n";
import { Heart, Ticket } from "lucide-react";

export type Filters = { country?: string; region: string; sector: string; verifiedOnly: boolean; meal?: boolean; welfare?: boolean };

const selectCls =
  "h-11 min-w-0 w-full rounded-xl border border-border bg-card px-3 text-sm font-medium outline-none focus:ring-2 focus:ring-ring";

export function FiltersBar({
  filters,
  onChange,
  count,
}: {
  filters: Filters;
  onChange: (f: Filters) => void;
  count: number;
}) {
  const { tr, lang } = useLang();
  let dn: Intl.DisplayNames | null = null;
  try { dn = new Intl.DisplayNames([lang], { type: "region" }); } catch { dn = null; }
  const countries = COUNTRY_CODES.map((c) => ({ value: countryEn(c), label: dn?.of(c) ?? countryEn(c) }))
    .sort((a, b) => (a.value === "Italy" ? -1 : b.value === "Italy" ? 1 : a.label.localeCompare(b.label, lang)));
  const showRegions = !filters.country || filters.country === "Italy";
  return (
    <div className="sticky top-0 z-20 -mx-4 border-b border-border bg-background/95 px-4 py-4 backdrop-blur">
      <div className="mx-auto grid max-w-7xl grid-cols-2 items-center gap-3 sm:flex sm:flex-wrap">
        <select
          className={selectCls}
          value={filters.country ?? ""}
          onChange={(e) => onChange({ ...filters, country: e.target.value, region: "" })}
          aria-label={tr.allCountries}
        >
          <option value="">{tr.allCountries}</option>
          {countries.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
        {showRegions && <select
          className={selectCls}
          value={filters.region}
          onChange={(e) => onChange({ ...filters, region: e.target.value })}
          aria-label={tr.region}
        >
          <option value="">{tr.allRegions}</option>
          {REGIONS.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>}
        <select
          className={selectCls}
          value={filters.sector}
          onChange={(e) => onChange({ ...filters, sector: e.target.value })}
          aria-label={tr.sector}
        >
          <option value="">{tr.allSectors}</option>
          {SECTORS.map((s) => (
            <option key={s} value={s}>{tr.sectors[s]}</option>
          ))}
        </select>
        <label className="col-span-2 flex min-h-10 cursor-pointer items-center justify-between gap-3 text-sm font-medium sm:col-span-1 sm:justify-start sm:rounded-xl sm:border sm:border-border sm:bg-card sm:px-3">
          <span>{tr.verifiedOnly}</span>
          <Switch className="shrink-0 sm:order-first" checked={filters.verifiedOnly} onCheckedChange={(v) => onChange({ ...filters, verifiedOnly: v })} />
        </label>
        <label className="col-span-2 flex min-h-10 cursor-pointer items-center justify-between gap-3 text-sm font-medium sm:col-span-1 sm:justify-start sm:rounded-xl sm:border sm:border-border sm:bg-card sm:px-3">
          <span className="flex min-w-0 items-center gap-2"><Ticket className="h-4 w-4 shrink-0 text-primary" /> {tr.onlyMeal}</span>
          <Switch className="shrink-0 sm:order-first" checked={!!filters.meal} onCheckedChange={(v) => onChange({ ...filters, meal: v })} />
        </label>
        <label className="col-span-2 flex min-h-10 cursor-pointer items-center justify-between gap-3 text-sm font-medium sm:col-span-1 sm:justify-start sm:rounded-xl sm:border sm:border-border sm:bg-card sm:px-3">
          <span className="flex min-w-0 items-center gap-2"><Heart className="h-4 w-4 shrink-0 text-destructive" /> {tr.onlyWelfare}</span>
          <Switch className="shrink-0 sm:order-first" checked={!!filters.welfare} onCheckedChange={(v) => onChange({ ...filters, welfare: v })} />
        </label>
        <span className="col-span-2 text-right text-xs text-muted-foreground sm:col-span-1 sm:ml-auto">{fmt(tr.showing, { n: count })}</span>
      </div>
    </div>
  );
}
