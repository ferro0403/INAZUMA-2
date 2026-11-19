// Aggiunge ai giocatori i dati del nuovo gioco: 7 statistiche Lv50, importanza, mosse.

export function statsFor(playerId, statsDb) {
  const values = statsDb.byPlayerId[String(playerId)];
  if (!Array.isArray(values) || values.length !== statsDb.fields.length) return null;
  if (!values.every((value) => Number.isFinite(value))) return null;
  return Object.fromEntries(statsDb.fields.map((field, index) => [field, values[index]]));
}

export function missingStatsReason(playerId, statsDb) {
  const unavailable = (statsDb.unavailable || []).find((entry) => String(entry.id) === String(playerId));
  if (unavailable) return `nel file Lv50 senza valori (${unavailable.reason})`;
  return "id non presente nel file Lv50";
}

function fromCategory(category, rules) {
  return Object.hasOwn(rules.byCategory, category) ? rules.byCategory[category] : null;
}

function fromFinalOverall(finalOverall, rules) {
  if (!Number.isFinite(finalOverall)) return null;
  const step = rules.byFinalOverall.find((entry) => finalOverall >= entry.atLeast);
  return step ? step.importance : null;
}

// Restituisce { importance, importanceSource } leggendo player.legacy.
export function computeImportance(player, sourceId, rules, overrides) {
  const id = String(player.playerId ?? player.id);
  const seasonKey = `${sourceId}/${id}`;
  if (Object.hasOwn(overrides.seasonPlayers || {}, seasonKey)) {
    return { importance: overrides.seasonPlayers[seasonKey], importanceSource: "override" };
  }
  if (Object.hasOwn(overrides.players || {}, id)) {
    return { importance: overrides.players[id], importanceSource: "override" };
  }
  const legacy = player.legacy || {};
  const candidates = [fromCategory(legacy.category, rules), fromFinalOverall(legacy.finalOverall, rules)];
  const known = candidates.filter((value) => value !== null);
  return { importance: known.length ? Math.max(...known) : 0, importanceSource: "rule" };
}

// Mosse 2-4 (vecchia RTG). Se la season non le ha, si guarda nelle season di fallback, in ordine.
export function fourMovesFor(playerId, fallbackOrder, fourMoves) {
  const key = String(playerId);
  for (const sourceSeason of fallbackOrder || []) {
    const indices = fourMoves.s[sourceSeason]?.[key];
    if (!indices) continue;
    const moves = indices.map((index) => {
      const [name, type, element, power] = fourMoves.d[index];
      return { name, type, element, power };
    });
    return { moves, sourceSeason };
  }
  return { moves: [], sourceSeason: null };
}

// Mossa singola (vecchia run classica), da data/<SEASON>_moves.json.
export function signatureMoveFor(playerId, catalog) {
  const key = String(playerId);
  if (catalog?.players?.[key]) return { move: catalog.players[key], inherited: false };
  if (catalog?.inheritedPlayers?.[key]) return { move: catalog.inheritedPlayers[key], inherited: true };
  return { move: null, inherited: false };
}
