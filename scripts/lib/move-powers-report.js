// Report in italiano sul cambio delle potenze: si calcola dai dati (power nuova vs legacy.power).
import fs from "node:fs";
import { moveKey } from "./move-powers.js";

function* allMoves(season) {
  for (const player of season.players) {
    yield* player.moves;
    const signature = player.signatureMove;
    if (!signature) continue;
    yield signature;
    yield* Object.values(signature.roleMoves || {});
  }
}

export function collectPowerFindings(seasons, table, overrides) {
  const distinct = new Map();
  let slots = 0;
  for (const season of seasons) {
    for (const move of allMoves(season)) {
      slots += 1;
      const key = moveKey(move);
      const entry = distinct.get(key) || { key, name: move.name, now: move.power, before: new Set(), slots: 0 };
      entry.before.add(move.legacy?.power ?? null);
      entry.slots += 1;
      distinct.set(key, entry);
    }
  }
  const moves = [...distinct.values()];
  const fromOverride = moves.filter((move) => Object.hasOwn(overrides.byName, move.name));
  const fromFile = moves.filter((move) => !Object.hasOwn(overrides.byName, move.name));
  const same = fromFile.filter((move) => move.before.size === 1 && move.before.has(move.now));
  const changed = fromFile.filter((move) => !same.includes(move));
  const unusedWithoutPower = table.moves
    .filter((move) => move.power === null && !distinct.has(moveKey(move)) && !Object.hasOwn(overrides.byName, move.name));
  return { slots, distinct: moves.length, same, changed, fromOverride, unusedWithoutPower };
}

const describe = (move) => `${move.name} (${move.key.split("|").slice(1).join(", ")}): ` +
  `${[...move.before].map((power) => power ?? "nessuna").join("/")} → ${move.now}`;

export function writePowerReport(file, findings, source) {
  const examples = findings.changed.slice().sort((a, b) => b.slots - a.slots).slice(0, 5);
  const unused = findings.unusedWithoutPower.map((move) => `${move.name} (${move.type}, ${move.element})`);
  const text = [
    "# Report potenze originali delle mosse",
    "",
    `Generato da \`scripts/apply-move-powers.js\` (fonte: \`${source}\`, tabella in \`data/move-powers.json\`).`,
    "Non modificare a mano: si rigenera. Il vecchio valore di ogni mossa resta in `legacy.power`.",
    "",
    "## In breve",
    "",
    `- Mosse diverse usate dai giocatori (nome + tipo + elemento): **${findings.distinct}** ` +
      `(${findings.slots} mosse in totale contando ogni giocatore, mossa singola e varianti per ruolo).`,
    `- Potenza uguale a prima: **${findings.same.length}**`,
    `- Potenza cambiata: **${findings.changed.length}**`,
    `- Senza potenza nel file, messe a mano dall'utente (\`data/move-power-overrides.json\`): ` +
      `**${findings.fromOverride.length}** (${findings.fromOverride.map(describe).join("; ")})`,
    "",
    "## Esempi di potenze cambiate (le piu' usate)",
    "",
    ...examples.map((move) => `- ${describe(move)}`),
    "",
    `## Mosse senza potenza nel file che nessun giocatore usa (${unused.length})`,
    "",
    "Non servono ora e non hanno ricevuto nessun valore.",
    "",
    unused.join(", "),
    "",
    "## Cosa non e' stato fatto",
    "",
    "- Le mosse del file senza nome inglese non sono nella tabella: non si possono cercare per nome.",
    "- Cambia solo `power`. Gli altri campi della mossa singola (`signatureMove`), come `tension`,",
    "  restano quelli del vecchio gioco.",
    "",
  ].join("\n");
  fs.writeFileSync(file, text, "utf8");
}
