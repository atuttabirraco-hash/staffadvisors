import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/bacheca-lavoro")({
  head: () => ({
    meta: [
      { title: "Bacheca Disponibilità | StaffAdvisors" },
      { name: "robots", content: "noindex" },
    ],
  }),
  beforeLoad: () => {
    throw redirect({ to: "/bacheca-disponibilita" });
  },
  component: () => null,
});
