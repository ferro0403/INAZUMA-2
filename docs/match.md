# Partita RTG (tappa 4)

Codice in `src/match/` (scritto da zero), numeri in `data/balance.json` (sezione `match`), nessuna interfaccia.
Le regole vengono dal vecchio RTG (`rtg-match-engine.js`, `rtg-match-pt-runtime.js`, `rtg-ai-policy.js`,
`rtg-encounter-runtime.js`, `rtg-penalty-runtime.js`), lette solo per capirle.

| File | Cosa fa |
|---|---|
| `match-state.js` | crea la partita: numero di azioni, azioni interattive, calcio d'inizio, PT |
| `match-random.js` | casualita' con seme dentro lo stato (`state.rng`) |
| `player-pick.js` | chi prende parte allo scontro (pesi per ruolo del posto, forza, recenza, uso) |
| `move-points.js` | punti mossa (PT) |
| `ai-policy.js` | IA del nemico: mosse, intervallo, rigori |
| `encounter.js` | uno scontro: probabilita' (motore), mosse, esito, zona, gol |
| `halftime.js` | cambi all'intervallo |
| `penalties.js` | rigori |
| `match-flow.js` | tempi, intervallo, supplementari, rigori (`stepMatch`, `playMatch`) |
| `rtg-opponent.js` | squadra nemica di una partita principale e adattamento alla potenza del giocatore |
| `match-simulation.js` | partite IA contro IA per il simulatore |
| `../cards/card.js` | identita' della carta: `fonte:idGiocatore` (es. season + id) |

## Regole riprese dal vecchio RTG
- **Azioni**: tra 22 e 30 per partita, scelte con il seme; il primo tempo dura la meta' (arrotondata in basso).
- **Zone**: centrocampo -> attacco -> tiro. Chi ha la palla e' l'attore.
  - centrocampo: gruppo centrocampo contro centrocampo, mosse dribbling contro difesa;
  - attacco: dribbling (technique + control) contro difesa (pressure + physical);
  - tiro: tiro (kick + control) contro parata (physical + agility).
  Chi vince avanza: l'attore passa alla zona dopo; se vince il difensore prende palla
  (in attacco se ha vinto a centrocampo, a centrocampo negli altri casi). Un tiro vinto e' gol e la palla
  passa all'altra squadra a centrocampo.
- **Scelta del giocatore**: stessi pesi per ruolo del vecchio gioco (es. tiro: FW 1, MF 0,28, DF 0,02), un po'
  di peso alla forza nel gruppo, meno peso a chi ha giocato da poco o spesso. Dopo un dribbling vinto tira lo
  stesso giocatore. Il ruolo e' quello del **posto in formazione** (nessun vincolo di ruolo).
- **Azioni interattive**: da 17 a 22 azioni (scelte con il seme) permettono le mosse; tiri, supplementari e
  rigori sempre. Nelle altre si gioca senza mosse.
- **Punti mossa**: una mossa costa quanto la sua potenza. Tiro e parata si pagano sempre, dribbling e difesa
  solo se lo scontro e' vinto. Si possono usare solo mosse del tipo giusto e pagabili.
- **IA**: sceglie una mossa tra quelle pagabili (piu' probabile se potente), poi la usa con una probabilita'
  che dipende da quanto e' facile lo scontro (35% se gia' favorita al 75%, fino al 90% se sfavorita), con bonus
  a fine partita se non sta vincendo, bonus su tiro e parata, malus se e' l'ultimo uso prima del 50'.
- **Intervallo**: l'utente puo' cambiare titolari, riserve e posti, ma con le stesse carte; la rosa deve restare
  valida (11 titolari, massimo 4 riserve, massimo 2 Fabled). L'IA non cambia.
- **Supplementari**: se pari dopo i tempi regolamentari, due tempi da 3 azioni, tutte interattive.
- **Rigori**: se ancora pari, 5 a testa poi a oltranza. Senza mosse tiratore e portiere scelgono una direzione
  (stessa = parata); solo il tiratore con mossa = gol; solo il portiere = parata; entrambi = scontro tiro contro
  parata. Il portiere dell'IA "legge" le direzioni gia' usate dal tiratore.

## Regole NON riprese (o cambiate)
- **Possesso nelle azioni automatiche**: nel vecchio gioco, nelle azioni non interattive il possesso tornava
  sempre a chi attaccava (anche se perdeva). Qui vale sempre "chi vince avanza", come richiesto.
- **Calcolo dei PT**: prima 120-260 PT da statistiche che non esistono piu' (stamina, grit...) e bonus per
  rarita' vecchia. Qui **200 PT uguali per tutti** (decisione dell'utente, provvisorio).
- **Due usi per mossa** (versione ancora piu' vecchia): non ripreso, si usano solo i PT.
- **Elemento della mossa** quando entrambi usano una mossa: nel vecchio gioco dava un bonus in piu'. Qui conta
  la regola del motore (`elements.elementFrom`, ora l'elemento del giocatore).
- **Overall nella forza**: la forza e' quella del motore (statistiche Lv50 x rarita' e stelle).
- **Allenatori, poteri, eventi, interfaccia, salvataggi**: fuori da questa tappa.

## Decisioni prese qui (da confermare)
- **Tiratori dei rigori**: titolari dal tiro piu' forte, portiere per ultimo, poi si ricomincia. Portiere = chi
  e' nel posto GK (se nessuno, il migliore in parata). Chi tira per primo lo decide il seme.
- **Intervallo**: i PT restano legati alla carta (chi esce e rientra non li ricarica); rarita' e stelle non
  cambiano durante la partita.
- **Dopo l'intervallo** palla e zona restano dove erano (come nel vecchio gioco).
- **Rigori infiniti**: dopo 200 rigori decide la sorte (non succede in pratica, serve solo a garantire la fine).

## Difficolta' delle partite
`data/rtg-difficulty.json`: per ogni season, per ogni partita principale RTG in ordine (`rtg.mainTeams`, speciali
comprese), minimo e massimo del moltiplicatore del nemico. Creato da `npm run build-rtg-difficulty` con una
rampa lineare (da 1,0-1,2 al primo a 1,3-1,7 all'ultimo, in `balance.difficultyRamp`); si puo' correggere a mano.
Il nemico prende la potenza della squadra del giocatore, limitata tra `base x min` e `base x max`
(base = nemico a rarita' Normale). Le partite secondarie (squadre di svincolati) sono fuori da questa tappa.

Formazione e titolari del nemico vengono dai dati della season (boss o partita speciale).
**7 partite non si possono giocare** perche' nella formazione nemica ci sono giocatori senza statistiche Lv50:
IE1 S3 `neo_national` (Neil Turner), `orpheus` (Nakata); Orion `raging_bulls` (Park Gom-bull),
`fallen_angels` (Serge Atanas, Seth Bael), `los_invencibles` (Raul Parejo, Marcos Canales, Dani Ramos),
`ace_invaders` (Mark Krueger), `inazuma_national_2` (Lucas Star). Il motore si ferma con un errore chiaro.

## Simulatore
`npm run simulate-match`: partite IA contro IA, seme fisso, stessa rosa casuale da entrambe le parti
(formazione 4-4-2, carte di ruolo giusto), l'avversario con le statistiche moltiplicate per avere la potenza
di squadra indicata.
