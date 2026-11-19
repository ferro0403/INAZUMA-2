#!/usr/bin/env node
// Simulatore di taratura: gioca migliaia di scontri tra la stessa carta a rarita'/stelle diverse
// e stampa la percentuale di vittoria per ogni coppia. Numeri e obiettivi in data/balance.json.
// Uso: node scripts/simulate.js [--calibrate]   (--calibrate prova i valori di k e indica il migliore)
import path from "node:path";
import { readJson } from "./lib/json-io.js";
import { ROOT, loadBundle } from "./lib/load-data.js";
import { calibrationError, simulatePairs } from "../src/engine/simulation.js";

const balance = readJson(path.join(ROOT, "data", "balance.json"));
const calibration = balance.calibration;

function loadCards() {
  const bundle = loadBundle();
  return [...bundle.seasons, bundle.freeAgents].flatMap((source) => source.players.filter((p) => p.stats));
}

function run(cards, k, pairs) {
  const tuned = { ...balance, duel: { ...balance.duel, k } };
  return simulatePairs(cards, pairs, tuned, { seed: calibration.seed, duels: calibration.duelsPerPair });
}

function searchK(cards) {
  const { min, max, step } = calibration.kSearch;
  let best = null;
  for (let k = min; k <= max + step / 2; k += step) {
    const rounded = Math.round(k * 1000) / 1000;
    const error = calibrationError(run(cards, rounded, calibration.targets));
    if (!best || error < best.error) best = { k: rounded, error };
  }
  return best;
}

function printTable(results) {
  const rows = results.map((result) => {
    const target = result.target === undefined ? "-" : `${result.target}%`;
    const ok = result.target === undefined ? "" : Math.abs(result.winRate - result.target) <= calibration.tolerance
      ? "ok" : "FUORI";
    return `| ${result.name} | ${result.winRate.toFixed(1)}% | ${target} | ${ok} |`;
  });
  console.log(["| Coppia | Vittorie | Obiettivo | Esito |", "|---|---|---|---|", ...rows].join("\n"));
}

function main() {
  const cards = loadCards();
  console.log(`Carte con statistiche: ${cards.length}. Scontri per coppia: ${calibration.duelsPerPair}. ` +
    `Seme: ${calibration.seed}.`);
  if (process.argv.includes("--calibrate")) {
    const best = searchK(cards);
    console.log(`k migliore tra ${calibration.kSearch.min} e ${calibration.kSearch.max}: ${best.k} ` +
      `(errore ${best.error.toFixed(2)}). k attuale in balance.json: ${balance.duel.k}.`);
  }
  console.log(`\nRisultati con k = ${balance.duel.k} (senza mosse ne' vantaggi di elemento):\n`);
  const results = run(cards, balance.duel.k, [...calibration.targets, ...calibration.extraPairs]);
  printTable(results);
  const outside = results
    .filter((r) => r.target !== undefined && Math.abs(r.winRate - r.target) > calibration.tolerance);
  console.log(outside.length ? `\n${outside.length} obiettivi fuori tolleranza (±${calibration.tolerance}).`
    : `\nTutti gli obiettivi entro ±${calibration.tolerance}.`);
}

main();
