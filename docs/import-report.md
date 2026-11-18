# Report importazione dal vecchio repo

Generato da `scripts/import-from-old-repo.js` dal commit `77429e7cb9c6eb4cbdd2fb723da9defa4bec261f` di ferro0403/INAZUMA-ROGUELIKE.
Non modificare a mano: si rigenera a ogni importazione.

## Per season

### Inazuma Eleven 1 (`ie1`)

- Giocatori: **157**, squadre: **10**, boss: 10, partite speciali: 0, profili: 0
- Importanza: comune: 111, conosciuto: 35, protagonista: 11
- Mosse per giocatore (numero: giocatori): 3: 1, 4: 156
- Elementi scritti nei dati: Fuoco: 33, Montagna: 33, Albero: 51, Vento: 40
- Senza statistiche Lv50: nessuno
- Senza mosse: nessuno

### Inazuma Eleven 2 (`ie1_s2`)

- Giocatori: **203**, squadre: **17**, boss: 10, partite speciali: 7, profili: 230
- Importanza: protagonista: 14, comune: 144, conosciuto: 45
- Mosse per giocatore (numero: giocatori): 3: 1, 4: 202
- Elementi scritti nei dati: Mountain: 30, Fire: 46, Forest: 67, Wind: 60
- Senza statistiche Lv50: nessuno
- Senza mosse: nessuno

### Inazuma Eleven 3 (`ie1_s3`)

- Giocatori: **584**, squadre: **41**, boss: 12, partite speciali: 7, profili: 584
- Importanza: protagonista: 58, comune: 398, conosciuto: 128
- Mosse per giocatore (numero: giocatori): 0: 3, 3: 5, 4: 576
- Mosse prese da una season precedente (come nel vecchio gioco): ie1: 122, ie1_s2: 163
- Elementi scritti nei dati: Mountain: 121, Fire: 135, Wind: 157, Forest: 171
- Senza statistiche Lv50: Neil Turner (96), Nakata (custom_0001)
- Senza mosse: Simon Calier (170), Peter Wells (174), Paul Peabody (1053)

### Inazuma Eleven Ares (`ie2`)

- Giocatori: **157**, squadre: **11**, boss: 11, partite speciali: 0, profili: 0
- Importanza: protagonista: 26, conosciuto: 49, comune: 82
- Mosse per giocatore (numero: giocatori): 0: 1, 2: 1, 3: 8, 4: 147
- Elementi scritti nei dati: Wind: 42, Mountain: 33, Fire: 38, Forest: 44
- Senza statistiche Lv50: nessuno
- Senza mosse: Curt Gale (4441)

### Inazuma Eleven Orion (`orion`)

- Giocatori: **309**, squadre: **24**, boss: 13, partite speciali: 0, profili: 329
- Importanza: protagonista: 100, conosciuto: 58, comune: 151
- Mosse per giocatore (numero: giocatori): 2: 1, 3: 10, 4: 298
- Mosse prese da una season precedente (come nel vecchio gioco): ie2: 129
- Elementi scritti nei dati: Fire: 80, Forest: 79, Mountain: 71, Wind: 79
- Senza statistiche Lv50: Lucas Star (4650), Park Gom-bull (4655), Seth Bael (4680), Serge Atanas (4681), Dani Ramos (4735), Raúl Parejo (4744), Marcos Canales (4745), Mark Krueger (4841)
- Senza mosse: nessuno

### Svincolati (`free_agents`)

- Giocatori: **1563**, squadre: **1**, boss: 0, partite speciali: 0, profili: 0
- Importanza: comune: 1553, conosciuto: 10
- Mosse per giocatore (numero: giocatori): 0: 1563
- Elementi scritti nei dati: Wind: 393, Mountain: 367, Forest: 394, Fire: 409
- Senza statistiche Lv50: nessuno
- Senza mosse: **1563** giocatori (tutti, elenco nei dati)

## Non importato

- `data/events/`: Eventi (Halloween): esclusi dalla tappa 1 per richiesta.
- `data/rtg-halloween-occult-*.json`: Dati dell'evento Halloween: esclusi dalla tappa 1.
- `data/DARK_ANGELS_team.json, data/DARK_ANGELS_lineup.json`: Non letti da nessun file del vecchio gioco (Dark Angels gioca dentro IE1_S3, che e' importata). Da chiedere all'utente se servono.
- `data/PLAYER_KIT_VISUALS.json`: Rimanda a immagini locali (assets/vr-players/...) del vecchio repo: niente asset copiati.
- `data/RTG_move_power_targets_169.json`: File di riferimento per mosse non ancora assegnate: non assegna mosse a nessuno.
