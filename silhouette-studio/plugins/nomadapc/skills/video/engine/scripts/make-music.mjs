// Музыка по настроению -> public/music/<id>-<N>.wav (по одной части на главу).
// Читает раскадровки из data/*.json: поле music: [{ mood, from }].
// Настроения: sad (грустное фортепиано), hope (надежда, светлее), bright (лёгкая «любопытная» для объяснялок).
// Запуск: npm run music            — для всех раскадровок
//         npm run music -- story   — только для ролика с id "story"
import { readdirSync, readFileSync } from "node:fs";
import { FS, bell, buf, fade, marimba, noiseHit, pad, piano, reverb, writeWav } from "./dsp.mjs";

const XFADE = 2;

const MOODS = {
  sad: {
    bpm: 64,
    chords: [[57, 60, 64], [53, 57, 60], [55, 60, 64], [55, 59, 62]],
    bass: [45, 41, 48, 43],
    melody: [
      [[0, 76, 1.5], [1.5, 74, 0.5], [2, 72, 2]],
      [[0, 72, 1.5], [1.5, 74, 0.5], [2, 69, 2]],
      [[0, 67, 1], [1, 72, 1], [2, 76, 2]],
      [[0, 74, 3], [3, 71, 1]],
    ],
    arp: [0, 1, 2, 3, 2, 1, 2, 1],
    voice: "piano",
  },
  hope: {
    bpm: 76,
    chords: [[60, 64, 67], [59, 62, 67], [57, 60, 64], [57, 60, 65]],
    bass: [48, 47, 45, 41],
    melody: [
      [[0, 79, 1], [1, 76, 1], [2, 72, 1], [3, 74, 1]],
      [[0, 74, 2], [2, 79, 2]],
      [[0, 76, 1], [1, 72, 1], [2, 76, 1], [3, 77, 1]],
      [[0, 77, 2], [2, 76, 1], [3, 74, 1]],
    ],
    arp: [0, 1, 2, 3, 1, 2, 3, 2],
    voice: "piano",
  },
  bright: {
    bpm: 104,
    chords: [[65, 69, 72], [64, 67, 72], [62, 65, 69], [62, 65, 70]],
    bass: [41, 48, 50, 46],
    melody: [
      [[0, 84, 0.5], [0.5, 81, 0.5], [1.5, 79, 0.5], [2, 81, 1]],
      [[0, 79, 0.5], [0.5, 76, 0.5], [2, 72, 1]],
      [[0, 77, 0.5], [0.5, 81, 0.5], [1.5, 84, 0.5], [2, 81, 1]],
      [[0, 82, 1], [1.5, 81, 0.5], [2, 77, 1.5]],
    ],
    arp: [0, 2, 1, 2, 0, 2, 1, 3],
    voice: "marimba",
  },
};

const compose = (moodName, sec) => {
  const m = MOODS[moodName] ?? MOODS.sad;
  const beat = 60 / m.bpm;
  const bar = beat * 4;
  const b = buf(sec + 3);
  const bars = Math.ceil(sec / bar) + 1;
  for (let k = 0; k < bars; k++) {
    const t0 = k * bar;
    if (t0 > sec) break;
    const c = k % 4;
    const ch = m.chords[c];
    const tones = [...ch, ch[0] + 12];
    const cycle = Math.floor(k / 4);
    if (m.voice === "piano") {
      piano(b, t0, m.bass[c], bar * 0.95, 0.42);
      pad(b, t0, ch.map((n) => n - 12), bar, 0.05);
      m.arp.forEach((idx, j) => piano(b, t0 + j * beat * 0.5, tones[idx], beat * 0.9, 0.16 + (j === 0 ? 0.05 : 0)));
      // мелодия появляется со второго круга, на четвёртом — передышка
      if (cycle % 4 !== 0 && cycle % 4 !== 3) m.melody[c].forEach(([at, n, d]) => piano(b, t0 + at * beat, n, d * beat, 0.26));
    } else {
      marimba(b, t0, m.bass[c], 0.5, 5);
      marimba(b, t0 + beat * 2, m.bass[c], 0.4, 5);
      m.arp.forEach((idx, j) => marimba(b, t0 + j * beat * 0.5, tones[idx], j % 2 ? 0.16 : 0.22, 9));
      for (let j = 0; j < 8; j++) noiseHit(b, t0 + j * beat * 0.5 + beat * 0.25, 7000, 60, 0.05, k * 8 + j, 1);
      noiseHit(b, t0 + beat, 1600, 40, 0.12, k + 500, 1.2);
      noiseHit(b, t0 + beat * 3, 1600, 40, 0.12, k + 700, 1.2);
      if (cycle % 2 === 1 || k % 4 === 2) m.melody[c].forEach(([at, n]) => bell(b, t0 + at * beat, n, 0.13));
      pad(b, t0, ch.map((n) => n - 12), bar, 0.03);
    }
  }
  const L = reverb(b, m.voice === "piano" ? 0.35 : 0.22, 1, 0);
  const R = reverb(b, m.voice === "piano" ? 0.35 : 0.22, 1.03, 3);
  const n = Math.ceil(sec * FS);
  const left = fade(L.slice(0, n), 0.05, 2.5);
  const right = fade(R.slice(0, n), 0.05, 2.5);
  // общий уровень: нормируем по обоим каналам
  let peak = 0;
  for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs(left[i]), Math.abs(right[i]));
  for (let i = 0; i < n; i++) {
    left[i] = (left[i] / peak) * 0.85;
    right[i] = (right[i] / peak) * 0.85;
  }
  return [left, right];
};

const only = process.argv[2];
for (const f of readdirSync("data").filter((x) => x.endsWith(".json"))) {
  const p = JSON.parse(readFileSync(`data/${f}`, "utf8"));
  if (!p.scenes || !p.music?.length || p.musicFile) continue;
  if (only && p.id !== only) continue;
  const total = p.scenes.reduce((a, s) => a + s.dur, 0);
  p.music.forEach((part, i) => {
    const start = Math.max(0, part.from - (i ? XFADE / 2 : 0));
    const end = i + 1 < p.music.length ? p.music[i + 1].from + XFADE / 2 : total;
    const sec = end - start + 0.5;
    writeWav(`public/music/${p.id}-${i + 1}.wav`, compose(part.mood, sec));
    console.log(`  music/${p.id}-${i + 1}.wav  ${part.mood}  ${sec.toFixed(1)} c`);
  });
}
console.log("Музыка готова");
