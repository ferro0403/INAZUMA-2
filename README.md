# Inazuma 2

Nuovo gioco nel browser (run classica e Road to Glory) con le 7 statistiche Lv50 e le rarita'.
Il progetto e le tappe sono in [`docs/PROGETTO_NUOVO_GIOCO.md`](docs/PROGETTO_NUOVO_GIOCO.md);
le regole di lavoro in [`CLAUDE.md`](CLAUDE.md).

## Avvio
Nessuna build: basta servire la cartella con un server statico qualsiasi, ad esempio

```bash
python3 -m http.server 8000
```

e aprire `http://localhost:8000`.

## Dati
- Formato: [`docs/data-format.md`](docs/data-format.md)
- Ultimo report di importazione: [`docs/import-report.md`](docs/import-report.md)

```bash
npm run import -- ../INAZUMA-ROGUELIKE
```

```bash
npm test
```
