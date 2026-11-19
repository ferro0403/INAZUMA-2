// Potenza di una squadra: numero calcolato al momento, mai salvato nei dati.
// starter = { card, progress: { rarity, stars }, slotRole }  (slotRole = ruolo del posto in formazione)
import { baseStrength } from "./strength.js";
import { progressMultiplier } from "./progress.js";
import { moveBonus } from "./move-bonus.js";

function slotGroups(slotRole, balance) {
  const groups = balance.teamPower.groupsBySlotRole[slotRole];
  if (!groups) throw new Error(`Ruolo del posto sconosciuto: ${slotRole}`);
  return groups;
}

// Forza media nei gruppi del posto, senza rarita' e stelle.
export function slotBaseStrength(card, slotRole, balance) {
  const groups = slotGroups(slotRole, balance);
  return groups.reduce((sum, group) => sum + baseStrength(card, group, balance), 0) / groups.length;
}

// Contributo delle mosse, nella stessa unita' della forza (bonus / k).
export function movesPower(card, balance) {
  const moves = card.moves || [];
  if (moves.length === 0) return 0;
  const average = moves.reduce((sum, move) => sum + moveBonus(move, balance), 0) / moves.length;
  return (average / balance.duel.k) * balance.teamPower.moveWeight;
}

// Parti separate: stats (gia' moltiplicate) e mosse. multiplier opzionale sostituisce i progressi.
export function playerPowerParts(starter, balance, multiplier = null) {
  const factor = multiplier ?? progressMultiplier(starter.progress, balance);
  return {
    stats: slotBaseStrength(starter.card, starter.slotRole, balance) * factor,
    moves: movesPower(starter.card, balance),
  };
}

export function playerPower(starter, balance) {
  const parts = playerPowerParts(starter, balance);
  return parts.stats + parts.moves;
}

export function teamPower(starters, balance, multiplier = null) {
  if (!starters.length) return 0;
  const total = starters.reduce((sum, starter) => {
    const parts = playerPowerParts(starter, balance, multiplier);
    return sum + parts.stats + parts.moves;
  }, 0);
  return total / starters.length;
}
