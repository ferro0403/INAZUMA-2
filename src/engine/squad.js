// Validazione della rosa: titolari e riserve, limite di carte della rarita' limitata tra i titolari.
// Nessun vincolo di ruolo: ogni giocatore puo' stare in qualsiasi posizione.
// entry = { cardId, progress: { rarity, stars } }
import { checkStars, findRarity } from "./progress.js";

function progressErrors(entry, balance) {
  try {
    findRarity(entry.progress?.rarity, balance);
    checkStars(entry.progress?.stars, balance);
    return [];
  } catch (error) {
    return [`${entry.cardId}: ${error.message}`];
  }
}

export function validateSquad(squad, balance) {
  const rules = balance.squad;
  const starters = squad.starters || [];
  const reserves = squad.reserves || [];
  const errors = [];
  if (starters.length !== rules.starters) errors.push(`Servono ${rules.starters} titolari (ora ${starters.length})`);
  if (reserves.length > rules.maxReserves) errors.push(`Massimo ${rules.maxReserves} riserve (ora ${reserves.length})`);
  const ids = [...starters, ...reserves].map((entry) => entry.cardId);
  const repeated = ids.filter((id, index) => ids.indexOf(id) !== index);
  for (const id of new Set(repeated)) errors.push(`Carta presente piu' volte: ${id}`);
  for (const entry of [...starters, ...reserves]) errors.push(...progressErrors(entry, balance));
  const limited = starters.filter((entry) => entry.progress?.rarity === rules.limitedRarity).length;
  if (limited > rules.maxLimitedRarityStarters) {
    const name = findRarity(rules.limitedRarity, balance).name;
    errors.push(`Massimo ${rules.maxLimitedRarityStarters} carte ${name} tra i titolari (ora ${limited})`);
  }
  return errors;
}
