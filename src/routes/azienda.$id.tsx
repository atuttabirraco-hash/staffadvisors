import { createFileRoute, Link, notFound, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { Check, Copy, MessageSquareReply, UserRound, Users } from "lucide-react";
import { ReplyRequestModal } from "@/components/staff/ReplyRequestModal";
import { getCompanyPage } from "@/lib/public.functions";
import { buildCompanies, contractLabel, aiSummary, sectorLabel, type Review } from "@/lib/company-data";
import { useLang } from "@/lib/lang";
import { ScoreBars, ScorePill } from "@/components/staff/ScoreBars";
import { VerifiedBadge } from "@/components/staff/VerifiedBadge";
import { BenefitsCard } from "@/components/staff/BenefitsCard";
import { TrendCard } from "@/components/staff/TrendCard";
import { CompanyJobs } from "@/components/staff/JobOffers";
import { Footer } from "@/components/staff/Sections";
import { BranchesCard } from "@/components/staff/BranchesCard";
import { ShareButtons } from "@/components/staff/ShareButtons";
import { GoogleReviewsCard } from "@/components/staff/GoogleReviewsCard";
import { isHospitality } from "@/lib/constants";
import { SITE_URL, SOCIAL_IMAGE, companySlug } from "@/lib/site";
import { reviewCode } from "@/lib/review-id";
import { HomeLink } from "@/components/staff/HomeLink";

export const Route = createFileRoute("/azienda/$id")({
  loader: async ({ params }) => {
    const res = await getCompanyPage({ data: { id: params.id } });
    if (!res.company) throw notFound();
    const slug = companySlug(res.company);
    if (params.id !== slug) throw redirect({ to: "/azienda/$id", params: { id: slug }, statusCode: 301, replace: true });
    return res as typeof res & { company: NonNullable<typeof res.company>; reviews: Review[] };
  },
  head: ({ loaderData, params }) => {
    const c = loaderData?.company;
    const title = c ? `Recensioni ${c.name}${c.city ? " " + c.city : ""} - Come si lavora davvero | StaffAdvisors` : "Azienda | StaffAdvisors";
    const desc = c
      ? `Recensioni anonime dei dipendenti di ${c.name}${c.city ? " a " + c.city : ""}: stipendio, turni, gestione, crescita, sicurezza e ambiente. Per scrivere una recensione serve un account gratuito.`
      : "Recensioni anonime sui luoghi di lavoro in Italia: per scriverne una serve un account gratuito.";
    const url = `${SITE_URL}/azienda/${c ? companySlug(c) : params.id}`;
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
  errorComponent: () => <p className="p-10 text-center">Errore di caricamento.</p>,
  notFoundComponent: () => <p className="p-10 text-center">Azienda non trovata.</p>,
  component: CompanyPage,
});

function CompanyPage() {
  const { tr } = useLang();
  const d = Route.useLoaderData();
  const [copied, setCopied] = useState(false);
  const [replyFor, setReplyFor] = useState<string | null>(null);
  const [c] = buildCompanies([d.company], d.reviews);
  if (!c) return null;
  const shareTitle = `Recensioni di ${c.name}${c.city ? " " + c.city : ""} su StaffAdvisors`;
  const inviteUrl = `${SITE_URL}/recensisci/${c.id}`;
  const copyInvite = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = inviteUrl;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
        <HomeLink className="text-sm font-semibold text-primary">{"\u2190"} {tr.backHome}</HomeLink>
        <header className="mt-4 flex items-start justify-between gap-4 rounded-2xl border border-border bg-card p-5 shadow-card">
          <div>
            <h1 className="text-2xl font-extrabold">{c.name}</h1>
            <p className="text-xs text-muted-foreground">{c.legal_name} {c.vat ? `\u2022 ${tr.vat} ${c.vat}` : ""}</p>
            {c.full_address && <p className="mt-1 text-sm font-medium">{c.full_address}</p>}
            <p className="mt-1 text-sm text-muted-foreground">{c.city} {c.region ? `\u2022 ${c.region}` : ""} {"\u2022"} {sectorLabel(c.sector, tr)}</p>
          </div>
          <div className="text-right">
            <ScorePill value={c.overall} size="lg" />
            <p className="mt-1 text-xs text-muted-foreground">{c.reviewCount} {tr.reviews}</p>
          </div>
        </header>
        <ShareButtons url={`${SITE_URL}/azienda/${companySlug(d.company)}`} title={shareTitle} />
        <div className="mt-4 rounded-2xl border border-border bg-card p-4 shadow-card">
          <p className="flex items-center gap-2 text-sm font-bold"><Users className="h-4 w-4 text-primary" /> {tr.inviteEmployees}</p>
          <p className="mt-1 text-xs text-muted-foreground">{tr.inviteText}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <code className="max-w-full flex-1 truncate rounded-xl bg-muted px-3 py-2 text-xs">{inviteUrl}</code>
            <button
              onClick={copyInvite}
              aria-label={copied ? tr.shareCopied : tr.shareCopy}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-xs font-bold text-primary-foreground"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? tr.shareCopied : tr.shareCopy}
            </button>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`${tr.reviewFor}: ${c.name} - ${inviteUrl}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-bold"
            >
              WhatsApp
            </a>
          </div>
        </div>
        <p className="mt-4 rounded-2xl bg-primary-soft p-4 text-sm">{aiSummary(c, tr)}</p>
        {c.reviews.length > 0 && (
          <>
            <div className="mt-4"><ScoreBars scores={c.scores} extraScores={isHospitality(c.sector) ? c.extraScores : undefined} /></div>
            <BranchesCard id={c.id} brand={c.parent_brand} city={c.city} />
            <BenefitsCard c={c} />
            <TrendCard reviews={d.reviews} />
          </>
        )}
        {c.reviews.length === 0 && <BranchesCard id={c.id} brand={c.parent_brand} city={c.city} />}
        <CompanyJobs companyId={c.id} />
        {c.reviews.length === 0 && <GoogleReviewsCard companyId={c.id} />}
        <div className="mt-6 space-y-4">
          {c.reviews.map((r) => (
            <article key={r.id} className="rounded-2xl border border-border bg-card p-4 shadow-card">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted"><UserRound className="h-4 w-4 text-muted-foreground" /></div>
                <p className="flex-1 text-sm font-bold">{r.role} <span className="font-normal text-muted-foreground">{"\u2022"} {contractLabel(r.contract_type, tr)}</span></p>
                <VerifiedBadge verified={r.is_verified} />
              </div>
              <p className="mt-1 font-mono text-[11px] font-semibold text-muted-foreground">ID {reviewCode(r.id)}</p>
              <p className="mt-3 text-sm"><b className="text-success">{tr.pro}: </b>{r.pro}</p>
              <p className="mt-1 text-sm"><b className="text-destructive">{tr.cons}: </b>{r.cons}</p>
              {(() => {
                const rep = d.replies.find((x) => x.review_id === r.id);
                return rep ? (
                  <div className="mt-3 rounded-xl border-l-4 border-primary bg-muted/60 p-3">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-primary">{tr.companyReply}{rep.is_verified ? <span className="ml-2 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold normal-case tracking-normal">{tr.replyVerifiedBadge}</span> : null}</p>
                    <p className="mt-1 text-sm">{rep.reply_text}</p>
                  </div>
                ) : (
                  <button onClick={() => setReplyFor(r.id)} className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-primary">
                    <MessageSquareReply className="h-3.5 w-3.5" /> {tr.rightToReply}
                  </button>
                );
              })()}
            </article>
          ))}
        </div>
      </main>
      <ReplyRequestModal reviewId={replyFor} companyId={c.id} companyName={c.name} onClose={() => setReplyFor(null)} />
      <Footer />
    </div>
  );
}
