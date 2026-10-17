import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { ExternalLink, Lock, Mail, MessageCircle, Phone, Star } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { getJobOffers, getSiteSettings, type JobOffer } from "@/lib/public.functions";
import { getOfferContacts } from "@/lib/auth.functions";
import { useLang } from "@/lib/lang";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export function useSiteSettings() {
  const fn = useServerFn(getSiteSettings);
  return useQuery({ queryKey: ["site-settings"], queryFn: () => fn(), staleTime: 60_000 });
}

export function useJobOffers(companyId?: string, skipAdzuna = false) {
  const fn = useServerFn(getJobOffers);
  return useQuery({ queryKey: ["job-offers", companyId ?? "all", skipAdzuna], queryFn: () => fn({ data: { company_id: companyId, skip_adzuna: skipAdzuna } }) });
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const chip = "inline-flex items-center gap-1 rounded-xl border border-border bg-background px-2.5 py-1.5 text-xs font-semibold text-foreground hover:border-primary";

/**
 * Contacts of a manual offer. They are personal data of whoever posted the ad, so
 * they are never in the public payload: a signed-in session is required, otherwise
 * the visitor is invited to register.
 */
export function ContactReveal({ offerId, title }: { offerId: string; title: string }) {
  const { tr } = useLang();
  const callContacts = useServerFn(getOfferContacts);
  const [box, setBox] = useState<"closed" | "signup" | "open">("closed");
  const [contacts, setContacts] = useState<{ email: string | null; phone: string | null } | null>(null);
  const [busy, setBusy] = useState(false);

  const reveal = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setBox("signup");
        return;
      }
      const res = await callContacts({ data: { id: offerId } });
      setContacts({ email: res.email ?? null, phone: res.phone ?? null });
      setBox("open");
    } catch {
      toast.error(tr.authError);
    } finally {
      setBusy(false);
    }
  };

  if (box === "signup") {
    return (
      <div className="mt-3 rounded-xl border border-primary/40 bg-primary-soft p-3">
        <p className="flex items-center gap-1.5 text-sm font-bold text-foreground">
          <Lock className="h-4 w-4 shrink-0 text-primary" /> {tr.contactsLoginTitle}
        </p>
        <p className="mt-1 text-xs leading-snug text-muted-foreground">{tr.contactsLoginDesc}</p>
        <Button asChild size="sm" variant="hero" className="mt-3">
          <Link to="/auth">{tr.contactsLoginCta}</Link>
        </Button>
      </div>
    );
  }

  if (box === "open") {
    const email = contacts?.email && EMAIL_RE.test(contacts.email.trim()) ? contacts.email.trim() : null;
    const rawPhone = (contacts?.phone ?? "").trim();
    const tel = rawPhone.replace(/[^\d+]/g, "");
    const wa = tel.replace(/\D/g, "");
    const subject = encodeURIComponent(`${tr.applySubject} "${title}" - StaffAdvisors`);
    const waText = encodeURIComponent(`${tr.applySubject} "${title}" (StaffAdvisors): `);
    if (!email && !tel) return <p className="mt-3 text-xs text-muted-foreground">{tr.contactsNone}</p>;
    return (
      <div className="mt-3 rounded-xl border border-border bg-muted/40 p-3">
        <p className="text-[11px] leading-snug text-muted-foreground">{tr.contactDirect}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {email && (
            <a href={`mailto:${email}?subject=${subject}`} className={`${chip} break-all`}>
              <Mail className="h-3.5 w-3.5" /> {email}
            </a>
          )}
          {tel && (
            <a href={`tel:${tel}`} className={chip}>
              <Phone className="h-3.5 w-3.5" /> {tr.lblPhone}: {rawPhone}
            </a>
          )}
          {wa.length >= 8 && (
            <a href={`https://wa.me/${wa}?text=${waText}`} target="_blank" rel="noopener noreferrer nofollow" className={chip}>
              <MessageCircle className="h-3.5 w-3.5" /> {tr.lblWhatsapp}
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={reveal}
      disabled={busy}
      className="inline-flex items-center gap-1 text-sm font-semibold text-primary disabled:opacity-60"
    >
      {tr.showContacts} <Phone className="h-3.5 w-3.5" />
    </button>
  );
}

/**
 * External apply link (Adzuna / manual apply_link). Applying means contacting the
 * employer, so it requires a signed-in session, exactly like ContactReveal.
 */
export function ApplyLink({ url, label }: { url: string; label: string }) {
  const { tr } = useLang();
  const [box, setBox] = useState<"closed" | "signup">("closed");
  const [busy, setBusy] = useState(false);

  const open = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setBox("signup");
        return;
      }
      window.open(url, "_blank", "noopener,noreferrer");
    } finally {
      setBusy(false);
    }
  };

  if (box === "signup") {
    return (
      <div className="mt-3 rounded-xl border border-primary/40 bg-primary-soft p-3">
        <p className="flex items-center gap-1.5 text-sm font-bold text-foreground">
          <Lock className="h-4 w-4 shrink-0 text-primary" /> {tr.contactsLoginTitle}
        </p>
        <p className="mt-1 text-xs leading-snug text-muted-foreground">{tr.contactsLoginDesc}</p>
        <Button asChild size="sm" variant="hero" className="mt-3">
          <Link to="/auth">{tr.contactsLoginCta}</Link>
        </Button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={open}
      disabled={busy}
      className="inline-flex items-center gap-1 text-sm font-semibold text-primary disabled:opacity-60"
    >
      {label} <ExternalLink className="h-3.5 w-3.5" />
    </button>
  );
}

