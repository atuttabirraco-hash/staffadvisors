import { useEffect, useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useLang } from "@/lib/lang";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/staff/Header";
import { MailCheck } from "lucide-react";
import { PasswordInput } from "@/components/staff/PasswordInput";
import { trackSignUp } from "@/lib/analytics";
import { Footer } from "@/components/staff/Sections";
import { businessCopy } from "@/lib/business-copy";
import { useSiteSettings } from "@/components/staff/JobOffers";
import { HomeLink } from "@/components/staff/HomeLink";

async function homeAfterLogin(next: string): Promise<string> {
  const { data } = await supabase.auth.getUser();
  if (!data.user) return next;
  if (data.user.user_metadata?.["account_type"] === "business") return "/area-aziende";
  const { data: row } = await supabase.from("company_accounts").select("user_id").eq("user_id", data.user.id).maybeSingle();
  return row ? "/area-aziende" : next;
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47a5.57 5.57 0 0 1-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09A11.99 11.99 0 0 0 12 24z" />
      <path fill="#FBBC05" d="M5.27 14.29A7.2 7.2 0 0 1 4.89 12c0-.8.14-1.57.38-2.29V6.62H1.29a12 12 0 0 0 0 10.76l3.98-3.09z" />
      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42A11.98 11.98 0 0 0 12 0 11.99 11.99 0 0 0 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75z" />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.53 4.08zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
  );
}

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Accedi o registrati | StaffAdvisors" },
      { name: "description", content: "Crea un account StaffAdvisors per scrivere recensioni anonime, ritrovarle e accedere alle funzioni riservate." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Accedi o registrati | StaffAdvisors" },
      { property: "og:description", content: "Accedi al tuo account personale o aziendale StaffAdvisors." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <AuthPage />,
});

