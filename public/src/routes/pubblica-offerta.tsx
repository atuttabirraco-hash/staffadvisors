import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from "@stripe/react-stripe-js";
import { toast } from "sonner";
import { useLang } from "@/lib/lang";
import { CONTRACT_TYPES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/staff/Sections";
import { useSiteSettings } from "@/components/staff/JobOffers";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { createFreeOffer, createOfferCheckout, createRenewCheckout, getOfferStatus } from "@/lib/offers-pay.functions";
import { getStripe, getStripeEnvironment } from "@/lib/stripe";

type Search = { offer?: string | undefined; session_id?: string | undefined; renew?: string | undefined };

export const Route = createFileRoute("/pubblica-offerta")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    offer: typeof s["offer"] === "string" ? s["offer"] : undefined,
    session_id: typeof s["session_id"] === "string" ? s["session_id"] : undefined,
    renew: typeof s["renew"] === "string" ? s["renew"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Pubblica un'offerta di lavoro | StaffAdvisors" },
      { name: "description", content: "Aziende, privati e agenzie: pubblica la tua offerta di lavoro in evidenza su StaffAdvisors." },
      { property: "og:title", content: "Pubblica un'offerta di lavoro | StaffAdvisors" },
      { property: "og:description", content: "Pubblica la tua offerta di lavoro in evidenza su StaffAdvisors." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PostOffer,
});

const input = "h-11 w-full rounded-xl border border-border bg-background px-3 text-sm";

function Done({ id }: { id: string }) {
  const { tr } = useLang();
  const fn = useServerFn(getOfferStatus);
  const q = useQuery({
    queryKey: ["offer-status", id],
    queryFn: () => fn({ data: { id, environment: getStripeEnvironment() } }),
    refetchInterval: (query) => (query.state.data?.paid ? false : 3000),
  });
  return (
    <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-card">
      <p className="text-4xl">{q.data?.paid ? "\u2705" : "\u23f3"}</p>
      <p className="mt-3 text-lg font-bold">{q.data?.paid ? tr.postPaid : tr.postPending}</p>
      {q.data?.paid && <OfferLinkBox id={id} />}
      <Button asChild variant="hero" className="mt-5"><Link to="/lavoro">{tr.jobsTitle}</Link></Button>
    </div>
  );
}

function OfferLinkBox({ id }: { id: string }) {
  const { tr } = useLang();
  const [copied, setCopied] = useState(false);
  const url = `${window.location.origin}/offerta/${id}`;
  return (
    <div className="mt-4 rounded-xl border border-border bg-muted/40 p-3 text-left">
      <p className="text-xs font-semibold text-muted-foreground">{tr.offerShareLabel}</p>
      <div className="mt-2 flex items-center gap-2">
        <input readOnly value={url} onFocus={(e) => e.currentTarget.select()} className="h-9 w-full rounded-lg border border-border bg-background px-2 text-xs" />
        <Button type="button" variant="soft" size="sm" onClick={async () => {
          try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* noop */ }
        }}>{copied ? tr.linkCopied : tr.copyLink}</Button>
      </div>
    </div>
  );
}

