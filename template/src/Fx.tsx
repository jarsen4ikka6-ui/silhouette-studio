// Атмосфера поверх кадра: дождь, виньетка, плёнка (зерно, пыль, засвет), размытый передний план, плечо «через плечо»
import React, { useId } from "react";
import { AbsoluteFill } from "remotion";
import { BODY, darken, lighten } from "./Character";
import type { Actor, Foreground as Fg, LookFx } from "./types";
import { rand } from "./util";

const W = 1920;
const H = 1080;
const useUid = () => useId().replace(/[^a-zA-Z0-9]/g, "");

export const Rain: React.FC<{ t: number; density?: number }> = ({ t, density = 1 }) => {
  const n = Math.round(220 * density);
  return (
    <svg viewBox="0 0 1920 1080" width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
      {Array.from({ length: n }, (_, i) => {
        const near = rand(i + 0.5) > 0.75;
        const sp = (near ? 2200 : 1400) + rand(i) * 600;
        const len = near ? 70 + rand(i + 2) * 40 : 30 + rand(i + 2) * 30;
        const y = ((rand(i + 3) * 1300 + t * sp) % 1300) - 120;
        const x = rand(i + 9) * 2200 - 100 - y * 0.2;
        return <line key={i} x1={x} y1={y} x2={x - len * 0.2} y2={y + len} stroke="#c2d2f0" strokeWidth={near ? 2.6 : 1.4} strokeLinecap="round" opacity={near ? 0.45 : 0.28} />;
      })}
    </svg>
  );
};

export const Vignette: React.FC<{ strength?: number }> = ({ strength = 0.45 }) => (
  <AbsoluteFill style={{ background: `radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(10,6,20,${strength}) 100%)`, pointerEvents: "none" }} />
);

// Плёночный вид: тёплый засвет из угла, пылинки в воздухе, зерно
export const LookLayer: React.FC<{ look: LookFx; t: number; frame: number }> = ({ look, t, frame }) => {
  const u = useUid();
  const grain = look.grain ?? 0.07;
  const dust = look.dust ?? 1;
  const leak = look.leak === false ? null : look.leak ?? "#ffb46e";
  const lx = look.leakSide === "right" ? W * 0.92 : W * 0.08;
  const n = Math.round(46 * dust);
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {look.tint ? <AbsoluteFill style={{ background: look.tint, mixBlendMode: "soft-light", opacity: 0.5 }} /> : null}
      {leak ? (
        <AbsoluteFill
          style={{
            background: `radial-gradient(ellipse 60% 70% at ${lx}px -60px, ${leak} 0%, rgba(0,0,0,0) 70%)`,
            mixBlendMode: "screen",
            opacity: 0.32 + Math.sin(t * 0.7) * 0.06,
          }}
        />
      ) : null}
      {n > 0 ? (
        <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} style={{ position: "absolute", inset: 0 }}>
          <defs>
            <filter id={`bk${u}`} x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation={6} />
            </filter>
          </defs>
          {Array.from({ length: n }, (_, i) => {
            const big = rand(i + 0.3) > 0.82;
            const sp = 8 + rand(i + 1) * 16;
            const x = (rand(i + 2) * W + Math.sin(t * 0.4 + i) * 30 + t * (rand(i + 4) - 0.5) * 20 + W) % W;
            const y = (rand(i + 3) * (H + 100) - t * sp + H * 4) % (H + 100) - 50;
            const r = big ? 9 + rand(i + 5) * 14 : 1.2 + rand(i + 5) * 2.4;
            const o = (big ? 0.1 : 0.35 + rand(i + 6) * 0.4) * (0.6 + 0.4 * Math.sin(t * (1 + rand(i + 7)) + i));
            return <circle key={i} cx={x} cy={y} r={r} fill="#fff1d6" opacity={o} filter={big ? `url(#bk${u})` : undefined} />;
          })}
        </svg>
      ) : null}
      {grain > 0 ? (
        <svg viewBox={`0 0 ${W / 2} ${H / 2}`} width={W} height={H} preserveAspectRatio="none" style={{ position: "absolute", inset: 0, mixBlendMode: "overlay", opacity: grain * 4 }}>
          <filter id={`gr${u}`}>
            <feTurbulence type="fractalNoise" baseFrequency={0.85} numOctaves={2} seed={frame % 7} />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect width={W / 2} height={H / 2} filter={`url(#gr${u})`} opacity={0.5} />
        </svg>
      ) : null}
    </AbsoluteFill>
  );
};

