// Раскадровка под озвучку: boards/<имя>.json (фразы) -> data/<имя>.json (секунды).
// В доске время пишется фразой диктора, а не числом:
//   "start": "Рука нащупывает"          — сцена начинается с этих слов
//   "at": "@Телефона нет"                — любое поле-строка с @ = секунда этих слов от начала сцены
//   "at": "@Телефона нет|+0.4"           — со сдвигом
//   "dur": "@Все до одного|end"          — до конца этих слов (для dur: длина от at)
// Фраза ищется в transcripts/<имя>.json (npm run transcribe) начиная с начала сцены, регистр, ё/е и знаки не важны.
// Ролик без диктора (История): озвучки нет, у сцен пишется "dur" (секунды) или "start" числом, at — секундами.
// Запуск: npm run timing -- 01-bez-telefonov   (заодно генерирует музыку ролика)
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

const name = process.argv[2];
if (!name) throw new Error("Укажи доску: npm run timing -- <имя файла из boards/ без .json>");
const board = JSON.parse(readFileSync(`boards/${name}.json`, "utf8"));
const trFile = [`transcripts/${name}.json`].find((f) => existsSync(f));
const tr = trFile ? JSON.parse(readFileSync(trFile, "utf8")) : { duration: 0, words: [] };
if (!trFile) console.log(`Озвучки нет (transcripts/${name}.json) — ролик без диктора, время берётся из секунд в доске`);
board.id ??= name;
if (trFile && board.voice === undefined) board.voice = tr.voice;
const voiceAt = board.voiceAt ?? 0;
const LEAD = board.lead ?? 0.25; // сцена начинается чуть раньше первого слова

const norm = (s) => s.toLowerCase().replace(/ё/g, "е").split(/[^\p{L}\p{N}]+/u).filter(Boolean);
const tokens = [];
for (const w of tr.words) for (const tk of norm(w.text)) tokens.push({ tk, start: w.start + voiceAt, end: w.end + voiceAt });

// секунда фразы в ролике (не раньше from)
const find = (phrase, from, where) => {
  const want = norm(phrase);
  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i].start < from - 0.3) continue;
    let ok = true;
    for (let k = 0; k < want.length; k++) if (tokens[i + k]?.tk !== want[k]) { ok = false; break; }
    if (ok) return { start: tokens[i].start, end: tokens[i + want.length - 1].end };
  }
  throw new Error(`Не нашёл фразу «${phrase}» после ${from.toFixed(1)} c (${where}). Сверь с transcripts/${name}.txt`);
};

const parseRef = (s) => {
  const [phrase, mod = ""] = s.slice(1).split("|");
  return { phrase, mod: mod.trim() };
};

// 1. начала сцен
const starts = [];
board.scenes.forEach((s, i) => {
  const prev = i ? starts[i - 1] : 0;
  if (i === 0) starts.push(0);
  else if (typeof s.start === "number") starts.push(s.start);
  else if (typeof s.start === "string") starts.push(find(s.start, prev, `сцена ${i + 1}`).start - LEAD + (s.shift ?? 0));
  // без озвучки можно задавать длину сцен: "dur": 4.5 — следующая начнётся через 4.5 c
  else if (s.start === undefined && typeof board.scenes[i - 1].dur === "number") starts.push(prev + board.scenes[i - 1].dur);
  else throw new Error(`Сцена ${i + 1}: нет start (фраза, с которой она начинается) или dur у предыдущей сцены`);
});
// длина ролика: озвучка + хвост; без озвучки — до конца последней сцены
const total = trFile ? voiceAt + tr.duration + (board.tail ?? 3) : starts[starts.length - 1] + (typeof board.scenes.at(-1).dur === "number" ? board.scenes.at(-1).dur : board.tail ?? 5);

