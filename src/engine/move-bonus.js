// Bonus di una mossa: lineare dalla potenza minima alla massima (fuori da questo intervallo resta al limite).

export function moveBonus(move, balance) {
  if (!move) return 0;
  const { minPower, bonusAtMinPower, maxPower, bonusAtMaxPower } = balance.moveBonus;
  const power = Math.min(maxPower, Math.max(minPower, move.power));
  const slope = (bonusAtMaxPower - bonusAtMinPower) / (maxPower - minPower);
  return bonusAtMinPower + (power - minPower) * slope;
}
