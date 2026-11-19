// IA del vecchio RTG, in modo semplice: sceglie una mossa tra quelle che puo' pagare (piu' probabile se
// potente), poi decide se usarla in base a quanto e' facile lo scontro, al minuto e al punteggio.
// Lo stesso controller fa anche i cambi all'intervallo (nessuno) e i rigori.
import { rand, weightedPick } from "./match-random.js";

export function moveChance(context, balance) {
  const ai = balance.match.ai;
  if (!context.option || context.remainingUses <= 0) return 0;
  let chance = ai.chanceByWinProbability.find((step) => context.winProbability >= step.atLeast).chance;
  const losing = context.score.own < context.score.other;
  const drawing = context.score.own === context.score.other;
  const shotOrSave = ["shot", "save"].includes(context.moveType);
  if (context.minute >= ai.lateMinute && (drawing || losing)) chance += ai.lateNotWinningBonus;
  if (context.minute >= ai.veryLateMinute && losing) chance += ai.veryLateLosingBonus;
  if (shotOrSave) chance += ai.shotSaveBonus;
  if (context.minute >= ai.lateShotSaveMinute && shotOrSave) chance += ai.lateShotSaveBonus;
  if (context.remainingUses === 1 && context.minute < ai.lastUseBeforeMinute) chance -= ai.lastUseMalus;
  return Math.max(0, Math.min(ai.maxChance, chance));
}

// context = { options, remainingPoints, winProbability, minute, score: { own, other }, moveType }
export function chooseAiMove(state, context, balance) {
  if (!context.options.length) return null;
  const option = weightedPick(state, context.options, (move) => Math.max(1, move.power));
  const remainingUses = Math.floor(context.remainingPoints / option.power);
  const chance = moveChance({ ...context, option, remainingUses }, balance);
  return rand(state) * 100 < chance ? option : null;
}

// Rigore: la direzione del portiere "legge" i rigori gia' tirati dall'avversario.
export function aiPenaltyDirection(state, role, shooterHistory, balance) {
  const { directions, keeperReadWeight } = balance.match.penalties;
  if (role === "shooter") return directions[Math.floor(rand(state) * directions.length)];
  const counts = Object.fromEntries(directions.map((direction) => [direction, 0]));
  for (const direction of shooterHistory) counts[direction] += 1;
  return weightedPick(state, directions, (direction) => 1 + counts[direction] * keeperReadWeight);
}

export function createAiController(balance) {
  return {
    chooseMove: (state, context) => chooseAiMove(state, context, balance),
    chooseHalftime: () => null,
    choosePenalty: (state, context) => ({
      move: chooseAiMove(state, context, balance),
      direction: aiPenaltyDirection(state, context.role, context.shooterHistory, balance),
    }),
  };
}
