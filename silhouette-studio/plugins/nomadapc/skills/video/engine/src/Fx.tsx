// Атмосфера поверх кадра: дождь и виньетка
import React from "react";
import { AbsoluteFill } from "remotion";
import { rand } from "./util";

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

export const Vignette: React.FC<{ strength?: number }> = ({ strength = 0.55 }) => (
  <AbsoluteFill style={{ background: `radial-gradient(ellipse at center, rgba(0,0,0,0) 50%, rgba(0,0,0,${strength}) 100%)`, pointerEvents: "none" }} />
);
