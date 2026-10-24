// Все виды текста на экране: реплики, мысли, уведомления, часы, карточки.
// Всё появляется мягким проявлением, без прыжков.
import React from "react";
import { AbsoluteFill } from "remotion";
import { CHALK, HAND, INTER, SANS, SERIF } from "./fonts";
import type { Card, Overlay, SceneText } from "./types";
import { clamp, ease, fadeWindow } from "./util";

const SHADOW = "0 0 18px rgba(0,0,0,0.85), 0 2px 4px rgba(0,0,0,0.7)";

// Мягкое тёмное пятно за текстом, как у Last Soul
const Blob: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ position: "relative", display: "inline-block" }}>
    <div style={{ position: "absolute", inset: "-26px -54px", background: "radial-gradient(ellipse at center, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.25) 45%, rgba(0,0,0,0) 72%)", filter: "blur(6px)" }} />
    <div style={{ position: "relative" }}>{children}</div>
  </div>
);

export const SpeechText: React.FC<{ item: SceneText; t: number; x: number; y: number }> = ({ item, t, x, y }) => {
  const op = fadeWindow(t, item.at ?? 0, item.dur ?? Infinity, 0.3, 0.3);
  if (op <= 0) return null;
  const rise = (1 - ease(clamp((t - (item.at ?? 0)) / 0.5))) * 10;
  const kind = item.kind;
  const color = kind === "think" ? "#f6c35b" : kind === "offscreen" ? "#9fd0ff" : "#ffffff";
  const size = kind === "think" ? 48 : 58;
  if (kind === "notif") {
    return (
      <div style={{ position: "absolute", left: x, top: y, transform: `translate(-10%, ${-100 + rise}%)`, opacity: op }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, background: "rgba(246,248,252,0.94)", color: "#1b2230", fontFamily: SANS, fontWeight: 600, fontSize: 26, padding: "14px 26px 14px 16px", borderRadius: 40, boxShadow: "0 8px 28px rgba(0,0,0,0.35)", whiteSpace: "nowrap" }}>
          <div style={{ width: 34, height: 34, borderRadius: 17, background: "#e04848", color: "#fff", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>▶</div>
          {item.text}
        </div>
      </div>
    );
  }
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: `translate(-50%, ${-100 + rise}%)`, opacity: op, textAlign: "center", whiteSpace: "pre-line" }}>
      <Blob>
        <div style={{ fontFamily: HAND, fontSize: size, color, textShadow: SHADOW, lineHeight: 1.15, maxWidth: 900 }}>{item.text}</div>
      </Blob>
    </div>
  );
};

