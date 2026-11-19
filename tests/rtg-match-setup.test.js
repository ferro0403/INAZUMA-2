// Carte (giocatore + versione), difficolta' per partita e nemico sempre tra minimo e massimo.
import { test } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { readJson } from "../scripts/lib/json-io.js";
import { ROOT, loadBundle } from "../scripts/lib/load-data.js";
import { cardFromPlayer, cardIdOf, cardsOfSource, parseCardId } from "../src/cards/card.js";
import { createRandom } from "../src/engine/random.js";
import { validateSquad } from "../src/engine/squad.js";
import { teamPower } from "../src/engine/team-power.js";
import { buildRtgOpponent, opponentStarters } from "../src/match/rtg-opponent.js";
import { randomSquad } from "../src/match/match-simulation.js";
import { createMatch } from "../src/match/match-state.js";
import { playMatch } from "../src/match/match-flow.js";
import { createAiController } from "../src/match/ai-policy.js";

const balance = readJson(path.join(ROOT, "data", "balance.json"));
const difficulty = readJson(path.join(ROOT, "data", "rtg-difficulty.json"));
const bundle = loadBundle();
const cards = bundle.seasons.flatMap((season) => [...cardsOfSource(season).values()]);
const slotRoles = bundle.seasons[0].formations.eleven.find((f) => f.id === "4-4-2").slotRoles;

test("la carta e' giocatore + versione: due versioni dello stesso giocatore possono stare nella stessa rosa", () => {
  const byPlayer = new Map();
  for (const card of cards) byPlayer.set(card.playerId, [...(byPlayer.get(card.playerId) || []), card]);
  const versions = [...byPlayer.values()].find((list) => list.length >= 2);
  assert.ok(versions, "nei dati c'e' almeno un giocatore in piu' season");
  assert.notEqual(versions[0].cardId, versions[1].cardId);
  assert.deepEqual(parseCardId(versions[0].cardId), { sourceId: versions[0].sourceId, playerId: versions[0].playerId });
  const others = cards.filter((card) => card.playerId !== versions[0].playerId).slice(0, 13);
  const entry = (card) => ({ cardId: card.cardId, progress: {} });
  const squad = { starters: [versions[0], versions[1], ...others.slice(0, 9)].map(entry), reserves: [] };
  assert.deepEqual(validateSquad(squad, balance), []);
  const twice = { starters: [versions[0], versions[0], ...others.slice(0, 9)].map(entry), reserves: [] };
  assert.equal(validateSquad(twice, balance).length, 1);
  assert.equal(cardIdOf("x", "7"), "x:7");
  assert.equal(cardFromPlayer("x", { playerId: 7, stats: {}, moves: [] }).cardId, "x:7");
});

test("rtg-difficulty.json: una riga per ogni partita principale RTG, in ordine, con min <= max", () => {
  for (const season of bundle.seasons) {
    const rows = difficulty.seasons[season.id];
    assert.deepEqual(rows.map((row) => row.teamId), season.rtg.mainTeams);
    rows.forEach((row, index) => {
      assert.equal(row.order, index + 1);
      assert.ok(row.minMultiplier > 0 && row.minMultiplier <= row.maxMultiplier);
    });
    assert.ok(rows[0].minMultiplier >= 1 && rows[0].maxMultiplier <= 1.25);
    assert.ok(rows.at(-1).minMultiplier >= 1.25 && rows.at(-1).maxMultiplier <= 1.75);
  }
});

function playable(season, teamId) {
  try {
    opponentStarters(season, teamId);
    return true;
  } catch {
    return false;
  }
}

test("il nemico resta sempre tra minimo e massimo della partita, qualunque sia la squadra del giocatore", () => {
  const random = createRandom(11);
  const progresses = [{ rarity: "normal", stars: 0 }, { rarity: "rare", stars: 2 }, { rarity: "fabled", stars: 5 },
    { multiplier: 0.3 }, { multiplier: 5 }];
  for (const season of bundle.seasons) {
    for (const teamId of season.rtg.mainTeams.filter((id) => playable(season, id))) {
      const base = randomSquad(cards, slotRoles, 0, random).starters;
      for (const progress of progresses) {
        const userStarters = base.map((entry) => ({ ...entry, progress }));
        const { adapted, limits, squad } = buildRtgOpponent({ season, teamId, userStarters, difficulty, balance });
        assert.ok(adapted.power >= adapted.min - 1e-9 && adapted.power <= adapted.max + 1e-9);
        assert.ok(Math.abs(adapted.min - adapted.base * limits.minMultiplier) < 1e-9);
        assert.ok(Math.abs(teamPower(squad.starters, balance) - adapted.power) < 1e-6);
      }
    }
  }
});

test("partita RTG completa contro il primo boss di ogni season", () => {
  const ai = createAiController(balance);
  const random = createRandom(21);
  for (const season of bundle.seasons) {
    const teamId = season.rtg.mainTeams.find((id) => playable(season, id));
    const user = randomSquad(cards, slotRoles, 4, random);
    const { squad } = buildRtgOpponent({ season, teamId, userStarters: user.starters, difficulty, balance });
    const state = playMatch(createMatch({ seed: `${season.id}:${teamId}`, user, opponent: squad, balance }),
      { user: ai, opponent: ai }, balance);
    assert.equal(state.status, "completed");
  }
});

test("le partite con giocatori nemici senza statistiche si fermano con un errore chiaro", () => {
  const blocked = bundle.seasons.flatMap((season) => season.rtg.mainTeams
    .filter((id) => !playable(season, id)).map((id) => `${season.id}/${id}`));
  assert.ok(blocked.length > 0);
  for (const key of blocked) {
    const [seasonId, teamId] = key.split("/");
    const season = bundle.seasons.find((item) => item.id === seasonId);
    assert.throws(() => opponentStarters(season, teamId), /senza statistiche Lv50/);
  }
});
