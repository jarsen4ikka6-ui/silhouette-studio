// Общее для всего ролика: стиль людей, громкость озвучки по кадрам (для рта), плашки сверху.
// И интерфейс стиля toon: пузыри реплик, жёлтые плашки, крупные слова, счётчики «ПОТРАЧЕНО» и «ДЕНЬ 1».
import React, { createContext, useContext } from "react";
import { RUBIK } from "./fonts";
import type { HudItem } from "./types";
import { clamp, ease, fadeWindow } from "./util";

export const ENV_FPS = 30; // огибающая озвучки: одно число 0..100 на каждую 1/30 секунды

export type FilmInfo = { style: "silhouette" | "toon"; env?: number[]; voiceAt: number; hud?: HudItem[] };
export const Film = createContext<FilmInfo>({ style: "silhouette", voiceAt: 0 });
export const useFilm = () => useContext(Film);

// Насколько открыт рот в момент T (секунды от начала ролика): по громкости озвучки.
// Без озвучки (история) — ровное «бормотание», чтобы рот всё равно двигался.
export const mouthAt = (film: FilmInfo, T: number) => {
  if (!film.env?.length) {
    const w = Math.sin(T * 13.1) * 0.5 + Math.sin(T * 7.3 + 1) * 0.35 + Math.sin(T * 21.7) * 0.15;
    return clamp(0.25 + w * 0.6);
  }
  const f = (T - film.voiceAt) * ENV_FPS;
  const i = Math.floor(f);
  const a = film.env[i] ?? 0;
  const b = film.env[i + 1] ?? 0;
  const v = (a + (b - a) * (f - i)) / 100;
  // тихие звуки — рот закрыт, громкие — раскрыт; небольшой порог, чтобы не дрожал на шуме
  return clamp((v - 0.12) / 0.7);
};

const INK = "#1e2233";
const CREAM = "#f6f2ea";

// Пузырь реплики. (x, y) — куда указывает хвостик (над головой или сбоку от неё)
export const ToonBubble: React.FC<{ text: string; t: number; at: number; dur: number; x: number; y: number; tail: "down" | "left" | "right"; think?: boolean }> = ({ text, t, at, dur, x, y, tail, think }) => {
  const op = fadeWindow(t, at, dur, 0.12, 0.2);
  if (op <= 0) return null;
  const k = clamp((t - at) / 0.22);
  const pop = 0.88 + 0.12 * ease(k) + Math.sin(k * Math.PI) * 0.04;
  const len = text.length;
  const size = len > 90 ? 36 : len > 50 ? 40 : 44;
  const tr = tail === "down" ? "translate(-50%, -100%)" : tail === "left" ? "translate(0, -50%)" : "translate(-100%, -50%)";
  const origin = tail === "down" ? "50% 100%" : tail === "left" ? "0 50%" : "100% 50%";
  const pad = tail === "down" ? { paddingBottom: 26 } : tail === "left" ? { paddingLeft: 26 } : { paddingRight: 26 };
  const tailPos: React.CSSProperties = tail === "down" ? { left: "50%", bottom: 0, marginLeft: -23 } : tail === "left" ? { left: 0, top: "50%", marginTop: -23 } : { right: 0, top: "50%", marginTop: -23 };
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: `${tr} scale(${pop})`, transformOrigin: origin, opacity: op, ...pad }}>
      <div style={{ position: "relative", background: CREAM, border: `4px solid ${INK}`, borderRadius: think ? 46 : 24, padding: "16px 26px 18px", maxWidth: 660, minWidth: 120, boxShadow: "0 10px 0 rgba(10,12,24,0.28)", fontFamily: RUBIK, fontWeight: 700, fontSize: size, lineHeight: 1.18, color: "#22232b", textAlign: len > 40 ? "left" : "center", fontStyle: think ? "italic" : undefined }}>
        {text}
      </div>
      <svg width={46} height={30} viewBox={tail === "down" ? "0 0 46 30" : "0 0 30 46"} style={{ position: "absolute", overflow: "visible", ...tailPos, ...(tail === "down" ? {} : { width: 30, height: 46 }) }}>
        {think ? (
          tail === "down" ? (
            <g fill={CREAM} stroke={INK}>
              <circle cx={23} cy={8} r={8} strokeWidth={4} />
              <circle cx={23} cy={25} r={4.5} strokeWidth={3} />
            </g>
          ) : (
            <g fill={CREAM} stroke={INK}>
              <circle cx={tail === "left" ? 20 : 10} cy={23} r={8} strokeWidth={4} />
              <circle cx={tail === "left" ? 4 : 26} cy={23} r={4.5} strokeWidth={3} />
            </g>
          )
        ) : (
          <g>
            <path d={tail === "down" ? "M 6 -2 L 16 28 L 40 -2" : tail === "left" ? "M 32 6 L 2 16 L 32 40" : "M -2 6 L 28 16 L -2 40"} fill={CREAM} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
            {/* закрываем рамку пузыря там, где выходит хвостик */}
            <path d={tail === "down" ? "M 9 -4 L 37 -4" : tail === "left" ? "M 34 9 L 34 37" : "M -4 9 L -4 37"} stroke={CREAM} strokeWidth={7} />
          </g>
        )}
      </svg>
    </div>
  );
};

