// Punti mossa (PT): ogni carta ne ha balance.match.movePoints.perCard a partita; una mossa costa la sua potenza.
// I PT sono legati alla carta, quindi restano uguali anche se la carta va in panchina e torna.
import { SIDES, allEntries } from "./sides.js";

const key = (side, cardId) => `${side}|${cardId}`;

export function initialMovePoints(state, balance) {
  const points = {};
  for (const side of SIDES) {
    for (const entry of allEntries(state, side)) {
      points[key(side, entry.card.cardId)] = balance.match.movePoints.perCard;
    }
  }
  return points;
}

export function remainingPoints(state, side, cardId) {
  return state.movePoints[key(side, cardId)] ?? 0;
}

// Mosse del tipo giusto che la carta puo' ancora pagare.
export function affordableMoves(state, side, card, moveType) {
  const remaining = remainingPoints(state, side, card.cardId);
  return card.moves.filter((move) => move.type === moveType && move.power <= remaining);
}

export function mustPay(moveType, won, balance) {
  return balance.match.movePoints.alwaysPaidTypes.includes(moveType) || won;
}

export function payMove(state, side, cardId, move) {
  const k = key(side, cardId);
  const remaining = state.movePoints[k] ?? 0;
  if (move.power > remaining) throw new Error(`PT insufficienti per ${move.name}`);
  state.movePoints[k] = remaining - move.power;
}
