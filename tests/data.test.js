import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROOT, loadBundle } from "../scripts/lib/load-data.js";
import { validateData } from "../src/data/validate.js";

const bundle = loadBundle();

test("i dati in data/ superano tutti i controlli del validatore", () => {
  assert.deepEqual(validateData(bundle), []);
});

test("ogni season dell'indice ha il suo file e il suo id", () => {
  for (const entry of bundle.index.seasons) {
    assert.ok(fs.existsSync(path.join(ROOT, entry.file)), entry.file);
    assert.equal(bundle.seasons.find((season) => season.id === entry.id)?.id, entry.id);
  }
});

test("le statistiche hanno sempre i 7 campi nell'ordine ufficiale", () => {
  assert.deepEqual(bundle.statsDb.fields,
    ["kick", "control", "technique", "pressure", "physical", "agility", "intelligence"]);
  for (const source of [...bundle.seasons, bundle.freeAgents]) {
    for (const player of source.players.filter((p) => p.stats)) {
      assert.deepEqual(Object.keys(player.stats), bundle.statsDb.fields);
    }
  }
});

test("gli svincolati non hanno mosse assegnate (le assegna l'utente)", () => {
  assert.ok(bundle.freeAgents.players.every((player) => player.moves.length === 0));
});

test("nessun giocatore ha piu' di 4 mosse", () => {
  for (const season of bundle.seasons) assert.ok(season.players.every((player) => player.moves.length <= 4));
});
