// Probabilita' (in %) che l'attore vinca uno scontro diretto.
// side = { card, progress: { rarity, stars }, group, move? }  (move = mossa usata, opzionale)
import { cardStrength } from "./strength.js";
import { elementBonus, sideElement } from "./elements.js";
import { moveBonus } from "./move-bonus.js";

export function clampProbability(value, balance) {
  const { minProbability, maxProbability } = balance.duel;
  return Math.min(maxProbability, Math.max(minProbability, value));
}

export function duelBreakdown(actor, opponent, balance) {
  const actorStrength = cardStrength(actor.card, actor.group, actor.progress, balance);
  const opponentStrength = cardStrength(opponent.card, opponent.group, opponent.progress, balance);
  const strengthTerm = balance.duel.k * (actorStrength - opponentStrength);
  const element = elementBonus(sideElement(actor, balance), sideElement(opponent, balance), balance);
  const move = moveBonus(actor.move, balance) - moveBonus(opponent.move, balance);
  const raw = balance.duel.baseProbability + strengthTerm + element + move;
  const probability = clampProbability(raw, balance);
  return { actorStrength, opponentStrength, strengthTerm, element, move, raw, probability };
}

export function duelProbability(actor, opponent, balance) {
  return duelBreakdown(actor, opponent, balance).probability;
}

// Gioca uno scontro: random() restituisce un numero in [0, 1). true = vince l'attore.
export function playDuel(actor, opponent, balance, random) {
  return random() * 100 < duelProbability(actor, opponent, balance);
}
