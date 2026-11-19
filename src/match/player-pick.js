// Scelta del giocatore che prende parte a uno scontro, come nel vecchio RTG:
// peso per ruolo del posto, un po' per la forza, meno se ha giocato da poco o spesso.
// Dopo un dribbling vinto tira lo stesso giocatore. Nessun vincolo di ruolo: il ruolo e' quello del posto.
import { baseStrength } from "../engine/strength.js";
import { weightedPick } from "./match-random.js";

function roleWeight(pickKind, slotRole, balance) {
  return balance.match.roleWeights[pickKind]?.[slotRole] ?? 0;
}

function continuationShooter(state, side, zoneRules) {
  if (zoneRules.actorPick !== "shot") return null;
  const last = state.log.at(-1);
  if (!last || last.zone !== "attack" || !last.actorWon || last.actorSide !== side) return null;
  return state.squads[side].starters.find((entry) => entry.card.cardId === last.actorCardId) || null;
}

function candidatePool(state, side, pickKind, balance) {
  const starters = state.squads[side].starters;
  let candidates = starters.filter((entry) => roleWeight(pickKind, entry.slotRole, balance) > 0);
  if (!candidates.length) candidates = starters.filter((entry) => entry.slotRole !== "GK");
  if (!candidates.length) candidates = starters.slice();
  const rules = balance.match.playerPick;
  const history = state.history[side];
  const recent = new Set(history.slice(-rules.excludeLastN));
  const fresh = candidates.filter((entry) => !recent.has(entry.card.cardId));
  if (fresh.length >= rules.minFreshCandidates) return fresh;
  const last = history.at(-1);
  const notRepeated = candidates.length > 1 ? candidates.filter((entry) => entry.card.cardId !== last) : candidates;
  return notRepeated.length ? notRepeated : candidates;
}

function pickWeight(state, side, entry, pickKind, group, balance) {
  const rules = balance.match.playerPick;
  const id = entry.card.cardId;
  const role = Math.max(rules.minWeight, roleWeight(pickKind, entry.slotRole, balance));
  const strength = rules.strengthBase + Math.min(rules.strengthCap, baseStrength(entry.card, group, balance))
    / rules.strengthDivisor;
  const history = state.history[side];
  const index = history.lastIndexOf(id);
  const distance = index < 0 ? Infinity : history.length - index;
  const recency = rules.recencyByDistance[distance - 1] ?? 1;
  const usage = 1 / (1 + (state.appearances[side][id] || 0) * rules.usagePenalty);
  return Math.max(rules.minWeight, role * strength * recency * usage);
}

// role = "actor" o "opponent": decide quale pesi e gruppo della zona usare.
export function pickPlayer(state, side, zoneRules, role, balance) {
  const pickKind = zoneRules[`${role}Pick`];
  const group = zoneRules[`${role}Group`];
  if (role === "actor") {
    const shooter = continuationShooter(state, side, zoneRules);
    if (shooter) return shooter;
  }
  const pool = candidatePool(state, side, pickKind, balance);
  return weightedPick(state, pool, (entry) => pickWeight(state, side, entry, pickKind, group, balance));
}

export function recordAppearance(state, side, cardId, balance) {
  state.history[side] = [...state.history[side], cardId].slice(-balance.match.playerPick.historyLength);
  state.appearances[side][cardId] = (state.appearances[side][cardId] || 0) + 1;
}
