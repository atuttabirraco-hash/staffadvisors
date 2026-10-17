import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/staff/LegalPage";

const T = "Cookie Policy | StaffAdvisors";
const D = "StaffAdvisors usa solo cookie e archiviazione tecnici necessari. Nessun cookie di profilazione o pubblicitario.";

export const Route = createFileRoute("/cookie")({
  head: () => ({
    meta: [
      { title: T }, { name: "description", content: D },
      { property: "og:title", content: T }, { property: "og:description", content: D },
      { property: "og:type", content: "article" }, { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "/cookie" }],
  }),
  component: () => (
    <LegalPage title="Cookie Policy">
      <p>Questa informativa e redatta ai sensi delle Linee guida cookie del Garante Privacy (10 giugno 2021).</p>
      <h2>Cookie utilizzati</h2>
      <ul>
        <li><b>Tecnici necessari</b>: memorizzano la lingua scelta e la chiusura di questo avviso (archiviazione locale del browser). Non richiedono consenso.</li>
        <li><b>Profilazione / pubblicita</b>: non utilizzati.</li>
        <li><b>Analytics di terze parti</b>: non utilizzati.</li>
      </ul>
      <h2>Come gestirli</h2>
      <p>Puoi cancellare i dati del sito dalle impostazioni del tuo browser in qualsiasi momento. Il sito continuera a funzionare.</p>
      <p>Per domande: info@staffadvisors.it</p>
    </LegalPage>
  ),
});
