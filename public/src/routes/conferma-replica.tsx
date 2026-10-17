import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { z } from "zod";
import { confirmCompanyReply } from "@/lib/contact.functions";
import { Footer } from "@/components/staff/Sections";

export const Route = createFileRoute("/conferma-replica")({
  validateSearch: z.object({ t: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "Conferma risposta azienda | StaffAdvisors" },
      { name: "description", content: "Conferma che la risposta alla recensione e stata scritta dalla tua azienda." },
      { property: "og:title", content: "Conferma risposta azienda | StaffAdvisors" },
      { property: "og:description", content: "Conferma la risposta della tua azienda su StaffAdvisors." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ConfirmPage,
});

function ConfirmPage() {
  const { t } = Route.useSearch();
  const confirm = useServerFn(confirmCompanyReply);
  const [state, setState] = useState<"idle" | "busy" | "published" | "rejected" | "invalid">("idle");
  const [companyId, setCompanyId] = useState<string | undefined>();

  async function decide(accept: boolean) {
    if (!t) return setState("invalid");
    setState("busy");
    try {
      const r = await confirm({ data: { token: t, accept } });
      if (r.status === "published" && "companyId" in r) setCompanyId(r.companyId);
      setState(r.status);
    } catch {
      setState("invalid");
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-16 text-center">
      <div className="rounded-2xl border bg-card p-8 shadow-sm">
        {state === "published" ? (
          <>
            <h1 className="text-2xl font-bold">Risposta pubblicata</h1>
            <p className="mt-3 text-muted-foreground">Grazie: la risposta ora e visibile con il badge "Azienda verificata".</p>
            {companyId && (
              <Link to="/azienda/$id" params={{ id: companyId }} className="mt-6 inline-block font-semibold text-primary underline">
                Vai alla pagina dell'azienda
              </Link>
            )}
          </>
        ) : state === "rejected" ? (
          <>
            <h1 className="text-2xl font-bold">Risposta annullata</h1>
            <p className="mt-3 text-muted-foreground">Grazie per la segnalazione: questa risposta non verra pubblicata.</p>
          </>
        ) : state === "invalid" ? (
          <>
            <h1 className="text-2xl font-bold">Link non valido</h1>
            <p className="mt-3 text-muted-foreground">Il link e scaduto o e gia stato usato.</p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold">Sei tu ad aver risposto?</h1>
            <p className="mt-3 text-muted-foreground">Conferma che la risposta alla recensione e stata scritta dalla tua azienda.</p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button disabled={state === "busy"} onClick={() => decide(true)} className="rounded-2xl bg-primary px-5 py-3 font-semibold text-primary-foreground disabled:opacity-60">
                Si, sono io: pubblica
              </button>
              <button disabled={state === "busy"} onClick={() => decide(false)} className="rounded-2xl border px-5 py-3 font-semibold disabled:opacity-60">
                Non sono io
              </button>
            </div>
          </>
        )}
      </div>
      </main>
      <Footer />
    </div>
  );
}
