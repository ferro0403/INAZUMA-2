// Trasforma un database season del vecchio gioco nel formato del nuovo:
// stessi dati, campi del vecchio sistema spostati in `legacy`, piu' stat Lv50, importanza e mosse.
import { splitLegacy, takeKeys } from "./legacy.js";
import { computeImportance, fourMovesFor, signatureMoveFor, statsFor } from "./player-enrich.js";

export const SCHEMA_VERSION = 1;

function withoutLegacy(object) {
  const { legacy, ...rest } = object;
  return { rest, legacy };
}

// ctx: { sourceId, isLegacyKey, statsDb, importanceRules, importanceOverrides,
//        fourMoves, fallbackOrder, signatureCatalog }
export function buildPlayer(oldPlayer, ctx) {
  const id = String(oldPlayer.playerId ?? oldPlayer.id);
  const { rest, legacy } = withoutLegacy(splitLegacy(oldPlayer, ctx.isLegacyKey));
  const stats = statsFor(id, ctx.statsDb);
  const importance = computeImportance({ ...rest, legacy }, ctx.sourceId, ctx.importanceRules,
    ctx.importanceOverrides);
  const four = ctx.fourMoves ? fourMovesFor(id, ctx.fallbackOrder, ctx.fourMoves) : { moves: [] };
  const signature = signatureMoveFor(id, ctx.signatureCatalog);
  const player = { ...rest, stats, ...importance, moves: four.moves };
  if (four.sourceSeason && four.sourceSeason !== ctx.sourceId) player.movesFromSeason = four.sourceSeason;
  if (ctx.signatureCatalog) player.signatureMove = signature.move;
  if (signature.inherited) player.signatureMoveInherited = true;
  if (legacy) player.legacy = legacy;
  return player;
}

export function buildSeason(oldDb, display, ctx, extras) {
  const { taken: meta, rest } = takeKeys(oldDb, ctx.metaKeysToLegacy);
  const { players = [], ...structure } = rest;
  const body = splitLegacy(structure, ctx.isLegacyKey);
  const { rest: bodyRest, legacy: bodyLegacy } = withoutLegacy(body);
  const season = {
    schemaVersion: SCHEMA_VERSION,
    id: display.id,
    name: display.name,
    displaySeasonNumber: display.displaySeasonNumber,
    albumCollectionId: display.albumCollectionId,
    importedFrom: extras.importedFrom,
    ...bodyRest,
    displayTeamNames: extras.displayTeamNames || {},
    players: players.map((player) => buildPlayer(player, ctx)),
    rtg: extras.rtg ? buildRtgBlock(extras.rtg, ctx) : null,
    legacy: { ...meta, ...(bodyLegacy || {}) },
  };
  return season;
}

function buildRtgBlock(rtgSeason, ctx) {
  const { seasonId, ...rest } = rtgSeason;
  return splitLegacy(rest, ctx.isLegacyKey);
}

export function buildFreeAgents(oldDb, ctx, importedFrom) {
  const { players = [], teams = [], ...meta } = oldDb;
  return {
    schemaVersion: SCHEMA_VERSION,
    id: ctx.sourceId,
    name: "Svincolati",
    importedFrom,
    teams: splitLegacy(teams, ctx.isLegacyKey),
    players: players.map((player) => buildPlayer(player, ctx)),
    legacy: meta,
  };
}
