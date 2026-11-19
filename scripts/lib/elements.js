// Uniforma i nomi degli elementi (es. "Fuoco" -> "Fire"). Il valore originale finisce in `legacy`.
// I blocchi `legacy` non vengono toccati: contengono gia' i valori originali.

export function translateElements(value, rule) {
  if (Array.isArray(value)) return value.map((item) => translateElements(item, rule));
  if (!value || typeof value !== "object") return value;
  const out = {};
  const original = {};
  for (const [key, item] of Object.entries(value)) {
    if (key === "legacy") continue;
    if (rule.keys.includes(key) && Object.hasOwn(rule.map, item)) {
      if (Object.hasOwn(value.legacy || {}, key)) throw new Error(`legacy.${key} esiste gia': non lo sovrascrivo`);
      out[key] = rule.map[item];
      original[key] = item;
    } else {
      out[key] = translateElements(item, rule);
    }
  }
  const legacy = { ...(value.legacy || {}), ...original };
  if (Object.keys(legacy).length > 0) out.legacy = legacy;
  return out;
}
