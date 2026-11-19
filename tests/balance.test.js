// balance.json: nessun valore fuori dai limiti. Dati: nessuna potenza di mossa sopra 100.
import { test } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { readJson } from "../scripts/lib/json-io.js";
import { ROOT, loadBundle } from "../scripts/lib/load-data.js";

const balance = readJson(path.join(ROOT, "data", "balance.json"));
const bundle = loadBundle();
const between = (value, min, max) => Number.isFinite(value) && value >= min && value <= max;

test("duel: k positivo, probabilita' tra 0 e 100 con min < base < max", () => {
  const { k, baseProbability, minProbability, maxProbability } = balance.duel;
  assert.ok(between(k, 0.01, 5));
  assert.ok(between(minProbability, 0, 100) && between(maxProbability, 0, 100));
  assert.ok(minProbability < baseProbability && baseProbability < maxProbability);
  assert.equal(minProbability + maxProbability, 100, "limiti simmetrici, serve alla simmetria degli scontri");
});

test("elementi e mosse: bonus in limiti ragionevoli, potenze tra 0 e 100", () => {
  const { cycle, advantageBonus, elementFrom } = balance.elements;
  assert.ok(between(advantageBonus, 0, 20));
  assert.ok(["card", "move"].includes(elementFrom));
  const known = new Set(bundle.elements.elements);
  assert.ok(cycle.length >= 2 && cycle.every((element) => known.has(element)));
  const move = balance.moveBonus;
  assert.ok(between(move.minPower, 0, 100) && between(move.maxPower, 0, 100) && move.minPower < move.maxPower);
  assert.ok(between(move.bonusAtMinPower, 0, 30) && between(move.bonusAtMaxPower, 0, 30));
  assert.ok(move.bonusAtMinPower <= move.bonusAtMaxPower);
});

test("gruppi di statistiche: solo le 7 statistiche Lv50", () => {
  const fields = new Set(bundle.statsDb.fields);
  const groups = Object.entries(balance.statGroups).filter(([key]) => key !== "note");
  assert.ok(groups.length > 0);
  for (const [name, list] of groups) assert.ok(list.length > 0 && list.every((f) => fields.has(f)), name);
  for (const list of Object.values(balance.teamPower.groupsBySlotRole)) {
    assert.ok(list.every((group) => Array.isArray(balance.statGroups[group])));
  }
});

test("rarita' e stelle: bonus crescenti da 0, totale massimo sotto +100%", () => {
  const bonuses = balance.rarities.list.map((rarity) => rarity.bonus);
  assert.equal(bonuses[0], 0);
  bonuses.slice(1).forEach((value, i) => assert.ok(value > bonuses[i] && value <= 1));
  assert.equal(new Set(balance.rarities.list.map((rarity) => rarity.id)).size, bonuses.length);
  assert.ok(between(balance.stars.bonusPerStar, 0, 0.1) && Number.isInteger(balance.stars.max));
  assert.ok(bonuses.at(-1) + balance.stars.max * balance.stars.bonusPerStar < 1);
});

test("rosa, progressione e nemico: valori coerenti", () => {
  const squad = balance.squad;
  assert.ok(squad.starters === 11 && between(squad.maxReserves, 0, 11));
  assert.ok(balance.rarities.list.some((rarity) => rarity.id === squad.limitedRarity));
  assert.ok(between(squad.maxLimitedRarityStarters, 0, squad.starters));
  const progress = balance.rarityProgress;
  assert.equal(progress.matchesPerStep.length, balance.rarities.list.length - 1);
  assert.ok(progress.matchesPerStep.every((value) => value > 0) && between(progress.lossWeight, 0, 1));
  const enemy = balance.enemy;
  assert.ok(between(enemy.followRatio, 0.1, 3));
  assert.ok(enemy.minMultiplier > 0 && enemy.minMultiplier <= enemy.maxMultiplier);
  assert.ok(between(balance.teamPower.moveWeight, 0, 5));
});

test("taratura: obiettivi tra 50 e 95 e coppie con rarita' esistenti", () => {
  const ids = new Set(balance.rarities.list.map((rarity) => rarity.id));
  const { targets, extraPairs, tolerance } = balance.calibration;
  for (const pair of [...targets, ...extraPairs]) assert.ok(ids.has(pair.a.rarity) && ids.has(pair.b.rarity));
  for (const pair of targets) assert.ok(between(pair.target, 50, 95));
  assert.ok(between(tolerance, 0, 10));
});

test("nei dati dei giocatori nessuna potenza di mossa supera 100", () => {
  for (const source of [...bundle.seasons, bundle.freeAgents]) {
    for (const player of source.players) {
      const sig = player.signatureMove;
      const signature = sig ? [sig, ...Object.values(sig.roleMoves || {})] : [];
      for (const move of [...player.moves, ...signature]) {
        assert.ok(between(move.power, 1, 100), `${source.id}/${player.playerId} ${move.name}: ${move.power}`);
      }
    }
  }
});
