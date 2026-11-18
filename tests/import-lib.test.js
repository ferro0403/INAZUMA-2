import { test } from "node:test";
import assert from "node:assert/strict";
import { formatJson } from "../scripts/lib/json-io.js";
import { makeLegacyKeyTest, splitLegacy } from "../scripts/lib/legacy.js";
import { mergeLegacy } from "../scripts/lib/parity.js";
import { computeImportance, fourMovesFor } from "../scripts/lib/player-enrich.js";
import { validateData } from "../src/data/validate.js";

const isLegacy = makeLegacyKeyTest({ nameContains: ["overall", "level"], exactNames: ["category", "ratings"] });
const rules = {
  byCategory: { Normale: 0, Elite: 1, Mondiale: 2 },
  byFinalOverall: [{ atLeast: 90, importance: 2 }, { atLeast: 85, importance: 1 }, { atLeast: 0, importance: 0 }],
};

test("splitLegacy sposta i campi vecchi in legacy e mergeLegacy li rimette identici", () => {
  const old = { id: "1", finalOverall: 80, bossLevel: 3, category: "Forte", xi: [{ slot: 1, level: 2 }],
    nested: { teamOverall: 70, keep: true } };
  const split = splitLegacy(old, isLegacy);
  assert.deepEqual(split.legacy, { finalOverall: 80, bossLevel: 3, category: "Forte" });
  assert.deepEqual(split.xi[0], { slot: 1, legacy: { level: 2 } });
  assert.equal(split.nested.keep, true);
  assert.deepEqual(mergeLegacy(split), old);
});

test("formatJson non cambia nessun valore (link compresi)", () => {
  const value = { url: "https://a.b/c.png?x=1,2&y=\":\"", list: [1, "a,b", null], deep: { k: [{ a: 1 }] } };
  assert.deepEqual(JSON.parse(formatJson(value)), value);
});

test("importanza: regola da category e finalOverall, vince il valore piu' alto", () => {
  const none = { players: {}, seasonPlayers: {} };
  const of = (legacy) => computeImportance({ playerId: "1", legacy }, "s", rules, none).importance;
  assert.equal(of({ category: "Normale", finalOverall: 72 }), 0);
  assert.equal(of({ category: "Elite", finalOverall: 86 }), 1);
  assert.equal(of({ category: "Mondiale", finalOverall: 91 }), 2);
  assert.equal(of({ finalOverall: 95 }), 2);
  assert.equal(of({}), 0);
});

test("importanza: le correzioni a mano vincono, quella per season vince su quella generale", () => {
  const overrides = { players: { 1: 2 }, seasonPlayers: { "s/1": 1 } };
  const player = { playerId: "1", legacy: { category: "Normale" } };
  assert.deepEqual(computeImportance(player, "s", rules, overrides), { importance: 1, importanceSource: "override" });
  assert.deepEqual(computeImportance(player, "t", rules, overrides), { importance: 2, importanceSource: "override" });
});

test("mosse: si usano quelle della prima season dell'ordine di fallback che le ha", () => {
  const db = { d: [["A", "shot", "Fire", 50], ["B", "save", "Wind", null]], s: { old: { 7: [0, 1] }, new: {} } };
  assert.deepEqual(fourMovesFor("7", ["new", "old"], db), {
    moves: [{ name: "A", type: "shot", element: "Fire", power: 50 }, { name: "B", type: "save", element: "Wind", power: null }],
    sourceSeason: "old",
  });
  assert.deepEqual(fourMovesFor("8", ["new", "old"], db), { moves: [], sourceSeason: null });
});

test("il validatore trova id duplicati, riferimenti rotti e statistiche mancanti non elencate", () => {
  const player = (id, stats) => ({ playerId: id, stats, importance: 0, moves: [] });
  const stats = { a: 1 };
  const season = {
    id: "s",
    players: [player("1", stats), player("1", stats), player("2", null)],
    teams: [{ teamId: "t", playerIds: ["1", "99"] }],
    bossOrder: [{ teamId: "x", startingXIPlayerIds: ["1"] }],
  };
  const errors = validateData({
    seasons: [season],
    freeAgents: { id: "fa", players: [] },
    statsDb: { fields: ["a"] },
    statsMissing: { players: [] },
  });
  const has = (text) => errors.some((error) => error.includes(text));
  assert.ok(has("id duplicato in players: 1"));
  assert.ok(has("giocatore inesistente 99"));
  assert.ok(has("squadra inesistente x"));
  assert.ok(has("XI non da 11"));
  assert.ok(has("s/2: statistiche mancanti"));
});
