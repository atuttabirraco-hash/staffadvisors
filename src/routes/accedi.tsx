import { createFileRoute } from "@tanstack/react-router";
import { AuthPage } from "./auth";

export const Route = createFileRoute("/accedi")({
  head: () => ({
    meta: [
      { title: "Accedi | StaffAdvisors" },
      { name: "description", content: "Accedi a StaffAdvisors per gestire il tuo annuncio in bacheca." },
      { property: "og:title", content: "Accedi | StaffAdvisors" },
      { property: "og:description", content: "Accedi a StaffAdvisors." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => <AuthPage initial="login" next="/dashboard" />,
});
