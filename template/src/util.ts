import { Easing, interpolate } from "remotion";

export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const ease = Easing.bezier(0.45, 0, 0.25, 1);

// Значение, которое плавно меняется за сцену: число или [откуда, куда]
export const along = <T extends number>(v: T | [T, T] | undefined, p: number, def: number): number => {
  if (v === undefined) return def;
  if (Array.isArray(v)) return v[0] + (v[1] - v[0]) * ease(clamp(p));
  return v;
};

// Плавное появление и исчезновение элемента: возвращает прозрачность 0..1
export const fadeWindow = (t: number, at = 0, dur = Infinity, fin = 0.35, fout = 0.35) => {
  if (t < at) return 0;
  const a = clamp((t - at) / fin);
  const b = dur === Infinity ? 1 : clamp((at + dur - t) / fout);
  return Math.min(a, b);
};

// Детерминированный «случайный» ряд: одинаковый на каждом кадре
export const rand = (seed: number) => {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

export const dbToGain = (db: number) => Math.pow(10, db / 20);

export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

export { interpolate };
