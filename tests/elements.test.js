// Elementi uniformati in inglese: nessun nome italiano fuori dai blocchi legacy, originale conservato.
import { test } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { readJson } from "../scripts/lib/json-io.js";
import { ROOT, loadBundle } from "../scripts/lib/load-data.js";
import { translateElements } from "../scripts/lib/elements.js";

const rule = readJson(path.join(ROOT, "scripts", "import-config.json")).elementNames;
const italian = new Set(Object.keys(rule.map));
const bundle = loadBundle();
const sources = [...bundle.seasons, bundle.freeAgents];

function findItalian(value, where, found) {
  if (Array.isArray(value)) value.forEach((item, i) => findItalian(item, `${where}[${i}]`, found));
  else if (value && typeof value === "object") {
    for (const [key, item] of Object.entries(value)) {
      if (key !== "legacy") findItalian(item, `${where}.${key}`, found);
    }
  } else if (italian.has(value)) found.push(`${where} = ${value}`);
  return found;
}

test("nessun elemento in italiano nei dati (fuori da legacy)", () => {
  for (const source of [...sources, bundle.playerVisuals, bundle.rtgCampaign]) {
    assert.deepEqual(findItalian(source, source.id ?? "file", []), []);
  }
});

test("ogni giocatore ha un elemento della lista in inglese", () => {
  const allowed = new Set(bundle.elements.elements);
  for (const source of sources) {
    for (const player of source.players) assert.ok(allowed.has(player.element), `${source.id}/${player.playerId}`);
  }
});

test("chi aveva l'elemento in italiano lo conserva in legacy.element", () => {
  const translated = sources.flatMap((source) => source.players).filter((p) => p.legacy?.element);
  assert.ok(translated.length > 0);
  for (const player of translated) {
    assert.ok(italian.has(player.legacy.element));
    assert.equal(player.element, rule.map[player.legacy.element]);
  }
});

test("translateElements traduce solo i valori noti e non tocca i blocchi legacy", () => {
  const input = { element: "Albero", type: "shot", legacy: { level: 1 }, list: [{ element: "Fire" }] };
  assert.deepEqual(translateElements({ element: "Vento", list: [{ element: "Fire", type: "save" }] }, rule),
    { element: "Wind", list: [{ element: "Fire", type: "save" }], legacy: { element: "Vento" } });
  assert.deepEqual(translateElements(input, rule),
    { element: "Forest", type: "shot", list: [{ element: "Fire" }], legacy: { level: 1, element: "Albero" } });
  assert.throws(() => translateElements({ element: "Fuoco", legacy: { element: "X" } }, rule));
});
