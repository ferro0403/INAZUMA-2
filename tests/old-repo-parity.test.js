// Confronto con il vecchio repo. Gira solo se OLD_REPO punta al vecchio repo:
//   OLD_REPO=../INAZUMA-ROGUELIKE npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { readJson } from "../scripts/lib/json-io.js";
import { ROOT, loadBundle } from "../scripts/lib/load-data.js";
import { openOldRepo } from "../scripts/lib/old-repo.js";
import { checkParity } from "../scripts/lib/parity.js";

const oldPath = process.env.OLD_REPO;

test("dati, ordine partite, mosse e link immagini uguali al vecchio repo", { skip: !oldPath && "OLD_REPO non impostato" },
  () => {
    const config = readJson(path.join(ROOT, "scripts", "import-config.json"));
    assert.deepEqual(checkParity(loadBundle(), openOldRepo(oldPath), config), []);
  });
