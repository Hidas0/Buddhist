// Убирает дубли /* … */ /* … */ построчно (не трогает блочные /* … */ с переносами)
import fs from "fs";
import path from "path";

const CSS_PATH = path.join(process.cwd(), "css", "style.css");

function fixLine(line) {
  if (!line.includes("/*") || line.trim().startsWith("/*") && !line.includes(":")) {
    return line;
  }

  let out = line;

  // Дубли комментариев на одной строке
  let prev;
  do {
    prev = out;
    out = out.replace(/(\/\*[^*\n]+\*\/)\s*(?:\/\*[^*\n]+\*\/\s*)+/g, "$1 ");
  } while (out !== prev);

  // ; перед следующим свойством после комментария
  out = out.replace(/(\/\*[^*\n]+\*\/)\s+(?=[a-zA-Z0-9_-]+\s*:)/g, "$1; ");

  // лишняя ; сразу перед }
  out = out.replace(/(\/\*[^*\n]+\*\/)\s*;\s*(\})/g, "$1 $2");

  out = out.replace(/;\s*;\s*/g, "; ");

  return out;
}

const lines = fs.readFileSync(CSS_PATH, "utf8").split(/\r?\n/);
const fixed = lines.map(fixLine);
fs.writeFileSync(CSS_PATH, fixed.join("\n"), "utf8");
console.log("Fixed", lines.length, "lines");
