#!/usr/bin/env node
// Ricalcola l'importanza di tutti i giocatori dai dati gia' importati (player.legacy),
// usando data/importance-rules.json e data/importance-overrides.json. Non serve il vecchio repo.
// Uso: node scripts/apply-importance.js
import path from "node:path";
import { readJson, writeJson } from "./lib/json-io.js";
import { ROOT, loadBundle } from "./lib/load-data.js";
import { computeImportance } from "./lib/player-enrich.js";
import { collectFindings, writeReport } from "./lib/import-report.js";

const rules = readJson(path.join(ROOT, "data", "importance-rules.json"));
const overrides = readJson(path.join(ROOT, "data", "importance-overrides.json"));
const bundle = loadBundle();

function apply(source) {
  let changed = 0;
  source.players = source.players.map((player) => {
    const result = computeImportance(player, source.id, rules, overrides);
    if (result.importance !== player.importance || result.importanceSource !== player.importanceSource) changed += 1;
    return Object.fromEntries(Object.entries(player).map(([key, value]) => [key, result[key] ?? value]));
  });
  return changed;
}

const files = [
  ...bundle.index.seasons.map((entry, index) => [entry.file, bundle.seasons[index]]),
  [bundle.index.freeAgents.file, bundle.freeAgents],
];
for (const [file, source] of files) {
  const changed = apply(source);
  writeJson(path.join(ROOT, file), source);
  console.log(`${source.id}: ${changed} giocatori cambiati`);
}

const config = readJson(path.join(ROOT, "scripts", "import-config.json"));
const findings = collectFindings(bundle.seasons, bundle.freeAgents, bundle.statsDb);
writeReport(path.join(ROOT, "docs", "import-report.md"),
  { findings, config, commit: bundle.seasons[0]?.importedFrom?.commit });
