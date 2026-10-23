// Мини-синтезатор: шум, фильтры, инструменты, ревербератор, запись WAV. Без внешних зависимостей.
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

export const FS = 44100;
export const TAU = Math.PI * 2;
export const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);

// Детерминированный шум: звуки одинаковые при каждой генерации
export const makeNoise = (seed = 1) => {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return (s / 4294967296) * 2 - 1;
  };
};

// Фильтр с плавающей частотой среза (state variable filter)
export const svf = () => {
  let low = 0;
  let band = 0;
  return (x, fc, q = 0.7) => {
    const f = 2 * Math.sin((Math.PI * Math.min(fc, FS / 6.5)) / FS);
    const high = x - low - band / Math.max(0.5, q);
    band += f * high;
    low += f * band;
    return { low, band, high };
  };
};

export const env = (t, a, d) => (t < 0 ? 0 : t < a ? t / a : Math.exp(-(t - a) * d));

export const buf = (sec) => new Float32Array(Math.ceil(sec * FS));

// Фортепиано: гармоники с разным затуханием и лёгкой «растяжкой» строя
export const piano = (out, start, note, dur, vel = 0.5) => {
  const f0 = midi(note);
  const i0 = Math.floor(start * FS);
  const len = Math.min(out.length - i0, Math.floor((dur + 2.5) * FS));
  const low = Math.max(0.6, 1.6 - (note - 48) / 40);
  for (let h = 1; h <= 8; h++) {
    const f = f0 * h * (1 + 0.0004 * h * h);
    if (f > 9000) break;
    const amp = vel / Math.pow(h, 1.45);
    const dec = (0.9 + 0.55 * h) / low;
    for (let i = 0; i < len; i++) {
      const t = i / FS;
      const rel = t > dur ? Math.exp(-(t - dur) * 6) : 1;
      out[i0 + i] += Math.sin(TAU * f * t) * amp * env(t, 0.004, dec) * rel;
    }
  }
};

// Маримба/щипок: основной тон + 4-я гармоника, быстрое затухание
export const marimba = (out, start, note, vel = 0.5, decay = 7) => {
  const f = midi(note);
  const i0 = Math.floor(start * FS);
  const len = Math.min(out.length - i0, Math.floor(1.2 * FS));
  for (let i = 0; i < len; i++) {
    const t = i / FS;
    out[i0 + i] += vel * (Math.sin(TAU * f * t) * env(t, 0.002, decay) + 0.25 * Math.sin(TAU * f * 4 * t) * env(t, 0.001, decay * 3.5));
  }
};

// Колокольчик (глокеншпиль): негармонические обертоны
export const bell = (out, start, note, vel = 0.3) => {
  const f = midi(note);
  const i0 = Math.floor(start * FS);
  const len = Math.min(out.length - i0, Math.floor(2 * FS));
  const parts = [[1, 1, 2.2], [2.76, 0.4, 4], [5.4, 0.2, 7]];
  for (let i = 0; i < len; i++) {
    const t = i / FS;
    let v = 0;
    for (const [m, a, d] of parts) v += a * Math.sin(TAU * f * m * t) * env(t, 0.001, d);
    out[i0 + i] += vel * v;
  }
};

// Мягкий пэд: расстроенные синусы с медленной атакой
export const pad = (out, start, notes, dur, vel = 0.08) => {
  const i0 = Math.floor(start * FS);
  const len = Math.min(out.length - i0, Math.floor((dur + 1.5) * FS));
  for (const n of notes) {
    const f = midi(n);
    for (const d of [-0.003, 0, 0.0035]) {
      for (let i = 0; i < len; i++) {
        const t = i / FS;
        const a = Math.min(1, t / 1.2) * (t > dur ? Math.max(0, 1 - (t - dur) / 1.5) : 1);
        out[i0 + i] += vel * a * Math.sin(TAU * f * (1 + d) * t) / 3;
      }
    }
  }
};

