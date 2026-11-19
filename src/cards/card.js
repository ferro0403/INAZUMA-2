// Una carta = giocatore + versione. La versione e' la fonte del giocatore (una season o gli svincolati):
// Mark Evans di una season e Mark Evans di un'altra sono due carte diverse, con mosse diverse.

const SEPARATOR = ":";

export function cardIdOf(sourceId, playerId) {
  if (!sourceId || playerId === undefined || playerId === null) throw new Error("Carta senza fonte o giocatore");
  return `${sourceId}${SEPARATOR}${playerId}`;
}

export function parseCardId(cardId) {
  const index = String(cardId).indexOf(SEPARATOR);
  if (index <= 0) throw new Error(`Id carta non valido: ${cardId}`);
  return { sourceId: cardId.slice(0, index), playerId: cardId.slice(index + 1) };
}

// Dati del giocatore che servono al gioco: nessun campo legacy.
export function cardFromPlayer(sourceId, player) {
  const playerId = String(player.playerId ?? player.id);
  return {
    cardId: cardIdOf(sourceId, playerId),
    sourceId,
    playerId,
    name: player.name,
    position: player.position,
    element: player.element,
    stats: player.stats,
    moves: player.moves || [],
    portraitUrl: player.portraitUrl,
  };
}

// Tutte le carte di una fonte (season o svincolati) con le statistiche, indicizzate per cardId.
export function cardsOfSource(source) {
  const cards = source.players.filter((player) => player.stats).map((player) => cardFromPlayer(source.id, player));
  return new Map(cards.map((card) => [card.cardId, card]));
}
