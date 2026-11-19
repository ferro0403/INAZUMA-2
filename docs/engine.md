# Motore (tappa 3)

Codice in `src/engine/`, numeri in `data/balance.json`, nessuna interfaccia. Il motore non conosce le season:
riceve carte (`stats`, `element`, `moves` dai dati) e progressi (`{ rarity, stars }`) come parametri.

| File | Cosa fa |
|---|---|
| `progress.js` | rarita' e stelle -> moltiplicatore: `1 + bonus rarita' + stelle x bonus per stella` (si sommano); un nemico adattato usa invece `{ multiplier }` |
| `strength.js` | forza in un tipo di scontro = media del gruppo di statistiche x moltiplicatore |
| `elements.js` | vantaggio di elemento (ciclo), elemento del giocatore o della mossa (`elementFrom`) |
| `move-bonus.js` | bonus mossa lineare dalla potenza |
| `duel.js` | probabilita' dello scontro e scontro giocato |
| `team-power.js` | potenza della squadra (calcolata, mai salvata) |
| `enemy.js` | adattamento del nemico tra minimo e massimo |
| `squad.js` | validazione della rosa |
| `random.js`, `simulation.js` | numeri casuali con seme, simulazione di taratura |

## Formula dello scontro
`probabilita' = 50 + k x (forza_attore - forza_avversario) + elemento + (bonus mossa attore - bonus mossa avversario)`,
limitata tra 5 e 95. Senza mosse dell'avversario e' la formula del documento; con i limiti simmetrici
A contro B + B contro A fa sempre 100 (senza elementi).

- Gruppi: tiro = kick + control, dribbling = technique + control, difesa = pressure + physical,
  parata = physical + agility, centrocampo = intelligence + pressure.
- Elemento: +5 se il proprio batte quello avversario, -5 al contrario. Per ora conta l'elemento del giocatore
  (`elementFrom: "card"`); con `"move"` conterebbe quello della mossa usata.
- Mossa: da +4 (potenza 30) a +13 (potenza 100), lineare.
- Quale gruppo affronta quale (es. tiro contro parata) lo decide la partita, nella prossima tappa.

## Potenza della squadra
Per ogni titolare: forza media nei gruppi del posto in cui gioca (FW: tiro e dribbling, MF: centrocampo e
dribbling, DF: difesa, GK: parata) + bonus medio delle sue mosse diviso k (cosi' un bonus di probabilita'
diventa "forza equivalente"). Potenza = media degli 11. Un difensore in attacco ha il tiro basso, quindi vale meno.

## Nemico
Minimo = potenza base del nemico (rarita' Normale, 0 stelle) x 1,0; massimo = x 1,7 (come un Fabled 5 stelle).
Il nemico prende la potenza del giocatore, limitata tra minimo e massimo, e il motore calcola il moltiplicatore
da dare alle sue statistiche per arrivarci. Il giocatore non e' mai bloccato.

## Taratura
`npm run simulate` (con `-- --calibrate` cerca anche il k migliore). Scontri tra la stessa carta (ruolo,
elemento e mosse uguali), senza mosse, solo rarita' e stelle diverse; 20.000 scontri per coppia, su tutte le
2.963 carte con statistiche, seme fisso.
