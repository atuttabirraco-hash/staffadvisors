import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { MessageSquare, Search, Star, ExternalLink } from "lucide-react";
import { useLang } from "@/lib/lang";
import { reviewsCopy } from "@/lib/business-reviews-copy";
import { getMyCompanyReviews, linkMyCompany, replyAsCompany, searchMyCompany } from "@/lib/business-reviews.functions";
import { Button } from "@/components/ui/button";

type Data = Awaited<ReturnType<typeof getMyCompanyReviews>>;
const inputCls = "h-10 w-full rounded-xl border border-input bg-background px-3 text-sm";

export function BusinessReviews() {
  const { lang } = useLang();
  const c = reviewsCopy[lang];
  const load = useServerFn(getMyCompanyReviews);
  const search = useServerFn(searchMyCompany);
  const link = useServerFn(linkMyCompany);
  const reply = useServerFn(replyAsCompany);
  const [data, setData] = useState<Data | null>(null);
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<{ id: string; name: string; city: string | null; address: string | null }[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const refresh = async () => setData(await load());
  useEffect(() => { void refresh(); }, []);
  useEffect(() => {
    if (q.trim().length < 2) { setHits([]); return; }
    const t = setTimeout(() => { void search({ data: { q } }).then(setHits).catch(() => setHits([])); }, 300);
    return () => clearTimeout(t);
  }, [q]);

  const choose = async (id: string | null) => { await link({ data: { company_id: id } }); setQ(""); setHits([]); await refresh(); };
  const send = async (rid: string) => {
    setBusy(true); setMsg("");
    try {
      const r = await reply({ data: { review_id: rid, reply: text } });
      setMsg(r.status === "published" ? c.published : r.status === "pending" ? c.sentCheck : c.rejected);
      if (r.status !== "rejected") { setOpen(null); setText(""); await refresh(); }
    } catch { setMsg(c.error); } finally { setBusy(false); }
  };

  return (
    <section className="mt-8 rounded-2xl border border-border bg-card p-5">
      <h2 className="flex items-center gap-2 text-xl font-bold text-foreground"><MessageSquare className="h-5 w-5 text-primary" /> {c.title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{c.sub}</p>
      {data && !data.company && (
        <div className="mt-4">
          <p className="text-sm font-semibold text-foreground">{c.linkTitle}</p>
          <div className="relative mt-2"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <input value={q} maxLength={80} onChange={(e) => setQ(e.target.value)} placeholder={c.search} className={`${inputCls} pl-9`} /></div>
          <div className="mt-2 flex flex-col gap-2">
            {hits.map((h) => (
              <div key={h.id} className="flex items-center justify-between gap-2 rounded-xl border border-border p-3">
                <div className="text-sm"><p className="font-semibold text-foreground">{h.name}</p><p className="text-muted-foreground">{[h.address, h.city].filter(Boolean).join(", ")}</p></div>
                <Button size="sm" variant="outline" onClick={() => void choose(h.id)}>{c.link}</Button>
              </div>
            ))}
          </div>
        </div>
      )}
      {data?.company && (
        <>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <p className="font-semibold text-foreground">{data.company.name}{data.company.city ? ` · ${data.company.city}` : ""}</p>
            <span className="inline-flex items-center gap-1 text-sm text-muted-foreground"><Star className="h-4 w-4 text-primary" /> {data.company.avg_score.toFixed(1)} · {data.company.review_count} {c.reviews}</span>
            <Link to="/azienda/$id" params={{ id: data.company.id }} target="_blank" className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"><ExternalLink className="h-4 w-4" /> {c.viewPage}</Link>
            <button onClick={() => void choose(null)} className="text-sm text-muted-foreground hover:underline">{c.change}</button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">{data.canPublish ? c.verifiedNote : c.checkNote}</p>
          {msg && <p className="mt-3 text-sm font-medium text-primary">{msg}</p>}
          <div className="mt-4 flex flex-col gap-3">
            {data.reviews.length === 0 && <p className="text-sm text-muted-foreground">{c.none}</p>}
            {data.reviews.map((r) => {
              const avg = (r.score_salary + r.score_shifts + r.score_management + r.score_growth + r.score_safety + r.score_environment) / 6;
              return (
                <div key={r.id} className="rounded-xl border border-border p-4 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-foreground">{r.role ?? "-"}</p>
                    <span className="text-muted-foreground">★ {avg.toFixed(1)} · {new Date(r.created_at).toLocaleDateString(lang)}</span>
                  </div>
                  {r.pro && <p className="mt-2"><span className="font-semibold">{c.pro}:</span> {r.pro}</p>}
                  {r.cons && <p className="mt-1"><span className="font-semibold">{c.cons}:</span> {r.cons}</p>}
                  {r.advice && <p className="mt-1"><span className="font-semibold">{c.advice}:</span> {r.advice}</p>}
                  {r.reply && <div className="mt-3 rounded-xl bg-primary-soft p-3"><p className="text-xs font-bold text-primary">{c.replied}</p><p className="mt-1 text-foreground">{r.reply}</p></div>}
                  {r.pending && <p className="mt-2 text-xs font-medium text-primary">{c.pending}</p>}
                  {open === r.id ? (
                    <div className="mt-3 flex flex-col gap-2">
                      <textarea rows={4} minLength={10} maxLength={2000} value={text} onChange={(e) => setText(e.target.value)} className="w-full rounded-xl border border-input bg-background p-3 text-sm" />
                      <div className="flex gap-2">
                        <Button size="sm" variant="hero" disabled={busy || text.trim().length < 10} onClick={() => void send(r.id)}>{c.send}</Button>
                        <Button size="sm" variant="outline" onClick={() => { setOpen(null); setText(""); }}>{c.cancel}</Button>
                      </div>
                    </div>
                  ) : (
                    <Button size="sm" variant="outline" className="mt-3" onClick={() => { setOpen(r.id); setText(r.reply ?? ""); setMsg(""); }}>{c.reply}</Button>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}