export const OverlayView: React.FC<{ o: Overlay; t: number }> = ({ o, t }) => {
  const op = fadeWindow(t, o.at ?? 0, o.dur ?? Infinity, 0.4, 0.4);
  if (op <= 0) return null;
  if (o.kind === "clock") {
    return (
      <div style={{ position: "absolute", top: 70, left: 0, right: 0, textAlign: "center", opacity: op }}>
        <span style={{ fontFamily: SANS, fontWeight: 600, fontSize: 132, color: "#fff", textShadow: SHADOW, letterSpacing: 2 }}>{o.time}</span>
        {o.ampm ? <span style={{ fontFamily: SANS, fontWeight: 600, fontSize: 46, color: "#fff", textShadow: SHADOW, marginLeft: 14 }}>{o.ampm}</span> : null}
      </div>
    );
  }
  if (o.kind === "counter") {
    // число, которое накручивается (или таймер, который идёт вниз)
    const k = ease(clamp((t - (o.at ?? 0) - 0.2) / (o.time ?? 2)));
    const v = o.from + (o.to - o.from) * k;
    const txt = o.format === "mmss" ? `${Math.floor(Math.max(0, v) / 60)}:${String(Math.floor(Math.max(0, v) % 60)).padStart(2, "0")}` : Math.round(v).toLocaleString("ru-RU");
    return (
      <div style={{ position: "absolute", left: o.x ?? 0, right: o.x === undefined ? 0 : undefined, top: o.y ?? 70, textAlign: "center", opacity: op }}>
        <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 150, color: "#fff", textShadow: SHADOW, lineHeight: 1 }}>
          {txt}
          {o.suffix ? <span style={{ fontSize: 64, marginLeft: 14 }}>{o.suffix}</span> : null}
        </div>
        {o.label ? <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 30, letterSpacing: 6, color: "#f2c66d", textTransform: "uppercase", marginTop: 14, textShadow: SHADOW }}>{o.label}</div> : null}
      </div>
    );
  }
  if (o.kind === "bars") {
    const W0 = 760;
    return (
      <div style={{ position: "absolute", left: o.x ?? (1920 - W0 - 260) / 2, top: o.y ?? 110, opacity: op, padding: "34px 40px", borderRadius: 26, background: "rgba(8,10,16,0.72)" }}>
        {o.items.map((it, i) => {
          const k = ease(clamp((t - (o.at ?? 0) - 0.3 - i * 0.35) / 1.4));
          const color = it.color ?? "#f2c66d";
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 24, marginTop: i ? 26 : 0 }}>
              <div style={{ width: 260, fontFamily: SANS, fontWeight: 600, fontSize: 30, color: "#fff", textAlign: "right" }}>{it.label}</div>
              <div style={{ width: W0 - 200, height: 46, borderRadius: 23, background: "rgba(255,255,255,0.12)", overflow: "hidden" }}>
                <div style={{ width: `${it.value * k}%`, height: "100%", borderRadius: 23, background: color, boxShadow: `0 0 18px ${color}` }} />
              </div>
              <div style={{ width: 120, fontFamily: SANS, fontWeight: 700, fontSize: 40, color }}>{Math.round(it.value * k)}%</div>
            </div>
          );
        })}
      </div>
    );
  }
  if (o.kind === "caption") {
    return (
      <div style={{ position: "absolute", left: 110, bottom: 96, opacity: op }}>
        <div style={{ width: 80, height: 4, background: "#f2c66d", marginBottom: 18 }} />
        <div style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 78, color: "#fff", textShadow: SHADOW, letterSpacing: 4 }}>{o.text}</div>
      </div>
    );
  }
  if (o.kind === "term" || o.kind === "tip") {
    return (
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 360, background: "linear-gradient(rgba(0,0,0,0.78), rgba(0,0,0,0.45) 60%, rgba(0,0,0,0))", opacity: op }}>
        <div style={{ textAlign: "center", paddingTop: 70 }}>
          <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 30, letterSpacing: 7, color: o.kind === "tip" ? "#8fe3a0" : "#f2c66d", textTransform: "uppercase" }}>{o.title}</div>
          <div style={{ fontFamily: SERIF, fontStyle: "italic", fontWeight: 500, fontSize: 50, color: "#fff", marginTop: 18, padding: "0 260px", lineHeight: 1.2, textShadow: SHADOW }}>{o.text}</div>
        </div>
      </div>
    );
  }
  if (o.kind === "meter") {
    const k = ease(clamp((t - (o.at ?? 0) - 0.4) / 1.8));
    const v = o.from + (o.to - o.from) * k;
    const H = 360;
    const color = o.color ?? (v < 30 ? "#e8574a" : v < 60 ? "#f2c66d" : "#6fd38a");
    return (
      <div style={{ position: "absolute", left: o.x ?? 1560, top: o.y ?? 300, opacity: op, display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
        <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 28, color: "#fff", letterSpacing: 4, textTransform: "uppercase", textShadow: SHADOW }}>{o.label}</div>
        <div style={{ position: "relative", width: 64, height: H, borderRadius: 32, background: "rgba(10,12,18,0.75)", border: "4px solid rgba(255,255,255,0.85)", overflow: "hidden" }}>
          <div style={{ position: "absolute", left: 6, right: 6, bottom: 6, height: ((H - 12) * v) / 100, borderRadius: 26, background: color, boxShadow: `0 0 24px ${color}` }} />
        </div>
        <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: 40, color, textShadow: SHADOW }}>{Math.round(v)}%</div>
      </div>
    );
  }
  return <AwakenOverlay o={o} t={t} op={op} />;
};

