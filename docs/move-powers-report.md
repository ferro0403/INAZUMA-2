# Report potenze originali delle mosse

Generato da `scripts/apply-move-powers.js` (fonte: `PLAYER_MOVES_DATABASE.json`, tabella in `data/move-powers.json`).
Non modificare a mano: si rigenera. Il vecchio valore di ogni mossa resta in `legacy.power`.

## In breve

- Mosse diverse usate dai giocatori (nome + tipo + elemento): **523** (7026 mosse in totale contando ogni giocatore, mossa singola e varianti per ruolo).
- Potenza uguale a prima: **353**
- Potenza cambiata: **164**
- Senza potenza nel file, messe a mano dall'utente (`data/move-power-overrides.json`): **6** (Icebreaker (shot, Wind): 105 → 100; Beyond the Death Zone (shot, Forest): 105 → 100; Triple Blizzard (shot, Wind): 105 → 100; Cosmic Blaster (shot, Forest): 110 → 100; Majin Merge (save, Fire): 110 → 100; Shadow Guard (defense, Wind): nessuna → 100)

## Esempi di potenze cambiate (le piu' usate)

- The Wall (defense, Mountain): 65 → 60
- Water Veil (dribble, Wind): 65/60 → 60
- Photon Crash (defense, Fire): 80 → 60
- Astro Break (shot, Forest): 70/60 → 60
- Freeze Shot (shot, Forest): 55/50 → 50

## Mosse senza potenza nel file che nessun giocatore usa (83)

Non servono ora e non hanno ricevuto nessun valore.

Air Cut (dribble, Wind), Athenian Assault (shot, Wind), Atomic Harmonic (shot, Forest), Aurora Arrow (defense, Fire), Back Slash (dribble, Mountain), Bald Eagle Glide (shot, Mountain), Black Briars (dribble, Forest), Brachias Radiance (dribble, Fire), Buffalo Crusher (defense, Fire), Bushin Blades (shot, Mountain), Caliburn (shot, Void), Checkmate (shot, Forest), Crimson Pegasus Charge (dribble, Fire), Crimson Prison (shot, Mountain), Crimson Sphere (save, Fire), Crown Fire (save, Fire), Dandrol Crusher (defense, Forest), Dark Space (defense, Forest), Dazzling Carnival (dribble, Forest), Destrier Charge (shot, Mountain), Dolmega Stomp (save, Mountain), Doruga Assault (shot, Fire), Dragnova Strike (shot, Void), Dragon Storm (defense, Wind), Executioner's Axe (shot, Forest), Falcon Glide (shot, Wind), Feather Duster (defense, Wind), Firebird Flight (shot, Fire), Flamberge (shot, Fire), Flamey Mirage (defense, Fire), Forked Edge (dribble, Forest), Fortress of Despair (defense, Mountain), Fox Mirage (defense, Forest), Full Moon Fever (shot, Forest), Gandoran Crusher (defense, Mountain), Giga Knuckle Sandwich (save, Mountain), Gigabite Geyser (save, Wind), Goliger Assault (shot, Mountain), Grizzly Smash (dribble, Mountain), Gryphbang Smash (dribble, Void), Gyorom Claw (defense, Fire), Heart's Desire (shot, Wind), Horse Sprint (dribble, Wind), Hunter's Spear (defense, Wind), Hyperdrive (dribble, Wind), Icicle Road (shot, Wind), Inferno Fist (save, Forest), Kulupe Claw (defense, Void), Lancelot Lunge (shot, Fire), Lion Assault (shot, Forest), Lucky Dice (save, Forest), Luminous Orb (shot, Wind), Magician's Box (shot, Forest), Magnatas Stomp (save, Fire), Majin the Great (save, Mountain), Mammoth Stomp (save, Wind), Meteoric Fire Tornado V (shot, Fire), Moon Bear Smash (dribble, Fire), Mortal Smash (shot, Mountain), Peacock Radiance (dribble, Forest), Pegasus Bolt (dribble, Wind), Pegasus Charge (dribble, Wind), Pegasus Punch (shot, Wind), Phoenichias Radiance (dribble, Wind), Rat-a-Tat Pass (dribble, Fire), Ratel Claw (defense, Wind), Roc and Roll (shot, Mountain), Shadow Empress (shot, Fire), Silver Wolf Strike (shot, Forest), Solar Flare (shot, Fire), Stop it Poppet (save, Forest), Superior Crayon Power (save, Forest), The Tempest (dribble, Forest), Thunderclaw (shot, Wind), Titanic Shield (save, Wind), Titanic Slam (defense, Mountain), Tortoise Shield (defense, Mountain), Trident Torpedo (shot, Wind), Univolt Sprint (dribble, Fire), Valkyrie's Signal (defense, Forest), Wall for One (defense, Mountain), White Breath (shot, Wind), Wolf Strike (shot, Fire)

## Cosa non e' stato fatto

- Le mosse del file senza nome inglese non sono nella tabella: non si possono cercare per nome.
- Cambia solo `power`. Gli altri campi della mossa singola (`signatureMove`), come `tension`,
  restano quelli del vecchio gioco.
