# Decorazioni automatiche per le festività

## Obiettivo
Aggiungere alla sola pagina iniziale tocchi stagionali sobri, che compaiono e scompaiono automaticamente in base alla data. Fuori dai periodi previsti la pagina resta identica alla versione classica.

## Cosa verrà realizzato
- **Halloween, 24 ottobre–2 novembre:** piccolo richiamo alla zucca, dettagli arancioni e una frase stagionale vicino alla testata principale.
- **Natale, 1 dicembre–6 gennaio:** decorazioni natalizie leggere attorno al logo o alla testata.
- **Carnevale:** dalla settimana precedente al Martedì Grasso, calcolato ogni anno dalla data di Pasqua, con mascherina e coriandoli discreti.
- **Pasqua:** dalla settimana precedente fino al martedì successivo a Pasquetta, calcolato ogni anno, con dettagli primaverili e pasquali.
- Testi stagionali disponibili in tutte le 8 lingue del sito.
- Animazioni leggere, disattivate automaticamente per chi preferisce ridurre i movimenti.
- Controllo su telefono e computer, compresa la corretta visualizzazione della versione normale fuori periodo.

## Dettagli tecnici
- Una funzione centrale determinerà la festività attiva usando la data italiana, evitando differenze dovute al fuso orario del visitatore.
- Carnevale e Pasqua useranno il calcolo annuale della Pasqua, senza date inserite manualmente.
- Un piccolo elemento dedicato verrà mostrato solo nella pagina `/`; la piattaforma in `/app` e tutte le altre pagine resteranno invariate.
- Il rendering iniziale userà una data coerente tra pagina e browser per evitare schermate vuote o cambi improvvisi.
