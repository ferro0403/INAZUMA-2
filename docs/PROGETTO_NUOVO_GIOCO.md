# Nuovo gioco: stesso stile dell'RTG/run attuale, con statistiche Lv50 e rarità

## Idea in una riga
Un gioco nuovo, in un **repo nuovo con codice scritto da zero, pulito e facile da modificare**
(il codice del gioco attuale NON si copia: si riprendono solo i DATI), con le stesse regole di quello attuale,
cioè **due modalità**, stesse season, stesse mosse.
Cambia **come si misura la forza di un giocatore**: niente overall/rating 1-10, ma
le 7 statistiche Lv50 dello Zukan + una **rarità** (4 livelli).

## Le due modalità (come nel gioco attuale, da non confondere)
I percorsi di file indicati sono del **vecchio repo** (ferro0403/INAZUMA-ROGUELIKE) e servono solo per capire come funziona; non si copiano.
1. **Run classica, stile roguelike** (`js/run-*.js`, `js/map-generator.js`, `js/match-simulator.js`):
   draft, mappa a nodi, partite, boss, 2 vite; si vince o si perde la run.
2. **Road to Glory / RTG** (`js/road-to-glory/`): giocatori che si sbloccano e restano,
   squadra, allenatori, scontri diretti con le mosse (`rtg-encounter-runtime.js`).
Sono **due motori di partita diversi**: la nuova forza (stat + rarità) deve funzionare in entrambi.
Prima di cambiare qualsiasi cosa, studiare nel codice come ognuno usa overall/livello oggi.

## Cosa resta uguale
- Partita simulata a scontri diretti con mosse (come ora), elementi Fuoco > Bosco > Vento > Montagna > Fuoco.
- Le due modalità, season, squadre, formazioni, ordine delle partite e boss: **le regole e i dati** restano quelli esistenti; il codice si riscrive.
- Allenatori ed eventi (Halloween): fuori dalla tappa 1, se ne parla dopo.
- Mosse per giocatore (2-4) già assegnate per: IE1, IE1 S2, IE1 S3, Ares (IE2), Orion.
  Mancano GO e Victory Road, e gli svincolati: **le mosse le assegna sempre l'utente**, l'IA non le inventa
  (si limita a segnare nel report chi non le ha).
- I dati che servono si prendono dal codice e dai file del gioco attuale; se qualcosa manca, si chiede all'utente.

## Cosa cambia

### 1. Statistiche
Fonte: `data/statistiche-ufficiali-lv50.json` (zip INAMOSSE_STATS_LV50, per id giocatore):
`[kick, control, technique, pressure, physical, agility, intelligence]`.
Gli id coincidono con quelli del gioco attuale (IE1 157/157, IE1 S2 203/203, IE1 S3 582/584, IE2 157/157, Orion 301/309).
I pochi mancanti vanno controllati a mano.

**Limite importante:** i dati hanno solo **30 combinazioni diverse** per 5.459 giocatori.
Sono profili di ruolo (difensore, portiere, attaccante...), con totale simile (656-693).
Quindi le statistiche dicono "che ruolo fa", non "quanto è forte".

### 2. Rarità (ispirata al gioco vero Victory Road; qui tutti i giocatori possono raggiungere tutte le rarità)
| Rarità | Bonus a tutte le statistiche |
|---|---|
| Normale | +0% |
| Rara | +30% |
| Leggendaria | +60% |
| Fabled | +90% |

I valori sono **provvisori**: si fissano con una simulazione (vedi sotto).
Limite in campo (come nel gioco vero): al massimo 1 Fabled e 2 Leggendari.
Come si sale: copie dello stesso giocatore o una risorsa; i primi gradini costano poco, gli ultimi molto.

### 3. Cosa distingue i giocatori dello stesso ruolo (versione "A", niente passive)
- elemento, mosse (già nel database), rarità;
- un piccolo **bonus di importanza** fisso: comune +0%, conosciuto +5%, protagonista +10%.
  Chi lo decide: viene **calcolato dal lavoro già fatto** dall'utente nel gioco attuale
  (`finalOverall` e `category`, presenti in tutte le season), così non si assegna nulla a mano.
  L'utente può poi correggere i casi sbagliati. Il vecchio overall serve solo per questo calcolo, non si mostra più.
  (Il bonus di **rarità**, invece, lo dà il gioco quando il giocatore sale di rarità.)
- Le passive restano un'idea futura solo per personaggi speciali.

### 4. Formula degli scontri (da sostituire)
Le due modalità oggi hanno **due formule diverse**, entrambe basate sull'overall:
- RTG (`rtg-encounter-runtime.js`): `base = 0.5*overall + 0.5*media(3 stat)`, probabilità `50 + 2.5*(attore - avversario) + elemento + mossa`, clamp 5-95.
- Run classica (`match-simulator.js`): forza di squadra = media overall dei giocatori + profilo statistico (pesi in config), poi fasce di probabilità sulla differenza.
Nel nuovo gioco niente overall. Si parte dall'RTG; per la run classica si studia prima la sua formula e si decide con l'utente.
Gruppi di statistiche **proposti** (ispirati ai valori di scontro del gioco vero, da confermare guardando i dati; la fonte è una guida non ufficiale):
- tiro: kick + control
- dribbling: technique + control
- difesa: pressure + physical (+ technique/intelligence)
- parata: physical + agility
- centrocampo/mischia: intelligence + pressure

`forza = media dei gruppi (con bonus rarità e importanza)`; `probabilità = 50 + k*(forza_attore - forza_avversario) + elemento + mossa`, clamp 5-95.
Le statistiche sono intorno a 100 (non 1-10), quindi **k va ricalcolato**, non copiato.

### 5. Difficoltà delle run
I boss non hanno più `bossLevel` ma rarità + bonus: ogni stage ha la rarità/forza media dei suoi avversari.
Il costo/budget interno di un giocatore si calcola dalle statistiche pesate per ruolo (mai mostrato).

## Calibrazione (obbligatoria prima di fissare i numeri)
Simulatore sul modello di `tests/rtg-match-statistical-calibration-test.js`:
- Fabled contro Normale: vince circa 80-85%, non il 100%.
- Stessa rarità, stesso ruolo: circa 50% (solo elemento/mossa decidono).
- Una squadra tutta Normale contro una tutta Rara deve poter vincere qualche volta.

## Tappe
1. **Dati e base del repo**: struttura pulita, script che importa dal vecchio repo i dati (giocatori, squadre, formazioni, ordine partite, mosse), 7 stat Lv50, importanza, validatore e test. Report dei mancanti.
2. **Motore**: nuova formula degli scontri + rarità + simulatore di calibrazione. Test.
3. **Gioco**: collegare **entrambe** le modalità (run classica e RTG) al nuovo motore, difficoltà boss, schermate rarità e salita.
4. **Rifinitura**: GO e Victory Road e svincolati (mosse date dall'utente), passive solo se servono, eventuale modalità a campo con pedine (idea per dopo).

## Regole di lavoro
- Repo nuovo con codice nuovo: il gioco attuale non si tocca e non si copia.
- Sul codice mai modifiche dirette a main: lavoro in PR separate, merge in main solo dall'utente dopo averle verificate.
- Immagini: solo i link già presenti nel database; nessun asset ricavato da altri giochi.
