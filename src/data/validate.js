// Controlli sui dati del gioco. Funzioni pure: girano sia in Node (validatore, test) sia nel browser.

const PLAYER_REF_KEY = /^(playerId|.*PlayerIds|playerIds|guaranteedPlayerId)$/;
const PROFILE_REF_KEY = /^(profileId|.*ProfileIds|profileIds|.*ProfileId)$/;
const STRICT_SECTIONS = new Set(["teams", "bossOrder", "specialMatches", "profiles", "profileUpgradePaths"]);
const MAX_MOVES = 4;

const SKIPPED_KEYS = new Set(["legacy", "identityModel"]);
const idOf = (item) => String(item?.playerId ?? item?.id ?? "");
const teamIdOf = (item) => String(item?.teamId ?? item?.id ?? "");
const profileIdOf = (item) => String(item?.profileId ?? item?.id ?? "");

function duplicates(list) {
  const seen = new Set();
  const dups = new Set();
  for (const value of list) (seen.has(value) ? dups : seen).add(value);
  return [...dups];
}

// null = "nessun riferimento" (es. premio senza giocatore garantito): non e' un errore.
function asList(value) {
  return (Array.isArray(value) ? value : [value]).filter((item) => item !== null);
}

// Visita tutto tranne i blocchi `legacy` (e le descrizioni testuali) e chiama visit(key, value, path).
function walk(value, path, visit) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => walk(item, `${path}[${index}]`, visit));
    return;
  }
  if (!value || typeof value !== "object") return;
  for (const [key, item] of Object.entries(value)) {
    if (SKIPPED_KEYS.has(key)) continue;
    visit(key, item, `${path}.${key}`);
    walk(item, `${path}.${key}`, visit);
  }
}

function checkUnique(source, errors) {
  const groups = {
    players: source.players.map(idOf),
    teams: (source.teams || []).map(teamIdOf),
    profiles: (source.profiles || []).map(profileIdOf),
  };
  for (const [name, ids] of Object.entries(groups)) {
    for (const dup of duplicates(ids)) errors.push(`${source.id}: id duplicato in ${name}: ${dup}`);
  }
}

function checkStats(source, ctx, errors) {
  for (const player of source.players) {
    const key = `${source.id}/${idOf(player)}`;
    if (player.stats === null) {
      if (!ctx.statsMissing.has(key)) errors.push(`${key}: statistiche mancanti e non elencate in stats-missing`);
      continue;
    }
    const fields = Object.keys(player.stats || {});
    const sameFields = fields.join() === ctx.statFields.join();
    const numeric = fields.every((field) => Number.isFinite(player.stats[field]));
    if (!sameFields || !numeric) errors.push(`${key}: statistiche non valide (${JSON.stringify(player.stats)})`);
  }
}

function checkPlayerFields(source, errors) {
  for (const player of source.players) {
    const key = `${source.id}/${idOf(player)}`;
    if (![0, 1, 2].includes(player.importance)) errors.push(`${key}: importanza non valida (${player.importance})`);
    if (!Array.isArray(player.moves) || player.moves.length > MAX_MOVES) {
      errors.push(`${key}: lista mosse non valida`);
      continue;
    }
    for (const move of player.moves) {
      const ok = ["name", "type", "element"].every((field) => typeof move[field] === "string" && move[field])
        && (move.power === null || Number.isFinite(move.power));
      if (!ok) errors.push(`${key}: mossa non valida ${JSON.stringify(move)}`);
    }
  }
}

function checkReferences(source, ctx, errors) {
  const players = new Set(source.players.map(idOf));
  const profiles = new Set((source.profiles || []).map(profileIdOf));
  const { players: _players, ...rest } = source;
  walk(rest, source.id, (key, value, path) => {
    const strict = STRICT_SECTIONS.has(path.split(/[.[]/)[1]);
    if (PLAYER_REF_KEY.test(key)) {
      for (const id of asList(value).map(String)) {
        const known = players.has(id) || (!strict && ctx.freeAgentIds.has(id));
        if (!known) errors.push(`${path}: giocatore inesistente ${id}`);
      }
    } else if (PROFILE_REF_KEY.test(key)) {
      for (const id of asList(value).map(String)) {
        if (!profiles.has(id)) errors.push(`${path}: profilo inesistente ${id}`);
      }
    }
  });
}

function checkMatches(source, errors) {
  const teams = new Set((source.teams || []).map(teamIdOf));
  const formations = new Set((source.formations?.eleven || []).map((formation) => formation.id));
  const matches = [...(source.bossOrder || []), ...(source.specialMatches || [])];
  for (const match of matches) {
    if (!teams.has(match.teamId)) errors.push(`${source.id}: partita contro squadra inesistente ${match.teamId}`);
    const formation = match.bossFormation ?? match.matchFormation;
    if (formation && !formations.has(formation)) errors.push(`${source.id}: formazione inesistente ${formation}`);
    if ((match.startingXIPlayerIds || []).length !== 11) errors.push(`${source.id}/${match.teamId}: XI non da 11`);
  }
  for (const teamId of source.rtg?.mainTeams || []) {
    if (!teams.has(teamId)) errors.push(`${source.id}: squadra RTG inesistente ${teamId}`);
  }
}

function checkFormations(source, errors) {
  const all = [...(source.formations?.eleven || []), ...(source.formations?.five || [])];
  for (const formation of all) {
    const total = Object.values(formation.requirements || {}).reduce((sum, count) => sum + count, 0);
    if (total !== formation.slotRoles?.length) errors.push(`${source.id}: formazione ${formation.id} incoerente`);
  }
}

// bundle: { seasons: [season], freeAgents, statsDb, statsMissing: { players: [...] } }
export function validateData(bundle) {
  const errors = [];
  const ctx = {
    statFields: bundle.statsDb.fields,
    statsMissing: new Set(bundle.statsMissing.players.map((entry) => `${entry.source}/${entry.playerId}`)),
    freeAgentIds: new Set(bundle.freeAgents.players.map(idOf)),
  };
  for (const source of [...bundle.seasons, bundle.freeAgents]) {
    checkUnique(source, errors);
    checkStats(source, ctx, errors);
    checkPlayerFields(source, errors);
    checkReferences(source, ctx, errors);
    checkMatches(source, errors);
    checkFormations(source, errors);
  }
  const nullStats = new Set([...bundle.seasons, bundle.freeAgents]
    .flatMap((source) => source.players.filter((p) => p.stats === null).map((p) => `${source.id}/${idOf(p)}`)));
  for (const key of ctx.statsMissing) {
    if (!nullStats.has(key)) errors.push(`stats-missing elenca ${key} ma il giocatore ha le statistiche (o non esiste)`);
  }
  return errors;
}
