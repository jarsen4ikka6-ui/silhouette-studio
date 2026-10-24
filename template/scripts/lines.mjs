// Кто и когда говорит: сценарий script/<ролик>.md + расшифровка transcripts/<ролик>.json.
// Озвучка читается одним голосом, но в сценарии реплики подписаны: «МАМА: Это откуда?».
// Скрипт сопоставляет слова сценария со словами расшифровки и находит время каждой реплики.
// Запуск: npm run lines -- <ролик>
// Результат: transcripts/<ролик>.lines.json — [{ who, text, start, end, words: [{ w, start, end }] }]
//            (who = null — рассказчик; время в секундах от начала озвучки)
//            transcripts/<ролик>.lines.txt — то же для чтения: [12.30 - 14.10] МАМА: …
// По lines.json команда timing сама ставит пузыри реплик и открывает рот у говорящего (cast в доске).
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const name = process.argv[2];
if (!name) throw new Error("Укажи ролик: npm run lines -- <имя>");
const scriptFile = [`script/${name}.md`, `script/${name}.txt`].find((f) => existsSync(f));
if (!scriptFile) throw new Error(`Нет сценария script/${name}.md`);
const tr = JSON.parse(readFileSync(`transcripts/${name}.json`, "utf8"));

// реплика: имя заглавными и двоеточие в начале строки
const SPEAKER = /^([А-ЯЁA-Z][А-ЯЁA-Z0-9 .\-]{0,40}?):\s*(.+)$/u;
const norm = (s) => s.toLowerCase().replace(/ё/g, "е").split(/[^\p{L}\p{N}]+/u).filter(Boolean);

// 1. сценарий -> куски (рассказчик / реплики)
let md = readFileSync(scriptFile, "utf8").replace(/\r/g, "");
const cut = md.search(/^-{3,}\s*$/m); // источники после линии не читаются
if (cut > 0) md = md.slice(0, cut);
const segs = [];
for (let line of md.split("\n")) {
  line = line.replace(/\*\*|__/g, "").trim();
  if (!line || line.startsWith("#") || line.startsWith("|") || line.startsWith(">")) continue;
  const m = line.match(SPEAKER);
  if (m && m[1] === m[1].toUpperCase() && /[А-ЯЁA-Z]{2}/u.test(m[1])) segs.push({ who: m[1].trim(), text: m[2].trim() });
  else segs.push({ who: null, text: line });
}
if (!segs.length) throw new Error(`Сценарий ${scriptFile} пустой`);

// слова сценария: исходное слово (с пунктуацией) + его токены
const sw = []; // { seg, w, toks: [индексы в st] }
const st = []; // токены сценария { tk, word }
segs.forEach((s, si) => {
  for (const w of s.text.split(/\s+/).filter(Boolean)) {
    const toks = norm(w);
    const word = { seg: si, w, toks: [] };
    for (const tk of toks) {
      word.toks.push(st.length);
      st.push({ tk, word: sw.length });
    }
    sw.push(word);
  }
});
// токены расшифровки
const tt = [];
for (const w of tr.words) for (const tk of norm(w.text)) tt.push({ tk, start: w.start, end: w.end });

// 2. выравнивание (как diff): совпадение 0, похожее слово 0.4, замена 1, пропуск 1
const like = (a, b) => (a === b ? 0 : a.length >= 5 && b.length >= 5 && a.slice(0, 4) === b.slice(0, 4) ? 0.4 : 1);
const N = st.length;
const M = tt.length;
const back = new Uint8Array((N + 1) * (M + 1)); // 1 — по диагонали, 2 — пропуск в сценарии, 3 — пропуск в расшифровке
let prev = new Float32Array(M + 1);
let cur = new Float32Array(M + 1);
for (let j = 0; j <= M; j++) {
  prev[j] = j;
  back[j] = 3;
}
for (let i = 1; i <= N; i++) {
  cur[0] = i;
  back[i * (M + 1)] = 2;
  const a = st[i - 1].tk;
  for (let j = 1; j <= M; j++) {
    const d = prev[j - 1] + like(a, tt[j - 1].tk);
    const up = prev[j] + 1;
    const left = cur[j - 1] + 1;
    let v = d;
    let b = 1;
    if (up < v) {
      v = up;
      b = 2;
    }
    if (left < v) {
      v = left;
      b = 3;
    }
    cur[j] = v;
    back[i * (M + 1) + j] = b;
  }
  [prev, cur] = [cur, prev];
}
const match = new Int32Array(N).fill(-1);
let good = 0;
for (let i = N, j = M; i > 0 || j > 0; ) {
  const b = back[i * (M + 1) + j];
  if (i > 0 && j > 0 && b === 1) {
    if (like(st[i - 1].tk, tt[j - 1].tk) < 1) {
      match[i - 1] = j - 1;
      good++;
    }
    i--;
    j--;
  } else if (i > 0 && (b === 2 || j === 0)) i--;
  else j--;
}

// 3. время каждого слова сценария: по найденным токенам, остальное — между соседями
const tStart = new Float64Array(N).fill(NaN);
const tEnd = new Float64Array(N).fill(NaN);
for (let i = 0; i < N; i++)
  if (match[i] >= 0) {
    tStart[i] = tt[match[i]].start;
    tEnd[i] = tt[match[i]].end;
  }
for (let i = 0; i < N; i++) {
  if (!Number.isNaN(tStart[i])) continue;
  let a = i - 1;
  while (a >= 0 && Number.isNaN(tStart[a])) a--;
  let b = i + 1;
  while (b < N && Number.isNaN(tStart[b])) b++;
  const t0 = a >= 0 ? tEnd[a] : 0;
  const t1 = b < N ? tStart[b] : tr.duration;
  const k = (i - a) / (b - a);
  const k2 = (i - a + 1) / (b - a);
  tStart[i] = t0 + (t1 - t0) * k * 0.98;
  tEnd[i] = Math.max(tStart[i] + 0.05, t0 + (t1 - t0) * Math.min(1, k2) * 0.98);
}

const lines = segs.map((s, si) => {
  const words = sw
    .filter((w) => w.seg === si && w.toks.length)
    .map((w) => ({ w: w.w, start: +tStart[w.toks[0]].toFixed(2), end: +tEnd[w.toks[w.toks.length - 1]].toFixed(2) }));
  return { who: s.who, text: s.text, start: words[0]?.start ?? 0, end: words.at(-1)?.end ?? 0, words };
});

writeFileSync(`transcripts/${name}.lines.json`, JSON.stringify(lines, null, 1));
const fmt = (x) => x.toFixed(2).padStart(7);
writeFileSync(`transcripts/${name}.lines.txt`, lines.map((l) => `[${fmt(l.start)} - ${fmt(l.end)}] ${l.who ? `${l.who}: ` : ""}${l.text}`).join("\n") + "\n");

const who = {};
for (const l of lines) if (l.who) who[l.who] = (who[l.who] ?? 0) + 1;
const pct = Math.round((good / Math.max(1, N)) * 100);
console.log(`Сценарий и озвучка совпали на ${pct}% слов. Реплик: ${Object.entries(who).map(([k, v]) => `${k} ${v}`).join(", ") || "нет"}`);
console.log(`-> transcripts/${name}.lines.json, transcripts/${name}.lines.txt`);
if (pct < 80) console.log("ВНИМАНИЕ: озвучка сильно отличается от сценария. Проверь, тот ли это сценарий и не поменяли ли текст при озвучке: время реплик может быть неточным.");
