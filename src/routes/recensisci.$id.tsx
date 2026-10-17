import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Lock, PenLine } from "lucide-react";
import { getCompanyPage } from "@/lib/public.functions";
import { useLang } from "@/lib/lang";
import { WriteReviewModal } from "@/components/staff/WriteReviewModal";
import { Footer } from "@/components/staff/Sections";
import { ScorePill } from "@/components/staff/ScoreBars";
import type { Company } from "@/lib/company-data";
import { SITE_URL, SOCIAL_IMAGE } from "@/lib/site";
import { HomeLink } from "@/components/staff/HomeLink";

export const Route = createFileRoute("/recensisci/$id")({
  loader: async ({ params }) => {
    const res = await getCompanyPage({ data: { id: params.id } });
    if (!res.company) throw notFound();
    return { company: res.company };
  },
  head: ({ loaderData }) => {
    const c = loaderData?.company;
    const title = c ? `Lascia la tua recensione su ${c.name}${c.city ? " " + c.city : ""} | StaffAdvisors` : "Recensisci | StaffAdvisors";
    const desc = c
      ? `Racconta in modo anonimo come si lavora da ${c.name}${c.city ? " a " + c.city : ""}: la tua recensione aiuta altri lavoratori.`
      : "Lascia una recensione anonima sul tuo luogo di lavoro.";
    return {
      meta: [
        { title }, { name: "description", content: desc },
        { property: "og:title", content: title }, { property: "og:description", content: desc },
        { property: "og:type", content: "website" },
        { property: "og:image", content: SOCIAL_IMAGE },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:image", content: SOCIAL_IMAGE },
        { name: "robots", content: "noindex" },
      ],
    };
  },
  errorComponent: () => <p className="p-10 text-center">Errore di caricamento.</p>,
  notFoundComponent: () => <p className="p-10 text-center">Azienda non trovata.</p>,
  component: ReviewInvitePage,
});

function ReviewInvitePage() {
  const { tr } = useLang();
  const navigate = useNavigate();
  const { company } = Route.useLoaderData();
  const [open, setOpen] = useState(true);
  const c = company as unknown as Company;

  const goToCompany = () => navigate({ to: "/azienda/$id", params: { id: company.id } });

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <main className="mx-auto w-full max-w-xl flex-1 px-4 py-10">
        <HomeLink className="text-sm font-semibold text-primary">{"\u2190"} {tr.backHome}</HomeLink>
        <div className="mt-4 rounded-2xl border border-border bg-card p-6 text-center shadow-card">
          <p className="text-[11px] font-bold uppercase tracking-wide text-primary">{tr.reviewFor}</p>
          <h1 className="mt-1 text-2xl font-extrabold">{company.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{company.city}{company.region ? ` \u2022 ${company.region}` : ""}</p>
          <div className="mt-3 flex justify-center"><ScorePill value={company.avg_score ?? 0} size="lg" /></div>
          <p className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-muted/60 p-3 text-xs text-muted-foreground">
            <Lock className="h-3.5 w-3.5 shrink-0" /> {tr.trustBox}
          </p>
          <button
            onClick={() => setOpen(true)}
            className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground"
          >
            <PenLine className="h-4 w-4" /> {tr.writeReview}
          </button>
        </div>
      </main>
      <Footer />
      <WriteReviewModal
        open={open}
        preselected={c}
        onClose={goToCompany}
        onCreateCompany={() => setOpen(false)}
        onSubmitted={goToCompany}
      />
    </div>
  );
}
