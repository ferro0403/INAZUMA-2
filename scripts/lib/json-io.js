// Lettura e scrittura JSON leggibile e stabile (stesso input => stesso file).
import fs from "node:fs";
import path from "node:path";

const INLINE_MAX = 120;

export function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

export function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${formatJson(value)}\n`, "utf8");
}

function isPrimitive(value) {
  return value === null || typeof value !== "object";
}

// Versione su una riga, con spazi dopo ":" e ",". I valori sono serializzati con JSON.stringify:
// le stringhe (link compresi) non vengono mai toccate.
function inlineJson(value) {
  if (isPrimitive(value)) return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(inlineJson).join(", ")}]`;
  const parts = Object.entries(value).filter(([, v]) => v !== undefined)
    .map(([key, item]) => `${JSON.stringify(key)}: ${inlineJson(item)}`);
  return `{${parts.join(", ")}}`;
}

export function formatJson(value, indent = "") {
  if (isPrimitive(value)) return JSON.stringify(value);
  const isArray = Array.isArray(value);
  const entries = isArray ? value : Object.entries(value).filter(([, v]) => v !== undefined);
  if (entries.length === 0) return isArray ? "[]" : "{}";
  const [open, close] = isArray ? ["[", "]"] : ["{", "}"];
  const inline = inlineJson(value);
  if (inline.length + indent.length <= INLINE_MAX) return inline;
  const inner = `${indent}  `;
  const lines = isArray
    ? entries.map((item) => `${inner}${formatJson(item, inner)}`)
    : entries.map(([key, item]) => `${inner}${JSON.stringify(key)}: ${formatJson(item, inner)}`);
  return `${open}\n${lines.join(",\n")}\n${indent}${close}`;
}
