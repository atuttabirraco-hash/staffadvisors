# Roadmap

## In corso
- Nessuna attività aperta.

## Completato (verificato)
- Pubblicazione su staffadvisors.it richiesta e messa online: pulsante «Torna all'area aziendale» nei menu, home pubblica anche per aziende, sondaggi con tipo (anonimo/individuale) e nome/data di nascita, Avvia/Pausa/Termina con risposte parziali conservate, risultati a cartella, codice QR del link, avviso «Modifiche non salvate», sintesi AI leggibile a schermo con interruttore admin, 10 domande preimpostate, guida "Come funziona", CV facoltativo, accesso Google/Apple aziende, eliminazione account, email di ringraziamento con invito Trustpilot. Controllo di sicurezza: nessun problema serio (due voci pubbliche già confermate come volute). Verificato online: titolo pagina corretto e nuovi comandi presenti nella versione pubblicata.
- Home pubblica anche per aziende; Area aziende nei menu accanto a lavoro e bacheca, non flottante. Verificato nelle tre pagine pubbliche e nascosto agli ospiti.
- Termina chiude il sondaggio e aggiorna subito i risultati, comprese le risposte parziali salvate durante la compilazione. Prova con questionario incompleto: un voto conservato, seconda domanda senza voti, partecipante bloccato dopo chiusura; dati temporanei rimossi. Quattro test superati.
- Eliminazione account anche nell’Area aziende; recensioni e risposte ufficiali pubblicate conservate. Conferma annullabile, eliminazione e ritorno all’accesso provati con due account temporanei (persona e azienda); sei test superati.
- Sintesi AI sotto i risultati nell’Area aziende, con pulsante «Genera sintesi AI» senza download obbligatorio: provata con risposta anonima reale, lettura da telefono e cartella contenente la stessa sintesi; resta leggibile dopo il download, risposte eliminate e dati temporanei rimossi.
- Sintesi senza intelligenza artificiale (nessun consumo di crediti): calcolata sui dati raccolti, in tutte le 8 lingue, con punti di forza, azioni consigliate e temi ricorrenti delle risposte scritte; compare a schermo come «Sintesi automatica» e nella cartella come sintesi.txt. Quattro test superati; prova reale con sondaggio temporaneo (3 risposte), cartella scaricata e controllata, sondaggio di prova poi eliminato. Pubblicata su staffadvisors.it il 17/10/2026.
- Sondaggi: codice QR accanto al link (pulsante QR, attivo solo a sondaggio avviato) e avviso «Modifiche non salvate» di fianco a «Salva domande» che sparisce dopo il salvataggio — verificati in anteprima
- Guida "Come funziona" area aziende — si apre da sola al primo accesso, 5 passi, verificata in anteprima
- Prova end-to-end richiesta dall'utente: azienda di prova creata, sondaggio con 10 domande preimpostate, 2 dipendenti fittizi hanno risposto in forma anonima (uno per dispositivo), resoconto e percentuali visibili nell'area, cartella ZIP scaricata sul computer (tabella voti + riepilogo + sintesi AI dettagliata), risposte cancellate dal server dopo il download (verificato anche nel database: 0 risposte rimaste)
- Pulizia: azienda e sondaggio di prova eliminati dal database
- Sezione «Per le aziende» della pagina iniziale: nuovo punto «Sondaggi interni anonimi per i dipendenti» con link «Apri l’area sondaggi» verso /area-aziende (verificato in italiano, inglese e arabo; il punto sparisce se l’area aziende viene spenta da /admin)

## In sospeso
- Nessuna pubblicazione in attesa.
- [fatto] Formato risultati per telefono: scelta la pagina web, realizzata e pubblicata (risultati.html con ciambelle, stelle e barre).
- [fatto] Nuova pagina risultati (risultati.html) nella cartella scaricata dei sondaggi: verificata con prova end-to-end (3 risposte di prova, scaricamento, apertura pagina). Scelta di Diego: solo pagina web, niente Excel/PDF.
- [fatto] Grafici più belli su richiesta di Diego: ciambella SVG per Sì/No e scelta multipla, stelle con media per voto 1-5, barre con sfumatura arancione e animazione. Test 3/3 e typecheck ok.
