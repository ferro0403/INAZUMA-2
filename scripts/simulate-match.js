#!/usr/bin/env node
// Simulatore di partite RTG IA contro IA: per ogni differenza di potenza (in balance.matchSimulation)
// gioca migliaia di partite con seme fisso e stampa una tabella.
// Uso: node scripts/simulate-match.js
import path from "node:path";
import { readJson } from "./lib/json-io.js";
import { ROOT, loadBundle } from "./lib/load-data.js";
import { cardsOfSource } from "../src/cards/card.js";
import { simulateMatches } from "../src/match/match-simulation.js";

const balance = readJson(path.join(ROOT, "data", "balance.json"));
const settings = balance.matchSimulation;
const bundle = loadBundle();
const cards = bundle.seasons.flatMap((season) => [...cardsOfSource(season).values()]);
const formation = bundle.seasons.flatMap((season) => season.formations.eleven).find((f) => f.id === settings.formation);

const pct = (value) => `${value.toFixed(1)}%`;
const label = (extra) => (extra === 0 ? "squadra uguale" : `+${Math.round(extra * 100)}%`);

console.log(`Carte: ${cards.length}. Formazione ${formation.id}. Partite per riga: ${settings.matchesPerRow}. ` +
  `Seme: ${settings.seed}.\n`);
console.log("| Potenza avversario | Vince il piu' forte | Vince l'altro | Pari al 90' | Decise ai supplementari | " +
  "Rigori | Gol a partita | Azioni (media, min-max) |");
console.log("|---|---|---|---|---|---|---|---|");
settings.powerDifferences.forEach((extra, index) => {
  const r = simulateMatches({ cards, slotRoles: formation.slotRoles, extra, matches: settings.matchesPerRow,
    seed: settings.seed + index, balance });
  console.log(`| ${label(extra)} | ${pct(r.strongerWinRate)} | ${pct(r.weakerWinRate)} | ${pct(r.drawRate)} | ` +
    `${pct(r.extraTimeRate)} | ${pct(r.penaltiesRate)} | ${r.goalsPerMatch.toFixed(2)} | ` +
    `${r.actions.average.toFixed(1)} (${r.actions.min}-${r.actions.max}) |`);
});
console.log("\nCon 'squadra uguale' le due colonne di vittoria sono avversario e utente (stessa forza).");
