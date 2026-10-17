import { useEffect, useState } from "react";
import { useInfiniteQuery, useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { REVIEW_COLS, buildCompanies, type Company, type CompanyWithStats, type Review } from "./company-data";
import { searchExternalCompanies, createCompanyFromPlace } from "./staff.functions";

export const PAGE = 24;

export type CompanyFilters = {
  q?: string; country?: string; region?: string; city?: string; sector?: string; rating?: number;
  meal?: boolean; welfare?: boolean; verified?: boolean; trend?: string;
};

const clean = (w: string) => w.replace(/[%,()*\\."']/g, "").trim();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyFilters(q: any, f: CompanyFilters) {
  for (const w of (f.q ?? "").split(/\s+/).map(clean).filter((x) => x.length > 0)) {
    q = q.or(`name.ilike.%${w}%,legal_name.ilike.%${w}%,vat.ilike.%${w}%,city.ilike.%${w}%,region.ilike.%${w}%,sector.ilike.%${w}%`);
  }
  if (f.country) q = q.eq("country", f.country);
  if (f.region) q = q.eq("region", f.region);
  if (f.city) q = q.ilike("city", `${clean(f.city)}%`);
  if (f.sector) q = q.eq("sector", f.sector);
  if (f.rating) q = q.gte("avg_score", f.rating).gt("review_count", 0);
  if (f.meal) q = q.eq("has_meal", true);
  if (f.welfare) q = q.eq("has_welfare", true);
  if (f.verified) q = q.gt("verified_count", 0);
  if (f.trend === "up") q = q.gt("trend", 0.2);
  if (f.trend === "down") q = q.lt("trend", -0.2);
  return q;
}

/** Attach review stats to a page of companies (fetches only their reviews). */
async function withReviews(rows: Company[]): Promise<CompanyWithStats[]> {
  const ids = rows.filter((c) => c.review_count > 0).map((c) => c.id);
  let reviews: Review[] = [];
  if (ids.length) {
    const r = await supabase.from("reviews").select(REVIEW_COLS).eq("status", "approved").in("company_id", ids);
    if (r.error) throw r.error;
    reviews = r.data as Review[];
  }
  return buildCompanies(rows, reviews);
}

export function useCompanyPages(f: CompanyFilters) {
  return useInfiniteQuery({
    queryKey: ["companies-page", f],
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const from = pageParam as number;
      const base = supabase.from("companies").select("*", from === 0 ? { count: "exact" } : {});
      const { data, error, count } = await applyFilters(base, f)
        .order("review_count", { ascending: false }).order("name").order("id")
        .range(from, from + PAGE - 1);
      if (error) throw error;
      return { items: await withReviews((data ?? []) as Company[]), count: count as number | null, next: (data?.length ?? 0) === PAGE ? from + PAGE : null };
    },
    getNextPageParam: (last) => last.next ?? undefined,
  });
}

export function useCompanyCount() {
  return useQuery({
    queryKey: ["companies-count"],
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { count, error } = await supabase.from("companies").select("id", { count: "exact", head: true });
      if (error) throw error;
      return count ?? 0;
    },
  });
}

export function useDebounced<T>(v: T, ms = 400) {
  const [d, setD] = useState(v);
  useEffect(() => { const t = setTimeout(() => setD(v), ms); return () => clearTimeout(t); }, [v, ms]);
  return d;
}

/** Autocomplete: max 10 rows, debounced 400ms. */
export function useCompanySearch(text: string) {
  const q = useDebounced(text.trim(), 400);
  return useQuery({
    queryKey: ["companies-search", q],
    enabled: q.length >= 2,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await applyFilters(supabase.from("companies").select("*"), { q })
        .order("review_count", { ascending: false }).order("name").limit(10);
      if (error) throw error;
      return withReviews((data ?? []) as Company[]);
    },
  });
}

/** Companies with reviews + latest reviews + replies, for ticker / best-worst / modal. */
export function useReviewedData() {
  return useQuery({
    queryKey: ["reviewed-data"],
    queryFn: async () => {
      const [c, r, p] = await Promise.all([
        supabase.from("companies").select("*").gt("review_count", 0).order("review_count", { ascending: false }).limit(500),
        supabase.from("reviews").select(REVIEW_COLS).eq("status", "approved").order("created_at", { ascending: false }).limit(1000),
        supabase.from("company_replies").select("*").limit(1000),
      ]);
      if (c.error) throw c.error;
      if (r.error) throw r.error;
      if (p.error) throw p.error;
      const reviews = r.data as Review[];
      return { companies: buildCompanies(c.data as Company[], reviews), reviews, replies: p.data };
    },
  });
}

/** Ids of companies with meal vouchers / welfare among a given set (used by /lavoro). */
export function useBenefitIds(ids: string[], enabled: boolean) {
  return useQuery({
    queryKey: ["benefit-ids", ids],
    enabled: enabled && ids.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase.from("companies").select("id, has_meal, has_welfare").in("id", ids);
      if (error) throw error;
      return { meal: new Set(data.filter((c) => c.has_meal).map((c) => c.id)), welfare: new Set(data.filter((c) => c.has_welfare).map((c) => c.id)) };
    },
  });
}

export type Branch = { id: string; name: string; address: string | null; full_address: string | null; city: string | null; review_count: number; avg_score: number };

/** All branches of a brand in a city (or everywhere when city is empty). */
export function useBranches(brand: string | null | undefined, city?: string | null) {
  return useQuery({
    queryKey: ["branches", brand, city ?? ""],
    enabled: !!brand,
    staleTime: 60_000,
    queryFn: async () => {
      let q = supabase.from("companies").select("id, name, address, full_address, city, review_count, avg_score").eq("parent_brand", brand!);
      if (city) q = q.ilike("city", city);
      const { data, error } = await q.order("address").limit(200);
      if (error) throw error;
      return data as Branch[];
    },
  });
}

/** Brand-wide aggregated rating across all branches. */
export function useBrandStats(brand: string | null | undefined) {
  return useQuery({
    queryKey: ["brand-stats", brand],
    enabled: !!brand,
    queryFn: async () => {
      const { data, error } = await supabase.from("companies").select("avg_score, review_count").eq("parent_brand", brand!).gt("review_count", 0).limit(1000);
      if (error) throw error;
      const { count } = await supabase.from("companies").select("id", { count: "exact", head: true }).eq("parent_brand", brand!);
      const n = data.reduce((a, c) => a + c.review_count, 0);
      return { branches: count ?? 0, reviews: n, avg: n ? data.reduce((a, c) => a + c.avg_score * c.review_count, 0) / n : 0 };
    },
  });
}

export type ExternalHit = { placeId: string; name: string; address: string | null; kind: string | null };

/** Google-backed national search: used only when the local database has no match. */
export function useExternalSearch(text: string) {
  const q = useDebounced(text.trim(), 500);
  const fn = useServerFn(searchExternalCompanies);
  return useQuery({
    queryKey: ["external-search", q],
    enabled: q.length >= 3,
    staleTime: 10 * 60_000,
    queryFn: async () => {
      const res = await fn({ data: { query: q } });
      return res.ok ? res.hits : ([] as ExternalHit[]);
    },
  });
}

/** Save a company found on Google into the database permanently (runs once per place). */
export function useAddPlace() {
  const fn = useServerFn(createCompanyFromPlace);
  return useMutation({ mutationFn: (placeId: string) => fn({ data: { placeId } }) });
}
