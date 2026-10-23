// Студия роликов: установка, обновление, проверка. Только встроенные модули Node — ставить ничего не нужно.
//   node studio.mjs where                 — где студия (из ~/.silhouette-studio.json), версия движка
//   node studio.mjs create "<папка>"      — новая студия: копия движка, npm install, звуки, тест-рендер
//   node studio.mjs update                — обновить движок студии до версии плагина (свои локации, ролики и озвучки не трогает)
//   node studio.mjs check                 — проверить Node.js и студию
import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ENGINE = path.join(HERE, "..", "engine");
const PLUGIN_VERSION = JSON.parse(readFileSync(path.join(ENGINE, "package.json"), "utf8")).version;
const CONFIG = path.join(os.homedir(), ".silhouette-studio.json");
const NODE_MIN = [22, 18]; // с 22.18 Node сам запускает .mts (скрипт расшифровки)

// Что в студии принадлежит плагину (обновляется) — всё остальное принадлежит человеку
const ENGINE_FILES = ["src", "scripts", "docs", "package.json", "package-lock.json", "tsconfig.json", "remotion.config.ts", "boards/demo.json"];
const KEEP_ON_UPDATE = [path.join("src", "custom")];
const USER_DIRS = ["boards", "data", "transcripts", "voice", "script", "out", path.join("public", "audio"), path.join("public", "music")];

const say = (s) => console.log(s);
const fail = (s) => {
  console.error(`\nОШИБКА: ${s}`);
  process.exit(1);
};
const readConfig = () => (existsSync(CONFIG) ? JSON.parse(readFileSync(CONFIG, "utf8")) : {});
const studioVersion = (dir) => (existsSync(path.join(dir, ".engine-version")) ? readFileSync(path.join(dir, ".engine-version"), "utf8").trim() : null);
const npm = process.platform === "win32" ? "npm.cmd" : "npm";
const run = (cmd, args, cwd) => {
  say(`\n> ${cmd} ${args.join(" ")}`);
  // на Windows npm — это npm.cmd, его запускают через оболочку одной строкой
  const r = process.platform === "win32" ? spawnSync([cmd, ...args].join(" "), { cwd, stdio: "inherit", shell: true }) : spawnSync(cmd, args, { cwd, stdio: "inherit" });
  return r.status === 0;
};

const nodeOk = () => {
  const [major, minor] = process.versions.node.split(".").map(Number);
  return major > NODE_MIN[0] || (major === NODE_MIN[0] && minor >= NODE_MIN[1]);
};
const checkNode = () => {
  if (!nodeOk()) {
    fail(`Node.js ${process.versions.node} слишком старый, нужен ${NODE_MIN.join(".")}+ (поставь свежий LTS с nodejs.org или winget install OpenJS.NodeJS.LTS).`);
  }
  say(`Node.js ${process.versions.node} — ок`);
};

const copyEngine = (dir, { update }) => {
  for (const f of ENGINE_FILES) {
    const src = path.join(ENGINE, f);
    if (!existsSync(src)) continue;
    const dst = path.join(dir, f);
    if (update && f === "src") {
      // src обновляем целиком, кроме src/custom (там свои локации и предметы человека)
      for (const name of readdirSync(dst)) {
        if (!KEEP_ON_UPDATE.includes(path.join("src", name))) rmSync(path.join(dst, name), { recursive: true, force: true });
      }
      for (const name of readdirSync(src)) {
        if (KEEP_ON_UPDATE.includes(path.join("src", name)) && existsSync(path.join(dst, name))) continue;
        cpSync(path.join(src, name), path.join(dst, name), { recursive: true });
      }
      continue;
    }
    if (update && f === "scripts") rmSync(dst, { recursive: true, force: true });
    mkdirSync(path.dirname(dst), { recursive: true });
    cpSync(src, dst, { recursive: true });
  }
  for (const d of USER_DIRS) mkdirSync(path.join(dir, d), { recursive: true });
  if (!existsSync(path.join(dir, "topics-history.md"))) {
    writeFileSync(path.join(dir, "topics-history.md"), "# Журнал тем\n\nСюда записываются показанные и сделанные темы, чтобы они не повторялись.\n\n| Дата | Формат | Тема | Суть | Оси | Статус |\n|---|---|---|---|---|---|\n");
  }
  writeFileSync(path.join(dir, ".engine-version"), PLUGIN_VERSION + "\n");
  writeFileSync(path.join(dir, ".gitignore"), "node_modules\nout\n");
};

