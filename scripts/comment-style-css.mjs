// Построчные комментарии в css/style.css
import fs from "fs";
import path from "path";

const CSS_PATH = path.join(process.cwd(), "css", "style.css");

const PROP_HINTS = {
  display: "режим отображения",
  position: "позиционирование",
  top: "отступ сверху",
  right: "отступ справа",
  bottom: "отступ снизу",
  left: "отступ слева",
  inset: "отступы со всех сторон",
  width: "ширина",
  height: "высота",
  "min-width": "минимальная ширина",
  "max-width": "максимальная ширина",
  "min-height": "минимальная высота",
  "max-height": "максимальная высота",
  margin: "внешний отступ",
  "margin-top": "отступ сверху",
  "margin-bottom": "отступ снизу",
  "margin-left": "отступ слева",
  "margin-right": "отступ справа",
  padding: "внутренний отступ",
  "padding-top": "отступ сверху",
  "padding-bottom": "отступ снизу",
  "padding-left": "отступ слева",
  "padding-right": "отступ справа",
  gap: "расстояние между элементами",
  "grid-template-columns": "колонки сетки",
  "grid-template-rows": "ряды сетки",
  "grid-column": "колонка grid",
  "grid-row": "ряд grid",
  "flex-direction": "направление flex",
  "flex-wrap": "перенос flex",
  "flex-shrink": "сжатие flex",
  "flex-grow": "растягивание flex",
  "flex-basis": "база flex",
  flex: "сокращённый flex",
  "align-items": "выравнивание по поперечной оси",
  "align-self": "выравнивание элемента",
  "justify-content": "выравнивание по главной оси",
  "justify-self": "выравнивание в grid",
  "place-items": "выравнивание grid",
  "text-align": "выравнивание текста",
  "text-decoration": "оформление текста",
  "font-family": "шрифт",
  "font-size": "размер шрифта",
  "font-weight": "жирность",
  "line-height": "межстрочный интервал",
  "letter-spacing": "межбуквенный интервал",
  color: "цвет текста",
  background: "фон",
  "background-color": "цвет фона",
  "background-image": "фоновое изображение",
  "background-size": "размер фона",
  "background-position": "позиция фона",
  border: "рамка",
  "border-radius": "скругление",
  "border-top": "верхняя рамка",
  "border-bottom": "нижняя рамка",
  "border-left": "левая рамка",
  "border-right": "правая рамка",
  "border-color": "цвет рамки",
  "border-width": "толщина рамки",
  "box-shadow": "тень",
  opacity: "прозрачность",
  overflow: "переполнение",
  "overflow-x": "переполнение по X",
  "overflow-y": "переполнение по Y",
  "z-index": "слой z-index",
  cursor: "курсор",
  transition: "переход",
  transform: "трансформация",
  "transform-origin": "центр трансформации",
  animation: "анимация",
  "animation-delay": "задержка анимации",
  "animation-duration": "длительность",
  "animation-name": "имя @keyframes",
  "animation-play-state": "пауза анимации",
  "will-change": "оптимизация рендера",
  "backdrop-filter": "фильтр подложки",
  "-webkit-backdrop-filter": "фильтр (WebKit)",
  "clip-path": "обрезка контура",
  "-webkit-clip-path": "обрезка (WebKit)",
  filter: "CSS-фильтр",
  "object-fit": "вписывание img/video",
  "aspect-ratio": "пропорции",
  "list-style": "маркеры списка",
  content: "псевдоэлемент content",
  visibility: "видимость",
  "pointer-events": "пропуск кликов",
  "user-select": "выделение текста",
  "white-space": "переносы",
  "text-overflow": "многоточие",
  "word-break": "разрыв слов",
  "overflow-wrap": "перенос слов",
  float: "float",
  clear: "clear",
  "scroll-behavior": "плавный скролл",
  "scroll-padding-top": "отступ якоря",
  "scroll-margin-top": "scroll-margin",
  "-webkit-text-size-adjust": "текст iOS",
  "text-size-adjust": "масштаб текста",
  "box-sizing": "box-sizing",
  order: "порядок flex",
  "font-style": "курсив",
  "font-variant-numeric": "цифры",
  "touch-action": "жесты",
  "-webkit-tap-highlight-color": "подсветка тапа",
  "scrollbar-width": "скроллбар",
  "-webkit-overflow-scrolling": "инерция скролла",
  "-webkit-line-clamp": "число строк",
  "-webkit-box-orient": "ориентация box",
  "transition-delay": "задержка перехода",
};

