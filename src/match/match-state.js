// Creazione dello stato di una partita RTG.
// side = { starters: [{ card, slotRole, progress }], reserves: [{ card, progress }] }
// I lati si chiamano "user" e "opponent". Lo stato e' un oggetto semplice (si puo' salvare in futuro).
import { hashSeed } from "../engine/random.js";
import { pickIndexes, rand, randInt } from "./match-random.js";
import { initialMovePoints } from "./move-points.js";

export function createMatch({ seed, user, opponent, balance }) {
  const rules = balance.match;
  const state = {
    seed: String(seed),
    rng: hashSeed(seed),
    status: "active",
    period: "first_half",
    actionIndex: 0,
    extraActionIndex: 0,
    score: { user: 0, opponent: 0 },
    zone: rules.zones.start,
    possession: null,
    squads: { user: copySquad(user), opponent: copySquad(opponent) },
    movePoints: {},
    history: { user: [], opponent: [] },
    appearances: { user: {}, opponent: {} },
    log: [],
    shootout: null,
    result: null,
  };
  state.actionTarget = randInt(state, rules.actions.min, rules.actions.max);
  state.firstHalfTarget = Math.floor(state.actionTarget / 2);
  const { min, max } = rules.interactiveActions;
  const interactive = Math.min(state.actionTarget, randInt(state, min, max));
  state.interactiveIndexes = pickIndexes(state, state.actionTarget, interactive);
  state.possession = rand(state) < 0.5 ? "user" : "opponent";
  state.movePoints = initialMovePoints(state, balance);
  return state;
}

function copySquad(squad) {
  return {
    starters: squad.starters.map((entry) => ({ ...entry })),
    reserves: (squad.reserves || []).map((entry) => ({ ...entry })),
  };
}

export function isExtraTime(state) {
  return state.period === "extra_first" || state.period === "extra_second";
}

export function currentMinute(state, balance) {
  const { regulation, extraTime } = balance.match.minutes;
  if (isExtraTime(state)) {
    const total = balance.match.extraTimeActionsPerHalf * 2;
    return regulation + Math.round((Math.min(total, state.extraActionIndex) / total) * extraTime);
  }
  return Math.round((Math.min(state.actionTarget, state.actionIndex) / state.actionTarget) * regulation);
}