// ---------- Стиль Awaken: плашки, календарь, счётчик, кубики, метки, панели ----------
const NAVY = "rgba(26,34,58,0.92)";
const HUD_SHADOW = "0 10px 30px rgba(10,8,30,0.35)";
const pop = (t: number, at = 0) => {
  const k = clamp((t - at) / 0.45);
  // лёгкий «прыжок» при появлении
  return 0.86 + 0.14 * (1 - Math.pow(1 - k, 3)) + Math.sin(k * Math.PI) * 0.04;
};

const lightenCss = (hex: string, k: number) => {
  const n = parseInt(hex.slice(1), 16);
  const f = (v: number) => Math.round(v + (255 - v) * k);
  return `rgb(${f((n >> 16) & 255)},${f((n >> 8) & 255)},${f(n & 255)})`;
};

const AwakenOverlay: React.FC<{ o: Overlay; t: number; op: number }> = ({ o, t, op }) => {
  const at = o.at ?? 0;
  if (o.kind === "pill") {
    return (
      <div style={{ position: "absolute", left: 0, right: 0, bottom: o.y === undefined ? 92 : undefined, top: o.y, textAlign: "center", opacity: op }}>
        <span style={{ display: "inline-block", transform: `scale(${pop(t, at)})`, background: NAVY, color: "#fff", fontFamily: INTER, fontWeight: 800, fontSize: 44, padding: "16px 46px", borderRadius: 999, boxShadow: HUD_SHADOW, letterSpacing: 0.5 }}>{o.text}</span>
      </div>
    );
  }
  if (o.kind === "source") {
    return <div style={{ position: "absolute", left: 44, bottom: 30, opacity: op * 0.75, fontFamily: INTER, fontWeight: 500, fontSize: 21, color: "#fff", textShadow: "0 1px 6px rgba(0,0,0,0.6)" }}>{o.text}</div>;
  }
  if (o.kind === "calendar") {
    const list = typeof o.text === "string" ? [{ at: 0, text: o.text }] : o.text;
    let i = 0;
    while (i + 1 < list.length && t - at >= list[i + 1].at) i++;
    const k = i === 0 ? 1 : ease(clamp((t - at - list[i].at) / 0.35));
    const drop = (1 - ease(clamp((t - at) / 0.5))) * -40;
    return (
      <div style={{ position: "absolute", right: 78, top: 66 + drop, opacity: op }}>
        <div style={{ position: "relative", background: "#f7f3ec", borderRadius: 14, boxShadow: HUD_SHADOW, overflow: "hidden", minWidth: 280 }}>
          <div style={{ height: 30, background: "linear-gradient(#e8665a, #d9524a)" }} />
          <div style={{ position: "relative", height: 92, padding: "0 38px", overflow: "hidden" }}>
            {i > 0 ? (
              <div style={{ position: "absolute", left: 0, right: 0, top: 0, textAlign: "center", fontFamily: INTER, fontWeight: 800, fontSize: 60, lineHeight: "92px", color: "#1d2433", transform: `translateY(${-k * 70}px)`, opacity: 1 - k }}>{list[i - 1].text}</div>
            ) : null}
            <div style={{ position: "relative", textAlign: "center", fontFamily: INTER, fontWeight: 800, fontSize: 60, lineHeight: "92px", color: "#1d2433", whiteSpace: "nowrap", transform: `translateY(${(1 - k) * 70}px)`, opacity: k }}>{list[i].text}</div>
          </div>
        </div>
        {[0.18, 0.82].map((x) => (
          <div key={x} style={{ position: "absolute", top: -6, left: `${x * 100}%`, width: 14, height: 22, marginLeft: -7, borderRadius: 7, background: "#3a3340" }} />
        ))}
      </div>
    );
  }
  if (o.kind === "stat") {
    const k = ease(clamp((t - at - 0.25) / (o.time ?? 1.6)));
    const v = Math.round(o.from + (o.to - o.from) * k);
    return (
      <div style={{ position: "absolute", left: o.x ?? 78, top: o.y ?? 66, opacity: op, transform: `scale(${pop(t, at)})`, transformOrigin: "0 0" }}>
        <div style={{ background: NAVY, borderRadius: 18, padding: "16px 34px 18px", boxShadow: HUD_SHADOW, minWidth: 240 }}>
          <div style={{ fontFamily: INTER, fontWeight: 700, fontSize: 21, letterSpacing: 4, color: "#9fb3dd", textTransform: "uppercase" }}>{o.label}</div>
          <div style={{ fontFamily: INTER, fontWeight: 800, fontSize: 70, color: "#fff", lineHeight: 1.05, fontVariantNumeric: "tabular-nums" }}>
            {o.prefix ?? ""}
            {v.toLocaleString("en-US").replace(/,/g, " ")}
            {o.suffix ?? ""}
          </div>
        </div>
      </div>
    );
  }
  if (o.kind === "blocks") {
    const colors = ["#e8574a", "#f2a93b", "#4fb3a9", "#5b8be0", "#9b6fd6", "#6cc070", "#f07fa8"];
    const n = o.word.length;
    const size = Math.min(150, 1500 / n);
    return (
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: op }}>
        {o.top ? <div style={{ fontFamily: INTER, fontWeight: 800, fontSize: 40, letterSpacing: 8, color: "#fff", textShadow: SHADOW, marginBottom: 34, opacity: fadeWindow(t, at, Infinity, 0.4) }}>{o.top}</div> : null}
        <div style={{ position: "relative", display: "flex", gap: size * 0.08 }}>
          {o.word.split("").map((ch, i) => {
            const k = clamp((t - at - 0.2 - i * 0.11) / 0.5);
            const fall = (1 - ease(k)) * -420;
            const c = colors[i % colors.length];
            return (
              <div key={i} style={{ position: "relative", width: size, height: size, transform: `translateY(${fall}px) rotate(${(1 - k) * (i % 2 ? 12 : -12)}deg)`, opacity: k > 0 ? 1 : 0 }}>
                <div style={{ position: "absolute", left: size * 0.1, top: -size * 0.1, width: size, height: size, background: lightenCss(c, 0.25), borderRadius: size * 0.1 }} />
                <div style={{ position: "absolute", inset: 0, background: `linear-gradient(160deg, ${lightenCss(c, 0.12)}, ${c})`, borderRadius: size * 0.1, boxShadow: `inset -${size * 0.06}px -${size * 0.06}px 0 rgba(0,0,0,0.18), 0 ${size * 0.08}px ${size * 0.15}px rgba(0,0,0,0.3)`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: INTER, fontWeight: 800, fontSize: size * 0.66, color: "#fff", textShadow: `0 ${size * 0.03}px 0 rgba(0,0,0,0.25)` }}>{ch}</div>
              </div>
            );
          })}
          {o.aside ? (
            <div style={{ position: "absolute", left: "100%", top: -size * 0.55, marginLeft: 20, fontFamily: CHALK, fontWeight: 700, fontSize: 58, color: "#ffe2b8", whiteSpace: "nowrap", transform: "rotate(-8deg)", opacity: fadeWindow(t, at + 1 + n * 0.11, Infinity, 0.4), textShadow: SHADOW }}>{o.aside}</div>
          ) : null}
        </div>
        {o.bottom ? <div style={{ fontFamily: INTER, fontWeight: 800, fontSize: 40, letterSpacing: 8, color: "#fff", textShadow: SHADOW, marginTop: 40, opacity: fadeWindow(t, at + 0.3 + n * 0.11, Infinity, 0.4) }}>{o.bottom}</div> : null}
      </AbsoluteFill>
    );
  }
  if (o.kind === "label") {
    const k = ease(clamp((t - at) / 0.6));
    const ex = o.x + (o.tx - o.x) * k;
    const ey = o.y + (o.ty - o.y) * k;
    const c = o.color ?? "#ffffff";
    return (
      <AbsoluteFill style={{ opacity: op }}>
        <svg viewBox="0 0 1920 1080" width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
          <line x1={o.x} y1={o.y} x2={ex} y2={ey} stroke={c} strokeWidth={3.5} strokeLinecap="round" />
          <circle cx={o.tx} cy={o.ty} r={8 * k} fill={c} />
        </svg>
        <div style={{ position: "absolute", left: o.x, top: o.y, transform: `translate(-50%, -115%) scale(${pop(t, at)})`, fontFamily: INTER, fontWeight: 800, fontSize: 36, letterSpacing: 3, color: c, textShadow: SHADOW, whiteSpace: "nowrap", textTransform: "uppercase" }}>{o.text}</div>
      </AbsoluteFill>
    );
  }
  if (o.kind === "panel") {
    const w = o.w ?? 400;
    const h = o.h ?? 270;
    const col = o.color ?? "#9fd6ff";
    const mk = ease(clamp((t - at - 0.5) / 0.5));
    return (
      <div style={{ position: "absolute", left: o.x, top: o.y, width: w, height: h, opacity: op, transform: `scale(${pop(t, at)})`, borderRadius: 24, background: "linear-gradient(160deg, rgba(255,255,255,0.16), rgba(255,255,255,0.04))", border: `2px solid ${col}88`, boxShadow: `0 0 40px ${col}33, inset 0 0 30px rgba(255,255,255,0.05)`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10 }}>
        <div style={{ fontFamily: INTER, fontWeight: 800, fontSize: 30, letterSpacing: 4, color: "#fff", textTransform: "uppercase", textAlign: "center" }}>{o.title}</div>
        {o.text ? <div style={{ fontFamily: INTER, fontWeight: 500, fontSize: 24, color: "rgba(255,255,255,0.75)", textAlign: "center", padding: "0 20px" }}>{o.text}</div> : null}
        {o.mark ? (
          <svg width={110} height={110} viewBox="0 0 100 100">
            <circle cx={50} cy={50} r={44} fill="none" stroke={o.mark === "check" ? "#5fe39a" : "#ff6b6b"} strokeWidth={6} opacity={0.35} />
            {o.mark === "check" ? (
              <path d="M 28 52 L 44 67 L 74 35" fill="none" stroke="#5fe39a" strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={80} strokeDashoffset={80 * (1 - mk)} />
            ) : (
              <path d="M 32 32 L 68 68 M 68 32 L 32 68" fill="none" stroke="#ff6b6b" strokeWidth={9} strokeLinecap="round" strokeDasharray={104} strokeDashoffset={104 * (1 - mk)} />
            )}
          </svg>
        ) : null}
      </div>
    );
  }
  if (o.kind === "question") {
    return (
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: op }}>
        <div style={{ transform: `scale(${pop(t, at)})`, background: "rgba(16,18,38,0.55)", borderRadius: 26, padding: "26px 64px", fontFamily: INTER, fontStyle: "italic", fontWeight: 800, fontSize: 92, color: "#fff", textShadow: "0 4px 18px rgba(0,0,0,0.5)", letterSpacing: 1 }}>{o.text}</div>
      </AbsoluteFill>
    );
  }
  if (o.kind === "heading") {
    return (
      <div style={{ position: "absolute", left: 0, right: 0, top: o.y ?? 120, textAlign: "center", opacity: op }}>
        <div style={{ fontFamily: INTER, fontWeight: 800, fontSize: 76, color: "#fff", textShadow: SHADOW, transform: `translateY(${(1 - ease(clamp((t - at) / 0.5))) * 20}px)` }}>{o.text}</div>
        {o.sub ? <div style={{ fontFamily: CHALK, fontWeight: 700, fontSize: 48, color: "#ffd9a6", marginTop: 6, textShadow: SHADOW, opacity: fadeWindow(t, at + 0.4, Infinity, 0.4) }}>{o.sub}</div> : null}
      </div>
    );
  }
  return null;
};

