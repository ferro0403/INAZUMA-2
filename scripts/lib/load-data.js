// Carica in Node tutti i dati del nuovo repo partendo da data/seasons/index.json.
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readJson } from "./json-io.js";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

export function loadBundle(root = ROOT) {
  const at = (relative) => readJson(path.join(root, relative));
  const index = at("data/seasons/index.json");
  return {
    index,
    seasons: index.seasons.map((entry) => at(entry.file)),
    freeAgents: at(index.freeAgents.file),
    statsDb: at(index.stats),
    elements: at(index.elements),
    statsMissing: at("data/stats-missing.json"),
    playerVisuals: at(index.playerVisuals),
    rtgCampaign: at(index.rtgCampaign),
  };
}
