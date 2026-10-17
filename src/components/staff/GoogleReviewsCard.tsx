import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Star, MessageSquarePlus, ShieldCheck } from "lucide-react";
import { getGoogleReviews } from "@/lib/staff.functions";
import { useLang } from "@/lib/lang";

/** Customer reviews from Google, shown only while a company has no employee reviews yet. */
export function GoogleReviewsCard({ companyId }: { companyId: string }) {
  const { tr } = useLang();
  const { data } = useQuery({
    queryKey: ["google-reviews", companyId],
    queryFn: () => getGoogleReviews({ data: { companyId } }),
    staleTime: 10 * 60 * 1000,
  });
  if (!data || data.reviews.length === 0) return null;
  return (
    <section className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-card">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-extrabold">{tr.gReviewsTitle}</h2>
        {data.mapsUrl && (
          <a href={data.mapsUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-primary">
            {tr.gReviewsFrom}
          </a>
        )}
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{tr.gReviewsDisclaimer}</p>
      {data.mapsUrl && (
        <a href={data.mapsUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" aria-hidden="true">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/>
          </svg>
          Powered by Google
        </a>
      )}
      <div className="mt-4">
        <Link
          to="/recensisci/$id"
          params={{ id: companyId }}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground"
        >
          <MessageSquarePlus className="h-4 w-4" /> {tr.beFirst}
        </Link>
        <p className="mt-2.5 flex items-start gap-1.5 text-xs font-medium text-muted-foreground">
          <ShieldCheck className="mt-px h-3.5 w-3.5 shrink-0 text-primary" />
          <span>{tr.gReviewsAnonymous}</span>
        </p>
      </div>
      <div className="mt-4 space-y-3">
        {data.reviews.map((r, i) => (
          <article key={i} className="rounded-xl bg-muted/60 p-4">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-0.5" aria-label={`${r.rating}/5`}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className={`h-3.5 w-3.5 ${s <= Math.round(r.rating) ? "fill-primary text-primary" : "text-muted-foreground/40"}`} />
                ))}
              </span>
              <p className="text-xs font-bold">{r.author}</p>
              {r.when && <p className="text-xs text-muted-foreground">{"\u2022"} {r.when}</p>}
            </div>
            <p className="mt-2 text-sm">{r.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
