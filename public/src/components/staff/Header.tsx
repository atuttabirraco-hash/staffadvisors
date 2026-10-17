import { SearchBox } from "./SearchBox";
import { ShareSiteButton } from "./ShareSiteButton";
import { Link } from "@tanstack/react-router";
import { useSiteSettings } from "./JobOffers";
import { PenLine, ChevronDown, User, Briefcase, Users } from "lucide-react";
import { LANGS, fmt } from "@/lib/i18n";
import { useCompanyCount } from "@/lib/company-query";
import { useLang } from "@/lib/lang";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { BrandLogo } from "./BrandLogo";
import { HomeLink } from "./HomeLink";
import { BusinessReturnButton } from "./BusinessReturnButton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Logo() {
  return (
    <HomeLink dir="ltr" aria-label="StaffAdvisors" className="flex min-w-0 items-center rounded-md bg-background px-2 py-1">
      <BrandLogo compact />
    </HomeLink>
  );
}

const FLAG_CODE: Record<string, string> = { it: "it", en: "gb", es: "es", fr: "fr", de: "de", pt: "pt", pl: "pl", ar: "sa" };
function Flag({ code }: { code: string }) {
  const c = FLAG_CODE[code] ?? code;
  return <img src={`https://flagcdn.com/w40/${c}.png`} srcSet={`https://flagcdn.com/w80/${c}.png 2x`} alt="" width={20} height={14} className="h-3.5 w-5 shrink-0 rounded-[3px] object-cover shadow-sm" loading="lazy" />;
}

export function LangSelector({ dark = false }: { dark?: boolean }) {
  const { lang, setLang } = useLang();
  const current = LANGS.find((l) => l.code === lang);
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <button
          className={
            dark
              ? "flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-secondary-foreground/20 bg-secondary-foreground/5 px-2.5 text-xs font-medium text-secondary-foreground hover:bg-secondary-foreground/10 sm:h-10 sm:rounded-xl sm:px-3 sm:text-sm"
              : "flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-border bg-card px-2.5 text-xs font-medium hover:bg-muted sm:h-10 sm:rounded-xl sm:px-3 sm:text-sm"
          }
          aria-label="Language"
        >
          <Flag code={lang} />
          <span>{current?.label ?? lang.toUpperCase()}</span>
          <ChevronDown className="h-3.5 w-3.5 opacity-60" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} collisionPadding={12} className="w-36 rounded-2xl bg-card p-1.5 text-card-foreground opacity-100 shadow-card-hover data-[state=open]:animate-none">
        {LANGS.map((l) => (
          <DropdownMenuItem key={l.code} onClick={() => setLang(l.code)} className="cursor-pointer rounded-xl px-3 py-2.5">
            <Flag code={l.code} /> <span className="ms-2 font-medium">{l.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function AuthButton() {
  const { tr } = useLang();
  const [loggedIn, setLoggedIn] = useState(false);
  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => setLoggedIn(!!data.user));
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") setLoggedIn(true);
      if (event === "SIGNED_OUT") setLoggedIn(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);
  return loggedIn ? (
    <Link to="/account" className="flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-secondary-foreground/20 px-2.5 text-xs font-medium hover:bg-secondary-foreground/10 sm:h-10 sm:rounded-xl sm:px-3 sm:text-sm">
      <User className="h-4 w-4" /> <span className="hidden sm:inline">{tr.myAccount}</span>
    </Link>
  ) : (
    <Link to="/auth" className="flex h-9 shrink-0 items-center rounded-full border border-secondary-foreground/20 px-2.5 text-xs font-medium hover:bg-secondary-foreground/10 sm:h-10 sm:rounded-xl sm:px-3 sm:text-sm">
      {tr.signIn}
    </Link>
  );
}

export function Header({ onWrite, onWriteFor, showShare = false }: { onWrite: () => void; onWriteFor?: (c: { id: string; name?: string | undefined }) => void; showShare?: boolean }) {
  const { tr } = useLang();
  const { data: settings } = useSiteSettings();
  const { data: total } = useCompanyCount();
  return (
    <header className="bg-gradient-hero text-secondary-foreground">
      <div className="border-b border-secondary-foreground/10 bg-primary/95 text-primary-foreground">
        <p className="mx-auto max-w-7xl px-4 py-2 text-center text-xs font-medium sm:text-sm">{tr.mission}</p>
      </div>
      <div className="mx-auto grid max-w-7xl grid-cols-[1fr_auto] items-center gap-x-2 gap-y-3 px-4 py-4 sm:flex sm:justify-between sm:gap-3">
        <div className="min-w-0">
          <Logo />
        </div>
        <nav className="order-3 col-span-2 flex w-full flex-wrap items-center gap-1 border-t border-secondary-foreground/10 pt-2 sm:order-none sm:col-span-1 sm:w-auto sm:border-0 sm:pt-0">
          {(settings?.job_offers_enabled || settings?.bacheca_enabled) && (
            <div className="flex flex-wrap items-center gap-1.5">
              {settings.job_offers_enabled && (
                <Link to="/lavoro" className="inline-flex items-center gap-1.5 rounded-xl border border-secondary-foreground/25 px-2.5 py-2 text-center text-sm font-semibold hover:bg-secondary-foreground/10 sm:px-3">
                  <Briefcase className="h-4 w-4 shrink-0" /> {tr.jobsTitle}
                </Link>
              )}
              {settings.bacheca_enabled && (
                <Link to="/bacheca-disponibilita" className="inline-flex items-center gap-1.5 rounded-xl border border-secondary-foreground/25 px-2.5 py-2 text-center text-sm font-semibold hover:bg-secondary-foreground/10 sm:px-3">
                  <Users className="h-4 w-4 shrink-0" /> {tr.bacheca}
                </Link>
              )}
            </div>
          )}
           <BusinessReturnButton />
           <Button variant="hero" size="lg" onClick={onWrite} className="hidden sm:inline-flex">
            <PenLine className="h-4 w-4" /> {tr.writeReview}
          </Button>
        </nav>
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <AuthButton />
          <LangSelector dark />
        </div>
      </div>
       <div className="mx-auto max-w-7xl px-4 pb-10 pt-6 sm:pb-16 sm:pt-10">
         <div className="flex flex-wrap items-center justify-between gap-2">
           <span className="inline-flex items-center gap-2 rounded-full border border-secondary-foreground/15 bg-secondary-foreground/10 px-3 py-1 text-xs font-medium">
             <span className="h-2 w-2 rounded-full bg-primary" /> {fmt(tr.stats, { n: (total ?? 0).toLocaleString("it-IT") })}
           </span>
           {showShare && <ShareSiteButton />}
         </div>
         <h1 className="mt-4 max-w-3xl text-[1.75rem] font-extrabold leading-[1.18] tracking-normal sm:text-5xl">{tr.heroTitle}</h1>
         <p className="mt-3 max-w-2xl text-sm leading-relaxed text-secondary-foreground/75 sm:text-base">{tr.heroSub}</p>
        <div className="mt-6 max-w-3xl"><SearchBox onWriteFor={onWriteFor} /></div>
        <Button variant="hero" size="lg" onClick={onWrite} className="mt-4 w-full sm:hidden">
          <PenLine className="h-4 w-4" /> {tr.writeReview}
        </Button>
      </div>
    </header>
  );
}