// Жёлтая плашка внизу кадра, чуть наклонена: «АКЦИЯ», «Ни банка, ни договора»
export const Plate: React.FC<{ text: string; t: number; at: number; dur: number; y?: number; tilt?: number }> = ({ text, t, at, dur, y = 880, tilt = -2 }) => {
  const op = fadeWindow(t, at, dur, 0.1, 0.25);
  if (op <= 0) return null;
  const k = ease(clamp((t - at) / 0.28));
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: y, display: "flex", justifyContent: "center", opacity: op }}>
      <div style={{ transform: `rotate(${tilt}deg) scale(${0.7 + 0.3 * k})`, background: "#f6c63b", border: `4px solid ${INK}`, borderRadius: 14, padding: "10px 34px 12px", boxShadow: "0 8px 0 rgba(10,12,24,0.35)", fontFamily: RUBIK, fontWeight: 800, fontSize: 54, color: INK, letterSpacing: 0.5, textTransform: "uppercase", whiteSpace: "nowrap" }}>
        {text}
      </div>
    </div>
  );
};

// Крупные слова по центру; *звёздочками* — золотые: «ТЕБЯ ИЩЕТ *ВЕСЬ МИР*»
export const Shout: React.FC<{ text: string; t: number; at: number; dur: number; y?: number }> = ({ text, t, at, dur, y = 540 }) => {
  const op = fadeWindow(t, at, dur, 0.08, 0.3);
  if (op <= 0) return null;
  const parts = text.split("*");
  const words = parts.flatMap((p, i) => p.split(/\s+/).filter(Boolean).map((w) => ({ w, gold: i % 2 === 1 })));
  return (
    <div style={{ position: "absolute", left: 80, right: 80, top: y, transform: "translateY(-50%)", display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "0 26px", opacity: op }}>
      {words.map(({ w, gold }, i) => {
        const k = clamp((t - at - i * 0.12) / 0.25);
        return (
          <span key={i} style={{ display: "inline-block", transform: `scale(${0.6 + 0.4 * ease(k) + Math.sin(k * Math.PI) * 0.08})`, opacity: k > 0 ? 1 : 0, fontFamily: RUBIK, fontWeight: 900, fontSize: 150, lineHeight: 1.05, color: gold ? "#f6c63b" : "#fbf8f1", WebkitTextStroke: `6px ${INK}`, paintOrder: "stroke fill", textShadow: "0 10px 0 rgba(10,12,24,0.45)", textTransform: "uppercase" }}>
            {w}
          </span>
        );
      })}
    </div>
  );
};

