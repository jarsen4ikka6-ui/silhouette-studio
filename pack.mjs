// Упаковка плагина: копирует движок из template/ и справочники в silhouette-studio/plugins/nomadapc.
// Запуск: node pack.mjs   (после правок движка — перед публикацией)
// Сам запускается перед каждым коммитом (.githooks/pre-commit), после коммита всё уходит на GitHub.
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATE = path.join(ROOT, "template");
const PLUGIN = path.join(ROOT, "silhouette-studio", "plugins", "nomadapc");
const SKILL = path.join(PLUGIN, "skills", "video");
const ENGINE = path.join(SKILL, "engine");
const REFS = path.join(SKILL, "references");

// только то, что принадлежит движку; ролики, озвучки, out и node_modules не попадают
const ENGINE_FILES = ["src", "scripts", "docs", "package.json", "package-lock.json", "tsconfig.json", "remotion.config.ts", "boards/demo.json"];

rmSync(ENGINE, { recursive: true, force: true });
for (const f of ENGINE_FILES) {
  const src = path.join(TEMPLATE, f);
  if (!existsSync(src)) throw new Error(`Нет ${src}`);
  mkdirSync(path.dirname(path.join(ENGINE, f)), { recursive: true });
  cpSync(src, path.join(ENGINE, f), { recursive: true });
}

// справочники для Claude
rmSync(REFS, { recursive: true, force: true });
mkdirSync(REFS, { recursive: true });
const style = readFileSync(path.join(ROOT, "style-guide.md"), "utf8")
  .replace(" (см. РЕШЕНИЯ.md)", " (движок генерирует её кодом по настроению главы — см. engine.md)")
  .replace(/^- \*\*Фоны — самая трудоёмкая часть\.\*\*.*$/m, "- **Фоны — самая трудоёмкая часть.** Каждая новая локация рисуется кодом в src/custom (engine.md, раздел 9).");
writeFileSync(path.join(REFS, "style-guide.md"), style);
cpSync(path.join(ROOT, "ideas-playbook.md"), path.join(REFS, "ideas-playbook.md"));
const board = JSON.parse(readFileSync(path.join(TEMPLATE, "boards", "01-bez-telefonov.json"), "utf8"));
delete board.voice;
delete board.id; // id = имя файла доски
writeFileSync(path.join(REFS, "example-board.json"), JSON.stringify(board, null, 2) + "\n");
cpSync(path.join(TEMPLATE, "script", "01-bez-telefonov.md"), path.join(REFS, "example-script.md"));
cpSync(path.join(TEMPLATE, "script", "01-bez-telefonov-ozvuchka.txt"), path.join(REFS, "example-ozvuchka.txt"));

// версия движка = версия из template/package.json + отпечаток файлов движка:
// любая правка движка меняет версию, и студии друзей сами обновятся при следующем запуске
const base = JSON.parse(readFileSync(path.join(TEMPLATE, "package.json"), "utf8")).version;
const hash = createHash("sha1");
const walk = (d) => {
  for (const e of readdirSync(d, { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : 1))) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else hash.update(path.relative(ENGINE, p).split(path.sep).join("/") + "\n" + readFileSync(p, "utf8").replaceAll("\r\n", "\n"));
  }
};
walk(ENGINE);
const version = `${base}+${hash.digest("hex").slice(0, 8)}`;
for (const f of ["package.json", "package-lock.json"]) {
  const j = JSON.parse(readFileSync(path.join(ENGINE, f), "utf8"));
  j.version = version;
  if (j.packages?.[""]) j.packages[""].version = version;
  writeFileSync(path.join(ENGINE, f), JSON.stringify(j, null, 2) + "\n");
}
// у плагина версии нет: тогда версией считается коммит, и каждый push на GitHub — обновление для друзей
const manifest = path.join(PLUGIN, ".claude-plugin", "plugin.json");
const pj = JSON.parse(readFileSync(manifest, "utf8"));
delete pj.version;
writeFileSync(manifest, JSON.stringify(pj, null, 2) + "\n");

// проверка: в плагине нет личных путей
const bad = [];
const scan = (dir) => {
  for (const e of readdirSafe(dir)) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) scan(p);
    else if (/\.(tsx?|mjs|mts|json|md|txt)$/.test(e.name) && /[A-Z]:\\\\?Users\\\\?(?!<)|\/Users\/(?!<)|ARSEN|Мой плагин/i.test(readFileSync(p, "utf8"))) bad.push(path.relative(ROOT, p));
  }
};
function readdirSafe(d) {
  return existsSync(d) ? readdirSync(d, { withFileTypes: true }) : [];
}
scan(path.join(ROOT, "silhouette-studio"));
if (bad.length) {
  console.error("ВНИМАНИЕ, личные пути в файлах:\n  " + bad.join("\n  "));
  process.exit(1);
}
console.log(`Плагин собран: версия ${version} -> ${path.relative(ROOT, PLUGIN)}`);

// архив для друзей: Claude → Customize → Plugins → Add → Upload plugin (.zip с плагином в корне)
cpSync(path.join(ROOT, "INSTALL.txt"), path.join(PLUGIN, "INSTALL.txt"));
mkdirSync(path.join(ROOT, "dist"), { recursive: true });
const zip = path.join(ROOT, "dist", "nomadapc.zip");
rmSync(zip, { force: true });
const zr = process.platform === "win32"
  ? spawnSync(path.join(process.env.SystemRoot ?? "C:/Windows", "System32", "tar.exe"), ["-a", "-cf", zip, ".claude-plugin", "skills", "INSTALL.txt"], { cwd: PLUGIN, stdio: "inherit" })
  : spawnSync("zip", ["-qr", zip, ".claude-plugin", "skills", "INSTALL.txt"], { cwd: PLUGIN, stdio: "inherit" });
if (zr.status !== 0) throw new Error("Не получилось собрать zip");
console.log(`Архив: ${path.relative(ROOT, zip)} (${Math.round(statSync(zip).size / 1024)} КБ)`);
