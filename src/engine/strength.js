// Forza di una carta in un tipo di scontro: media delle statistiche del gruppo x moltiplicatore dei progressi.
import { progressMultiplier } from "./progress.js";

export function groupFields(group, balance) {
  const fields = balance.statGroups[group];
  if (!Array.isArray(fields)) throw new Error(`Gruppo di statistiche sconosciuto: ${group}`);
  return fields;
}

// Forza senza rarita' e stelle.
export function baseStrength(card, group, balance) {
  if (!card?.stats) throw new Error("Carta senza statistiche");
  const fields = groupFields(group, balance);
  const total = fields.reduce((sum, field) => sum + card.stats[field], 0);
  return total / fields.length;
}

export function cardStrength(card, group, progress, balance) {
  return baseStrength(card, group, balance) * progressMultiplier(progress, balance);
}
