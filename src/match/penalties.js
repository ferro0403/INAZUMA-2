// Rigori, come nel vecchio RTG: 5 a testa poi a oltranza. Senza mosse si sceglie una direzione
// (stessa direzione = parata); solo il tiratore con mossa = gol; solo il portiere = parata;
// entrambi = scontro tiro contro parata con le mosse. Le mosse si pagano con i PT.
import { baseStrength } from "../engine/strength.js";
import { duelProbability } from "../engine/duel.js";
import { rand } from "./match-random.js";
import { otherSide } from "./sides.js";
import { affordableMoves, payMove, remainingPoints } from "./move-points.js";

export function startShootout(state) {
  state.status = "penalties";
  state.shootout = {
    first: rand(state) < 0.5 ? "user" : "opponent",
    kicks: { user: 0, opponent: 0 },
    score: { user: 0, opponent: 0 },
    directions: { user: [], opponent: [] },
    history: [],
    winner: null,
  };
}

// Tiratori: titolari dal tiro piu' forte, portiere per ultimo. Si ricomincia dal primo a oltranza.
export function penaltyTakers(state, side, balance) {
  const strength = (entry) => baseStrength(entry.card, "shot", balance);
  return state.squads[side].starters.slice()
    .sort((a, b) => (a.slotRole === "GK") - (b.slotRole === "GK") || strength(b) - strength(a)
      || a.card.cardId.localeCompare(b.card.cardId));
}

export function goalkeeperOf(state, side, balance) {
  const starters = state.squads[side].starters;
  const keeper = starters.find((entry) => entry.slotRole === "GK");
  if (keeper) return keeper;
  const save = (entry) => baseStrength(entry.card, "save", balance);
  return starters.slice().sort((a, b) => save(b) - save(a))[0];
}

// kick = { role, moveType, winProbability, shooterHistory }
function decide(state, side, entry, kick, controllers, balance) {
  const { role, moveType, winProbability, shooterHistory } = kick;
  const options = affordableMoves(state, side, entry.card, moveType);
  const context = {
    side, card: entry.card, role, moveType, options, winProbability, shooterHistory,
    remainingPoints: remainingPoints(state, side, entry.card.cardId),
    minute: balance.match.penalties.minute,
    period: "penalties",
    score: { own: state.score[side], other: state.score[otherSide(side)] },
  };
  const choice = controllers[side].choosePenalty(state, context);
  if (choice.move && !options.includes(choice.move)) throw new Error(`Mossa non disponibile: ${choice.move.name}`);
  if (!balance.match.penalties.directions.includes(choice.direction)) {
    throw new Error("Direzione del rigore non valida");
  }
  return choice;
}

function outcomeOf(shooter, keeper, shot, save, state, balance) {
  if (shot.move && !save.move) return "goal";
  if (!shot.move && save.move) return "save";
  if (shot.move && save.move) {
    const probability = duelProbability(
      { card: shooter.card, group: "shot", progress: shooter.progress, move: shot.move },
      { card: keeper.card, group: "save", progress: keeper.progress, move: save.move }, balance);
    return rand(state) * 100 < probability ? "goal" : "save";
  }
  return shot.direction === save.direction ? "save" : "goal";
}

function updateWinner(shootout, balance) {
  const n = balance.match.penalties.kicksPerSide;
  const { kicks, score } = shootout;
  if (kicks.user < n || kicks.opponent < n) {
    if (score.user > score.opponent + (n - kicks.opponent)) shootout.winner = "user";
    if (score.opponent > score.user + (n - kicks.user)) shootout.winner = "opponent";
    return;
  }
  if (kicks.user === kicks.opponent && score.user !== score.opponent) {
    shootout.winner = score.user > score.opponent ? "user" : "opponent";
  }
}

export function playKick(state, controllers, balance) {
  const shootout = state.shootout;
  const side = shootout.history.length % 2 === 0 ? shootout.first : otherSide(shootout.first);
  const defending = otherSide(side);
  const takers = penaltyTakers(state, side, balance);
  const shooter = takers[shootout.kicks[side] % takers.length];
  const keeper = goalkeeperOf(state, defending, balance);
  const plain = duelProbability({ card: shooter.card, group: "shot", progress: shooter.progress },
    { card: keeper.card, group: "save", progress: keeper.progress }, balance);
  const history = shootout.directions[side];
  const shotKick = { role: "shooter", moveType: "shot", winProbability: plain, shooterHistory: history };
  const saveKick = { role: "keeper", moveType: "save", winProbability: 100 - plain, shooterHistory: history };
  const shot = decide(state, side, shooter, shotKick, controllers, balance);
  const save = decide(state, defending, keeper, saveKick, controllers, balance);
  if (shot.move) payMove(state, side, shooter.card.cardId, shot.move);
  if (save.move) payMove(state, defending, keeper.card.cardId, save.move);
  const outcome = outcomeOf(shooter, keeper, shot, save, state, balance);
  shootout.kicks[side] += 1;
  if (outcome === "goal") shootout.score[side] += 1;
  shootout.directions[side].push(shot.direction);
  shootout.history.push({ side, shooterCardId: shooter.card.cardId, keeperCardId: keeper.card.cardId,
    shooterMove: shot.move?.name ?? null, keeperMove: save.move?.name ?? null, outcome });
  updateWinner(shootout, balance);
  if (!shootout.winner && shootout.history.length >= balance.match.penalties.maxKicks) {
    shootout.winner = rand(state) < 0.5 ? "user" : "opponent";
  }
}
