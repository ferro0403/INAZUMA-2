#!/usr/bin/env node
// Importa i DATI dal vecchio repo e rigenera i file in data/ (e il report in docs/).
// Uso: node scripts/import-from-old-repo.js <percorso-vecchio-repo>
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readJson, writeJson } from "./lib/json-io.js";
import { makeLegacyKeyTest } from "./lib/legacy.js";
import { translateElements } from "./lib/elements.js";
import { openOldRepo, readFourMoves, readRtgConfig, readSeasonDisplay } from "./lib/old-repo.js";
import { SCHEMA_VERSION, buildFreeAgents, buildSeason } from "./lib/build-season.js";
import { collectFindings, writeReport } from "./lib/import-report.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fromRoot = (...parts) => path.join(ROOT, ...parts);

function main() {
  const oldPath = process.argv[2];
  if (!oldPath) {
    console.error("Uso: node scripts/import-from-old-repo.js <percorso-vecchio-repo>");
    process.exit(1);
  }
  const config = readJson(fromRoot("scripts", "import-config.json"));
  const old = openOldRepo(oldPath);
  const commit = old.commit();
  const importedFrom = (file) => ({ repo: config.oldRepoName, commit, file });

  const shared = {
    isLegacyKey: makeLegacyKeyTest(config.legacyFieldRule),
    metaKeysToLegacy: config.seasonMetaKeysToLegacy,
    statsDb: readJson(fromRoot("data", "statistiche-ufficiali-lv50.json")),
    importanceRules: readJson(fromRoot("data", "importance-rules.json")),
    importanceOverrides: readJson(fromRoot("data", "importance-overrides.json")),
  };
  const displays = readSeasonDisplay(old, config.seasonRegistry);
  const rtg = readRtgConfig(old, config.rtgConfig);
  const fourMoves = readFourMoves(old, config.fourMoves);

  const seasons = config.seasons.map((entry) => {
    const display = displays.find((item) => item.id === entry.id);
    if (!display) throw new Error(`Season ${entry.id} assente in ${config.seasonRegistry.file}`);
    const ctx = {
      ...shared,
      sourceId: entry.id,
      fourMoves,
      fallbackOrder: config.fourMoves.fallbackOrder[entry.id],
      signatureCatalog: old.json(entry.signatureMoves),
    };
    const season = translateElements(buildSeason(old.json(entry.database), display, ctx, {
      importedFrom: importedFrom([entry.database, entry.signatureMoves, config.fourMoves.file,
        config.rtgConfig.file]),
      displayTeamNames: config.displayTeamNameOverrides[entry.id],
      rtg: rtg.seasons[entry.id],
    }), config.elementNames);
    writeJson(fromRoot("data", "seasons", `${entry.id}.json`), season);
    return season;
  });

  const freeAgents = translateElements(buildFreeAgents(old.json(config.freeAgents.file),
    { ...shared, sourceId: config.freeAgents.id, fourMoves: null, signatureCatalog: null },
    importedFrom([config.freeAgents.file])), config.elementNames);
  writeJson(fromRoot("data", "free-agents.json"), freeAgents);

  const visuals = old.json(config.playerVisuals);
  writeJson(fromRoot("data", "player-visuals.json"), {
    schemaVersion: SCHEMA_VERSION, importedFrom: importedFrom([config.playerVisuals]), ...visuals,
  });

  writeJson(fromRoot("data", "rtg-campaign.json"), {
    schemaVersion: SCHEMA_VERSION, importedFrom: importedFrom([config.rtgConfig.file]), ...rtg.constants,
  });

  writeJson(fromRoot("data", "seasons", "index.json"), {
    schemaVersion: SCHEMA_VERSION,
    note: "Elenco e ordine delle season. Aggiungere una season = aggiungere una riga qui e il suo file.",
    seasons: seasons.map((season) => ({
      id: season.id, name: season.name, displaySeasonNumber: season.displaySeasonNumber,
      file: `data/seasons/${season.id}.json`,
    })),
    freeAgents: { id: freeAgents.id, file: "data/free-agents.json" },
    stats: "data/statistiche-ufficiali-lv50.json",
    elements: "data/elements.json",
    playerVisuals: "data/player-visuals.json",
    rtgCampaign: "data/rtg-campaign.json",
  });

  const findings = collectFindings(seasons, freeAgents, shared.statsDb);
  writeJson(fromRoot("data", "stats-missing.json"), {
    note: "Giocatori senza le 7 statistiche Lv50 (stats: null). Generato dall'importazione: da controllare a mano.",
    players: findings.missingStats,
  });
  writeReport(fromRoot("docs", "import-report.md"), { findings, config, commit });
  console.log(`Importazione completata dal commit ${commit}. Report: docs/import-report.md`);
}

main();
