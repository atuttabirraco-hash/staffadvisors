import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/staff/LegalPage";

const T = "Informativa Privacy | StaffAdvisors";
const D = "Come StaffAdvisors tratta i dati personali ai sensi del GDPR (Reg. UE 2016/679): recensioni anonime, account e annunci della Bacheca Disponibilità.";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: T }, { name: "description", content: D },
      { property: "og:title", content: T }, { property: "og:description", content: D },
      { property: "og:type", content: "article" }, { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "/privacy" }],
  }),
  component: () => (
    <LegalPage title="Informativa sulla Privacy">
      <p>La presente informativa descrive il trattamento dei dati personali degli utenti di staffadvisors.it ai sensi degli artt. 13 e 14 del Regolamento (UE) 2016/679 (GDPR) e del D.Lgs. 196/2003.</p>
      <h2>Titolare del trattamento</h2>
      <p>Titolare del trattamento: Diego Gallarello, titolare privato del sito staffadvisors.it - email: info@staffadvisors.it</p>
      <h2>Dati trattati</h2>
      <ul>
        <li>Contenuto delle recensioni (valutazioni e testi), pubblicate in forma anonima.</li>
        <li>Email facoltativa per la verifica: non viene mai salvata in chiaro. Conserviamo solo un'impronta cifrata (hash) che non permette di risalire all'indirizzo.</li>
        <li>Per la Bacheca Disponibilità: nome visualizzato, mansione, zona, descrizione e recapiti indicati dall'utente; curriculum in PDF facoltativo, non pubblicato in pagina e scaricabile solo dagli utenti registrati che hanno effettuato l'accesso. Si raccomanda di non inserire dati sensibili o documenti d'identità; le copie già scaricate da terzi non possono essere ritirate.</li>
        <li>Dati tecnici di navigazione strettamente necessari al funzionamento del sito.</li>
      </ul>
      <h2>Finalita e base giuridica</h2>
      <p>Pubblicazione di recensioni sui luoghi di lavoro (legittimo interesse e liberta di espressione, art. 6.1.f GDPR); prevenzione di recensioni false tramite account; pubblicazione della disponibilita lavorativa e dei recapiti su consenso dell'utente (art. 6.1.a).</p>
      <h2>Conservazione</h2>
      <p>L'hash dell'email e conservato per il tempo necessario a impedire recensioni multiple e comunque non oltre la vita della recensione. Gli annunci della Bacheca scadono dopo 15 giorni e possono essere cancellati in qualsiasi momento dall'utente; il curriculum può essere rimosso in ogni momento e viene eliminato insieme all'annuncio.</p>
      <h2>Comunicazione dei dati</h2>
      <p>I dati non vengono venduti ne ceduti a terzi. Possono essere trattati da fornitori tecnici (hosting, database) nominati responsabili del trattamento.</p>
      <h2>Diritti dell'interessato</h2>
      <p>Puoi esercitare i diritti di accesso, rettifica, cancellazione, limitazione, opposizione e portabilita (artt. 15-22 GDPR) scrivendo a info@staffadvisors.it, e proporre reclamo al Garante per la protezione dei dati personali (www.garanteprivacy.it).</p>
      <h2>Nomi e dati di terzi</h2>
      <p>Le recensioni non possono contenere nomi di persone o dati identificativi: un sistema automatico li blocca e il personale di moderazione rimuove eventuali contenuti non conformi.</p>
    </LegalPage>
  ),
});
