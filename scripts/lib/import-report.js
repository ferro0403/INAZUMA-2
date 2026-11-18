// Raccoglie i risultati dell'importazione e scrive docs/import-report.md (in italiano).
import fs from "node:fs";
import { missingStatsReason } from "./player-enrich.js";

const IMPORTANCE_LABELS = ["comune", "conosciuto", "protagonista"];

function countBy(items, keyOf) {
  const counts = {};
  for (const item of items) {
    const key = keyOf(item);
    counts[key] = (counts[key] || 0) + 1;
  }
  return counts;
}

function summarizeSource(source, statsDb) {
  const players = source.players;
  return {
    id: source.id,
    name: source.name,
    players: players.length,
    teams: (source.teams || []).length,
    bosses: (source.bossOrder || []).length,
    specialMatches: (source.specialMatches || []).length,
    profiles: (source.profiles || []).length,
    missingStats: players.filter((p) => !p.stats).map((p) => ({
      source: source.id, playerId: String(p.playerId), name: p.name, reason: missingStatsReason(p.playerId, statsDb),
    })),
    missingMoves: players.filter((p) => p.moves.length === 0).map((p) => ({ playerId: String(p.playerId), name: p.name })),
    movesInherited: countBy(players.filter((p) => p.movesFromSeason), (p) => p.movesFromSeason),
    movesPerPlayer: countBy(players, (p) => p.moves.length),
    importance: countBy(players, (p) => IMPORTANCE_LABELS[p.importance]),
    elements: countBy(players, (p) => p.element),
  };
}

export function collectFindings(seasons, freeAgents, statsDb) {
  const sources = [...seasons, freeAgents].map((source) => summarizeSource(source, statsDb));
  return { sources, missingStats: sources.flatMap((source) => source.missingStats) };
}

const formatCounts = (counts) => Object.entries(counts).map(([key, value]) => `${key}: ${value}`).join(", ") || "-";

function sourceSection(source) {
  const lines = [`### ${source.name} (\`${source.id}\`)`, ""];
  lines.push(`- Giocatori: **${source.players}**, squadre: **${source.teams}**, boss: ${source.bosses}, ` +
    `partite speciali: ${source.specialMatches}, profili: ${source.profiles}`);
  lines.push(`- Importanza: ${formatCounts(source.importance)}`);
  lines.push(`- Mosse per giocatore (numero: giocatori): ${formatCounts(source.movesPerPlayer)}`);
  if (Object.keys(source.movesInherited).length) {
    lines.push(`- Mosse prese da una season precedente (come nel vecchio gioco): ${formatCounts(source.movesInherited)}`);
  }
  lines.push(`- Elementi scritti nei dati: ${formatCounts(source.elements)}`);
  const missing = source.missingStats.map((p) => `${p.name} (${p.playerId})`).join(", ");
  lines.push(`- Senza statistiche Lv50: ${missing || "nessuno"}`);
  if (source.missingMoves.length > 40) {
    lines.push(`- Senza mosse: **${source.missingMoves.length}** giocatori (tutti, elenco nei dati)`);
  } else {
    const names = source.missingMoves.map((p) => `${p.name} (${p.playerId})`).join(", ");
    lines.push(`- Senza mosse: ${names || "nessuno"}`);
  }
  return [...lines, ""].join("\n");
}

export function writeReport(file, { findings, config, commit }) {
  const notImported = config.notImported.map((item) => `- \`${item.path}\`: ${item.reason}`).join("\n");
  const text = [
    "# Report importazione dal vecchio repo",
    "",
    `Generato da \`scripts/import-from-old-repo.js\` dal commit \`${commit}\` di ${config.oldRepoName}.`,
    "Non modificare a mano: si rigenera a ogni importazione.",
    "",
    "## Per season",
    "",
    ...findings.sources.map(sourceSection),
    "## Non importato",
    "",
    notImported,
    "",
  ].join("\n");
  fs.writeFileSync(file, text, "utf8");
}
