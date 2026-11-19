// Vantaggio di elemento: ogni elemento del ciclo batte il successivo. Fuori dal ciclo = neutro.

export function elementBonus(actorElement, opponentElement, balance) {
  const { cycle, advantageBonus } = balance.elements;
  const actor = cycle.indexOf(actorElement);
  const opponent = cycle.indexOf(opponentElement);
  if (actor < 0 || opponent < 0 || actor === opponent) return 0;
  if ((actor + 1) % cycle.length === opponent) return advantageBonus;
  if ((opponent + 1) % cycle.length === actor) return -advantageBonus;
  return 0;
}

// Quale elemento conta per un lato dello scontro (regola in balance.elements.elementFrom).
export function sideElement(side, balance) {
  if (balance.elements.elementFrom === "move" && side.move) return side.move.element;
  return side.card.element;
}
