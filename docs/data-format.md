# Formato dei dati

Tutti i file in `data/` sono JSON leggibili. Quelli marcati *generato* si rifanno con
`npm run import -- <percorso-vecchio-repo>`: non modificarli a mano (le modifiche si perderebbero).

| File | Cosa contiene | Chi lo scrive |
|---|---|---|
| `seasons/index.json` | elenco e ordine delle season, percorsi degli altri file | generato |
| `seasons/<id>.json` | una season: regole, formazioni, squadre, boss, partite speciali, profili, reclutamento, RTG, giocatori | generato |
| `free-agents.json` | svincolati | generato |
| `player-visuals.json` | link ritratto/figura intera per id giocatore (dal Zukan) | generato |
| `rtg-campaign.json` | costanti di campagna della Road to Glory (premi, campagne) | generato |
| `elements.json` | nomi degli elementi (in inglese) | a mano |
| `stats-missing.json` | giocatori senza statistiche Lv50 | generato |
| `statistiche-ufficiali-lv50.json` | 7 statistiche Lv50 per id (fonte: Zukan) | dato dall'utente |
| `importance-rules.json` | regola dell'importanza | a mano |
| `importance-overrides.json` | correzioni a mano dell'importanza | a mano |

## Una season (`seasons/<id>.json`)
Le chiavi sono quelle del vecchio database, con questi cambi:

- in testa: `schemaVersion`, `id`, `name`, `displaySeasonNumber`, `albumCollectionId`, `importedFrom`
  (repo, commit e file di origine);
- `bossOrder`, `specialMatches`, `teams`, `formations`, `profiles`, `recruitmentPool`... restano come prima
  (stesso ordine, stessi id, stessi link);
- `displayTeamNames`: nome da mostrare per alcune squadre (prima era scritto nel codice);
- `rtg`: configurazione della modalita' Road to Glory per questa season (ordine `mainTeams`,
  `importantMatches`, checkpoint, vite, costi...), prima scritta in `js/road-to-glory/rtg-config.js`;
- `legacy`: tutto quello che serviva solo al vecchio formato (vedi sotto).

### Il blocco `legacy`
Ogni oggetto (giocatore, squadra, boss, regola...) puo' avere un blocco `legacy` con i campi del vecchio sistema:
overall (`finalOverall`, `teamOverall`, `designTargetOverall`...), rating 1-10 (`ratings`, `finalStats`),
fascia (`category`), livelli (`level`, `maxLevel`, `bossLevel`, `matchLevel`...), `teamStars`, `cap` della RTG,
`progressionCode`. La regola esatta e' in `scripts/import-config.json` (`legacyFieldRule`).
Niente e' cancellato: rimettendo i campi `legacy` al loro posto si riottiene il file originale
(lo controlla `npm run validate -- --old <percorso>`). Il nuovo gioco non deve usare `legacy`, tranne
il calcolo dell'importanza.

### Elementi
Sempre in inglese: Fire, Forest, Wind, Mountain (e Void, solo in alcune mosse); elenco in `elements.json`.
In IE1 erano in italiano (Fuoco, Montagna, Albero, Vento): il nome originale resta in `legacy.element`.
La tabella di conversione e' in `scripts/import-config.json` (`elementNames`).

### Un giocatore
Campi originali (id, nome, `portraitUrl`, ruolo, elemento, squadre...) piu':

- `stats`: `{ kick, control, technique, pressure, physical, agility, intelligence }` Lv50, oppure `null`
  se mancano (elencati in `stats-missing.json`);
- `importance`: 0 comune, 1 conosciuto, 2 protagonista; `importanceSource`: `rule` o `override`;
- `moves`: 2-4 mosse `{ name, type, element, power }` gia' assegnate nel vecchio gioco (RTG). Lista vuota se
  non ci sono: le assegna l'utente. `movesFromSeason` se le mosse vengono da una season precedente
  (come faceva il vecchio gioco, ordine in `scripts/import-config.json`);
- `signatureMove`: la mossa singola usata dalla vecchia run classica (`null` se assente);
  `signatureMoveInherited: true` se veniva da `inheritedPlayers`.

## Importanza
**Per ora non si usa**: il campo resta nei dati ma non entra in formule, interfaccia o report.

Regola (in `importance-rules.json`): si guardano `legacy.category` e `legacy.finalOverall` e vale il piu' alto:

| category | finalOverall | importanza |
|---|---|---|
| Debole, Normale, Buono, Forte | sotto 85 | 0 comune |
| Elite | 85-89 | 1 conosciuto |
| Mondiale, Leggenda | 90 e oltre | 2 protagonista |

Nel vecchio gioco `category` e' gia' la fascia di `finalOverall`, quindi i due criteri coincidono.
Per correggere un giocatore: `importance-overrides.json` (`players` per id, `seasonPlayers` per `season/id`),
poi `npm run importance`. Le correzioni sopravvivono a una nuova importazione.
