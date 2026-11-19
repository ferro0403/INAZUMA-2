// Motore: probabilita', simmetria, rarita' e stelle, limite Fabled, nemico, simulatore riproducibile.
import { test } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { readJson } from "../scripts/lib/json-io.js";
import { ROOT, loadBundle } from "../scripts/lib/load-data.js";
import { duelBreakdown, duelProbability } from "../src/engine/duel.js";
import { cardStrength } from "../src/engine/strength.js";
import { elementBonus } from "../src/engine/elements.js";
import { moveBonus } from "../src/engine/move-bonus.js";
import { adaptEnemy } from "../src/engine/enemy.js";
import { teamPower } from "../src/engine/team-power.js";
import { validateSquad } from "../src/engine/squad.js";
import { createRandom } from "../src/engine/random.js";
import { simulatePairs } from "../src/engine/simulation.js";

const balance = readJson(path.join(ROOT, "data", "balance.json"));
const cards = loadBundle().seasons.flatMap((season) => season.players.filter((p) => p.stats));
const groups = Object.keys(balance.statGroups).filter((key) => key !== "note");
const rarities = balance.rarities.list.map((rarity) => rarity.id);
const random = createRandom(42);
const pick = (list) => list[Math.floor(random() * list.length)];
const anyProgress = () => ({ rarity: pick(rarities), stars: Math.floor(random() * (balance.stars.max + 1)) });
const anySide = (withMove = true) => {
  const card = pick(cards);
  const move = withMove && card.moves.length && random() < 0.7 ? pick(card.moves) : null;
  return { card, group: pick(groups), progress: anyProgress(), move };
};

test("la probabilita' resta sempre tra 5 e 95", () => {
  const { minProbability, maxProbability } = balance.duel;
  for (let i = 0; i < 5000; i += 1) {
    const p = duelProbability(anySide(), anySide(), balance);
    assert.ok(p >= minProbability && p <= maxProbability, `${p}`);
  }
  const strong = { card: cards[0], group: "shot", progress: { rarity: "fabled", stars: 5 }, move: { power: 100 } };
  const weak = { card: cards[0], group: "shot", progress: { rarity: "normal", stars: 0 }, move: null };
  assert.equal(duelProbability({ ...strong, card: { ...cards[0], stats: big(cards[0].stats) } }, weak, balance), 95);
  assert.equal(duelProbability(weak, { ...strong, card: { ...cards[0], stats: big(cards[0].stats) } }, balance), 5);
});

function big(stats) {
  return Object.fromEntries(Object.entries(stats).map(([key, value]) => [key, value * 3]));
}

test("simmetria: A contro B + B contro A = 100 senza elementi (anche con le mosse)", () => {
  const noElements = { ...balance, elements: { ...balance.elements, advantageBonus: 0 } };
  for (let i = 0; i < 2000; i += 1) {
    const a = anySide();
    const b = anySide();
    const sum = duelProbability(a, b, noElements) + duelProbability(b, a, noElements);
    assert.ok(Math.abs(sum - 100) < 1e-9, `${sum}`);
  }
});

test("piu' rarita' = piu' forza, piu' stelle = piu' forza", () => {
  for (const card of cards.slice(0, 200)) {
    for (const group of groups) {
      const strengths = rarities.map((rarity) => cardStrength(card, group, { rarity, stars: 0 }, balance));
      strengths.slice(1).forEach((value, i) => assert.ok(value > strengths[i]));
      const byStars = [0, 1, 2, 3, 4, 5].map((stars) => cardStrength(card, group, { rarity: "rare", stars }, balance));
      byStars.slice(1).forEach((value, i) => assert.ok(value > byStars[i]));
    }
  }
});

test("elementi: ciclo Fire > Forest > Wind > Mountain > Fire, Void neutro", () => {
  const bonus = balance.elements.advantageBonus;
  assert.equal(elementBonus("Fire", "Forest", balance), bonus);
  assert.equal(elementBonus("Forest", "Fire", balance), -bonus);
  assert.equal(elementBonus("Mountain", "Fire", balance), bonus);
  assert.equal(elementBonus("Fire", "Wind", balance), 0);
  assert.equal(elementBonus("Void", "Fire", balance), 0);
  const side = (element, moveElement) => ({ card: { ...cards[0], element }, group: "shot",
    progress: { rarity: "normal", stars: 0 }, move: { element: moveElement, power: 50 } });
  assert.equal(duelBreakdown(side("Fire", "Wind"), side("Forest", "Fire"), balance).element, bonus);
  const byMove = { ...balance, elements: { ...balance.elements, elementFrom: "move" } };
  assert.equal(duelBreakdown(side("Fire", "Wind"), side("Forest", "Mountain"), byMove).element, bonus);
});

