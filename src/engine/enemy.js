// Adattamento del nemico: insegue la potenza del giocatore, sempre tra un minimo e un massimo
// ricavati dalla squadra nemica stessa. Il giocatore non viene mai bloccato: se e' fortissimo,
// il nemico si ferma al massimo; se e' debole, al minimo.
import { teamPower, playerPowerParts } from "./team-power.js";

// Potenza base del nemico = rarita' piu' bassa, 0 stelle (moltiplicatore 1).
export function enemyRange(enemyStarters, balance) {
  const base = teamPower(enemyStarters, balance, 1);
  return { base, min: base * balance.enemy.minMultiplier, max: base * balance.enemy.maxMultiplier };
}

// Restituisce la potenza del nemico e il moltiplicatore da dare alle sue statistiche per ottenerla.
export function adaptEnemy(playerTeamPower, enemyStarters, balance) {
  const range = enemyRange(enemyStarters, balance);
  const wanted = playerTeamPower * balance.enemy.followRatio;
  const targetPower = Math.min(range.max, Math.max(range.min, wanted));
  const count = enemyStarters.length;
  const parts = enemyStarters.map((starter) => playerPowerParts(starter, balance, 1));
  const statsPart = parts.reduce((sum, part) => sum + part.stats, 0) / count;
  const movesPart = parts.reduce((sum, part) => sum + part.moves, 0) / count;
  const multiplier = (targetPower - movesPart) / statsPart;
  return { ...range, wanted, targetPower, multiplier, power: teamPower(enemyStarters, balance, multiplier) };
}
