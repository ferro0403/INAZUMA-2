# Nuovo gioco: RTG con statistiche Lv50, rarità e stelle

Versione 2 (19 novembre). Sostituisce `docs/PROGETTO_NUOVO_GIOCO.md`.
Ogni numero segnato "provvisorio" si fissa con il simulatore, non a occhio.

## Idea
Un gioco nuovo, in un repo nuovo con codice scritto da zero, pulito e facile da modificare.
Il codice del gioco attuale (ferro0403/INAZUMA-ROGUELIKE) non si copia: si riprendono solo i DATI.
**Per ora solo la modalità RTG** (giocatori che si sbloccano e restano). Le run classiche (roguelike) NON si fanno ora; i dati dei boss già importati restano, inutilizzati.

## Le carte
- Una carta = **giocatore + versione** (id + season/profilo). Mark Evans ha 3 carte (IE1, IE1 S2, IE1 S3), ognuna con le sue mosse, il suo avanzamento e il suo banner, come nel gioco attuale.
- Circa 1.410 carte nelle season più 1.563 svincolati.
- Le **statistiche base** sono le 7 dello Zukan Lv50 (kick, control, technique, pressure, physical, agility, intelligence), uguali per le versioni dello stesso giocatore. Sono quasi un profilo per ruolo (30 combinazioni per 5.459 giocatori): non dicono "quanto è forte", dicono "che ruolo fa".
- Cosa distingue due carte dello stesso ruolo: **mosse** (e la loro potenza), **elemento**, **rarità**, **stelle**.
- Niente overall, niente rating, niente "importanza". I campi vecchi restano solo nei blocchi `legacy`.

## Mosse
- Da 2 a 4 per carta, scelte dall'utente (già importate per IE1, IE1 S2, IE1 S3, Ares, Orion).
- **Potenza delle mosse: originale, massimo 100, nessuna modificata a mano. FATTO (PR #4).** Le potenze sono 30, 50, 60, 70, 85 o 100 e stanno già in `data/seasons/*.json` (campo `power` di ogni mossa); il vecchio valore è in `legacy.power`. Tabella in `data/move-powers.json` (con anche `tension`, per ora non usata). Sei mosse senza potenza nel file originale sono a 100 per decisione dell'utente (`data/move-power-overrides.json`). Un test controlla che nessuna superi 100.
- Svincolati, GO e Victory Road: le mosse le dà l'utente. Le carte senza mosse restano con lista vuota e vengono segnalate.

## Rarità e crescita
Due crescite separate.

**Rarità (si sale giocando):** Normale → Rara → Leggendaria → Fabled.
- Ogni gradino: **+20% a tutte le statistiche** (Rara +20, Leggendaria +40, Fabled +60). Provvisorio.
- Si sale con le partite giocate con quella carta (nessuna fortuna): circa 5 partite per la Rara, altre 12 per la Leggendaria, altre 25 per la Fabled. Provvisorio. Contano le carte schierate (titolari e riserve che entrano) anche nelle partite perse, con un peso un po' minore.
- **Ogni carta può raggiungere tutte le rarità.**
- Limite: **al massimo 2 carte Fabled** tra gli 11 titolari.

**Stelle (si salgono coi doppioni):** ogni carta già posseduta che peschi aggiunge una stella, fino a 5. Ogni stella dà un piccolo bonus (+2%, massimo +10%). Provvisorio. I doppioni oltre la quinta stella danno una risorsa (da definire).

Massimo possibile circa +70%. Nessuno gioca una carta vuota: i valori servono a rendere il gioco giocabile, non a fare grinding.

## Squadra e posizioni
- 11 titolari + 4 riserve, nessuna sostituzione durante la partita.
- **Nessun vincolo di ruolo**: ogni giocatore può stare in qualsiasi posizione. La penalità arriva dalle statistiche (un difensore in attacco ha il tiro basso).

## Partita (RTG, scontri diretti con le mosse)
- Probabilità di vincere uno scontro: `50 + k*(forza_attore - forza_avversario) + bonus_elemento + bonus_mossa`, limitata tra 5 e 95.
- `forza` = media dei gruppi di statistiche rilevanti per quello scontro, moltiplicata per i bonus di rarità e stelle. Gruppi proposti (da confermare guardando i dati; fonte non ufficiale): tiro = kick + control; dribbling = technique + control; difesa = pressure + physical; parata = physical + agility; centrocampo = intelligence + pressure.
- Elementi: Fire > Forest > Wind > Mountain > Fire (±5 circa). Bonus mossa dipende dalla potenza della mossa (30-100): lineare, da circa +4 (potenza 30) a circa +13 (potenza 100), provvisorio.
- **`k` va tarato**: le statistiche sono intorno a 100, non da 1 a 10. Valore di partenza ~0,5.
- Obiettivo di taratura, a ruolo ed elemento uguali e senza mosse: Rara vs Normale ~60%, Leggendaria ~70%, Fabled ~80%, Fabled con 5 stelle ~85%. Un Normale deve poter ancora vincere.

## Potenza (numero calcolato, mai salvato)
Si calcola da statistiche, rarità, stelle e potenza delle mosse. Serve per la squadra e per adattare i nemici. Non esiste nei dati e non c'è un "overall" per giocatore.

## Nemici
- Il nemico segue la potenza della squadra del giocatore, ma sempre **tra un minimo e un massimo per partita**.
- Nessun tetto che blocca: il giocatore può usare chi vuole. Se è debole affronta il minimo, se è fortissimo il massimo.
- Aperto: minimo reclutati per season (da decidere con l'utente).

## Fuori da questa versione
Run classiche, eventi (Halloween), allenatori, immagini locali, modalità a campo con pedine.

## Tappe
1. **Fatta**: dati, importazione, validatore, test (PR #1, #2, #3).
2. **Fatta**: potenze originali delle mosse, massimo 100 (PR #4).
3. **Motore**: formula scontri, forza, potenza, rarità e stelle, nemici adattabili, tutto con numeri in `data/balance.json`; **simulatore** che prova migliaia di partite e verifica la taratura. Senza interfaccia.
4. **Interfaccia RTG**: squadra, banner, partita a scontri.
5. **Progressione**: avanzamento rarità giocando, stelle dai doppioni, distributori.

## Regole di lavoro
- Codice nuovo, scritto da zero; il gioco attuale non si tocca e non si copia.
- Sul codice mai modifiche dirette a main: lavoro in PR separate, merge in main solo dall'utente dopo averle verificate.
- Numeri del gioco in file di dati, non nel codice.
- Immagini: solo i link già presenti nel database.
