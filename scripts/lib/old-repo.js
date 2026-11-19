// Lettura dei DATI del vecchio repo. Il codice del vecchio gioco non viene copiato:
// due file JS contengono dati (ordine season, configurazione RTG) e vengono solo eseguiti
// in una sandbox isolata per leggerne i valori; un terzo contiene le mosse compresse in base64.
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import zlib from "node:zlib";
import { execFileSync } from "node:child_process";
import { readJson } from "./json-io.js";

export function openOldRepo(root) {
  const resolved = path.resolve(root);
  if (!fs.existsSync(path.join(resolved, "data"))) {
    throw new Error(`Cartella data/ non trovata in ${resolved}: serve il percorso del vecchio repo.`);
  }
  return {
    root: resolved,
    file: (relative) => path.join(resolved, relative),
    json: (relative) => readJson(path.join(resolved, relative)),
    commit: () => gitCommit(resolved),
  };
}

function gitCommit(root) {
  try {
    return execFileSync("git", ["-C", root, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
  } catch {
    return null;
  }
}

// Esegue un file JS "a script globale" in una sandbox senza accesso a rete, file o processo
// e restituisce l'oggetto che il file assegna a globalThis[globalName], convertito in JSON puro.
export function readGlobalFromScript(oldRepo, relativeFile, globalName, pick) {
  const sandbox = {};
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(oldRepo.file(relativeFile), "utf8"), sandbox, { timeout: 2000 });
  const exported = sandbox[globalName];
  if (!exported) throw new Error(`${relativeFile} non definisce ${globalName}`);
  return JSON.parse(JSON.stringify(pick ? pick(exported) : exported));
}

export function readSeasonDisplay(oldRepo, config) {
  return readGlobalFromScript(oldRepo, config.file, config.global, (registry) => registry.list());
}

export function readRtgConfig(oldRepo, config) {
  return readGlobalFromScript(oldRepo, config.file, config.global, (rtg) => ({
    seasons: rtg.SEASONS,
    constants: Object.fromEntries(config.constants.map((name) => [name, rtg[name]])),
  }));
}

// Mosse 2-4 per giocatore: { d: [[name, type, element, power], ...], s: { seasonId: { playerId: [indici] } } }
export function readFourMoves(oldRepo, config) {
  const source = fs.readFileSync(oldRepo.file(config.file), "utf8");
  const match = source.match(new RegExp(`const ${config.constant} = "([^"]+)"`));
  if (!match) throw new Error(`${config.file}: costante ${config.constant} non trovata`);
  const decoded = JSON.parse(zlib.inflateSync(Buffer.from(match[1], "base64")).toString("utf8"));
  if (decoded?.v !== 1 || !Array.isArray(decoded.d) || !decoded.s) throw new Error("Database mosse non valido");
  return decoded;
}
