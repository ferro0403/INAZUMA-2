#!/usr/bin/env node
// Mette le potenze ORIGINALI nelle mosse dei giocatori (data/seasons/*.json).
// Uso: node scripts/apply-move-powers.js [percorso/PLAYER_MOVES_DATABASE.json]
// Con il percorso rigenera prima data/move-powers.json (il file grande non sta nel repo).
import path from "node:path";
import { readJson, writeJson } from "./lib/json-io.js";
import { ROOT, loadBundle } from "./lib/load-data.js";
import { applyPowersToSeason, buildPowerTable, makePowerLookup } from "./lib/move-powers.js";
import { collectPowerFindings, writePowerReport } from "./lib/move-powers-report.js";

const TABLE_FILE = path.join(ROOT, "data", "move-powers.json");
const OVERRIDES_FILE = path.join(ROOT, "data", "move-power-overrides.json");
const SOURCE_NAME = "PLAYER_MOVES_DATABASE.json";

function main() {
  const bigFile = process.argv[2];
  if (bigFile) {
    writeJson(TABLE_FILE, {
      note: "Potenze e tension ORIGINALI delle mosse (power null = assente nel file). Generato: non modificare a mano.",
      source: SOURCE_NAME,
      moves: buildPowerTable(readJson(bigFile)),
    });
  }
  const table = readJson(TABLE_FILE);
  const overrides = readJson(OVERRIDES_FILE);
  const lookup = makePowerLookup(table, overrides);
  const bundle = loadBundle();
  const seasons = bundle.seasons.map((season, index) => {
    const updated = applyPowersToSeason(season, lookup);
    writeJson(path.join(ROOT, bundle.index.seasons[index].file), updated);
    return updated;
  });
  const findings = collectPowerFindings(seasons, table, overrides);
  writePowerReport(path.join(ROOT, "docs", "move-powers-report.md"), findings, table.source);
  console.log(`Potenze applicate: ${findings.same.length} uguali, ${findings.changed.length} cambiate, ` +
    `${findings.fromOverride.length} da override. Report: docs/move-powers-report.md`);
}

main();
