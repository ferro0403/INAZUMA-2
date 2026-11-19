// Intervallo: si puo' cambiare la rosa (chi gioca, chi va in panchina, i posti) ma con le stesse carte
// e gli stessi progressi, e la rosa deve restare valida (11 titolari, riserve, limite Fabled).
import { validateSquad } from "../engine/squad.js";

const squadForCheck = (squad) => ({
  starters: squad.starters.map((entry) => ({ cardId: entry.card.cardId, progress: entry.progress })),
  reserves: squad.reserves.map((entry) => ({ cardId: entry.card.cardId, progress: entry.progress })),
});

function progressByCard(squad) {
  return new Map([...squad.starters, ...squad.reserves]
    .map((entry) => [entry.card.cardId, JSON.stringify(entry.progress ?? {})]));
}

export function halftimeErrors(current, next, balance) {
  const errors = validateSquad(squadForCheck(next), balance);
  const before = progressByCard(current);
  const after = progressByCard(next);
  if (before.size !== after.size || [...after.keys()].some((id) => !before.has(id))) {
    errors.push("All'intervallo si possono usare solo le carte della rosa iniziale");
  }
  for (const [id, progress] of after) {
    if (before.has(id) && before.get(id) !== progress) errors.push(`${id}: rarita'/stelle cambiate durante la partita`);
  }
  const roles = balance.teamPower.groupsBySlotRole;
  for (const entry of next.starters) {
    if (!roles[entry.slotRole]) errors.push(`${entry.card.cardId}: posto sconosciuto ${entry.slotRole}`);
  }
  return errors;
}

export function applyHalftime(state, side, nextSquad, balance) {
  const errors = halftimeErrors(state.squads[side], nextSquad, balance);
  if (errors.length) throw new Error(`Rosa non valida all'intervallo: ${errors.join("; ")}`);
  state.squads[side] = {
    starters: nextSquad.starters.map((entry) => ({ ...entry })),
    reserves: nextSquad.reserves.map((entry) => ({ ...entry })),
  };
}