function OfferCard({ o }: { o: JobOffer }) {
  const { tr } = useLang();
  const salary = o.salary_visible && o.salary_min
    ? `${o.salary_min}${o.salary_max ? `-${o.salary_max}` : "+"} EUR/mese`
    : o.salary_range;
  const poster = o.poster_type === "agency"
    ? (o.agency_name ?? tr.viaAgency)
    : o.poster_company;
  const isManual = o.source === "manual" && !o.id.startsWith("adzuna-");
  return (
    <article className={`rounded-2xl border p-4 shadow-card ${o.is_premium ? "border-primary bg-primary-soft" : "border-border bg-card"}`}>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        {o.is_premium && (
          <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-0.5 text-xs font-bold text-primary-foreground">
            <Star className="h-3 w-3" /> {tr.directOffer}
          </span>
        )}
        {o.source === "manual" && (
          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${o.poster_type === "agency" ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"}`}>
            {o.poster_type === "agency" ? tr.viaAgency : tr.directHire}
          </span>
        )}
      </div>
      {isManual ? (
        <Link to="/offerta/$id" params={{ id: o.id }} className="block font-bold hover:underline">{o.title}</Link>
      ) : (
        <h3 className="font-bold">{o.title}</h3>
      )}
      {poster && <p className="text-xs font-semibold text-foreground/80">{poster}</p>}
      {o.meal_vouchers && <span className="mb-1 mr-2 inline-flex rounded-full bg-success/15 px-2 py-0.5 text-[11px] font-bold text-success">{"\ud83c\udfab"} {tr.mealIncluded}</span>}
      <p className="text-xs text-muted-foreground">{[o.city, o.address, o.contract_type, salary, o.positions && o.positions > 1 ? `${o.positions} ${tr.positions.toLowerCase()}` : null].filter(Boolean).join(" \u2022 ")}</p>
      {o.description && <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{o.description}</p>}
      {o.apply_link && (
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <ApplyLink url={o.apply_link} label={o.source === "adzuna" ? tr.applyOriginal : tr.apply} />
        </div>
      )}
      {isManual && <ContactReveal offerId={o.id} title={o.title} />}
      {o.attribution && <p className="mt-2 text-[11px] text-muted-foreground">{o.attribution}</p>}
    </article>
  );
}

export function OfferList({ offers, showCta = true, emptyText }: { offers: JobOffer[]; showCta?: boolean; emptyText?: string }) {
  const { tr } = useLang();
  return (
    <div className="space-y-3">
      {offers.length ? offers.map((o) => <OfferCard key={o.id} o={o} />) : <p className="text-sm text-muted-foreground">{emptyText ?? tr.noOffers}</p>}
      {offers.some((o) => o.source === "adzuna") && (
        <p className="text-[11px] text-muted-foreground">Jobs by <a href="https://www.adzuna.it" target="_blank" rel="noopener noreferrer" className="underline">Adzuna</a></p>
      )}
      {showCta && (
        <Button asChild variant="soft" size="sm">
          <Link to="/pubblica-offerta">{tr.publishOffer}</Link>
        </Button>
      )}
    </div>
  );
}

export function CompanyJobs({ companyId }: { companyId: string }) {
  const { tr } = useLang();
  const { data } = useJobOffers(companyId);
  if (!data?.enabled) return null;
  return (
    <section className="mt-6">
      <h2 className="mb-3 text-lg font-bold">{tr.jobsTitle}</h2>
      <OfferList offers={data.offers} />
    </section>
  );
}