function hasComment(s) {
  return /\/\*/.test(s.replace(/"[^"]*"/g, "").replace(/'[^']*'/g, ""));
}

/** Разбить блок свойств по ; вне комментариев */
function splitDecls(block) {
  const parts = [];
  let cur = "";
  let inComment = false;
  for (let i = 0; i < block.length; i++) {
    const ch = block[i];
    const next = block[i + 1];
    if (!inComment && ch === "/" && next === "*") {
      inComment = true;
      cur += ch;
      continue;
    }
    if (inComment && ch === "*" && next === "/") {
      cur += "*/";
      i++;
      inComment = false;
      continue;
    }
    if (!inComment && ch === ";") {
      const t = cur.trim();
      if (t) parts.push(t);
      cur = "";
      continue;
    }
    cur += ch;
  }
  const tail = cur.trim();
  if (tail) parts.push(tail);
  return parts;
}

function hint(prop, value) {
  if (prop.startsWith("--")) return `CSS-переменная ${prop}`;
  let h = PROP_HINTS[prop] || prop;
  if (value.includes("var(--primary")) h += ", акцент";
  if (value.includes("var(--bg")) h += ", фон";
  if (value.includes("var(--text-muted")) h += ", приглушённый текст";
  if (value.includes("var(--border")) h += ", рамка";
  if (value.includes("var(--navbar-height")) h += ", шапка";
  if (value.includes("env(safe-area")) h += ", safe-area";
  return h;
}

function annotateDecl(decl) {
  const t = decl.trim().replace(/;\s*$/, "");
  const m = t.match(/^([a-zA-Z0-9_-]+)\s*:\s*(.+)$/);
  if (!m) return decl;
  return `${m[1]}: ${m[2]}; /* ${hint(m[1], m[2])} */`;
}

/** Комментарии во вложенных { … } (from/to в @keyframes на одной строке). */
function annotateNestedBraces(fragment) {
  let prev;
  let out = fragment;
  do {
    prev = out;
    out = out.replace(/\{([^{}]*)\}/g, (_, inner) => {
      const body = inner.trim();
      if (!body || !/[a-zA-Z0-9_-]+\s*:/.test(body)) {
        return `{ ${body} }`;
      }
      const props = splitDecls(body)
        .map((p) => (hasComment(p) ? p + ";" : annotateDecl(p)))
        .join(" ");
      return `{ ${props} }`;
    });
  } while (out !== prev);
  return out;
}

function annotateOneLinerRule(line) {
  const trimmed = line.trim();
  const m = trimmed.match(/^(@?[^@{]+)\{(.+)\}(.*)$/s);
  if (!m) return line;
  const indent = line.match(/^\s*/)[0];
  const head = m[1].trim();
  const tail = m[3].trim();
  const body = annotateNestedBraces(m[2]);
  const commented =
    head.startsWith("@keyframes") || head.startsWith("@media")
      ? `${head} { ${body} }`
      : `${head} { ${body} }`;
  return `${indent}${commented}${tail ? " " + tail : ""}`;
}

function processLine(line, stack) {
  const trimmed = line.trim();

  if (!trimmed) return line;
  if (trimmed.startsWith("/*") || trimmed.startsWith("/**")) {
    return line;
  }
  // Строки JSDoc в шапке (« * текст»), но не селектор *
  if (trimmed.startsWith("*") && !trimmed.includes("{")) {
    return line;
  }

  // @keyframes на одной строке (from/to внутри)
  if (trimmed.startsWith("@keyframes") && trimmed.includes("}")) {
    const inner = trimmed.replace(/^@keyframes[^{]+\{/, "").replace(/\}[^}]*$/, "");
    if (inner && !hasComment(inner)) return annotateOneLinerRule(line);
    return line;
  }

  // Однострочное правило без вложенности: .foo { a: b; }
  const one = trimmed.match(/^([^{]+)\{([^}]+)\}(.*)$/);
  if (one && !trimmed.includes("@")) {
    if (hasComment(one[2])) return line;
    const indent = line.match(/^\s*/)[0];
    const props = splitDecls(one[2])
      .map((p) => (hasComment(p) ? p + ";" : annotateDecl(p)))
      .join(" ");
    const tail = one[3].trim();
    return `${indent}${one[1].trim()} { ${props} }${tail ? " " + tail : ""}`;
  }

  // Открытие блока
  if (/^[^{}]+\{\s*$/.test(trimmed)) {
    const sel = trimmed.replace(/\{\s*$/, "").trim();
    stack.push(sel);
    return `${line.replace(/\s*$/, "")} /* ${sel} */`;
  }

  // Закрытие блока
  if (trimmed === "}" || trimmed === "};") {
    const sel = stack.pop() || "";
    const indent = line.match(/^\s*/)[0];
    return `${indent}} /* /${sel} */`;
  }

  // @media / @keyframes
  if (trimmed.startsWith("@media") || trimmed.startsWith("@keyframes")) {
    if (trimmed.endsWith("{")) {
      stack.push(trimmed.replace(/\{\s*$/, "").trim());
      return `${line.replace(/\s*$/, "")} /* ${trimmed.replace(/\{$/, "").trim()} */`;
    }
    return line;
  }

  // Свойство (с отступом)
  if (/^[a-zA-Z0-9_-]+\s*:/.test(trimmed) && !hasComment(line)) {
    const indent = line.match(/^\s*/)[0];
    const withSemi = trimmed.endsWith(";") ? trimmed : trimmed + ";";
    return indent + annotateDecl(withSemi);
  }

  return line;
}

function processCss(text) {
  const lines = text.split(/\r?\n/);
  const stack = [];
  return lines.map((line) => processLine(line, stack)).join("\n");
}

const src = fs.readFileSync(CSS_PATH, "utf8");
fs.writeFileSync(CSS_PATH, processCss(src), "utf8");
console.log("OK", CSS_PATH);
