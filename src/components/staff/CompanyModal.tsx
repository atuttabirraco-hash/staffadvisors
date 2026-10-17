import { useMemo, useState } from "react";
import { Flag, MessageSquareReply, ShieldCheck, Sparkles, ThumbsUp, UserRound } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useLang } from "@/lib/lang";
import { SCORE_KEYS } from "@/lib/constants";
import { bestWorstKeys, computeScores, contractLabel, initials, sectorLabel, type CompanyWithStats, type Reply, type Review } from "@/lib/company-data";
import { markHelpful } from "@/lib/staff.functions";
import { reportReview } from "@/lib/contact.functions";
import { ScoreBars, ScorePill } from "./ScoreBars";
import { VerifiedBadge } from "./VerifiedBadge";
import { Link } from "@tanstack/react-router";
import { ReplyRequestModal } from "./ReplyRequestModal";
import { reviewCode } from "@/lib/review-id";


export function CompanyModal({
  company,
  replies,
  onClose,
  onWrite,
}: {
  company: CompanyWithStats | null;
  replies: Reply[];
  onClose: () => void;
  onWrite: (c: CompanyWithStats) => void;
}) {
  const { tr, lang } = useLang();
  const [role, setRole] = useState("");
  const [helpful, setHelpful] = useState<Record<string, number>>({});
  const helpfulFn = useServerFn(markHelpful);
  const reportFn = useServerFn(reportReview);
  const [reported, setReported] = useState<Record<string, boolean>>({});
  const [replyFor, setReplyFor] = useState<string | null>(null);

  const roles = useMemo(() => Array.from(new Set((company?.reviews ?? []).map((r) => r.role).filter(Boolean) as string[])), [company]);
  const filtered = useMemo(() => (company?.reviews ?? []).filter((r) => !role || r.role === role), [company, role]);
  const scores = useMemo(() => computeScores(filtered), [filtered]);

  if (!company) return null;
  const { best, worst } = company.reviewCount ? bestWorstKeys(company.scores) : { best: null, worst: null };
  const pros = company.reviews.map((r) => r.pro).filter(Boolean).slice(0, 3);
  const cons = company.reviews.map((r) => r.cons).filter(Boolean).slice(0, 3);
  const repliesByReview = new Map(replies.map((r) => [r.review_id, r]));

  const vote = async (r: Review) => {
    if (helpful[r.id]) return;
    try {
      const res = await helpfulFn({ data: { review_id: r.id } });
      setHelpful((h) => ({ ...h, [r.id]: res.helpful_count }));
    } catch {
      toast.error(tr.errorGeneric);
    }
  };

  return (
    <Dialog open={!!company} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[92vh] w-[calc(100%-1.5rem)] max-w-3xl overflow-y-auto overflow-x-hidden rounded-2xl p-0 sm:w-full">
        <DialogHeader className="border-b border-border bg-muted/40 p-5 text-left sm:p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-secondary text-lg font-bold text-secondary-foreground">
              {initials(company.name)}
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-xl font-extrabold leading-tight">{company.name}</DialogTitle>
              <Link to="/azienda/$id" params={{ id: company.id }} className="text-xs font-semibold text-primary underline">{tr.companyPage}</Link>
              <DialogDescription className="mt-0.5 text-xs">
                {company.legal_name} {company.vat ? `\u2022 ${tr.vat} ${company.vat}` : ""}
              </DialogDescription>
              <p className="mt-1 text-xs text-muted-foreground">
                {company.city} {company.region ? `\u2022 ${company.region}` : ""} {"\u2022"} {sectorLabel(company.sector, tr)}
              </p>
            </div>
            <div className="text-right">
              <ScorePill value={company.overall} size="lg" />
              <p className="mt-1 text-[11px] text-muted-foreground">{company.reviewCount} {tr.reviews}</p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 p-5 sm:p-6">
          <div className="rounded-2xl bg-primary-soft p-4">
            <p className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-primary">
              <Sparkles className="h-3 w-3" /> {tr.aiProsCons}
            </p>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-bold text-success">{tr.pro} {best ? `\u2022 ${tr[best]}` : ""}</p>
                <ul className="mt-1 space-y-1 text-xs text-foreground/80">
                  {pros.length ? pros.map((p, i) => <li key={i}>+ {p}</li>) : <li>{tr.summaryEmpty}</li>}
                </ul>
              </div>
              <div>
                <p className="text-xs font-bold text-destructive">{tr.cons} {worst ? `\u2022 ${tr[worst]}` : ""}</p>
                <ul className="mt-1 space-y-1 text-xs text-foreground/80">
                  {cons.map((c, i) => <li key={i}>- {c}</li>)}
                </ul>
              </div>
            </div>
          </div>

          <div>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h4 className="text-sm font-bold">{tr.overall}</h4>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="h-9 rounded-xl border border-border bg-card px-3 text-xs font-medium"
                aria-label={tr.filterByRole}
              >
                <option value="">{tr.allRoles}</option>
                {roles.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <ScoreBars scores={scores} />
          </div>

          <div className="space-y-4">
            {filtered.map((r) => {
              const reply = repliesByReview.get(r.id);
              const rs = SCORE_KEYS.map((k) => [k, r[`score_${k}` as const]] as const);
              return (
                <article key={r.id} className="rounded-2xl border border-border bg-card p-4 shadow-card">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted">
                      <UserRound className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold">
                        {r.role} <span className="font-normal text-muted-foreground">{"\u2022"} {contractLabel(r.contract_type, tr)}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">{tr.anonymous}</p>
                      <p className="mt-0.5 font-mono text-[11px] font-semibold text-muted-foreground">ID {reviewCode(r.id)}</p>
                    </div>
                    <VerifiedBadge verified={r.is_verified} />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {rs.map(([k, v]) => (
                      <span key={k} className="rounded-lg bg-muted px-2 py-0.5 text-[11px]">
                        {tr[k]} <b>{v}</b>
                      </span>
                    ))}
                  </div>
                  <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                    <p><span className="font-bold text-success">{tr.pro}: </span>{r.pro}</p>
                    <p><span className="font-bold text-destructive">{tr.cons}: </span>{r.cons}</p>
                  </div>
                  {r.advice && (
                    <p className="mt-2 text-sm text-muted-foreground"><span className="font-semibold">{tr.advice}: </span>{r.advice}</p>
                  )}
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => vote(r)} disabled={!!helpful[r.id]}>
                      <ThumbsUp className="h-3.5 w-3.5" /> {tr.helpful} ({helpful[r.id] ?? r.helpful_count})
                    </Button>
                    <Button size="sm" variant="ghost" disabled={!!reported[r.id]} onClick={async () => { setReported((x) => ({ ...x, [r.id]: true })); try { await reportFn({ data: { review_id: r.id } }); toast.success(tr.reportSent); } catch { toast.error(tr.errorGeneric); } }}>
                      <Flag className="h-3.5 w-3.5" /> {tr.report}
                    </Button>
                    {!reply && (
                      <Button size="sm" variant="ghost" onClick={() => setReplyFor(r.id)}>
                        <MessageSquareReply className="h-3.5 w-3.5" /> {tr.rightToReply}
                      </Button>
                    )}
                  </div>
                  {reply && (
                    <div className="mt-3 rounded-xl border-l-4 border-primary bg-muted/60 p-3">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-primary">{tr.companyReply}{reply.is_verified ? <span className="ml-2 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold normal-case tracking-normal">{tr.replyVerifiedBadge}</span> : null}</p>
                      <p className="mt-1 text-sm">{reply.reply_text}</p>
                    </div>
                  )}
                </article>
              );
            })}
          </div>

          <div className="flex flex-col gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
            <Button variant="hero" onClick={() => onWrite(company)}>
              {tr.writeReview}
            </Button>
          </div>
          <p className="sr-only">{lang}</p>
          <ReplyRequestModal reviewId={replyFor} companyId={company.id} companyName={company.name} onClose={() => setReplyFor(null)} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
