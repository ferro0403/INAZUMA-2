// Lati della partita e accesso alle rose.

export const SIDES = Object.freeze(["user", "opponent"]);
export const otherSide = (side) => (side === "user" ? "opponent" : "user");

export function allEntries(state, side) {
  return [...state.squads[side].starters, ...state.squads[side].reserves];
}