export function AuthPage({ initial = "login", next = "/account", business = false }: { initial?: "login" | "signup"; next?: string; business?: boolean }) {
  const { tr, lang } = useLang();
  const bc = businessCopy[lang];
  const businessAreaEnabled = useSiteSettings().data?.business_area_enabled ?? true;
  const [accountType, setAccountType] = useState<"person" | "business">(business ? "business" : "person");
  const [companyName, setCompanyName] = useState("");
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup" | "forgot">(initial);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState<"" | "confirm" | "reset">("");
  const [marketingConsent, setMarketingConsent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    if (mode === "signup" && accountType === "business" && companyName.trim().length < 2) { setBusy(false); return setError(bc.error); }
    if (mode === "signup") {
      const { data, error: err } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: { marketing_consent: marketingConsent, ...(accountType === "business" ? { account_type: "business", company_name: companyName.trim() } : {}) },
        },
      });
      setBusy(false);
      if (err) return setError(err.message || tr.authError);
      // Existing email: no email is sent and identities comes back empty
      if (data.user && (data.user.identities?.length ?? 0) === 0) return setError(tr.emailExists);
      if (data.user) trackSignUp(data.user.id, "email");
      setSent("confirm");
    } else if (mode === "forgot") {
      const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      setBusy(false);
      if (err) return setError(err.message);
      setSent("reset");
    } else {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password });
      setBusy(false);
      if (err) return setError(tr.authError);
      navigate({ to: (await homeAfterLogin(next)) as "/account" });
    }
  };

  const oauth = async (provider: "google" | "apple") => {
    setBusy(true);
    setError("");
    const result = await lovable.auth.signInWithOAuth(provider, {
      redirect_uri: accountType === "business" ? `${window.location.origin}/registrati-azienda` : window.location.origin,
    });
    if (result.redirected) return;
    setBusy(false);
    if (result.error) return setError(tr.authError);
    navigate({ to: accountType === "business" ? "/area-aziende" : ((await homeAfterLogin(next)) as "/account") });
  };

  // Business OAuth returns to /registrati-azienda: once the session exists, open the business area
  // (it asks for the company name when missing).
  useEffect(() => {
    if (!business) return;
    void supabase.auth.getSession().then(({ data }) => { if (data.session) navigate({ to: "/area-aziende" }); });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => { if (session) navigate({ to: "/area-aziende" }); });
    return () => sub.subscription.unsubscribe();
  }, [business]);

  const inputCls = "rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40";

  const oauthButtons = (
    <>
      <div className="mt-6 flex items-center gap-3">
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs font-medium text-muted-foreground">{tr.orContinueWith}</span>
        <span className="h-px flex-1 bg-border" />
      </div>
      <div className="mt-4 flex flex-col gap-2.5">
        <Button variant="outline" size="lg" type="button" disabled={busy} onClick={() => void oauth("google")} className="w-full gap-2">
          <GoogleIcon /> {tr.continueWithGoogle}
        </Button>
        <Button variant="outline" size="lg" type="button" disabled={busy} onClick={() => void oauth("apple")} className="w-full gap-2">
          <AppleIcon /> {tr.continueWithApple}
        </Button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="border-b border-border bg-card px-4 py-4">
        <div className="mx-auto max-w-7xl"><Logo /></div>
      </div>
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-sm">
          {sent ? (
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-soft text-primary">
                <MailCheck className="h-8 w-8" />
              </div>
              <p className="text-sm text-muted-foreground">{sent === "confirm" ? tr.confirmEmailMsg : tr.resetSent}</p>
              <p className="text-xs text-muted-foreground">{tr.checkSpam}</p>
              <HomeLink className="text-sm font-semibold text-primary hover:underline">{tr.backHome}</HomeLink>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
                {mode === "login" ? tr.welcomeBack : mode === "signup" ? tr.createAccount : tr.forgotPassword}
              </h1>
              {mode !== "forgot" && <p className="mt-2 text-sm text-muted-foreground">{tr.accountOptional}</p>}
              <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
                {mode === "signup" && (
                  <div className="flex flex-col gap-1.5">
                    <span className="text-sm font-medium text-foreground">{bc.accountType}</span>
                    <div className="grid grid-cols-2 gap-2">
                      {(["person", "business"] as const).map((k) => (
                        <button key={k} type="button" onClick={() => setAccountType(k)} className={`rounded-xl border px-3 py-2.5 text-sm font-semibold ${accountType === k ? "border-primary bg-primary-soft text-primary" : "border-input text-foreground hover:bg-muted"}`}>
                          {k === "person" ? bc.person : bc.business}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {mode === "signup" && accountType === "business" && (
                  <label className="flex flex-col gap-1.5">
                    <span className="text-sm font-medium text-foreground">{bc.companyName}</span>
                    <input required maxLength={120} value={companyName} onChange={(e) => setCompanyName(e.target.value)} autoComplete="organization" className={inputCls} />
                  </label>
                )}
                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium text-foreground">{tr.email}</span>
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" className={inputCls} />
                </label>
                {mode !== "forgot" && (
                  <div className="flex flex-col gap-1.5">
                    <span className="text-sm font-medium text-foreground">{tr.password}</span>
                    <PasswordInput value={password} onChange={setPassword} autoComplete={mode === "signup" ? "new-password" : "current-password"} />
                    {mode === "login" && (
                      <button type="button" onClick={() => { setMode("forgot"); setError(""); }} className="self-end text-xs font-medium text-primary hover:underline">
                        {tr.forgotPassword}
                      </button>
                    )}
                  </div>
                )}
                {mode === "signup" && (
                  <label className="flex items-start gap-2.5 text-xs text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={marketingConsent}
                      onChange={(e) => setMarketingConsent(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-input accent-primary"
                    />
                    <span>{tr.marketingConsent}</span>
                  </label>
                )}
                {error && <p className="text-sm font-medium text-destructive">{error}</p>}
                <Button variant="hero" size="lg" type="submit" disabled={busy}>
                  {mode === "login" ? tr.signIn : mode === "signup" ? tr.signUp : tr.sendResetLink}
                </Button>
              </form>
              <button
                onClick={() => { setMode(mode === "signup" ? "login" : mode === "login" ? "signup" : "login"); setError(""); }}
                className="mt-4 w-full text-center text-sm font-medium text-primary hover:underline"
              >
                {mode === "login" ? tr.noAccount : tr.haveAccount}
              </button>
              {mode !== "forgot" && oauthButtons}
              {mode === "login" && businessAreaEnabled && (
                <Link to="/registrati-azienda" className="mt-6 block text-center text-sm font-medium text-primary hover:underline">{bc.areYouBusiness}</Link>
              )}
            </>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