// число в конце текста накручивается от прошлого значения: «ПОТРАЧЕНО: 3 400» → «ПОТРАЧЕНО: 184 000»
const NUM = /(\d[\d\s]*)(\D*)$/;
const numOf = (s: string) => {
  const m = s.match(NUM);
  return m ? { head: s.slice(0, m.index), n: Number(m[1].replace(/\s/g, "")), tail: m[2] } : null;
};

// Плашки сверху, которые держатся через много сцен. T — секунды от начала ролика
export const Hud: React.FC<{ items: HudItem[]; T: number }> = ({ items, T }) => {
  const places = ["left", "right", "right2"] as const;
  return (
    <>
      {places.map((pl) => {
        const list = items.filter((h) => (h.place ?? "right") === pl && h.at <= T).sort((a, b) => a.at - b.at);
        const cur = list[list.length - 1];
        if (!cur || !cur.text) return null;
        const prev = list[list.length - 2];
        const since = T - cur.at;
        let text = cur.text;
        const a = prev?.text ? numOf(prev.text) : null;
        const b = numOf(cur.text);
        if (a && b && a.head === b.head && since < 0.9) text = `${b.head}${Math.round(a.n + (b.n - a.n) * ease(clamp(since / 0.9))).toLocaleString("ru-RU")}${b.tail}`;
        const bump = 1 + Math.sin(clamp(since / 0.3) * Math.PI) * 0.08;
        const fresh = !prev?.text ? clamp(since / 0.25) : 1;
        const gold = pl !== "left";
        return (
          <div
            key={pl}
            style={{
              position: "absolute",
              top: pl === "right2" ? 140 : 46,
              ...(pl === "left" ? { left: 56 } : { right: 56 }),
              transform: `scale(${bump * (0.8 + 0.2 * fresh)})`,
              transformOrigin: pl === "left" ? "0 0" : "100% 0",
              opacity: fresh,
              background: gold ? "linear-gradient(#ffd75a, #f0b52c)" : "rgba(14,18,36,0.55)",
              border: gold ? `4px solid ${INK}` : "4px solid #fbf8f1",
              borderRadius: 16,
              padding: "8px 24px 10px",
              boxShadow: gold ? "0 7px 0 rgba(10,12,24,0.35)" : undefined,
              fontFamily: RUBIK,
              fontWeight: 800,
              fontSize: pl === "right2" ? 36 : 44,
              color: gold ? INK : "#fbf8f1",
              letterSpacing: 1,
              whiteSpace: "nowrap",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {text}
          </div>
        );
      })}
    </>
  );
};

// Жёлтая косая лента на весь экран: «ДЕНЬ 1» и строка под ней. Въезжает слева, уезжает вправо
export const DayBand: React.FC<{ text: string; sub?: string; t: number; at: number; dur: number }> = ({ text, sub, t, at, dur }) => {
  if (t < at || t > at + dur) return null;
  const k = ease(clamp((t - at) / 0.35));
  const out = ease(clamp((t - (at + dur - 0.35)) / 0.35));
  const x = (1 - k) * -2200 + out * 2200;
  return (
    <div style={{ position: "absolute", left: -200, right: -200, top: 540, transform: `translate(${x}px, -50%) rotate(-5deg)`, display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ width: "100%", background: "#f6c63b", borderTop: `6px solid ${INK}`, borderBottom: `6px solid ${INK}`, boxShadow: "0 14px 0 rgba(10,12,24,0.4)", textAlign: "center", padding: "6px 0 12px", fontFamily: RUBIK, fontWeight: 900, fontSize: 190, lineHeight: 1.05, color: INK, letterSpacing: 6, textTransform: "uppercase" }}>
        {text}
      </div>
      {sub ? (
        <div style={{ marginTop: 26, background: INK, borderRadius: 12, padding: "10px 34px 14px", fontFamily: RUBIK, fontWeight: 800, fontSize: 54, color: "#fbf8f1", textTransform: "uppercase", opacity: clamp((t - at - 0.3) / 0.25) }}>
          {sub}
        </div>
      ) : null}
    </div>
  );
};

// Огромное золотое число по центру, накручивается от нуля: «184 650 ₽». label — строка над ним, from — с какого числа крутить
export const BigNum: React.FC<{ text: string; label?: string; from?: number; time?: number; t: number; at: number; dur: number; y?: number }> = ({ text, label, from = 0, time = 1.2, t, at, dur, y = 540 }) => {
  const op = fadeWindow(t, at, dur, 0.08, 0.3);
  if (op <= 0) return null;
  const m = text.match(/^(\D*)(\d[\d\s]*)(.*)$/);
  let shown = text;
  if (m) {
    const n = Number(m[2].replace(/\s/g, ""));
    const v = Math.round(from + (n - from) * ease(clamp((t - at - 0.2) / time)));
    shown = `${m[1]}${v.toLocaleString("ru-RU")}${m[3]}`;
  }
  const done = clamp((t - at - 0.2 - time) / 0.2);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: y, transform: "translateY(-50%)", display: "flex", flexDirection: "column", alignItems: "center", opacity: op }}>
      {label ? <div style={{ fontFamily: RUBIK, fontWeight: 800, fontSize: 64, color: "#fbf8f1", WebkitTextStroke: `4px ${INK}`, paintOrder: "stroke fill", textTransform: "uppercase", marginBottom: 6 }}>{label}</div> : null}
      <div style={{ fontFamily: RUBIK, fontWeight: 900, fontSize: 260, lineHeight: 1, color: "#f6c63b", WebkitTextStroke: `9px ${INK}`, paintOrder: "stroke fill", textShadow: "0 14px 0 rgba(10,12,24,0.45)", whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums", transform: `scale(${1 + Math.sin(done * Math.PI) * 0.08})` }}>
        {shown}
      </div>
    </div>
  );
};

// Название серии: лучи, тёмная рамка, крупный текст с *золотыми* словами и подпись (sub) сверху
export const TitleCard: React.FC<{ text: string; sub?: string; t: number; at: number; dur: number }> = ({ text, sub, t, at, dur }) => {
  const op = fadeWindow(t, at, dur, 0.15, 0.35);
  if (op <= 0) return null;
  const rays = (t - at) * 8;
  const parts = text.split("*");
  return (
    <div style={{ position: "absolute", inset: 0, opacity: op }}>
      <svg viewBox="0 0 1920 1080" width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <radialGradient id="ttlv" cx="0.5" cy="0.5" r="0.7">
            <stop offset="0.35" stopColor="#0a0c18" stopOpacity={0.15} />
            <stop offset="1" stopColor="#0a0c18" stopOpacity={0.75} />
          </radialGradient>
        </defs>
        <g transform={`translate(960 540) rotate(${rays})`} opacity={0.18}>
          {Array.from({ length: 16 }, (_, i) => (
            <path key={i} d="M 0 0 L -90 -1200 L 90 -1200 Z" fill="#f6c63b" transform={`rotate(${i * 22.5})`} />
          ))}
        </g>
        <rect width={1920} height={1080} fill="url(#ttlv)" />
      </svg>
      <div style={{ position: "absolute", left: 120, right: 120, top: 540, transform: `translateY(-50%) scale(${0.85 + 0.15 * ease(clamp((t - at) / 0.4))})`, textAlign: "center" }}>
        {sub ? <div style={{ fontFamily: RUBIK, fontWeight: 800, fontSize: 56, color: "#fbf8f1", letterSpacing: 4, textTransform: "uppercase", marginBottom: 18, opacity: 0.9 }}>{sub}</div> : null}
        <div style={{ fontFamily: RUBIK, fontWeight: 900, fontSize: 130, lineHeight: 1.05, color: "#fbf8f1", WebkitTextStroke: `7px ${INK}`, paintOrder: "stroke fill", textShadow: "0 12px 0 rgba(10,12,24,0.5)", textTransform: "uppercase" }}>
          {parts.map((p, i) => (
            <span key={i} style={{ color: i % 2 ? "#f6c63b" : "#fbf8f1" }}>
              {p}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