// Надписи, которые живут внутри сцены (на доске) и двигаются вместе с камерой
export const SCENE_OVERLAYS: string[] = ["chalk", "chalkfigs"];

export const SceneOverlay: React.FC<{ o: Overlay; t: number }> = ({ o, t }) => {
  const at = o.at ?? 0;
  const op = fadeWindow(t, at, o.dur ?? Infinity, 0.15, 0.4);
  if (op <= 0) return null;
  if (o.kind === "chalk") {
    const n = Math.floor((t - at) * (o.speed ?? 16));
    const size = o.size ?? 60;
    return (
      <text x={o.x} y={o.y} fontFamily={CHALK} fontWeight={500} fontSize={size} fill={o.color ?? "#f1eee4"} opacity={op * 0.9} style={{ whiteSpace: "pre" }}>
        {o.text.slice(0, Math.max(0, n))}
      </text>
    );
  }
  if (o.kind === "chalkfigs") {
    const size = o.size ?? 110;
    const gap = o.gap ?? size * 0.62;
    const every = o.every ?? 0.18;
    const c = o.color ?? "#f1eee4";
    return (
      <g opacity={op * 0.88} fill="none" stroke={c} strokeWidth={size * 0.035} strokeLinecap="round" strokeLinejoin="round">
        {Array.from({ length: o.count }, (_, i) => {
          const k = ease(clamp((t - at - i * every) / 0.45));
          if (k <= 0) return null;
          const x = o.x + i * gap;
          const y = o.y;
          const r = size * 0.13;
          const crossed = (o.cross ?? []).includes(i);
          const ck = crossed ? ease(clamp((t - at - o.count * every - 0.4) / 0.4)) : 0;
          const d = `M ${x} ${y - size + 2 * r} L ${x} ${y - size * 0.38} M ${x - size * 0.2} ${y - size * 0.62} L ${x + size * 0.2} ${y - size * 0.62} M ${x - size * 0.16} ${y} L ${x} ${y - size * 0.38} L ${x + size * 0.16} ${y}`;
          return (
            <g key={i}>
              <circle cx={x} cy={y - size + r} r={r} strokeDasharray={7 * r} strokeDashoffset={7 * r * (1 - k)} />
              <path d={d} strokeDasharray={size * 2.2} strokeDashoffset={size * 2.2 * (1 - k)} />
              {ck > 0 ? <path d={`M ${x - size * 0.28} ${y - size * 0.9} L ${x + size * 0.28} ${y - size * 0.1} M ${x + size * 0.28} ${y - size * 0.9} L ${x - size * 0.28} ${y - size * 0.1}`} stroke="#ff7a6b" strokeDasharray={size * 2} strokeDashoffset={size * 2 * (1 - ck)} /> : null}
            </g>
          );
        })}
      </g>
    );
  }
  return null;
};

