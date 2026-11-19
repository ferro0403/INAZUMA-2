// Confronto con il vecchio repo: i dati importati, rimettendo i campi `legacy` al loro posto
// e togliendo i campi nuovi, devono essere IDENTICI a quelli originali (link compresi).
import { isDeepStrictEqual } from "node:util";
import { readFourMoves, readRtgConfig } from "./old-repo.js";
import { makePowerLookup, moveKey } from "./move-powers.js";

export const ADDED_PLAYER_FIELDS = ["stats", "importance", "importanceSource", "moves", "movesFromSeason",
  "signatureMove", "signatureMoveInherited"];

export function mergeLegacy(value) {
  if (Array.isArray(value)) return value.map(mergeLegacy);
  if (!value || typeof value !== "object") return value;
  const { legacy, ...rest } = value;
  const out = Object.fromEntries(Object.entries(rest).map(([key, item]) => [key, mergeLegacy(item)]));
  return { ...out, ...(legacy || {}) };
}

function restorePlayer(player) {
  const copy = { ...player };
  for (const field of ADDED_PLAYER_FIELDS) delete copy[field];
  return mergeLegacy(copy);
}

export function restoreSeason(season) {
  const { schemaVersion, id, name, displaySeasonNumber, albumCollectionId, importedFrom, displayTeamNames,
    rtg, players, legacy, ...body } = season;
  return { ...mergeLegacy(body), ...legacy, players: players.map(restorePlayer) };
}

export function restoreFreeAgents(freeAgents) {
  const { teams, players, legacy } = freeAgents;
  return { ...legacy, teams: mergeLegacy(teams), players: players.map(restorePlayer) };
}

// Primo punto in cui due valori differiscono (per messaggi leggibili).
export function firstDifference(a, b, path = "") {
  if (isDeepStrictEqual(a, b)) return null;
  if (a && b && typeof a === "object" && typeof b === "object" && Array.isArray(a) === Array.isArray(b)) {
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    for (const key of keys) {
      const diff = firstDifference(a[key], b[key], `${path}.${key}`);
      if (diff) return diff;
    }
  }
  return `${path || "(radice)"}: ${JSON.stringify(a)?.slice(0, 120)} != ${JSON.stringify(b)?.slice(0, 120)}`;
}

export function collectUrls(value, out = []) {
  if (typeof value === "string" && /^https?:\/\//.test(value)) out.push(value);
  else if (value && typeof value === "object") Object.values(value).forEach((item) => collectUrls(item, out));
  return out;
}

function sameMultiset(a, b) {
  return isDeepStrictEqual([...a].sort(), [...b].sort());
}

function checkSeason(season, entry, old, shared, errors, expected) {
  const { rtg, fourMoves, config, lookup } = shared;
  const oldDb = old.json(entry.database);
  const label = season.id;
  const oldOrder = oldDb.bossOrder.map((boss) => boss.teamId);
  if (!isDeepStrictEqual(season.bossOrder.map((boss) => boss.teamId), oldOrder)) {
    errors.push(`${label}: ordine boss diverso dal vecchio`);
  }
  const { rtg: _rtg, ...withoutRtg } = season;
  if (!sameMultiset(collectUrls(withoutRtg), collectUrls(oldDb))) errors.push(`${label}: link immagini cambiati`);
  const diff = firstDifference(restoreSeason(season), oldDb);
  if (diff) errors.push(`${label}: dati diversi dal vecchio in ${diff}`);
  const rtgDiff = firstDifference({ ...mergeLegacy(season.rtg), seasonId: season.id }, rtg.seasons[season.id]);
  if (rtgDiff) errors.push(`${label}: configurazione RTG diversa dal vecchio in ${rtgDiff}`);
  checkMoves(season, old.json(entry.signatureMoves), fourMoves, config, { errors, expected, lookup });
}

function* movesWithRoles(moves) {
  for (const move of moves) {
    if (!move) continue;
    yield move;
    yield* Object.values(move.roleMoves || {});
  }
}

// Potenze cambiate rispetto al vecchio: attese solo se uguali a quelle originali (tabella o override).
function checkPowers(label, moves, ctx) {
  for (const move of movesWithRoles(moves)) {
    const original = ctx.lookup(move);
    if (!original || move.power !== original.power) {
      ctx.errors.push(`${label}: ${moveKey(move)} ha potenza ${move.power}, attesa ${original?.power}`);
    } else if (move.legacy?.power !== move.power) {
      ctx.expected.push(`${label}: ${moveKey(move)} ${move.legacy?.power} -> ${move.power}`);
    }
  }
}

// Stesse mosse del vecchio gioco (nome, tipo, elemento, ordine); solo la potenza puo' cambiare.
function checkMoves(season, catalog, fourMoves, config, ctx) {
  const order = config.fourMoves.fallbackOrder[season.id];
  for (const player of season.players) {
    const id = String(player.playerId);
    const from = order.find((sourceId) => fourMoves.s[sourceId]?.[id]);
    const expected = (from ? fourMoves.s[from][id] : []).map((index) => {
      const [name, type, element, power] = fourMoves.d[index];
      return { name, type, element, power };
    });
    const label = `${season.id}/${id}`;
    if (!isDeepStrictEqual(mergeLegacy(player.moves), expected)) ctx.errors.push(`${label}: mosse diverse dal vecchio`);
    const signature = catalog.players?.[id] ?? catalog.inheritedPlayers?.[id] ?? null;
    if (!isDeepStrictEqual(mergeLegacy(player.signatureMove ?? null), signature)) {
      ctx.errors.push(`${label}: mossa singola diversa`);
    }
    checkPowers(label, [...player.moves, player.signatureMove], ctx);
  }
}

// Restituisce { errors, expected }: expected = potenze cambiate come previsto (non sono errori).
export function checkParity(bundle, old, config) {
  const errors = [];
  const expected = [];
  const lookup = makePowerLookup(bundle.movePowers, bundle.movePowerOverrides);
  const rtg = readRtgConfig(old, config.rtgConfig);
  const fourMoves = readFourMoves(old, config.fourMoves);
  const importedIds = bundle.seasons.map((season) => season.id);
  if (!isDeepStrictEqual(importedIds, config.seasons.map((entry) => entry.id))) {
    errors.push(`season importate (${importedIds}) diverse da quelle attese`);
  }
  for (const entry of config.seasons) {
    const season = bundle.seasons.find((item) => item.id === entry.id);
    if (season) checkSeason(season, entry, old, { rtg, fourMoves, config, lookup }, errors, expected);
  }
  const oldFreeAgents = old.json(config.freeAgents.file);
  const faDiff = firstDifference(restoreFreeAgents(bundle.freeAgents), oldFreeAgents);
  if (faDiff) errors.push(`svincolati diversi dal vecchio in ${faDiff}`);
  const { schemaVersion, importedFrom, ...visuals } = bundle.playerVisuals;
  const visualsDiff = firstDifference(visuals, old.json(config.playerVisuals));
  if (visualsDiff) errors.push(`player-visuals diverso dal vecchio in ${visualsDiff}`);
  for (const name of config.rtgConfig.constants) {
    if (!isDeepStrictEqual(bundle.rtgCampaign[name], rtg.constants[name])) errors.push(`rtg-campaign: ${name} diverso`);
  }
  return { errors, expected };
}
