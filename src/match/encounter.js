// Uno scontro della partita: chi ha la palla (attore) contro un avversario, nella zona attuale.
// Chi vince avanza; un tiro vinto e' gol. Le mosse si usano solo nelle azioni "interattive".
import { duelProbability } from "../engine/duel.js";
import { rand } from "./match-random.js";
import { otherSide } from "./sides.js";
import { currentMinute, isExtraTime } from "./match-state.js";
import { pickPlayer, recordAppearance } from "./player-pick.js";
import { affordableMoves, mustPay, payMove, remainingPoints } from "./move-points.js";

function isInteractive(state, zoneRules) {
  if (isExtraTime(state) || zoneRules.alwaysInteractive === true) return true;
  return state.interactiveIndexes.includes(state.actionIndex);
}

function duelSide(entry, group, move = null) {
  return { card: entry.card, group, progress: entry.progress, move };
}

function decideMove(state, side, entry, moveType, winProbability, controllers, balance) {
  const options = affordableMoves(state, side, entry.card, moveType);
  const context = {
    side, card: entry.card, options, moveType, winProbability,
    remainingPoints: remainingPoints(state, side, entry.card.cardId),
    minute: currentMinute(state, balance),
    period: state.period,
    score: { own: state.score[side], other: state.score[otherSide(side)] },
  };
  const move = options.length ? controllers[side].chooseMove(state, context) : null;
  if (move && !options.includes(move)) throw new Error(`Mossa non disponibile: ${move.name}`);
  return move;
}

function moveAfterResult(state, actorSide, zoneRules, actorWon, balance) {
  const zones = balance.match.zones;
  if (actorWon && zoneRules.next === "goal") {
    state.score[actorSide] += 1;
    state.possession = otherSide(actorSide);
    state.zone = zones.afterGoal;
    return true;
  }
  if (actorWon) {
    state.zone = zoneRules.next;
  } else {
    state.possession = otherSide(actorSide);
    state.zone = zones.afterLossInZone[state.zone];
  }
  return false;
}

export function playAction(state, controllers, balance) {
  const zone = state.zone;
  const zoneRules = balance.match.zones[zone];
  const actorSide = state.possession;
  const opponentSide = otherSide(actorSide);
  const actor = pickPlayer(state, actorSide, zoneRules, "actor", balance);
  const opponent = pickPlayer(state, opponentSide, zoneRules, "opponent", balance);
  const interactive = isInteractive(state, zoneRules);
  const plain = duelProbability(duelSide(actor, zoneRules.actorGroup),
    duelSide(opponent, zoneRules.opponentGroup), balance);
  let actorMove = null;
  let opponentMove = null;
  if (interactive) {
    actorMove = decideMove(state, actorSide, actor, zoneRules.actorMoveType, plain, controllers, balance);
    opponentMove = decideMove(state, opponentSide, opponent, zoneRules.opponentMoveType, 100 - plain,
      controllers, balance);
  }
  const probability = duelProbability(duelSide(actor, zoneRules.actorGroup, actorMove),
    duelSide(opponent, zoneRules.opponentGroup, opponentMove), balance);
  const roll = rand(state) * 100;
  const actorWon = roll < probability;
  if (actorMove && mustPay(actorMove.type, actorWon, balance)) payMove(state, actorSide, actor.card.cardId, actorMove);
  if (opponentMove && mustPay(opponentMove.type, !actorWon, balance)) {
    payMove(state, opponentSide, opponent.card.cardId, opponentMove);
  }
  const scoreBefore = { ...state.score };
  const goal = moveAfterResult(state, actorSide, zoneRules, actorWon, balance);
  recordAppearance(state, actorSide, actor.card.cardId, balance);
  recordAppearance(state, opponentSide, opponent.card.cardId, balance);
  state.log.push({
    period: state.period, minute: currentMinute(state, balance), zone, interactive,
    actorSide, actorCardId: actor.card.cardId, opponentCardId: opponent.card.cardId,
    actorMove: actorMove?.name ?? null, opponentMove: opponentMove?.name ?? null,
    probability, roll, actorWon, goal, scoreBefore, score: { ...state.score },
  });
  if (isExtraTime(state)) state.extraActionIndex += 1;
  else state.actionIndex += 1;
}
