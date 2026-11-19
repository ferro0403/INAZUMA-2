# Regole per lavorare su INAZUMA-2

Gioco nuovo, scritto da zero. Il vecchio gioco (ferro0403/INAZUMA-ROGUELIKE) si legge per capire i dati,
ma **non si copia il suo codice**: da li' si importano solo i DATI, con `scripts/import-from-old-repo.js`.
Progetto completo: `docs/PROGETTO_NUOVO_GIOCO.md`.

## Struttura
- `index.html` + `src/` : il gioco, solo browser e moduli ES (`import`/`export`). **Nessuna build.**
- `src/engine/` : motore (scontri, forza, potenza, nemici, rosa). Tutti i numeri in `data/balance.json`.
- `src/match/` : partita RTG (azioni, mosse, IA, intervallo, supplementari, rigori). Vedi `docs/match.md`.
- `src/cards/` : identita' della carta = fonte (season o svincolati) + id giocatore.
- `data/` : dati in JSON leggibili (season, svincolati, statistiche, importanza). Vedi `docs/data-format.md`.
- `scripts/` : importazione, validazione, ricalcolo importanza (Node >= 22, nessuna dipendenza).
- `tests/` : `npm test` (node:test). Con `OLD_REPO=<percorso>` confronta anche col vecchio repo.
- `docs/` : documentazione e report generati.

## Regole
1. **Mai scrivere su `main`.** Ogni lavoro su un branch, in una PR separata e piccola. Il merge lo fa solo l'utente.
2. **File piccoli** (sotto 400 righe) e **una responsabilita' per file**.
3. **Season ed eventi sono dati, non codice**: vietato scrivere id di season/evento nel codice (`"ie1"`, `"orion"`,
   `"halloween"`...) e vietato `if (seasonId === ...)`. Il codice legge `data/seasons/index.json` e i campi dei file.
4. **Dati in JSON leggibili** in `data/`: niente blob compressi o base64 nei `.js`. **Numeri del gioco solo in
   `data/balance.json`**, mai nel codice.
5. **CSS**: niente `!important`; colori, spazi e raggi solo come variabili in `src/styles/tokens.css`.
6. **Non inventare dati**: mosse, statistiche e importanza non si assegnano a caso. Le mosse le da' l'utente.
   Se un dato manca si chiede.
7. Immagini: solo i link gia' presenti nei dati, mai cambiati. Nessun asset preso da altri giochi.
8. Prima di dire "fatto": `npm test` e `npm run validate` verdi.

## Comandi
- `npm test` - tutti i test (`OLD_REPO=../INAZUMA-ROGUELIKE npm test` per il confronto col vecchio repo)
- `npm run validate` - controlla i dati (`-- --old <percorso>` per il confronto)
- `npm run import -- <percorso-vecchio-repo>` - rigenera `data/` dal vecchio repo
- `npm run importance` - ricalcola l'importanza dopo aver cambiato regole o correzioni
- `npm run simulate` - simulatore di taratura (`-- --calibrate` cerca il k migliore)
- `npm run simulate-match` - partite IA contro IA, tabella per differenza di potenza
- `npm run build-rtg-difficulty` - crea `data/rtg-difficulty.json` (`-- --force` per rifarlo)
- `npm run move-powers -- [percorso/PLAYER_MOVES_DATABASE.json]` - potenze originali delle mosse
  (con il percorso rigenera `data/move-powers.json`; il file grande non va nel repo)
