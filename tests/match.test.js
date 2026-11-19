// Partita RTG: finisce sempre, riproducibile, gol solo da tiro vinto, rosa valida dopo i cambi, PT mai negativi.
import { test } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { readJson } from "../scripts/lib/json-io.js";
import { ROOT, loadBundle } from "../scripts/lib/load-data.js";
import { cardsOfSource } from "../src/cards/card.js";
import { createRandom } from "../src/engine/random.js";
import { validateSquad } from "../src/engine/squad.js";
import { createMatch } from "../src/match/match-state.js";
import { playMatch, stepMatch } from "../src/match/match-flow.js";
import { createAiController } from "../src/match/ai-policy.js";
import { randomSquad } from "../src/match/match-simulation.js";

const balance = readJson(path.join(ROOT, "data", "balance.json"));
const bundle = loadBundle();
const cards = bundle.seasons.flatMap((season) => [...cardsOfSource(season).values()]);
const slotRoles = bundle.seasons[0].formations.eleven.find((f) => f.id === "4-4-2").slotRoles;
const ai = createAiController(balance);
const random = createRandom(99);

function newMatch(seed, controllers = { user: ai, opponent: ai }) {
  const user = randomSquad(cards, slotRoles, 4, random);
  const opponent = randomSquad(cards, slotRoles, 4, random);
  return { state: createMatch({ seed, user, opponent, balance }), controllers };
}

const toCheck = (squad) => ({
  starters: squad.starters.map((e) => ({ cardId: e.card.cardId, progress: e.progress })),
  reserves: squad.reserves.map((e) => ({ cardId: e.card.cardId, progress: e.progress })),
});

test("la partita finisce sempre, con un vincitore, e dura 22-30 azioni piu' eventuali supplementari", () => {
  const decided = new Set();
  for (let i = 0; i < 400; i += 1) {
    const { state, controllers } = newMatch(`end:${i}`);
    playMatch(state, controllers, balance);
    assert.equal(state.status, "completed");
    assert.ok(["user", "opponent"].includes(state.result.winner));
    assert.ok(state.actionTarget >= 22 && state.actionTarget <= 30);
    const extra = state.result.decidedBy === "regulation" ? 0 : balance.match.extraTimeActionsPerHalf * 2;
    assert.equal(state.log.length, state.actionTarget + extra);
    if (state.result.decidedBy === "penalties") assert.equal(state.result.winner, state.shootout.winner);
    else assert.notEqual(state.score.user, state.score.opponent);
    decided.add(state.result.decidedBy);
  }
  assert.deepEqual([...decided].sort(), ["extra_time", "penalties", "regulation"]);
});

test("stesso seme = stesso risultato e stessa cronaca; seme diverso = partita diversa", () => {
  const play = (seed) => {
    const local = createRandom(5);
    const user = randomSquad(cards, slotRoles, 4, local);
    const opponent = randomSquad(cards, slotRoles, 4, local);
    return playMatch(createMatch({ seed, user, opponent, balance }), { user: ai, opponent: ai }, balance);
  };
  assert.deepEqual(play("same"), play("same"));
  assert.notDeepEqual(play("same").log, play("other").log);
});

test("un gol viene solo da un tiro vinto, e ogni tiro vinto e' gol", () => {
  for (let i = 0; i < 200; i += 1) {
    const { state, controllers } = newMatch(`goal:${i}`);
    playMatch(state, controllers, balance);
    let goals = 0;
    for (const entry of state.log) {
      const scored = entry.score.user + entry.score.opponent - entry.scoreBefore.user - entry.scoreBefore.opponent;
      const wonShot = entry.zone === "shot" && entry.actorWon;
      assert.equal(scored, wonShot ? 1 : 0);
      assert.equal(entry.goal, wonShot);
      if (wonShot) assert.equal(entry.score[entry.actorSide], entry.scoreBefore[entry.actorSide] + 1);
      goals += scored;
    }
    assert.equal(goals, state.score.user + state.score.opponent);
  }
});

test("mosse solo nelle azioni interattive e PT mai negativi", () => {
  for (let i = 0; i < 100; i += 1) {
    const { state, controllers } = newMatch(`moves:${i}`);
    playMatch(state, controllers, balance);
    for (const entry of state.log) if (!entry.interactive) assert.ok(!entry.actorMove && !entry.opponentMove);
    assert.ok(Object.values(state.movePoints).every((points) => points >= 0));
  }
});

// All'intervallo l'utente scambia titolari e riserve e cambia i posti in modo casuale ma valido.
function shufflingController(local) {
  return {
    ...ai,
    chooseHalftime(state, side) {
      const { starters, reserves } = state.squads[side];
      const all = [...starters, ...reserves].sort(() => local() - 0.5);
      const roles = starters.map((e) => e.slotRole).sort(() => local() - 0.5);
      return {
        starters: all.slice(0, 11).map((e, i) => ({ card: e.card, progress: e.progress, slotRole: roles[i] })),
        reserves: all.slice(11).map((e) => ({ card: e.card, progress: e.progress })),
      };
    },
  };
}

test("dopo i cambi all'intervallo la rosa e' sempre valida e con le stesse carte", () => {
  const local = createRandom(3);
  for (let i = 0; i < 100; i += 1) {
    const controller = shufflingController(local);
    const { state } = newMatch(`half:${i}`);
    const before = new Set([...state.squads.user.starters, ...state.squads.user.reserves].map((e) => e.card.cardId));
    playMatch(state, { user: controller, opponent: ai }, balance);
    assert.deepEqual(validateSquad(toCheck(state.squads.user), balance), []);
    const after = [...state.squads.user.starters, ...state.squads.user.reserves].map((e) => e.card.cardId);
    assert.deepEqual(new Set(after), before);
  }
});

function atHalftime(seed) {
  const { state } = newMatch(seed);
  while (state.status !== "halftime") stepMatch(state, { user: ai, opponent: ai }, balance);
  return state;
}

test("all'intervallo i cambi non validi vengono rifiutati", () => {
  const state = atHalftime("invalid");
  const squad = state.squads.user;
  const tryWith = (next) => assert.throws(() => stepMatch(state, { user: { ...ai, chooseHalftime: () => next },
    opponent: ai }, balance));
  const outsider = cards.find((card) => !squad.starters.some((e) => e.card.cardId === card.cardId));
  tryWith({ ...squad, starters: [...squad.starters.slice(1), { ...squad.starters[0], card: outsider }] });
  const twelve = [...squad.starters, { ...squad.reserves[0], slotRole: "MF" }];
  tryWith({ starters: twelve, reserves: squad.reserves.slice(1) });
  const fabled = { rarity: "fabled", stars: 0 };
  tryWith({ ...squad, starters: squad.starters.map((e) => ({ ...e, progress: fabled })) });
  tryWith({ ...squad, starters: squad.starters.map((e, i) => (i === 0 ? { ...e, slotRole: "XX" } : e)) });
  assert.equal(state.status, "halftime");
});
