// Progressi di una carta (rarita' e stelle) -> moltiplicatore delle statistiche.
// I progressi non stanno nei dati dei giocatori: il chiamante li passa come { rarity, stars }.

export const BASE_PROGRESS = Object.freeze({ rarity: null, stars: 0 });

export function rarityList(balance) {
  return balance.rarities.list;
}

export function findRarity(rarityId, balance) {
  const list = rarityList(balance);
  if (rarityId === null || rarityId === undefined) return list[0];
  const rarity = list.find((item) => item.id === rarityId);
  if (!rarity) throw new Error(`Rarita' sconosciuta: ${rarityId}`);
  return rarity;
}

export function checkStars(stars, balance) {
  const value = stars ?? 0;
  if (!Number.isInteger(value) || value < 0 || value > balance.stars.max) {
    throw new Error(`Stelle non valide: ${stars} (da 0 a ${balance.stars.max})`);
  }
  return value;
}

// Rarita' e stelle si sommano: 1 + bonus rarita' + stelle * bonus per stella.
export function progressMultiplier(progress, balance) {
  const rarity = findRarity(progress?.rarity, balance);
  const stars = checkStars(progress?.stars, balance);
  return 1 + rarity.bonus + stars * balance.stars.bonusPerStar;
}
