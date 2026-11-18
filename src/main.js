// Punto di ingresso. Tappa 1: mostra solo un riepilogo dei dati importati.
import { loadAllSeasons } from "./data/load-data.js";

function seasonCard(season) {
  const template = document.querySelector("#season-card");
  const card = template.content.cloneNode(true);
  card.querySelector("[data-field=name]").textContent = season.name;
  card.querySelector("[data-field=players]").textContent = season.players.length;
  card.querySelector("[data-field=teams]").textContent = (season.teams || []).length;
  card.querySelector("[data-field=bosses]").textContent = (season.bossOrder || []).length;
  return card;
}

async function start() {
  const list = document.querySelector("#seasons");
  const status = document.querySelector("#status");
  try {
    const { seasons } = await loadAllSeasons();
    seasons.forEach((season) => list.append(seasonCard(season)));
    status.textContent = `${seasons.length} season caricate.`;
  } catch (error) {
    status.textContent = `Errore: ${error.message}`;
  }
}

start();