export const CardView: React.FC<{ card: Card; t: number }> = ({ card, t }) => {
  const a = fadeWindow(t, 0.15, Infinity, 0.9);
  const b = fadeWindow(t, 0.9, Infinity, 0.9);
  return (
    <AbsoluteFill style={{ background: "#000", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
      {card.kind === "quote" ? (
        <div style={{ padding: "0 280px" }}>
          <div style={{ fontFamily: SERIF, fontStyle: "italic", fontWeight: 500, fontSize: 68, color: "#f2f2f2", lineHeight: 1.25, opacity: a }}>«{card.text}»</div>
          {card.author ? <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 36, color: "#9aa0aa", marginTop: 36, opacity: b }}>— {card.author}</div> : null}
        </div>
      ) : card.kind === "hook" ? (
        <div style={{ fontFamily: SERIF, fontWeight: 500, fontSize: 84, color: "#fff", padding: "0 220px", lineHeight: 1.2, opacity: a }}>{card.text}</div>
      ) : (
        <div>
          <div style={{ fontFamily: SERIF, fontWeight: 600, fontSize: 104, letterSpacing: 26, color: "#f4f4f4", textTransform: "uppercase", opacity: a, marginRight: -26 }}>{card.title}</div>
          {card.text ? <div style={{ fontFamily: SERIF, fontStyle: "italic", fontWeight: 500, fontSize: 42, color: "#b9bec8", marginTop: 34, opacity: b }}>{card.text}</div> : null}
        </div>
      )}
    </AbsoluteFill>
  );
};
