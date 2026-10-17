import { createFileRoute } from "@tanstack/react-router";
import { PlatformHome } from "@/components/staff/PlatformHome";
import { SITE_URL, SOCIAL_IMAGE } from "@/lib/site";

export const Route = createFileRoute("/app")({
  head: () => ({ meta: [{ title: "Cerca aziende e recensioni di lavoro | StaffAdvisors" }, { name: "description", content: "Cerca aziende e leggi recensioni anonime sul lavoro. Per scriverne una serve un account gratuito: la recensione resta anonima." }, { property: "og:title", content: "Cerca aziende e recensioni di lavoro | StaffAdvisors" }, { property: "og:description", content: "La piattaforma italiana per scoprire come si lavora davvero." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }, { property: "og:url", content: `${SITE_URL}/app` }, { property: "og:image", content: SOCIAL_IMAGE }, { name: "twitter:image", content: SOCIAL_IMAGE }], links: [{ rel: "canonical", href: `${SITE_URL}/app` }] }),
  component: PlatformHome,
});