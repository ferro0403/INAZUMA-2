// Regole di CLAUDE.md controllate in automatico.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ROOT, loadBundle } from "../scripts/lib/load-data.js";

function filesIn(dir, extensions) {
  const full = path.join(ROOT, dir);
  if (!fs.existsSync(full)) return [];
  return fs.readdirSync(full, { recursive: true })
    .filter((file) => extensions.some((ext) => file.endsWith(ext)))
    .map((file) => path.join(full, file));
}

const codeFiles = [...filesIn("src", [".js"]), ...filesIn("scripts", [".js"]), ...filesIn("tests", [".js"])];

test("file di codice sotto le 400 righe", () => {
  for (const file of codeFiles) {
    const lines = fs.readFileSync(file, "utf8").split("\n").length;
    assert.ok(lines < 400, `${path.relative(ROOT, file)}: ${lines} righe`);
  }
});

test("nessun id di season o evento scritto nel codice di src/ e scripts/", () => {
  const ids = [...loadBundle().index.seasons.map((season) => season.id), "halloween"];
  const files = [...filesIn("src", [".js", ".html", ".css"]), ...filesIn("scripts", [".js"])];
  for (const file of files) {
    const text = fs.readFileSync(file, "utf8");
    for (const id of ids) {
      assert.ok(!new RegExp(`["'\`]${id}["'\`/]`).test(text), `${path.relative(ROOT, file)} contiene "${id}"`);
    }
  }
});

test("niente !important e colori solo come variabili nei CSS (fuori dal file dei token)", () => {
  for (const file of filesIn("src", [".css"])) {
    const text = fs.readFileSync(file, "utf8");
    assert.ok(!text.includes("!important"), `${path.relative(ROOT, file)} usa !important`);
    if (file.endsWith("tokens.css")) continue;
    assert.ok(!/#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(/i.test(text), `${path.relative(ROOT, file)} ha colori letterali`);
  }
});