const [cmd, arg] = process.argv.slice(2);

if (cmd === "where" || cmd === undefined) {
  if (!nodeOk()) say(`NODE УСТАРЕЛ: ${process.versions.node}, нужен ${NODE_MIN.join(".")}+ — обнови Node.js (LTS)`);
  const { studio } = readConfig();
  if (!studio || !existsSync(path.join(studio, "package.json"))) {
    say("СТУДИИ НЕТ — нужна установка (node studio.mjs create \"<папка>\")");
  } else {
    const v = studioVersion(studio);
    say(`СТУДИЯ: ${studio}`);
    say(`Движок студии: ${v ?? "?"}, в плагине: ${PLUGIN_VERSION}${v !== PLUGIN_VERSION ? "  -> нужно обновление (node studio.mjs update)" : ""}`);
    if (!existsSync(path.join(studio, "node_modules"))) say("Зависимости не установлены -> node studio.mjs update");
  }
} else if (cmd === "check") {
  checkNode();
  const { studio } = readConfig();
  say(studio ? `Студия: ${studio}` : "Студия ещё не создана");
} else if (cmd === "create") {
  checkNode();
  if (!arg) fail('Укажи папку: node studio.mjs create "<папка>"');
  const dir = path.resolve(arg.replace(/^~(?=$|[\\/])/, os.homedir()));
  if (existsSync(path.join(dir, "package.json")) && studioVersion(dir) === null) fail(`В ${dir} уже лежит какой-то другой проект. Выбери пустую папку.`);
  mkdirSync(dir, { recursive: true });
  say(`Создаю студию в ${dir}`);
  copyEngine(dir, { update: false });
  writeFileSync(CONFIG, JSON.stringify({ ...readConfig(), studio: dir }, null, 2));
  if (!run(npm, ["install", "--no-audit", "--no-fund"], dir)) fail("npm install не прошёл. Проверь интернет и запусти снова: node studio.mjs update");
  if (!run(npm, ["run", "sfx"], dir)) fail("Не получилось сгенерировать звуки (npm run sfx)");
  say("\nПробный ролик (3 секунды), чтобы проверить, что рендер работает...");
  if (!run(npm, ["run", "timing", "--", "demo"], dir)) fail("Тест: timing не прошёл");
  if (!run(npm, ["run", "render", "--", "demo", "--seconds", "3"], dir)) {
    fail("Тест-рендер не прошёл. Чаще всего это драйвер видеокарты или антивирус, который не даёт запустить встроенный браузер Remotion. Пришли текст ошибки.");
  }
  say(`\nГОТОВО. Студия: ${dir}\nТест: ${path.join(dir, "out", "demo-test.mp4")}`);
} else if (cmd === "update") {
  checkNode();
  const { studio } = readConfig();
  if (!studio || !existsSync(studio)) fail("Студия не найдена. Сначала: node studio.mjs create \"<папка>\"");
  const before = existsSync(path.join(studio, "package-lock.json")) ? readFileSync(path.join(studio, "package-lock.json"), "utf8") : "";
  const from = studioVersion(studio);
  copyEngine(studio, { update: true });
  const after = readFileSync(path.join(studio, "package-lock.json"), "utf8");
  if (before !== after || !existsSync(path.join(studio, "node_modules"))) {
    if (!run(npm, ["install", "--no-audit", "--no-fund"], studio)) fail("npm install не прошёл. Проверь интернет и повтори.");
  }
  run(npm, ["run", "sfx"], studio);
  say(`\nДвижок обновлён: ${from ?? "?"} -> ${PLUGIN_VERSION}. Свои локации (src/custom), ролики и озвучки на месте.`);
} else {
  fail(`Не знаю команду «${cmd}». Есть: where, check, create, update`);
}
