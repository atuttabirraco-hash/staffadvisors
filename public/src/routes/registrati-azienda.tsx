import { createFileRoute, Link } from "@tanstack/react-router";
import { AuthPage } from "./auth";
import { useSiteSettings } from "@/components/staff/JobOffers";

function BusinessSignup() {
  const { data: settings } = useSiteSettings();
  if (settings && !settings.business_area_enabled) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
        <p className="max-w-md rounded-2xl border border-border bg-card p-6 text-center text-muted-foreground">L'area aziende non è disponibile al momento.</p>
        <Link to="/" className="mt-4 text-sm font-medium text-primary hover:underline">Torna alla home</Link>
      </div>
    );
  }
  return <AuthPage initial="signup" business next="/area-aziende" />;
}

export const Route = createFileRoute("/registrati-azienda")({
  head: () => ({
    meta: [
      { title: "Area aziende: sondaggi anonimi per i dipendenti | StaffAdvisors" },
      { name: "description", content: "Registra gratis la tua azienda su StaffAdvisors: crea sondaggi interni anonimi per i dipendenti, leggi e rispondi alle recensioni sulla tua azienda e pubblica offerte di lavoro." },
      { property: "og:title", content: "Area aziende: sondaggi anonimi per i dipendenti | StaffAdvisors" },
      { property: "og:description", content: "Sondaggi interni anonimi, gestione e risposta alle recensioni dei dipendenti e offerte di lavoro pubbliche. Registrazione gratuita." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://staffadvisors.it/registrati-azienda" },
      { property: "og:image", content: "https://staffadvisors.it/social-card.jpg" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: "https://staffadvisors.it/social-card.jpg" },
    ],
    links: [{ rel: "canonical", href: "https://staffadvisors.it/registrati-azienda" }],
    scripts: [{
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: "Area aziende StaffAdvisors",
        url: "https://staffadvisors.it/registrati-azienda",
        description: "Sondaggi interni anonimi, risposte ufficiali alle recensioni e offerte di lavoro pubbliche per le aziende.",
        inLanguage: "it",
        isPartOf: { "@type": "WebSite", name: "StaffAdvisors", url: "https://staffadvisors.it" },
      }),
    }],
  }),
  component: BusinessSignup,
});
