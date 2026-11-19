// Numeri casuali con seme (mulberry32): stessa sequenza a ogni esecuzione con lo stesso seme.
// Lo stato e' un numero intero, cosi' puo' stare dentro uno stato salvabile (es. la partita).

export function hashSeed(seed) {
  if (Number.isInteger(seed)) return seed >>> 0;
  let hash = 2166136261;
  for (const char of String(seed)) {
    hash ^= char.codePointAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

// Un passo: restituisce [numero in [0, 1), nuovo stato].
export function stepRandom(state) {
  const next = (state + 0x6d2b79f5) >>> 0;
  let t = next;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return [((t ^ (t >>> 14)) >>> 0) / 4294967296, next];
}

export function createRandom(seed) {
  let state = hashSeed(seed);
  return function random() {
    const [value, next] = stepRandom(state);
    state = next;
    return value;
  };
}
