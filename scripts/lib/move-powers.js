// Potenze ORIGINALI delle mosse: tabella da PLAYER_MOVES_DATABASE.json + override dell'utente.
// Una mossa si riconosce da nome + tipo + elemento.

export const MAX_POWER = 100;

export const moveKey = (move) => `${move.name}|${move.type}|${move.element}`;

// Dal database grande (per id giocatore, con le sue mosse) alla tabella piccola, una riga per mossa.
// Se la stessa mossa compare piu' volte, vale l'unica potenza presente; potenze diverse = errore.
export function buildPowerTable(bigDb) {
  const byKey = new Map();
  for (const player of Object.values(bigDb)) {
    for (const move of player.moves || []) {
      if (!move.name) continue;
      const key = moveKey(move);
      const entry = byKey.get(key) || { name: move.name, type: move.type, element: move.element, rows: [] };
      entry.rows.push({ power: move.power ?? null, tension: move.tension ?? null });
      byKey.set(key, entry);
    }
  }
  const moves = [...byKey.values()].map(({ rows, ...move }) => {
    const valued = rows.filter((row) => row.power !== null);
    const powers = new Set(valued.map((row) => row.power));
    const tensions = new Set(valued.map((row) => row.tension));
    if (powers.size > 1 || tensions.size > 1) throw new Error(`${moveKey(move)}: potenze diverse nel file`);
    return { ...move, power: valued[0]?.power ?? null, tension: valued[0]?.tension ?? null };
  });
  return moves.sort((a, b) => moveKey(a).localeCompare(moveKey(b)));
}

// Restituisce (move) => { power, source } oppure null se la potenza non c'e'.
export function makePowerLookup(table, overrides) {
  const byKey = new Map(table.moves.map((move) => [moveKey(move), move]));
  return (move) => {
    if (Object.hasOwn(overrides.byName, move.name)) return { power: overrides.byName[move.name], source: "override" };
    const found = byKey.get(moveKey(move));
    return found && found.power !== null ? { power: found.power, source: "file" } : null;
  };
}

// Sostituisce power con quella originale; il vecchio valore resta in legacy.power
// (se c'e' gia' non viene toccato: rieseguire non cambia nulla).
export function applyPower(move, lookup) {
  if (!move) return move;
  const found = lookup(move);
  if (!found) throw new Error(`Potenza originale assente per ${moveKey(move)}`);
  const { legacy, roleMoves, ...rest } = move;
  const oldPower = Object.hasOwn(legacy || {}, "power") ? legacy.power : move.power;
  const updated = { ...rest, power: found.power };
  if (roleMoves) {
    updated.roleMoves = Object.fromEntries(Object.entries(roleMoves)
      .map(([role, roleMove]) => [role, applyPower(roleMove, lookup)]));
  }
  updated.legacy = { ...(legacy || {}), power: oldPower };
  return updated;
}

export function applyPowersToSeason(season, lookup) {
  return {
    ...season,
    players: season.players.map((player) => {
      const updated = { ...player, moves: player.moves.map((move) => applyPower(move, lookup)) };
      if (player.signatureMove) updated.signatureMove = applyPower(player.signatureMove, lookup);
      return updated;
    }),
  };
}
