// Potenze ORIGINALI delle mosse: massimo 100, mai inventate, stesse mosse di prima, coerenti per nome.
import { test } from "node:test";
import assert from "node:assert/strict";
import { loadBundle } from "../scripts/lib/load-data.js";
import { applyPower, buildPowerTable, makePowerLookup, moveKey } from "../scripts/lib/move-powers.js";
import { mergeLegacy } from "../scripts/lib/parity.js";

const bundle = loadBundle();
const table = bundle.movePowers;
const overrides = bundle.movePowerOverrides;
const lookup = makePowerLookup(table, overrides);
const ORIGINAL_POWERS = new Set([30, 50, 60, 70, 85, 100]);

function* playerMoves() {
  for (const season of bundle.seasons) {
    for (const player of season.players) {
      const label = `${season.id}/${player.playerId}`;
      for (const move of player.moves) yield { label, move };
      const signature = player.signatureMove;
      if (!signature) continue;
      yield { label, move: signature };
      for (const roleMove of Object.values(signature.roleMoves || {})) yield { label, move: roleMove };
    }
  }
}

test("nessuna potenza supera 100 (tabella, override e mosse dei giocatori)", () => {
  for (const move of table.moves) assert.ok(move.power === null || move.power <= 100, moveKey(move));
  for (const power of Object.values(overrides.byName)) assert.ok(power <= 100);
  for (const { label, move } of playerMoves()) assert.ok(move.power <= 100, `${label} ${moveKey(move)}`);
});

test("la tabella contiene solo potenze originali (30, 50, 60, 70, 85, 100) o null", () => {
  for (const move of table.moves) assert.ok(move.power === null || ORIGINAL_POWERS.has(move.power), moveKey(move));
});

test("gli override riguardano solo mosse senza potenza nel file", () => {
  for (const name of Object.keys(overrides.byName)) {
    const rows = table.moves.filter((move) => move.name === name);
    assert.ok(rows.length > 0, `${name} non e' nel file`);
    assert.ok(rows.every((move) => move.power === null), `${name} ha gia' una potenza nel file`);
  }
});

test("nessuna potenza inventata: ogni mossa ha la potenza del file o dell'override", () => {
  for (const { label, move } of playerMoves()) {
    const original = lookup(move);
    assert.ok(original, `${label}: ${moveKey(move)} senza potenza originale`);
    assert.equal(move.power, original.power, `${label}: ${moveKey(move)}`);
  }
});

test("stesse mosse di prima: cambia solo power, il vecchio valore e' in legacy.power", () => {
  for (const { label, move } of playerMoves()) {
    assert.ok(Object.hasOwn(move.legacy || {}, "power"), `${label}: ${moveKey(move)} senza legacy.power`);
    const restored = mergeLegacy(move);
    const { power, legacy, roleMoves, ...rest } = move;
    const { power: oldPower, roleMoves: oldRoles, ...oldRest } = restored;
    assert.deepEqual(rest, oldRest);
    assert.equal(oldPower, move.legacy.power);
  }
});

test("le mosse con lo stesso nome hanno sempre la stessa potenza", () => {
  const byName = new Map();
  for (const { label, move } of playerMoves()) {
    const seen = byName.get(move.name);
    if (seen === undefined) byName.set(move.name, move.power);
    else assert.equal(move.power, seen, `${label}: ${move.name}`);
  }
});

test("buildPowerTable: unica potenza presente vince sulle righe vuote, potenze diverse = errore", () => {
  const row = (power, tension) => ({ name: "A", type: "shot", element: "Fire", power, tension });
  assert.deepEqual(buildPowerTable({ 1: { moves: [row(null, null), row(70, 70)] }, 2: { moves: [{ name: null }] } }),
    [{ name: "A", type: "shot", element: "Fire", power: 70, tension: 70 }]);
  assert.throws(() => buildPowerTable({ 1: { moves: [row(60, 60), row(70, 70)] } }));
});

test("applyPower e' ripetibile e conserva il primo vecchio valore", () => {
  const fake = () => ({ power: 60, source: "file" });
  const once = applyPower({ name: "A", type: "shot", element: "Fire", power: 65 }, fake);
  assert.deepEqual(once, { name: "A", type: "shot", element: "Fire", power: 60, legacy: { power: 65 } });
  assert.deepEqual(applyPower(once, fake), once);
  assert.throws(() => applyPower({ name: "B", type: "shot", element: "Fire", power: 1 }, () => null));
});
