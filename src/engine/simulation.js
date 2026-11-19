// Simulazione di scontri "a specchio": la stessa carta contro se stessa (ruolo, elemento e mosse uguali),
// cambiando solo rarita' e stelle. Senza mosse, come chiede l'obiettivo di taratura.
import { playDuel } from "./duel.js";
import { createRandom } from "./random.js";

export function simulateMirrorPair(cards, pair, balance, options) {
  const random = createRandom(options.seed);
  const groups = Object.keys(balance.statGroups).filter((key) => key !== "note");
  let wins = 0;
  for (let i = 0; i < options.duels; i += 1) {
    const card = cards[Math.floor(random() * cards.length)];
    const group = groups[Math.floor(random() * groups.length)];
    const actor = { card, group, progress: pair.a, move: null };
    const opponent = { card, group, progress: pair.b, move: null };
    if (playDuel(actor, opponent, balance, random)) wins += 1;
  }
  return (wins / options.duels) * 100;
}

export function simulatePairs(cards, pairs, balance, options) {
  return pairs.map((pair, index) => ({
    ...pair,
    winRate: simulateMirrorPair(cards, pair, balance, { ...options, seed: options.seed + index }),
  }));
}

// Errore della taratura: somma dei quadrati delle distanze dagli obiettivi.
export function calibrationError(results) {
  return results.reduce((sum, result) => sum + (result.winRate - result.target) ** 2, 0);
}
