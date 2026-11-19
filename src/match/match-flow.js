// Svolgimento della partita: primo tempo -> intervallo (cambi) -> secondo tempo
// -> se pari supplementari (due tempi brevi) -> se ancora pari rigori.
// stepMatch fa un solo passo (utile per l'interfaccia); playMatch gioca fino alla fine.
import { SIDES } from "./sides.js";
import { playAction } from "./encounter.js";
import { applyHalftime } from "./halftime.js";
import { playKick, startShootout } from "./penalties.js";

function finish(state, decidedBy) {
  const { user, opponent } = state.score;
  const winner = state.shootout?.winner ?? (user > opponent ? "user" : "opponent");
  state.status = "completed";
  state.period = "completed";
  state.result = { winner, decidedBy, score: { ...state.score } };
  if (state.shootout) state.result.shootoutScore = { ...state.shootout.score };
}

// Passa al periodo successivo quando quello attuale e' finito.
function checkBoundary(state, balance) {
  const perHalf = balance.match.extraTimeActionsPerHalf;
  const tied = state.score.user === state.score.opponent;
  if (state.period === "first_half" && state.actionIndex >= state.firstHalfTarget) {
    state.period = "halftime";
    state.status = "halftime";
  } else if (state.period === "second_half" && state.actionIndex >= state.actionTarget) {
    if (tied) state.period = "extra_first";
    else finish(state, "regulation");
  } else if (state.period === "extra_first" && state.extraActionIndex >= perHalf) {
    state.period = "extra_second";
  } else if (state.period === "extra_second" && state.extraActionIndex >= perHalf * 2) {
    if (tied) startShootout(state);
    else finish(state, "extra_time");
  }
}

function playHalftime(state, controllers, balance) {
  for (const side of SIDES) {
    const next = controllers[side].chooseHalftime(state, side);
    if (next) applyHalftime(state, side, next, balance);
  }
  state.period = "second_half";
  state.status = "active";
}

// controllers = { user, opponent }: ognuno con chooseMove, chooseHalftime, choosePenalty.
export function stepMatch(state, controllers, balance) {
  if (state.status === "active") {
    checkBoundary(state, balance);
    if (state.status === "active") playAction(state, controllers, balance);
  } else if (state.status === "halftime") {
    playHalftime(state, controllers, balance);
  } else if (state.status === "penalties") {
    playKick(state, controllers, balance);
    if (state.shootout.winner) finish(state, "penalties");
  }
  return state;
}

export function playMatch(state, controllers, balance) {
  const { actions, extraTimeActionsPerHalf, penalties } = balance.match;
  const maxSteps = actions.max + extraTimeActionsPerHalf * 2 + penalties.maxKicks + 10;
  for (let step = 0; state.status !== "completed"; step += 1) {
    if (step > maxSteps) throw new Error("La partita non finisce: errore nel motore");
    stepMatch(state, controllers, balance);
  }
  return state;
}
