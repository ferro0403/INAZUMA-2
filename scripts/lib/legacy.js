// Sposta i campi del vecchio sistema (overall, rating 1-10, livelli, bossLevel...) in un blocco "legacy".
// Non cancella niente: il valore finisce identico dentro `legacy`.

export function makeLegacyKeyTest(rule) {
  const words = (rule.nameContains || []).map((word) => word.toLowerCase());
  const exact = new Set(rule.exactNames || []);
  return (key) => exact.has(key) || words.some((word) => key.toLowerCase().includes(word));
}

export function splitLegacy(value, isLegacyKey) {
  if (Array.isArray(value)) return value.map((item) => splitLegacy(item, isLegacyKey));
  if (!value || typeof value !== "object") return value;
  const kept = {};
  const legacy = {};
  for (const [key, item] of Object.entries(value)) {
    if (key === "legacy") continue;
    if (isLegacyKey(key)) legacy[key] = item;
    else kept[key] = splitLegacy(item, isLegacyKey);
  }
  const merged = { ...(value.legacy || {}), ...legacy };
  if (Object.keys(merged).length > 0) kept.legacy = merged;
  return kept;
}

export function takeKeys(object, keys) {
  const taken = {};
  const rest = {};
  for (const [key, item] of Object.entries(object)) {
    if (keys.includes(key)) taken[key] = item;
    else rest[key] = item;
  }
  return { taken, rest };
}
