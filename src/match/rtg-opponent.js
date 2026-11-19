// Squadra nemica di una partita principale RTG e suo adattamento alla potenza del giocatore,
// tra il minimo e il massimo della partita (data/rtg-difficulty.json).
// La formazione e gli 11 titolari vengono dai dati della season (boss o partita speciale).
import { cardFromPlayer } from "../cards/card.js";
import { adaptEnemy } from "../engine/enemy.js";
import { teamPower } from "../engine/team-power.js";

function matchEntry(season, teamId) {
  const entries = [...(season.bossOrder || []), ...(season.specialMatches || [])];
  const entry = entries.find((item) => item.teamId === teamId);
  if (!entry) throw new Error(`${season.id}: nessuna formazione per ${teamId}`);
  return entry;
}

export function opponentStarters(season, teamId) {
  const entry = matchEntry(season, teamId);
  const formationId = entry.bossFormation ?? entry.matchFormation;
  const formation = season.formations.eleven.find((item) => item.id === formationId);
  if (!formation) throw new Error(`${season.id}: formazione ${formationId} assente`);
  const players = new Map(season.players.map((player) => [String(player.playerId), player]));
  const missing = entry.startingXIPlayerIds.map((id) => players.get(String(id))).filter((player) => !player?.stats);
  if (missing.length) {
    const names = missing.map((player) => player?.name).join(", ");
    throw new Error(`${season.id}/${teamId}: giocatori senza statistiche Lv50: ${names}`);
  }
  return entry.startingXIPlayerIds.map((playerId, index) => ({
    card: cardFromPlayer(season.id, players.get(String(playerId))),
    slotRole: formation.slotRoles[index],
  }));
}

export function difficultyFor(difficulty, seasonId, teamId) {
  const row = (difficulty.seasons[seasonId] || []).find((item) => item.teamId === teamId);
  if (!row) throw new Error(`Difficolta' assente per ${seasonId}/${teamId}`);
  return row;
}

// userStarters = [{ card, slotRole, progress }]. Restituisce il lato nemico pronto per createMatch.
export function buildRtgOpponent({ season, teamId, userStarters, difficulty, balance }) {
  const starters = opponentStarters(season, teamId);
  const limits = difficultyFor(difficulty, season.id, teamId);
  const adapted = adaptEnemy(teamPower(userStarters, balance), starters, balance, limits);
  const progress = { multiplier: adapted.multiplier };
  return {
    squad: { starters: starters.map((entry) => ({ ...entry, progress })), reserves: [] },
    adapted,
    limits,
  };
}