// 2. внутри сцены: все строки "@фраза" -> секунды от начала сцены
const resolve = (v, sceneStart, where, key) => {
  if (typeof v === "string" && v.startsWith("@")) {
    const { phrase, mod } = parseRef(v);
    const hit = find(phrase, sceneStart, where);
    let sec = (mod === "end" ? hit.end : hit.start) - sceneStart;
    if (/^[+-]\d/.test(mod)) sec += Number(mod);
    return Math.max(0, Math.round(sec * 100) / 100);
  }
  if (Array.isArray(v)) return v.map((x) => resolve(x, sceneStart, where, key));
  if (v && typeof v === "object") {
    const out = {};
    for (const [k, x] of Object.entries(v)) out[k] = resolve(x, sceneStart, where, k);
    // dur, заданный фразой, считаем от at этого же элемента
    if (typeof v.dur === "string" && v.dur.startsWith("@")) out.dur = Math.max(0.3, Math.round((out.dur - (out.at ?? 0)) * 100) / 100);
    return out;
  }
  return v;
};

// постоянные персонажи: "look": "hero" -> внешность из board.looks
const looks = board.looks ?? {};
for (const s of board.scenes)
  for (const a of s.actors ?? []) {
    if (typeof a.look !== "string") continue;
    if (!looks[a.look]) throw new Error(`Нет внешности «${a.look}» в looks`);
    a.look = looks[a.look];
  }

const scenes = board.scenes.map((s, i) => {
  const start = starts[i];
  const end = i + 1 < starts.length ? starts[i + 1] : total;
  const dur = Math.round((end - start) * 100) / 100;
  if (dur <= 0.2) throw new Error(`Сцена ${i + 1} («${s.note ?? ""}») получилась ${dur} c — проверь start у неё и у следующей`);
  const { start: _s, shift: _sh, ...rest } = s;
  return { ...resolve(rest, start, `сцена ${i + 1}`), dur };
});

// 3. табличка с числом должна успеть докрутиться до цифры и повисеть: короткий dur продлеваем сами
// (задержка + накрутка + 1.2 c с готовой цифрой + 0.4 c затухание), но не дальше конца сцены
const ROLL = { stat: [0.25, 1.6], counter: [0.2, 2], meter: [0.4, 1.8], bars: [0.3, 1.4] };
const warns = [];
for (const [i, s] of scenes.entries())
  for (const o of s.overlays ?? []) {
    if (o.dur === undefined) continue;
    const at = o.at ?? 0;
    const roll = ROLL[o.kind];
    if (roll) {
      const run = (o.time ?? roll[1]) + (o.kind === "bars" ? 0.35 * ((o.items?.length ?? 1) - 1) : 0);
      const need = roll[0] + run + 1.6;
      if (o.dur < need) o.dur = Math.round(Math.min(need, s.dur - at) * 100) / 100;
      if (o.dur < need) warns.push(`Сцена ${i + 1}: «${o.kind}» висит только ${o.dur} c, число крутится быстрее. Лучше начать его раньше или продлить сцену`);
    } else if (o.dur < 1.2) warns.push(`Сцена ${i + 1}: «${o.kind}» видно всего ${o.dur} c — зритель не успеет прочитать`);
  }

const music = (board.music ?? []).map((m) => ({ ...m, from: typeof m.from === "string" ? find(m.from.replace(/^@/, ""), 0, "music").start - 1 : m.from }));
const { scenes: _x, lead: _l, tail: _t, looks: _lk, ...head } = board;
mkdirSync("data", { recursive: true });
const hero = looks.hero ?? Object.values(looks)[0];
writeFileSync(`data/${name}.json`, JSON.stringify({ fps: 30, width: 1920, height: 1080, ...head, ...(hero ? { hero } : {}), music, scenes }, null, 2));

let acc = 0;
for (const [i, s] of scenes.entries()) {
  const m = Math.floor(acc / 60);
  console.log(`${String(i + 1).padStart(2)}  ${m}:${(acc % 60).toFixed(1).padStart(4, "0")}  ${s.dur.toFixed(1).padStart(5)} c  ${s.card ? "[карточка]" : s.location}  ${s.note ?? ""}`);
  acc += s.dur;
}
for (const w of warns) console.log(`ВНИМАНИЕ: ${w}`);
console.log(`Готово: ${scenes.length} сцен, ${Math.floor(total / 60)}:${String(Math.round(total % 60)).padStart(2, "0")} -> data/${name}.json`);

// музыка под этот ролик (если не свой трек)
if (!board.musicFile && music.length) {
  const r = spawnSync(process.execPath, ["scripts/make-music.mjs", board.id], { stdio: "inherit" });
  if (r.status !== 0) process.exit(r.status ?? 1);
}
