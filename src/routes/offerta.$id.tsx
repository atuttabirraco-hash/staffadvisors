import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ExternalLink, Star } from "lucide-react";
import { getOfferById, type JobOffer } from "@/lib/public.functions";
import { useLang } from "@/lib/lang";
import { Footer } from "@/components/staff/Sections";
import { ContactReveal } from "@/components/staff/JobOffers";
import { SITE_URL, SOCIAL_IMAGE } from "@/lib/site";

export const Route = createFileRoute("/offerta/$id")({
  loader: async ({ params }): Promise<JobOffer> => {
    const offer = await getOfferById({ data: { id: params.id } });
    if (!offer) throw notFound();
    return offer;
  },
  head: ({ params, loaderData }) => {
    const o = loaderData;
    const title = o ? `${o.title}${o.city ? " - " + o.city : ""} | StaffAdvisors` : "Offerta di lavoro | StaffAdvisors";
    const desc = o
      ? `${o.title}${o.poster_company ? " da " + o.poster_company : ""}${o.city ? " a " + o.city : ""}. Candidati su StaffAdvisors: recensioni anonime e offerte di lavoro vere.`
      : "Offerta di lavoro su StaffAdvisors.";
    const url = `${SITE_URL}/offerta/${params.id}`;
    return {
      meta: [
        { title }, { name: "description", content: desc },
        { property: "og:title", content: title }, { property: "og:description", content: desc },
        { property: "og:type", content: "article" }, { property: "og:url", content: url },
        { property: "og:image", content: SOCIAL_IMAGE },
        { property: "og:image:width", content: "1200" }, { property: "og:image:height", content: "630" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title }, { name: "twitter:description", content: desc },
        { name: "twitter:image", content: SOCIAL_IMAGE },
      ],
      links: [{ rel: "canonical", href: url }],
    };
  },
  notFoundComponent: () => <p className="p-10 text-center">Offerta non trovata.</p>,
  component: OfferPage,
});

function OfferPage() {
  const { tr } = useLang();
  const o = Route.useLoaderData();
  const salary = o.salary_visible && o.salary_min
    ? `${o.salary_min}${o.salary_max ? `-${o.salary_max}` : "+"} EUR/mese`
    : o.salary_range;
  const poster = o.poster_type === "agency" ? (o.agency_name ?? tr.viaAgency) : o.poster_company;
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
        <Link to="/lavoro" className="text-sm font-semibold text-primary">{"\u2190"} {tr.jobsTitle}</Link>
        <article className="mt-4 rounded-2xl border border-border bg-card p-6 shadow-card">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            {o.is_premium && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-0.5 text-xs font-bold text-primary-foreground">
                <Star className="h-3 w-3" /> {tr.directOffer}
              </span>
            )}
            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${o.poster_type === "agency" ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"}`}>
              {o.poster_type === "agency" ? tr.viaAgency : tr.directHire}
            </span>
          </div>
          <h1 className="text-2xl font-extrabold">{o.title}</h1>
          {poster && <p className="mt-1 text-sm font-semibold text-foreground/80">{poster}</p>}
          <p className="mt-2 text-sm text-muted-foreground">
            {[o.city, o.address, o.contract_type, salary, o.positions && o.positions > 1 ? `${o.positions} ${tr.positions.toLowerCase()}` : null].filter(Boolean).join(" \u2022 ")}
          </p>
          {o.meal_vouchers && <span className="mt-2 inline-flex rounded-full bg-success/15 px-2 py-0.5 text-[11px] font-bold text-success">{"\ud83c\udfab"} {tr.mealIncluded}</span>}
          {o.description && <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-foreground/90">{o.description}</p>}
          <div className="mt-5 flex flex-wrap items-center gap-4">
            {o.apply_link && (
              <a href={o.apply_link} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
                {tr.apply} <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
            <ContactReveal offerId={o.id} title={o.title} />
          </div>
        </article>
      </main>
      <Footer />
    </div>
  );
}
