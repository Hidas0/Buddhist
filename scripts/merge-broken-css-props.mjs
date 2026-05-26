// Склеивает разорванные многострочные свойства вида «box-shadow:;» + следующие строки
import fs from "fs";
import path from "path";

const CSS_PATH = path.join(process.cwd(), "css", "style.css");

const HINTS = {
  background: "фон",
  "box-shadow": "тень",
  transform: "трансформация",
  animation: "анимация",
  transition: "переход",
};

const emptyProp = /^(\s+)([a-zA-Z0-9-]+):\s*;\s*$/;

const lines = fs.readFileSync(CSS_PATH, "utf8").split(/\r?\n/);
const out = [];

for (let i = 0; i < lines.length; i++) {
  const m = lines[i].match(emptyProp);
  if (!m) {
    out.push(lines[i]);
    continue;
  }

  const baseIndent = m[1].length;
  const prop = m[2];
  const chunks = [];
  let j = i + 1;

  while (j < lines.length) {
    const ln = lines[j];
    const trimmed = ln.trim();
    if (!trimmed) break;
    if (trimmed.startsWith("}")) break;

    const ind = ln.match(/^(\s*)/)[1].length;
    if (ind <= baseIndent && /^[a-zA-Z0-9-]+\s*:/.test(trimmed)) break;

    chunks.push(trimmed);
    if (trimmed.endsWith(";")) {
      j++;
      break;
    }
    j++;
  }

  const val = chunks.join(" ").replace(/;\s*$/, "");
  const hint = HINTS[prop] || prop;
  out.push(`${m[1]}${prop}: ${val}; /* ${hint} */`);
  i = j - 1;
}

fs.writeFileSync(CSS_PATH, out.join("\n"), "utf8");
console.log("Merged broken props, lines:", out.length);
