# Aggiungere la lingua araba

## Cosa cambia
- Aggiungere l'arabo al selettore delle lingue come ottava lingua.
- Tradurre tutte le scritte pubbliche gia presenti, incluse recensioni, aziende, account e offerte di lavoro.
- Passare automaticamente l'interfaccia da destra a sinistra quando viene scelto l'arabo e ripristinare la direzione normale con le altre lingue.
- Conservare la lingua scelta nelle visite successive.

## Verifica
- Aprire il sito in formato telefono, selezionare `AR` e controllare intestazione, ricerca, filtri e schede.
- Tornare all'italiano e verificare che l'impaginazione ritorni correttamente da sinistra a destra.
- Controllare che il sito venga compilato senza errori.

## Dettagli tecnici
- Estendere l'elenco e il tipo delle lingue in `i18n.ts` e aggiungere un dizionario arabo completo con le stesse chiavi delle altre lingue.
- Sincronizzare gli attributi `lang` e `dir` del documento nel gestore della lingua.
- Aggiungere solo gli adattamenti RTL necessari agli elementi direzionali condivisi, senza cambiare il design corrente.
