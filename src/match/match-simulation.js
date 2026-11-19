// Partite IA contro IA per la taratura: stessa rosa da entrambe le parti, l'avversario con le statistiche
// moltiplicate per arrivare a una potenza piu' alta di una percentuale data. Riproducibile con il seme.
import { createRandom } from "../engine/random.js";
import { multiplierForPower } from "../engine/enemy.js";
import { teamPower } from "../engine/team-power.js";
import { createMatch } from "./match-state.js";
import { playMatch } from "./match-flow.js";
import { createAiController } from "./ai-policy.js";

const NORMAL = Object.freeze({ rarity: null, stars: 0 });

// Rosa casuale: per ogni posto della formazione una carta di quel ruolo, poi le riserve.
export function randomSquad(cards, slotRoles, reserves, random) {
  const used = new Set();
  const take = (filter) => {
    const pool = cards.filter((card) => !used.has(card.cardId) && filter(card));
    const card = pool[Math.floor(random() * pool.length)];
    used.add(card.cardId);
    return card;
  };
  const starters = slotRoles
    .map((slotRole) => ({ card: take((c) => c.position === slotRole), slotRole, progress: NORMAL }));
  const bench = Array.from({ length: reserves }, () => ({ card: take(() => true), progress: NORMAL }));
  return { starters, reserves: bench };
}

function strongerCopy(squad, extra, balance) {
  const target = teamPower(squad.starters, balance) * (1 + extra);
  const progress = { multiplier: multiplierForPower(squad.starters, target, balance) };
  return {
    starters: squad.starters.map((entry) => ({ ...entry, progress })),
    reserves: squad.reserves.map((entry) => ({ ...entry, progress })),
  };
}

// Gioca `matches` partite: "opponent" ha potenza +extra rispetto a "user". Restituisce le statistiche.
export function simulateMatches({ cards, slotRoles, extra, matches, seed, balance }) {
  const random = createRandom(seed);
  const ai = createAiController(balance);
  const controllers = { user: ai, opponent: ai };
  const totals = { strongerWins: 0, weakerWins: 0, drawsAfterRegulation: 0, extraTime: 0, penalties: 0, goals: 0 };
  const actions = [];
  for (let i = 0; i < matches; i += 1) {
    const user = randomSquad(cards, slotRoles, balance.squad.maxReserves, random);
    const opponent = strongerCopy(user, extra, balance);
    const state = playMatch(createMatch({ seed: `${seed}:${i}`, user, opponent, balance }), controllers, balance);
    if (state.result.winner === "opponent") totals.strongerWins += 1;
    else totals.weakerWins += 1;
    if (state.result.decidedBy !== "regulation") totals.drawsAfterRegulation += 1;
    if (state.result.decidedBy === "extra_time") totals.extraTime += 1;
    if (state.result.decidedBy === "penalties") totals.penalties += 1;
    totals.goals += state.score.user + state.score.opponent;
    actions.push(state.log.length);
  }
  const pct = (value) => (value / matches) * 100;
  return {
    extra,
    strongerWinRate: pct(totals.strongerWins),
    weakerWinRate: pct(totals.weakerWins),
    drawRate: pct(totals.drawsAfterRegulation),
    extraTimeRate: pct(totals.extraTime),
    penaltiesRate: pct(totals.penalties),
    goalsPerMatch: totals.goals / matches,
    actions: {
      average: actions.reduce((a, b) => a + b, 0) / matches,
      min: Math.min(...actions),
      max: Math.max(...actions),
    },
  };
}
