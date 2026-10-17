import { createFileRoute } from "@tanstack/react-router";
import { AuthPage } from "./auth";

export const Route = createFileRoute("/registrati")({
  head: () => ({
    meta: [
      { title: "Registrati | StaffAdvisors" },
      { name: "description", content: "Crea un account StaffAdvisors per pubblicare la tua disponibilita in bacheca." },
      { property: "og:title", content: "Registrati | StaffAdvisors" },
      { property: "og:description", content: "Crea un account StaffAdvisors." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => <AuthPage initial="signup" next="/inserisci-disponibilita" />,
});
