// Casualita' della partita: lo stato del generatore sta in state.rng, cosi' la partita e' riproducibile
// e lo stato resta un oggetto semplice.
import { stepRandom } from "../engine/random.js";

export function rand(state) {
  const [value, next] = stepRandom(state.rng);
  state.rng = next;
  return value;
}

// Intero tra min e max compresi.
export function randInt(state, min, max) {
  return min + Math.floor(rand(state) * (max - min + 1));
}

export function weightedPick(state, items, weightOf) {
  const weights = items.map(weightOf);
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  let ticket = rand(state) * total;
  for (let i = 0; i < items.length; i += 1) {
    ticket -= weights[i];
    if (ticket < 0) return items[i];
  }
  return items[items.length - 1];
}

// k indici distinti tra 0 e n-1, in ordine crescente.
export function pickIndexes(state, n, k) {
  const pool = Array.from({ length: n }, (_, i) => i);
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand(state) * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, k).sort((a, b) => a - b);
}