// Шумовой удар (шейкер, щелчок): полосовой шум с короткой огибающей
export const noiseHit = (out, start, fc, dec, vel, seed = 1, q = 1) => {
  const rnd = makeNoise(seed);
  const flt = svf();
  const i0 = Math.floor(start * FS);
  const len = Math.min(out.length - i0, Math.floor((6 / dec) * FS));
  for (let i = 0; i < len; i++) out[i0 + i] += flt(rnd(), fc, q).band * vel * env(i / FS, 0.002, dec);
};

// Ревербератор Шрёдера; разные задержки для левого и правого канала дают объём
export const reverb = (dry, wet = 0.3, size = 1, seed = 0) => {
  const combs = [1557, 1617, 1491, 1422, 1277, 1356].map((d) => Math.floor((d + seed * 23) * size));
  const aps = [225, 556, 441, 341].map((d) => d + seed * 7);
  const out = new Float32Array(dry.length);
  const cb = combs.map((d) => ({ b: new Float32Array(d), i: 0, lp: 0 }));
  const ab = aps.map((d) => ({ b: new Float32Array(d), i: 0 }));
  for (let n = 0; n < dry.length; n++) {
    const x = dry[n] * 0.015;
    let s = 0;
    for (const c of cb) {
      const y = c.b[c.i];
      c.lp = y * 0.75 + c.lp * 0.25;
      c.b[c.i] = x + c.lp * 0.84;
      c.i = (c.i + 1) % c.b.length;
      s += y;
    }
    for (const a of ab) {
      const y = a.b[a.i];
      a.b[a.i] = s + y * 0.5;
      a.i = (a.i + 1) % a.b.length;
      s = y - s * 0.5;
    }
    out[n] = dry[n] * (1 - wet) + s * wet * 4;
  }
  return out;
};

export const normalize = (b, peak = 0.9) => {
  let m = 0;
  for (let i = 0; i < b.length; i++) m = Math.max(m, Math.abs(b[i]));
  if (m > 0) for (let i = 0; i < b.length; i++) b[i] = (b[i] / m) * peak;
  return b;
};

export const fade = (b, inSec, outSec) => {
  const ni = Math.floor(inSec * FS);
  const no = Math.floor(outSec * FS);
  for (let i = 0; i < ni && i < b.length; i++) b[i] *= i / ni;
  for (let i = 0; i < no && i < b.length; i++) b[b.length - 1 - i] *= i / no;
  return b;
};

// Склейка конца с началом, чтобы фоновый звук играл по кругу без щелчка
export const makeLoop = (b, xSec = 0.5) => {
  const n = Math.floor(xSec * FS);
  const out = b.slice(0, b.length - n);
  for (let i = 0; i < n; i++) {
    const k = i / n;
    out[i] = out[i] * k + b[b.length - n + i] * (1 - k);
  }
  return out;
};

// WAV 16 бит; channels — массив каналов (моно или стерео)
export const writeWav = (file, channels) => {
  mkdirSync(path.dirname(file), { recursive: true });
  const ch = channels.length;
  const n = channels[0].length;
  const data = Buffer.alloc(n * 2 * ch);
  for (let i = 0; i < n; i++) {
    for (let c = 0; c < ch; c++) {
      const v = Math.max(-1, Math.min(1, channels[c][i]));
      data.writeInt16LE(Math.round(v * 32767), (i * ch + c) * 2);
    }
  }
  const h = Buffer.alloc(44);
  h.write("RIFF", 0);
  h.writeUInt32LE(36 + data.length, 4);
  h.write("WAVE", 8);
  h.write("fmt ", 12);
  h.writeUInt32LE(16, 16);
  h.writeUInt16LE(1, 20);
  h.writeUInt16LE(ch, 22);
  h.writeUInt32LE(FS, 24);
  h.writeUInt32LE(FS * 2 * ch, 28);
  h.writeUInt16LE(2 * ch, 32);
  h.writeUInt16LE(16, 34);
  h.write("data", 36);
  h.writeUInt32LE(data.length, 40);
  writeFileSync(file, Buffer.concat([h, data]));
};
