#!/usr/bin/env node
// Controlla i dati in data/. Con --old <percorso> li confronta anche con il vecchio repo.
// Uso: node scripts/validate-data.js [--old <percorso-vecchio-repo>]
import path from "node:path";
import { readJson } from "./lib/json-io.js";
import { ROOT, loadBundle } from "./lib/load-data.js";
import { openOldRepo } from "./lib/old-repo.js";
import { checkParity } from "./lib/parity.js";
import { validateData } from "../src/data/validate.js";

function oldRepoArg(argv) {
  const index = argv.indexOf("--old");
  return index >= 0 ? argv[index + 1] : process.env.OLD_REPO || null;
}

function main() {
  const bundle = loadBundle();
  const errors = validateData(bundle);
  const oldPath = oldRepoArg(process.argv.slice(2));
  if (oldPath) {
    const config = readJson(path.join(ROOT, "scripts", "import-config.json"));
    errors.push(...checkParity(bundle, openOldRepo(oldPath), config));
  }
  const players = [...bundle.seasons, bundle.freeAgents].reduce((sum, source) => sum + source.players.length, 0);
  if (errors.length) {
    errors.slice(0, 200).forEach((error) => console.error(`ERRORE ${error}`));
    console.error(`\n${errors.length} errori.`);
    process.exit(1);
  }
  const parity = oldPath ? " e uguali al vecchio repo" : " (confronto col vecchio repo saltato: usa --old)";
  console.log(`Dati validi${parity}: ${bundle.seasons.length} season + svincolati, ${players} giocatori.`);
}

main();