// Размытый тёмный предмет на переднем плане. sx — где он на экране (с параллаксом)
export const Foreground: React.FC<{ f: Fg; sx: number; t: number }> = ({ f, sx, t }) => {
  const u = useUid();
  const blur = f.blur ?? 9;
  const c = f.color ?? (f.kind === "leaves" || f.kind === "plant" ? "#1f3a2a" : "#15121f");
  const flip = f.flip ? -1 : 1;
  let body: React.ReactNode = null;
  switch (f.kind) {
    case "post":
      body = (
        <g>
          <rect x={sx - 55} y={-20} width={110} height={H + 40} fill={`url(#fg${u})`} />
        </g>
      );
      break;
    case "plant":
      body = (
        <g transform={`translate(${sx} ${H + 30}) scale(${flip} 1)`}>
          {Array.from({ length: 9 }, (_, i) => {
            const a = -70 + i * 17 + Math.sin(t * 0.8 + i) * 2;
            const len = 260 + rand(i) * 160;
            return <ellipse key={i} cx={0} cy={-len / 2} rx={34} ry={len / 2} fill={i % 2 ? c : darken(c, 0.25)} transform={`rotate(${a})`} />;
          })}
        </g>
      );
      break;
    case "leaves":
      body = (
        <g transform={`translate(${sx} -30) scale(${flip} 1)`}>
          <path d={`M -300 0 Q 0 60 300 10`} stroke={c} strokeWidth={14} fill="none" />
          {Array.from({ length: 12 }, (_, i) => {
            const x = -280 + i * 50;
            const sw = Math.sin(t * 0.9 + i * 0.7) * 4;
            return <ellipse key={i} cx={x} cy={70 + rand(i) * 60} rx={26} ry={62} fill={i % 2 ? c : darken(c, 0.2)} transform={`rotate(${-30 + rand(i + 3) * 60 + sw} ${x} ${40})`} />;
          })}
        </g>
      );
      break;
    case "railing":
      body = (
        <g>
          <rect x={-50} y={H - 250} width={W + 100} height={26} rx={8} fill={c} />
          <rect x={-50} y={H - 60} width={W + 100} height={70} fill={c} />
          {Array.from({ length: 14 }, (_, i) => {
            const x = ((sx + i * 160) % (W + 160) + W + 160) % (W + 160) - 80;
            return <rect key={i} x={x} y={H - 230} width={22} height={200} fill={c} />;
          })}
        </g>
      );
      break;
    case "lamp":
      body = (
        <g transform={`translate(${sx} 0)`}>
          <rect x={-4} y={-10} width={8} height={130} fill={c} />
          <path d="M -90 190 Q -80 110 0 110 Q 80 110 90 190 Z" fill={c} />
          <ellipse cx={0} cy={192} rx={70} ry={18} fill="#ffd9a0" opacity={0.8} />
        </g>
      );
      break;
    case "curtain":
      body = (
        <g transform={`translate(${sx} 0) scale(${flip} 1)`}>
          <path d={`M -200 -20 L 120 -20 Q 60 ${H / 2} 140 ${H + 20} L -200 ${H + 20} Z`} fill={c} />
          {[0, 1, 2].map((i) => (
            <path key={i} d={`M ${-120 + i * 70} -20 Q ${-90 + i * 70} ${H / 2} ${-110 + i * 70} ${H + 20}`} stroke={darken(c, 0.35)} strokeWidth={18} fill="none" />
          ))}
        </g>
      );
      break;
    case "glass":
      body = (
        <g opacity={0.16}>
          {[0, 1, 2].map((i) => (
            <path key={i} d={`M ${sx - 300 + i * 220} -20 l 160 0 l -420 ${H + 40} l -160 0 Z`} fill="#ffffff" opacity={i === 1 ? 0.5 : 1} />
          ))}
        </g>
      );
      break;
  }
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <defs>
        <filter id={`fb${u}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={blur} />
        </filter>
        <linearGradient id={`fg${u}`} x1={0} x2={1}>
          <stop offset="0%" stopColor={darken(c.startsWith("#") ? c : "#15121f", 0.2)} />
          <stop offset="60%" stopColor={c} />
          <stop offset="100%" stopColor={c.startsWith("#") ? lighten(c, 0.15) : c} />
        </linearGradient>
      </defs>
      <g filter={blur > 0 ? `url(#fb${u})` : undefined}>{body}</g>
    </svg>
  );
};

// План «через плечо»: большая размытая голова и плечо героя у края кадра
export const OverShoulder: React.FC<{ actor: Actor; t: number; side: "left" | "right" }> = ({ actor, t, side }) => {
  const u = useUid();
  const s = side === "left" ? 1 : -1;
  const cx = side === "left" ? 170 : W - 170;
  const cloth = actor.look?.color ?? "#2f9e94";
  const rim = actor.rim === "none" ? null : actor.rim ?? "#f6a95c";
  const by = Math.sin(t * 2) * 4;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <defs>
        <filter id={`os${u}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={7} />
        </filter>
      </defs>
      <g filter={`url(#os${u})`} transform={`translate(${cx} ${by})`}>
        {rim ? <circle cx={s * 6} cy={560} r={238} fill={rim} /> : null}
        <path d={`M ${-s * 330} ${H + 40} Q ${-s * 320} 820 ${-s * 120} 780 L ${s * 200} 770 Q ${s * 380} 800 ${s * 400} ${H + 40} Z`} fill={darken(cloth, 0.15)} />
        <circle cx={0} cy={560} r={236} fill={BODY} />
      </g>
    </svg>
  );
};