function PostOffer() {
  const { tr } = useLang();
  const { offer, renew } = Route.useSearch();
  const settings = useSiteSettings();
  const create = useServerFn(createOfferCheckout);
  const renewFn = useServerFn(createRenewCheckout);
  const freeFn = useServerFn(createFreeOffer);
  const free = settings.data?.offers_free ?? true;
  const [freeDone, setFreeDone] = useState(false);
  const [freeOfferId, setFreeOfferId] = useState<string | null>(null);
  const [freeExpires, setFreeExpires] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [authed, setAuthed] = useState<boolean | null>(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setAuthed(!!data.user);
      if (data.user?.email) setForm((f) => (f.poster_email ? f : { ...f, poster_email: data.user!.email! }));
    });
  }, []);
  const fetchRenewSecret = useCallback(async () => {
    const res = await renewFn({ data: { id: renew!, returnUrl: `${window.location.origin}/pubblica-offerta?offer=OFFER_ID`, environment: getStripeEnvironment() } });
    if ("error" in res) { toast.error(res.error); throw new Error(res.error); }
    return res.clientSecret;
  }, [renew, renewFn]);
  const [form, setForm] = useState({
    title: "", poster_company: "", poster_email: "", poster_phone: "", city: "", address: "", contract_type: "", salary_range: "", apply_link: "", meal_vouchers: false,
    poster_type: "private" as "private" | "agency", description: "", salary_min: "", salary_max: "", salary_visible: true, positions: "1",
    agency_name: "", agency_auth_code: "", client_anonymous: false, agency_disclaimer: false,
  });
  const [pending, setPending] = useState(false);
  const [tier, setTier] = useState<"standard" | "premium">("standard");
  const [payload, setPayload] = useState<typeof form | null>(null);
  const publishOff = settings.data?.offer_publish_mode === "off";
  const nums = (v: string) => (v.trim() ? Number(v) : null);
  const offerData = (f: typeof form) => ({
    title: f.title, poster_company: f.poster_type === "agency" && f.client_anonymous ? f.agency_name : f.poster_company,
    poster_email: f.poster_email, poster_phone: f.poster_phone.trim() || null, city: f.city.trim() || null, address: f.address.trim() || null, contract_type: f.contract_type.trim() || null,
    salary_range: f.salary_range.trim() || null, apply_link: f.poster_type === "private" ? null : (f.apply_link.trim() || null), meal_vouchers: f.meal_vouchers,
    poster_type: f.poster_type, description: f.description.trim() || null,
    salary_min: nums(f.salary_min), salary_max: nums(f.salary_max), salary_visible: f.salary_visible,
    positions: Math.max(1, Number(f.positions) || 1),
    agency_name: f.poster_type === "agency" ? f.agency_name.trim() || null : null,
    agency_auth_code: f.poster_type === "agency" ? f.agency_auth_code.trim() || null : null,
    client_anonymous: f.poster_type === "agency" ? f.client_anonymous : false,
    company_id: null,
  });
  const tiers = settings.data?.offer_price_mode === "tiers";
  const cents = tiers && tier === "premium" ? (settings.data?.offer_premium_price_cents ?? 3900) : (settings.data?.offer_price_cents ?? 1900);
  const price = (cents / 100).toFixed(2).replace(".", ",");
  const days = free ? 15 : (settings.data?.offer_days ?? 30);

  const fetchClientSecret = useCallback(async () => {
    if (!payload) throw new Error("no data");
    const res = await create({ data: {
      ...offerData(payload),
      tier, returnUrl: `${window.location.origin}/pubblica-offerta?offer=OFFER_ID`, environment: getStripeEnvironment(),
    } });
    if ("error" in res) { toast.error(res.error); throw new Error(res.error); }
    return res.clientSecret;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payload, tier, create]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {!free && <PaymentTestModeBanner />}
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
        <Link to="/lavoro" className="text-sm font-semibold text-primary">{"\u2190"} {tr.jobsTitle}</Link>
        <h1 className="mt-4 text-2xl font-extrabold">{tr.postTitle}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{(free ? tr.postFreeIntro : tr.postIntro).replace("{days}", String(days)).replace("{price}", price)}</p>
        <div className="mt-6">
          {freeDone ? (
            <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-card">
              <p className="text-4xl">{"\u2705"}</p>
              <p className="mt-3 text-lg font-bold">{pending ? tr.offerPending : tr.postFreeDone}</p>
              {freeExpires && <p className="mt-2 text-sm font-semibold text-primary">{tr.offerUntil} {new Date(freeExpires).toLocaleDateString("it-IT")}</p>}
              {freeOfferId && <OfferLinkBox id={freeOfferId} />}
              <Button asChild variant="hero" className="mt-5"><Link to="/lavoro">{tr.jobsTitle}</Link></Button>
            </div>
          ) : publishOff ? (
            <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-card">
              <p className="text-sm text-muted-foreground">{tr.offersOff}</p>
            </div>
          ) : offer ? <Done id={offer} /> : authed === null ? (
            <div className="h-40 animate-pulse rounded-2xl bg-muted" />
          ) : !authed ? (
            <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-card">
              <p className="text-sm text-muted-foreground">{tr.postLoginRequired}</p>
              <Button asChild variant="hero" className="mt-5"><Link to="/auth">{tr.signIn}</Link></Button>
            </div>
          ) : renew ? (
            <div className="overflow-hidden rounded-2xl border border-border bg-card p-2">
              <p className="p-3 font-bold">{tr.renewTitle}</p>
              <EmbeddedCheckoutProvider stripe={getStripe()} options={{ fetchClientSecret: fetchRenewSecret }}>
                <EmbeddedCheckout />
              </EmbeddedCheckoutProvider>
            </div>
          ) : payload ? (
            <div className="overflow-hidden rounded-2xl border border-border bg-card p-2">
              <EmbeddedCheckoutProvider stripe={getStripe()} options={{ fetchClientSecret }}>
                <EmbeddedCheckout />
              </EmbeddedCheckoutProvider>
            </div>
          ) : (
            <form className="grid gap-3 rounded-2xl border border-border bg-card p-5 shadow-card sm:grid-cols-2"
              onSubmit={async (e) => {
                e.preventDefault();
                if (form.poster_type === "agency" && (!form.agency_name.trim() || !form.agency_auth_code.trim() || !form.agency_disclaimer)) {
                  toast.error(tr.requiredFields);
                  return;
                }
                if (free) {
                  setBusy(true);
                  try {
                    const res = await freeFn({ data: offerData(form) });
                    if ("error" in res) toast.error(res.error);
                    else { setPending(res.pending); setFreeOfferId(res.id); setFreeExpires(res.expiresAt); setFreeDone(true); }
                  } catch { toast.error(tr.authError); } finally { setBusy(false); }
                  return;
                }
                try { getStripeEnvironment(); setPayload(form); } catch (err) { toast.error((err as Error).message); } }}>
              <div className="grid grid-cols-2 gap-2 sm:col-span-2" role="group" aria-label={tr.posterType}>
                {(["private", "agency"] as const).map((k) => (
                  <button key={k} type="button" aria-pressed={form.poster_type === k} onClick={() => setForm({ ...form, poster_type: k })}
                    className={`rounded-xl border px-3 py-2 text-sm font-semibold ${form.poster_type === k ? "border-primary bg-primary/10 text-primary" : "border-border"}`}>
                    {k === "private" ? tr.posterPrivate : tr.posterAgency}
                  </button>
                ))}
              </div>
              <input required minLength={2} placeholder={tr.postJobTitle} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={`${input} sm:col-span-2`} />
              {form.poster_type === "agency" && (
                <>
                  <input required minLength={2} placeholder={tr.agencyName} value={form.agency_name} onChange={(e) => setForm({ ...form, agency_name: e.target.value })} className={input} />
                  <input required minLength={2} placeholder={tr.agencyCode} value={form.agency_auth_code} onChange={(e) => setForm({ ...form, agency_auth_code: e.target.value })} className={input} />
                </>
              )}
              <input required minLength={2} placeholder={tr.postCompany} value={form.poster_company} onChange={(e) => setForm({ ...form, poster_company: e.target.value })} className={input} />
              <input required type="email" placeholder={tr.postEmail} value={form.poster_email} onChange={(e) => setForm({ ...form, poster_email: e.target.value })} className={input} />
              <input inputMode="tel" placeholder={tr.postPhone} value={form.poster_phone} onChange={(e) => setForm({ ...form, poster_phone: e.target.value.replace(/[^0-9+()\-\s]/g, "") })} className={input} />
              <textarea placeholder={tr.offerDesc} rows={3} maxLength={2000} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm sm:col-span-2" />
              <input placeholder={tr.postCity} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className={input} />
              <input placeholder={tr.address} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className={input} />
              <select value={form.contract_type} onChange={(e) => setForm({ ...form, contract_type: e.target.value })} className={input}>
                <option value="">-</option>{CONTRACT_TYPES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <input inputMode="numeric" placeholder={tr.salaryMin} value={form.salary_min} onChange={(e) => setForm({ ...form, salary_min: e.target.value.replace(/[^0-9]/g, "") })} className={input} />
              <input inputMode="numeric" placeholder={tr.salaryMax} value={form.salary_max} onChange={(e) => setForm({ ...form, salary_max: e.target.value.replace(/[^0-9]/g, "") })} className={input} />
              <input inputMode="numeric" min={1} placeholder={tr.positions} value={form.positions} onChange={(e) => setForm({ ...form, positions: e.target.value.replace(/[^0-9]/g, "") })} className={input} />
              {form.poster_type === "agency" ? (
                <input type="url" placeholder={`${tr.postLink} https://...`} value={form.apply_link} onChange={(e) => setForm({ ...form, apply_link: e.target.value })} className={input} />
              ) : (
                <p className="rounded-xl bg-muted px-3 py-2 text-xs text-muted-foreground sm:col-span-2">{tr.linkAutoHint}</p>
              )}
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.salary_visible} onChange={(e) => setForm({ ...form, salary_visible: e.target.checked })} /> {tr.salaryVisible}</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.meal_vouchers} onChange={(e) => setForm({ ...form, meal_vouchers: e.target.checked })} /> {"\ud83c\udfab"} {tr.mealIncluded}</label>
              {form.poster_type === "agency" && (
                <>
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.client_anonymous} onChange={(e) => setForm({ ...form, client_anonymous: e.target.checked })} /> {tr.clientAnonymous}</label>
                  <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={form.agency_disclaimer} onChange={(e) => setForm({ ...form, agency_disclaimer: e.target.checked })} /> {tr.agencyDisclaimer} *</label>
                </>
              )}
              {!free && tiers && (
                <div className="grid grid-cols-2 gap-2 sm:col-span-2">
                  {(["standard", "premium"] as const).map((k) => {
                    const c = (k === "premium" ? (settings.data?.offer_premium_price_cents ?? 3900) : (settings.data?.offer_price_cents ?? 1900)) / 100;
                    return (
                      <button key={k} type="button" aria-pressed={tier === k} onClick={() => setTier(k)}
                        className={`rounded-xl border px-3 py-2 text-sm font-semibold ${tier === k ? "border-primary bg-primary/10 text-primary" : "border-border"}`}>
                        {k === "premium" ? tr.postPremium : tr.postStandard} - {c.toFixed(2).replace(".", ",")} euro
                      </button>
                    );
                  })}
                </div>
              )}
              <Button type="submit" variant="hero" disabled={busy} className="sm:col-span-2">{free ? tr.postFree : `${tr.postPay} - ${price} euro`}</Button>
            </form>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
