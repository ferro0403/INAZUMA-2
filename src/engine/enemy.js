// Adattamento del nemico: insegue la potenza del giocatore, sempre tra un minimo e un massimo
// ricavati dalla squadra nemica stessa. Il giocatore non viene mai bloccato: se e' fortissimo,
// il nemico si ferma al massimo; se e' debole, al minimo.
import { teamPower, playerPowerParts } from "./team-power.js";

// Moltiplicatore delle statistiche che porta la squadra esattamente alla potenza voluta.
export function multiplierForPower(starters, targetPower, balance) {
  const count = starters.length;
  const parts = starters.map((starter) => playerPowerParts(starter, balance, 1));
  const statsPart = parts.reduce((sum, part) => sum + part.stats, 0) / count;
  const movesPart = parts.reduce((sum, part) => sum + part.moves, 0) / count;
  return (targetPower - movesPart) / statsPart;
}

// limits = { minMultiplier, maxMultiplier } della partita; se manca valgono quelli di balance.enemy.
export function enemyRange(enemyStarters, balance, limits = balance.enemy) {
  const base = teamPower(enemyStarters, balance, 1);
  return { base, min: base * limits.minMultiplier, max: base * limits.maxMultiplier };
}

// Restituisce la potenza del nemico e il moltiplicatore da dare alle sue statistiche per ottenerla.
export function adaptEnemy(playerTeamPower, enemyStarters, balance, limits = balance.enemy) {
  const range = enemyRange(enemyStarters, balance, limits);
  const wanted = playerTeamPower * balance.enemy.followRatio;
  const targetPower = Math.min(range.max, Math.max(range.min, wanted));
  const multiplier = multiplierForPower(enemyStarters, targetPower, balance);
  return { ...range, wanted, targetPower, multiplier, power: teamPower(enemyStarters, balance, multiplier) };
}
