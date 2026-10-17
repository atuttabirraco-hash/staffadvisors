import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { getSiteSettings } from "@/lib/public.functions";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMyReviews, deleteMyReview, getMyProfile, setNotifyJobs, getMyOffers, closeMyOffer, deleteMyOffer, getMyOffer, updateMyOffer, type MyReviewRow, type MyOfferRow, type MyOfferDetails } from "@/lib/auth.functions";
import { useLang } from "@/lib/lang";
import { CONTRACT_TYPES } from "@/lib/constants";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/staff/Header";
import { ExpiryNotice } from "@/components/staff/ExpiryNotice";
import { Button } from "@/components/ui/button";
import { VerifiedBadge } from "@/components/staff/VerifiedBadge";
import { Pencil, Trash2, User, X } from "lucide-react";
import { toast } from "sonner";
import { reviewCode } from "@/lib/review-id";
import { DeleteAccountSection } from "@/components/staff/DeleteAccountSection";
import { Footer } from "@/components/staff/Sections";

type MyReview = MyReviewRow;

type MyProfile = { display_name: string | null; notify_job_offers: boolean };

export const Route = createFileRoute("/_authenticated/account")({
  head: () => ({
    meta: [
      { title: "Il mio account | StaffAdvisors" },
      { name: "description", content: "Gestisci account, recensioni e annunci personali StaffAdvisors." },
      { property: "og:title", content: "Il mio account | StaffAdvisors" },
      { property: "og:description", content: "Gestisci account, recensioni e annunci personali StaffAdvisors." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AccountPage,
});

function AccountPage() {
  const { tr } = useLang();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user } = Route.useRouteContext();

  const fetchReviews = useServerFn(getMyReviews);
  const fetchProfile = useServerFn(getMyProfile);
  const callDelete = useServerFn(deleteMyReview);
  const callNotify = useServerFn(setNotifyJobs);
  const fetchSite = useServerFn(getSiteSettings);
  const site = useQuery({ queryKey: ["site-settings-reviews"], queryFn: () => fetchSite() });
  const canDelete = site.data?.reviews_deletable ?? false;

  const reviews = useQuery({ queryKey: ["my-reviews"], queryFn: async () => (await fetchReviews()) as unknown as MyReview[] });
  const profile = useQuery({ queryKey: ["my-profile"], queryFn: async () => (await fetchProfile()) as MyProfile });

  const del = useMutation({
    mutationFn: (id: string) => callDelete({ data: { id } }),
    onSuccess: () => {
      toast.success(tr.reviewDeleted);
      void qc.invalidateQueries({ queryKey: ["my-reviews"] });
      void qc.invalidateQueries({ queryKey: ["companies-page"] });
      void qc.invalidateQueries({ queryKey: ["reviewed-data"] });
    },
    onError: () => toast.error(tr.authError),
  });

  const notify = useMutation({
    mutationFn: (enabled: boolean) => callNotify({ data: { enabled } }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["my-profile"] }),
  });


  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="border-b border-border bg-card px-4 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Logo />
          <Button variant="soft" size="sm" onClick={signOut}>{tr.signOut}</Button>
        </div>
      </div>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-soft text-primary">
            <User className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground">{tr.myAccount}</h1>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-between rounded-2xl border border-border bg-card p-5">
          <div>
            <p className="font-semibold text-foreground">{tr.notifyJobs}</p>
            <p className="text-sm text-muted-foreground">{tr.notifyJobsDesc}</p>
          </div>
          <button
            role="switch"
            aria-checked={profile.data?.notify_job_offers ?? true}
            onClick={() => notify.mutate(!(profile.data?.notify_job_offers ?? true))}
            className={`relative h-7 w-12 rounded-full transition-colors ${(profile.data?.notify_job_offers ?? true) ? "bg-primary" : "bg-muted"}`}
          >
            <span className={`absolute top-1 h-5 w-5 rounded-full bg-card shadow transition-all ${(profile.data?.notify_job_offers ?? true) ? "left-6" : "left-1"}`} />
          </button>
        </div>

        <MyOffers />

        <h2 className="mt-10 text-lg font-bold text-foreground">{tr.myReviews}</h2>
        <div className="mt-4 flex flex-col gap-3">
          {reviews.isLoading ? (
            <div className="h-24 animate-pulse rounded-2xl bg-muted" />
          ) : (reviews.data ?? []).length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">{tr.noReviewsYet}</p>
          ) : (
            (reviews.data ?? []).map((r) => {
              return (
                <div key={r.id} className="rounded-2xl border border-border bg-card p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Link to="/azienda/$id" params={{ id: r.company_id }} className="font-semibold text-foreground hover:text-primary">
                        {r.company_name ?? "—"}
                      </Link>
                      <p className="text-xs text-muted-foreground">{r.role}{r.company_city ? ` · ${r.company_city}` : ""} · {new Date(r.created_at).toLocaleDateString("it-IT")}</p>
                      <p className="mt-0.5 font-mono text-[11px] font-semibold text-muted-foreground">ID {reviewCode(r.id)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <VerifiedBadge verified={r.is_verified} />
                      {canDelete && <button
                        onClick={() => del.mutate(r.id)}
                        className="rounded-xl p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        aria-label={tr.deleteReview}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>}
                    </div>
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{r.pro}</p>
                </div>
              );
            })
          )}
        </div>

        <DeleteAccountSection />
      </main>
      <Footer />
    </div>
  );
}

function MyOffers() {
  const { tr } = useLang();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<string | null>(null);
  const fetchOffers = useServerFn(getMyOffers);
  const callClose = useServerFn(closeMyOffer);
  const callRemove = useServerFn(deleteMyOffer);
  const offers = useQuery({ queryKey: ["my-offers"], queryFn: async () => (await fetchOffers()) as MyOfferRow[] });
  const close = useMutation({
    mutationFn: (id: string) => callClose({ data: { id } }),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ["my-offers"] }); void qc.invalidateQueries({ queryKey: ["job-offers"] }); },
    onError: () => toast.error(tr.authError),
  });
  const remove = useMutation({
    mutationFn: (id: string) => callRemove({ data: { id } }),
    onSuccess: () => {
      toast.success(tr.offerDeleted);
      void qc.invalidateQueries({ queryKey: ["my-offers"] });
      void qc.invalidateQueries({ queryKey: ["job-offers"] });
    },
    onError: () => toast.error(tr.authError),
  });
  const askRemove = (id: string) => { if (window.confirm(tr.deleteOfferConfirm)) remove.mutate(id); };
  const statusOf = (o: MyOfferRow) => {
    if (o.payment_status === "refunded") return tr.offerRefunded;
    if (o.paid_until && new Date(o.paid_until).getTime() < Date.now()) return tr.offerExpired;
    if (o.is_active) return tr.offerActive;
    return o.payment_status === "paid" && o.paid_until ? tr.offerWaiting : tr.offerClosed;
  };
  return (
    <>
      <div className="mt-10 flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-foreground">{tr.myOffers}</h2>
        <Button asChild variant="soft" size="sm"><Link to="/pubblica-offerta">{tr.publishOffer}</Link></Button>
      </div>
      <div className="mt-4 flex flex-col gap-3">
        {offers.isLoading ? <div className="h-20 animate-pulse rounded-2xl bg-muted" /> :
          (offers.data ?? []).length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">{tr.noOffersYet}</p>
          ) : (offers.data ?? []).map((o) => (
            <div key={o.id} className="flex flex-col gap-2">
              <ExpiryNotice expiresAt={o.paid_until} title={tr.offerExpiresSoon}>
                {o.payment_status === "free" ? (
                  <Button asChild variant="hero" size="sm"><Link to="/pubblica-offerta">{tr.publishAgain}</Link></Button>
                ) : (o.payment_status === "paid" || o.payment_status === "renewing") ? (
                  <Button asChild variant="hero" size="sm"><Link to="/pubblica-offerta" search={{ renew: o.id }}>{tr.renewOffer}</Link></Button>
                ) : null}
              </ExpiryNotice>
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-5">
                <div>
...
                <Button variant="soft" size="sm" onClick={() => setEditing(o.id)}>
                  <Pencil className="mr-1 h-3.5 w-3.5" /> {tr.editOffer}
                </Button>
                {o.is_active && <Button variant="soft" size="sm" onClick={() => close.mutate(o.id)}>{tr.closeOffer}</Button>}
                <Button variant="soft" size="sm" className="text-destructive" onClick={() => askRemove(o.id)}>
                  <Trash2 className="mr-1 h-3.5 w-3.5" /> {tr.deleteOffer}
                </Button>
              </div>
              </div>
            </div>
          ))}
      </div>
      {editing && <EditOfferModal id={editing} onClose={() => setEditing(null)} />}
    </>
  );
}

