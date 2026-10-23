// Все виды текста на экране: реплики, мысли, уведомления, часы, карточки.
// Всё появляется мягким проявлением, без прыжков.
import React from "react";
import { AbsoluteFill } from "remotion";
import { HAND, SANS, SERIF } from "./fonts";
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
