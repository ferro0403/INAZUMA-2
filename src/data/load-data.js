// Caricamento dei dati nel browser. Tutto parte da data/seasons/index.json:
// nessun id di season e' scritto nel codice.

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Impossibile caricare ${url} (${response.status})`);
  return response.json();
}

export function loadIndex() {
  return fetchJson("data/seasons/index.json");
}

export function loadSeason(entry) {
  return fetchJson(entry.file);
}

export async function loadAllSeasons() {
  const index = await loadIndex();
  const seasons = await Promise.all(index.seasons.map(loadSeason));
  return { index, seasons };
}
