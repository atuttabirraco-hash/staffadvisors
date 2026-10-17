import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/staff/LegalPage";

const T = "Termini e Condizioni | StaffAdvisors";
const D = "Regole d'uso di StaffAdvisors: recensioni anonime veritiere, niente nomi o insulti, diritto di replica per le aziende.";

export const Route = createFileRoute("/termini")({
  head: () => ({
    meta: [
      { title: T }, { name: "description", content: D },
      { property: "og:title", content: T }, { property: "og:description", content: D },
      { property: "og:type", content: "article" }, { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "/termini" }],
  }),
  component: () => (
    <LegalPage title="Termini e Condizioni d'uso">
      <p>Utilizzando staffadvisors.it accetti i presenti termini. Il servizio consente di leggere e pubblicare recensioni anonime sulle esperienze di lavoro in Italia, consultare offerte di lavoro e annunci della Bacheca Disponibilità.</p>
      <h2>Titolare del servizio</h2>
      <p>Il sito staffadvisors.it e gestito da Diego Gallarello in qualita di titolare privato del servizio. Contatti: info@staffadvisors.it.</p>
      <h2>Regole per le recensioni</h2>
      <ul>
        <li>Scrivi solo di esperienze di lavoro reali e personali.</li>
        <li>Vietato indicare nomi di persone, dati personali, insulti, contenuti discriminatori o diffamatori.</li>
        <li>Le recensioni esprimono opinioni personali degli autori, non di StaffAdvisors.</li>
        <li>Per scrivere una recensione serve un account gratuito; la recensione resta pubblicamente anonima.</li>
        <li>Sono consentite al massimo 2 recensioni all anno per ciascuna azienda per ogni account.</li>
      </ul>
      <h2>Moderazione</h2>
      <p>Le recensioni vengono pubblicate subito dopo un controllo automatico. StaffAdvisors puo rimuovere o contrassegnare come false le recensioni che violano queste regole, anche su segnalazione.</p>
      <h2>Diritto di replica</h2>
      <p>Le aziende possono rispondere pubblicamente alle recensioni e segnalare contenuti ritenuti falsi o lesivi scrivendo a info@staffadvisors.it.</p>
      <h2>Bacheca Disponibilità e offerte di lavoro</h2>
      <p>La Bacheca Disponibilità offre esclusivamente spazio per annunci pubblicati dagli utenti: StaffAdvisors non svolge attivita di intermediazione e non verifica i contenuti degli annunci. Chi pubblica un annuncio e responsabile dei recapiti e delle informazioni indicate; i contatti sono visibili solo agli utenti registrati. Gli annunci scadono automaticamente dopo 15 giorni e possono essere cancellati in qualsiasi momento dall'autore.</p>
      <h2>Responsabilita</h2>
      <p>L'autore e responsabile dei contenuti pubblicati. StaffAdvisors agisce come hosting provider ai sensi del D.Lgs. 70/2003 e rimuove tempestivamente i contenuti illeciti segnalati.</p>
      <h2>Legge applicabile</h2>
      <p>I presenti termini sono regolati dalla legge italiana.</p>
    </LegalPage>
  ),
});
