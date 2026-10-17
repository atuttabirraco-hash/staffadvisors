import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { sendSiteMessage } from "@/lib/contact.functions";
import { Button } from "@/components/ui/button";
import { useLang } from "@/lib/lang";
import { Footer } from "@/components/staff/Sections";

export const Route = createFileRoute("/contatti")({
  head: () => ({
    meta: [
      { title: "Contatti | StaffAdvisors" },
      { name: "description", content: "Segnala a StaffAdvisors problemi, errori o suggerimenti. Per lavoro e disponibilita usa la Bacheca Disponibilita." },
      { property: "og:title", content: "Contatti | StaffAdvisors" },
      { property: "og:description", content: "Contatta lo staff di StaffAdvisors: domande, problemi, proposte e segnalazioni." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Contatti,
});

function Contatti() {
  const { tr } = useLang();
  const send = useServerFn(sendSiteMessage);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    setErr("");
    try {
      await send({ data: { name: String(f.get("name") ?? ""), email: String(f.get("email") ?? ""), message: String(f.get("message") ?? "") } });
      setSent(true);
    } catch {
      setErr(tr.contactError);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
        <h1 className="text-2xl font-extrabold">{tr.contact}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{tr.contactIntro}</p>
        <p className="mt-1 text-sm">
          <a href="mailto:info@staffadvisors.it" className="font-semibold text-primary underline">info@staffadvisors.it</a>
        </p>
        <div className="mt-5 rounded-2xl border border-primary/25 bg-primary/5 p-5">
          <p className="text-sm font-extrabold">{tr.contactNoticeTitle}</p>
          <p className="mt-1 text-sm text-muted-foreground">{tr.contactNoticeText}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link to="/bacheca-disponibilita" className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">{tr.contactBoardCta}</Link>
            <Link to="/lavoro" className="rounded-xl border border-border bg-card px-4 py-2 text-sm font-bold">{tr.contactOffersCta}</Link>
          </div>
        </div>
        <div className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-card">
          {sent ? (
            <p className="py-6 text-center text-lg font-bold text-success">{tr.contactSent}</p>
          ) : (
            <form onSubmit={submit} className="space-y-3">
              <input required name="name" minLength={2} maxLength={100} placeholder={tr.contactName} aria-label={tr.contactName} className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm" />
              <input required type="email" name="email" maxLength={200} placeholder={tr.contactEmail} aria-label={tr.contactEmail} className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm" />
              <textarea required name="message" minLength={10} maxLength={4000} rows={6} placeholder={tr.contactMessage} aria-label={tr.contactMessage} className="w-full rounded-xl border border-border bg-background p-3 text-sm" />
              <p className="text-xs text-muted-foreground">{tr.contactReply}</p>
              <Button variant="hero" type="submit" disabled={busy}>{busy ? "..." : tr.contactSend}</Button>
              {err && <p className="text-sm text-destructive">{err}</p>}
            </form>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