type OfferForm = {
  title: string; poster_company: string; poster_email: string; poster_phone: string; city: string; address: string;
  contract_type: string; salary_min: string; salary_max: string; salary_visible: boolean;
  positions: string; description: string; apply_link: string; meal_vouchers: boolean; poster_type: string;
};

/**
 * Edit form for one of the signed-in user's own ads. Both the read and the write are
 * scoped to auth.uid() server-side, so nobody can open or change someone else's ad.
 * When the admin switched on "review before publishing", an edited ad goes back to review.
 */
function EditOfferModal({ id, onClose }: { id: string; onClose: () => void }) {
  const { tr } = useLang();
  const qc = useQueryClient();
  const callGet = useServerFn(getMyOffer);
  const callSave = useServerFn(updateMyOffer);
  const [form, setForm] = useState<OfferForm | null>(null);

  const load = useQuery({
    queryKey: ["my-offer", id],
    queryFn: async () => (await callGet({ data: { id } })) as MyOfferDetails,
  });

  useEffect(() => {
    const d = load.data;
    if (!d) return;
    setForm({
      title: d.title,
      poster_company: d.poster_company ?? "",
      poster_email: d.poster_email ?? "",
      poster_phone: d.poster_phone ?? "",
      city: d.city ?? "",
      address: d.address ?? "",
      contract_type: d.contract_type ?? "",
      salary_min: d.salary_min ? String(d.salary_min) : "",
      salary_max: d.salary_max ? String(d.salary_max) : "",
      salary_visible: d.salary_visible,
      positions: String(d.positions ?? 1),
      description: d.description ?? "",
      apply_link: d.apply_link ?? "",
      meal_vouchers: d.meal_vouchers,
      poster_type: d.poster_type,
    });
  }, [load.data]);

  const save = useMutation({
    mutationFn: () => {
      const f = form as OfferForm;
      return callSave({
        data: {
          id,
          title: f.title.trim(),
          poster_company: f.poster_company.trim(),
          poster_email: f.poster_email.trim(),
          poster_phone: f.poster_phone.trim() || null,
          city: f.city.trim() || null,
          address: f.address.trim() || null,
          contract_type: f.contract_type.trim() || null,
          salary_min: f.salary_min ? Number(f.salary_min) : null,
          salary_max: f.salary_max ? Number(f.salary_max) : null,
          salary_visible: f.salary_visible,
          positions: f.positions ? Math.max(1, Number(f.positions)) : 1,
          description: f.description.trim() || null,
          apply_link: f.apply_link.trim() || null,
          meal_vouchers: f.meal_vouchers,
        },
      });
    },
    onSuccess: (res) => {
      toast.success((res as { needsReview?: boolean })?.needsReview ? tr.offerSavedPending : tr.offerSaved);
      void qc.invalidateQueries({ queryKey: ["my-offers"] });
      void qc.invalidateQueries({ queryKey: ["job-offers"] });
      onClose();
    },
    onError: () => toast.error(tr.authError),
  });

  const input = "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl border border-border bg-card p-5 shadow-card sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-lg font-bold text-foreground">{tr.editOfferHeading}</h3>
          <button type="button" onClick={onClose} className="rounded-xl p-2 text-muted-foreground hover:bg-muted" aria-label={tr.cancel}>
            <X className="h-4 w-4" />
          </button>
        </div>
        {load.isLoading ? (
          <div className="mt-4 h-64 animate-pulse rounded-2xl bg-muted" />
        ) : !form ? (
          <p className="mt-4 text-sm text-muted-foreground">{tr.authError}</p>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); save.mutate(); }} className="mt-4 grid gap-3 sm:grid-cols-2">
            <input required minLength={2} aria-label={tr.postJobTitle} placeholder={tr.postJobTitle} className={`${input} sm:col-span-2`} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <input required minLength={2} aria-label={tr.postCompany} placeholder={tr.postCompany} className={input} value={form.poster_company} onChange={(e) => setForm({ ...form, poster_company: e.target.value })} />
            <input required type="email" aria-label={tr.postEmail} placeholder={tr.postEmail} className={input} value={form.poster_email} onChange={(e) => setForm({ ...form, poster_email: e.target.value })} />
            <input inputMode="tel" aria-label={tr.lblPhone} placeholder={`${tr.lblPhone} / WhatsApp`} className={input} value={form.poster_phone} onChange={(e) => setForm({ ...form, poster_phone: e.target.value.replace(/[^0-9+()\-\s]/g, "") })} />
            <input aria-label={tr.postCity} placeholder={tr.postCity} className={input} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            <input aria-label={tr.address} placeholder={tr.address} className={input} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            <select aria-label={tr.contractType} className={input} value={form.contract_type} onChange={(e) => setForm({ ...form, contract_type: e.target.value })}>
              <option value="">-</option>
              {CONTRACT_TYPES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <input inputMode="numeric" aria-label={tr.salaryMin} placeholder={tr.salaryMin} className={input} value={form.salary_min} onChange={(e) => setForm({ ...form, salary_min: e.target.value.replace(/[^0-9]/g, "") })} />
            <input inputMode="numeric" aria-label={tr.salaryMax} placeholder={tr.salaryMax} className={input} value={form.salary_max} onChange={(e) => setForm({ ...form, salary_max: e.target.value.replace(/[^0-9]/g, "") })} />
            <input inputMode="numeric" min={1} aria-label={tr.positions} placeholder={tr.positions} className={input} value={form.positions} onChange={(e) => setForm({ ...form, positions: e.target.value.replace(/[^0-9]/g, "") })} />
            <textarea aria-label={tr.offerDesc} placeholder={tr.offerDesc} rows={4} maxLength={2000} className={`${input} sm:col-span-2`} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            {form.poster_type === "agency" && (
              <input type="url" aria-label={tr.postLink} placeholder={`${tr.postLink} https://...`} className={`${input} sm:col-span-2`} value={form.apply_link} onChange={(e) => setForm({ ...form, apply_link: e.target.value })} />
            )}
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.salary_visible} onChange={(e) => setForm({ ...form, salary_visible: e.target.checked })} /> {tr.salaryVisible}</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.meal_vouchers} onChange={(e) => setForm({ ...form, meal_vouchers: e.target.checked })} /> {"\ud83c\udfab"} {tr.mealIncluded}</label>
            <div className="mt-2 flex flex-wrap gap-2 sm:col-span-2">
              <Button type="button" variant="soft" size="sm" onClick={onClose}>{tr.cancel}</Button>
              <Button type="submit" variant="hero" size="sm" disabled={save.isPending}>{tr.saveChanges}</Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
