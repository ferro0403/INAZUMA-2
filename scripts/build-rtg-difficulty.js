#!/usr/bin/env node
// Crea data/rtg-difficulty.json: per ogni season, per ogni partita principale RTG in ordine (rtg.mainTeams),
// il minimo e il massimo del moltiplicatore del nemico, lineari dal primo all'ultimo (balance.difficultyRamp).
// Il file si puo' poi correggere a mano: senza --force lo script non lo sovrascrive.
// Uso: node scripts/build-rtg-difficulty.js [--force]
import fs from "node:fs";
import path from "node:path";
import { readJson, writeJson } from "./lib/json-io.js";
import { ROOT, loadBundle } from "./lib/load-data.js";

const FILE = path.join(ROOT, "data", "rtg-difficulty.json");
const round = (value) => Math.round(value * 100) / 100;

function rampRow(index, count, ramp) {
  const t = count > 1 ? index / (count - 1) : 0;
  const lerp = (key) => round(ramp.first[key] + (ramp.last[key] - ramp.first[key]) * t);
  return { minMultiplier: lerp("minMultiplier"), maxMultiplier: lerp("maxMultiplier") };
}

function main() {
  if (fs.existsSync(FILE) && !process.argv.includes("--force")) {
    console.error("data/rtg-difficulty.json esiste gia' (puo' contenere correzioni a mano). Usa --force per rifarlo.");
    process.exit(1);
  }
  const ramp = readJson(path.join(ROOT, "data", "balance.json")).difficultyRamp;
  const seasons = Object.fromEntries(loadBundle().seasons.map((season) => {
    const teams = season.rtg.mainTeams;
    const rows = teams.map((teamId, index) => ({ order: index + 1, teamId, ...rampRow(index, teams.length, ramp) }));
    return [season.id, rows];
  }));
  writeJson(FILE, {
    note: "Per ogni partita principale RTG, in ordine: il nemico segue la potenza del giocatore restando tra " +
      "la sua potenza base x minMultiplier e x maxMultiplier. Si puo' correggere a mano.",
    seasons,
  });
  console.log("Creato data/rtg-difficulty.json");
}

main();