test("bonus mossa lineare: ~4 a potenza 30, ~13 a potenza 100, 0 senza mossa", () => {
  assert.equal(moveBonus(null, balance), 0);
  assert.equal(moveBonus({ power: balance.moveBonus.minPower }, balance), balance.moveBonus.bonusAtMinPower);
  assert.equal(moveBonus({ power: balance.moveBonus.maxPower }, balance), balance.moveBonus.bonusAtMaxPower);
  assert.ok(moveBonus({ power: 60 }, balance) > moveBonus({ power: 50 }, balance));
});

const entry = (id, rarity = "normal", stars = 0) => ({ cardId: `c${id}`, progress: { rarity, stars } });
const squadOf = (rarityOf) => ({ starters: Array.from({ length: 11 }, (_, i) => entry(i, rarityOf(i))), reserves: [] });

test("rosa: 11 titolari, massimo 4 riserve, massimo 2 Fabled tra i titolari, nessun vincolo di ruolo", () => {
  assert.deepEqual(validateSquad(squadOf(() => "normal"), balance), []);
  assert.deepEqual(validateSquad(squadOf((i) => (i < 2 ? "fabled" : "rare")), balance), []);
  assert.equal(validateSquad(squadOf((i) => (i < 3 ? "fabled" : "rare")), balance).length, 1);
  const reserves = [entry(20, "fabled"), entry(21, "fabled"), entry(22), entry(23)];
  const fabledReserves = { ...squadOf((i) => (i < 2 ? "fabled" : "normal")), reserves };
  assert.deepEqual(validateSquad(fabledReserves, balance), []);
  const tooMany = { ...fabledReserves, reserves: [...reserves, entry(24)] };
  assert.equal(validateSquad(tooMany, balance).length, 1);
  assert.equal(validateSquad({ starters: squadOf(() => "normal").starters.slice(1), reserves: [] }, balance).length, 1);
  const repeated = [...squadOf(() => "normal").starters.slice(1), entry(1)];
  assert.equal(validateSquad({ starters: repeated }, balance).length, 1);
  assert.equal(validateSquad(squadOf(() => "mythic"), balance).length, 11);
});

const lineup = (offset, progress) => ["GK", "DF", "DF", "DF", "DF", "MF", "MF", "MF", "FW", "FW", "FW"]
  .map((slotRole, i) => ({ card: cards[offset + i], slotRole, progress }));

test("potenza: cresce con rarita' e stelle, un difensore in attacco vale meno di un attaccante", () => {
  const normal = teamPower(lineup(0, { rarity: "normal", stars: 0 }), balance);
  const rare = teamPower(lineup(0, { rarity: "rare", stars: 0 }), balance);
  const rareStars = teamPower(lineup(0, { rarity: "rare", stars: 3 }), balance);
  assert.ok(rare > normal && rareStars > rare);
  const df = cards.find((card) => card.position === "DF" && card.stats.kick < card.stats.pressure);
  const fw = cards.find((card) => card.position === "FW" && card.stats.kick > card.stats.pressure);
  const one = (card) => teamPower([{ card: { ...card, moves: [] }, slotRole: "FW", progress: {} }], balance);
  assert.ok(one(fw) > one(df));
});

test("nemico sempre tra minimo e massimo, il giocatore non viene mai bloccato", () => {
  for (let offset = 0; offset < 300; offset += 11) {
    const enemy = lineup(offset, {});
    for (const playerPower of [0, 10, 80, 100, 120, 150, 1000, 1e6]) {
      const result = adaptEnemy(playerPower, enemy, balance);
      assert.ok(result.targetPower >= result.min - 1e-9 && result.targetPower <= result.max + 1e-9);
      assert.ok(Math.abs(result.power - result.targetPower) < 1e-6);
    }
    const middle = adaptEnemy((enemyBase(enemy) * 1.3), enemy, balance);
    assert.ok(Math.abs(middle.targetPower - middle.wanted) < 1e-9);
  }
});

function enemyBase(enemy) {
  return teamPower(enemy, balance, 1);
}

test("simulatore riproducibile: stesso seme, stessi risultati", () => {
  const pairs = balance.calibration.targets;
  const options = { seed: 7, duels: 2000 };
  assert.deepEqual(simulatePairs(cards, pairs, balance, options), simulatePairs(cards, pairs, balance, options));
  assert.notDeepEqual(simulatePairs(cards, pairs, balance, options),
    simulatePairs(cards, pairs, balance, { ...options, seed: 8 }));
});

test("taratura: con il k di balance.json gli obiettivi sono rispettati", () => {
  const { targets, seed, duelsPerPair, tolerance } = balance.calibration;
  for (const result of simulatePairs(cards, targets, balance, { seed, duels: duelsPerPair })) {
    assert.ok(Math.abs(result.winRate - result.target) <= tolerance, `${result.name}: ${result.winRate}`);
  }
});
