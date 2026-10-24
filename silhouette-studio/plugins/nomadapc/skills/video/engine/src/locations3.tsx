// Локации в стиле Awaken: детальные, тёплый вечерний свет, мягкие градиенты, ореолы ламп.
// Пол везде на y≈900 (там стоят ступни персонажей). Холст 1920×1080.
// cafe-street, classroom, living, lab-dark, gallery, porch, village, savanna, island, forest, studio
import React, { useId } from "react";
import { SKINS } from "./Character";
import { CHALK, INTER } from "./fonts";
import { clamp, rand } from "./util";

type P = { t: number; params: Record<string, number | string | boolean> };
const useUid = () => useId().replace(/[^a-zA-Z0-9]/g, "");
const num = (v: unknown, d: number) => (typeof v === "number" ? v : d);
const str = (v: unknown, d: string) => (typeof v === "string" ? v : d);
const Svg: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <svg viewBox="0 0 1920 1080" width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
    {children}
  </svg>
);

// Мягкий ореол света (лампа, окно, солнце)
export const Glow: React.FC<{ x: number; y: number; r: number; color?: string; o?: number; rx?: number }> = ({ x, y, r, color = "#ffe2b0", o = 1, rx }) => {
  const u = useUid();
  return (
    <g>
      <defs>
        <radialGradient id={`gl${u}`}>
          <stop offset="0" stopColor={color} stopOpacity={0.95} />
          <stop offset="0.3" stopColor={color} stopOpacity={0.4} />
          <stop offset="1" stopColor={color} stopOpacity={0} />
        </radialGradient>
      </defs>
      <ellipse cx={x} cy={y} rx={rx ?? r} ry={r} fill={`url(#gl${u})`} opacity={o} style={{ mixBlendMode: "screen" }} />
    </g>
  );
};

// Вертикальный градиент на весь прямоугольник
const Grad: React.FC<{ x?: number; y?: number; w: number; h: number; stops: [number, string][]; rx?: number; horiz?: boolean; o?: number }> = ({ x = 0, y = 0, w, h, stops, rx, horiz, o }) => {
  const u = useUid();
  return (
    <g>
      <defs>
        <linearGradient id={`gr${u}`} x1="0" y1="0" x2={horiz ? 1 : 0} y2={horiz ? 0 : 1}>
          {stops.map(([off, c], i) => (
            <stop key={i} offset={off} stopColor={c} />
          ))}
        </linearGradient>
      </defs>
      <rect x={x} y={y} width={w} height={h} rx={rx} fill={`url(#gr${u})`} opacity={o} />
    </g>
  );
};

// Луч света (из окна, из прорехи в листве)
const Shaft: React.FC<{ x: number; y: number; w: number; len: number; ang: number; color?: string; o?: number }> = ({ x, y, w, len, ang, color = "#fff1c9", o = 0.25 }) => {
  const u = useUid();
  return (
    <g transform={`translate(${x} ${y}) rotate(${ang})`}>
      <defs>
        <linearGradient id={`sh${u}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity={o} />
          <stop offset="1" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={`M ${-w / 2} 0 L ${w / 2} 0 L ${w * 0.9} ${len} L ${-w * 0.9} ${len} Z`} fill={`url(#sh${u})`} style={{ mixBlendMode: "screen" }} />
    </g>
  );
};

// Окно дома: рама, переплёт, тёплый свет или тёмное стекло, ящик с цветами
const HouseWindow: React.FC<{ x: number; y: number; w: number; h: number; lit?: boolean; flowers?: boolean; seed?: number; frame?: string }> = ({ x, y, w, h, lit, flowers, seed = 0, frame = "#efe4d2" }) => (
  <g>
    <rect x={x - 10} y={y - 10} width={w + 20} height={h + 20} fill={frame} />
    <Grad x={x} y={y} w={w} h={h} stops={lit ? [[0, "#ffe7b3"], [1, "#f0b468"]] : [[0, "#3c3f7a"], [1, "#5d5f9e"]]} />
    {lit ? <rect x={x + w * 0.08} y={y} width={w * 0.22} height={h} fill="#e9a659" opacity={0.35} /> : <path d={`M ${x + w * 0.2} ${y + h} L ${x + w * 0.55} ${y} L ${x + w * 0.7} ${y} L ${x + w * 0.35} ${y + h} Z`} fill="#fff" opacity={0.06} />}
    <rect x={x + w / 2 - 4} y={y} width={8} height={h} fill={frame} />
    <rect x={x} y={y + h * 0.45} width={w} height={8} fill={frame} />
    <rect x={x - 18} y={y + h + 8} width={w + 36} height={10} fill={frame} />
    {flowers ? (
      <g>
        <rect x={x - 6} y={y + h + 18} width={w + 12} height={26} rx={3} fill="#8a4b2f" />
        {Array.from({ length: 9 }, (_, i) => (
          <g key={i}>
            <circle cx={x + 6 + i * ((w - 12) / 8)} cy={y + h + 12} r={11} fill={i % 2 ? "#4f9a52" : "#3f8546"} />
            {rand(seed + i) > 0.5 ? <circle cx={x + 6 + i * ((w - 12) / 8) + 4} cy={y + h + 6} r={4.5} fill={rand(seed + i + 9) > 0.5 ? "#f05a5a" : "#fff4d8"} /> : null}
          </g>
        ))}
      </g>
    ) : null}
  </g>
);

// Кирпичная кладка (тонкие швы поверх стены)
const Bricks: React.FC<{ x: number; y: number; w: number; h: number; color: string; bw?: number; bh?: number; o?: number }> = ({ x, y, w, h, color, bw = 92, bh = 34, o = 0.5 }) => {
  const u = useUid();
  return (
    <g>
      <defs>
        <pattern id={`br${u}`} width={bw} height={bh * 2} patternUnits="userSpaceOnUse" x={x} y={y}>
          <path d={`M 0 ${bh} H ${bw} M 0 ${bh * 2} H ${bw} M ${bw / 2} 0 V ${bh} M 0 ${bh} V ${bh * 2}`} stroke={color} strokeWidth={3} fill="none" />
        </pattern>
      </defs>
      <rect x={x} y={y} width={w} height={h} fill={`url(#br${u})`} opacity={o} />
    </g>
  );
};

// Растение в горшке
export const PotPlant: React.FC<{ x: number; y: number; s?: number; t: number; pot?: string; leaf?: string }> = ({ x, y, s = 1, t, pot = "#b0643e", leaf = "#5f9a5c" }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    {Array.from({ length: 11 }, (_, i) => {
      const a = -75 + i * 15 + Math.sin(t * 0.9 + i) * 1.5;
      const len = 120 + (1 - Math.abs(i - 5) / 5) * 60;
      return <ellipse key={i} cx={0} cy={-len / 2 - 70} rx={17} ry={len / 2} fill={i % 2 ? leaf : "#4c8550"} transform={`rotate(${a} 0 -70)`} />;
    })}
    <path d="M -58 -84 L 58 -84 L 46 0 L -46 0 Z" fill={pot} />
    <rect x={-62} y={-92} width={124} height={16} rx={4} fill="#c47750" />
  </g>
);

// Гирлянда-лампочки по провисающему проводу
const StringLights: React.FC<{ x1: number; x2: number; y: number; sag?: number; n?: number; t: number; seg?: number }> = ({ x1, x2, y, sag = 22, n = 28, t, seg = 4 }) => {
  const per = n / seg;
  const pts = Array.from({ length: n + 1 }, (_, i) => {
    const k = (i % per) / per;
    return { x: x1 + ((x2 - x1) * i) / n, y: y + Math.sin(k * Math.PI) * sag };
  });
  return (
    <g>
      <polyline points={pts.map((p) => `${p.x},${p.y}`).join(" ")} fill="none" stroke="#3a2c2a" strokeWidth={2} />
      {pts.map((p, i) => {
        const fl = 0.75 + 0.25 * Math.sin(t * 3 + i * 1.7);
        return (
          <g key={i}>
            <circle cx={p.x} cy={p.y + 6} r={14} fill="#ffd98a" opacity={0.18 * fl} />
            <circle cx={p.x} cy={p.y + 6} r={4.5} fill="#fff2c4" opacity={fl} />
          </g>
        );
      })}
    </g>
  );
};

// Голубь на карнизе
const Pigeon: React.FC<{ x: number; y: number; t: number; flip?: boolean; seed?: number }> = ({ x, y, t, flip, seed = 0 }) => {
  const peck = Math.max(0, Math.sin(t * 1.6 + seed * 2)) > 0.9 ? 6 : 0;
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -1 : 1} 1)`}>
      <ellipse cx={0} cy={-14} rx={22} ry={13} fill="#8c8ea3" />
      <path d="M -20 -16 L -36 -10 L -20 -8 Z" fill="#6f7186" />
      <circle cx={18} cy={-26 + peck} r={9} fill="#9a9cb0" />
      <path d={`M 26 ${-26 + peck} L 33 ${-23 + peck} L 26 ${-21 + peck} Z`} fill="#e3a74a" />
      <circle cx={21} cy={-28 + peck} r={1.8} fill="#1b1b22" />
      <path d="M -6 -18 Q 6 -26 14 -16" fill="none" stroke="#7a7c92" strokeWidth={3} />
      <line x1={-4} y1={-2} x2={-4} y2={0} stroke="#d9874a" strokeWidth={3} />
      <line x1={6} y1={-2} x2={6} y2={0} stroke="#d9874a" strokeWidth={3} />
    </g>
  );
};

// ── Вечерняя улица с кафе ─────────────────────────────────────────
// params: sign (вывеска), door (номер дома), lamp (false — без фонаря)
export const CafeStreet: React.FC<P> = ({ t, params }) => {
  const sign = str(params.sign, "CORNER CAFÉ");
  const door = str(params.door, "12");
  return (
    <Svg>
      <Grad w={1920} h={1080} stops={[[0, "#7c7ab9"], [1, "#6c69a8"]]} />
      {/* просвет между домами — закатное небо */}
      <Grad x={1090} y={0} w={210} h={900} stops={[[0, "#c9a6d6"], [0.6, "#f6d3d6"], [1, "#fff0dc"]]} />
      <Glow x={1195} y={780} r={420} color="#fff4dd" o={0.9} />
      {/* левый дом */}
      <Bricks x={0} y={0} w={1090} h={900} color="#625f9f" />
      {[110, 375, 630, 880].map((x, i) => (
        <HouseWindow key={x} x={x} y={-20} w={170} h={250} lit={i >= 2} flowers seed={i * 10} />
      ))}
      <rect x={0} y={282} width={1092} height={22} fill="#efe4d2" />
      {/* правый дом */}
      <Bricks x={1300} y={0} w={620} h={900} color="#625f9f" />
      {[1380, 1640].map((x, i) => (
        <HouseWindow key={x} x={x} y={-20} w={170} h={250} lit={i === 1} />
      ))}
      <rect x={1300} y={282} width={620} height={22} fill="#efe4d2" />
      {/* дверь с номером */}
      <rect x={0} y={525} width={212} height={375} fill="#efe4d2" />
      <path d="M 22 610 A 84 84 0 0 1 190 610 Z" fill="#ffd28e" />
      {[0, 1, 2, 3, 4].map((i) => (
        <line key={i} x1={106} y1={610} x2={106 + Math.cos(Math.PI + (i + 1) * (Math.PI / 6)) * 84} y2={610 + Math.sin(Math.PI + (i + 1) * (Math.PI / 6)) * 84} stroke="#efe4d2" strokeWidth={3} />
      ))}
      <text x={106} y={590} textAnchor="middle" fontFamily={INTER} fontWeight={800} fontSize={30} fill="#3a2b2b">{door}</text>
      <rect x={26} y={612} width={160} height={288} fill="#3b1f1f" />
      <rect x={42} y={630} width={128} height={120} rx={4} fill="none" stroke="#5a2e2e" strokeWidth={3} />
      <rect x={42} y={770} width={128} height={116} rx={4} fill="none" stroke="#5a2e2e" strokeWidth={3} />
      <rect x={78} y={728} width={50} height={9} rx={3} fill="#e0b25a" />
      <circle cx={158} cy={790} r={6} fill="#e0b25a" />
      {/* кафе */}
      <rect x={310} y={300} width={780} height={600} fill="#1f4a3c" />
      <text x={700} y={402} textAnchor="middle" fontFamily={INTER} fontWeight={800} fontSize={66} letterSpacing={5} fill="#fbf1d4">{sign}</text>
      <rect x={320} y={428} width={760} height={4} fill="#c8a85a" />
      {/* витрина */}
      <Grad x={356} y={588} w={560} h={292} stops={[[0, "#f4cf9f"], [1, "#c88d5e"]]} />
      <Glow x={640} y={700} r={260} color="#ffe2b0" o={0.6} />
      {[0, 1].map((r) => (
        <g key={r}>
          <rect x={360} y={640 + r * 72} width={250} height={7} fill="#7d5134" />
          {Array.from({ length: 8 }, (_, i) => <rect key={i} x={372 + i * 30} y={616 + r * 72} width={20} height={24} rx={3} fill={["#f6ecdc", "#e07a50", "#6f8fd0", "#f6ecdc"][i % 4]} />)}
        </g>
      ))}
      <rect x={652} y={600} width={210} height={60} rx={6} fill="#2a2a2a" opacity={0.85} />
      <text x={757} y={638} textAnchor="middle" fontFamily={CHALK} fontSize={28} fill="#f1eadc">flat white · croissant</text>
      <rect x={720} y={700} width={150} height={56} rx={28} fill="none" stroke="#ff8fbf" strokeWidth={5} opacity={0.9 + Math.sin(t * 5) * 0.08} />
      <text x={795} y={741} textAnchor="middle" fontFamily={INTER} fontWeight={800} fontSize={36} fill="#ffb3d3">OPEN</text>
      <Glow x={795} y={728} r={110} color="#ff8fbf" o={0.35} />
      <rect x={530} y={588} width={8} height={292} fill="#1f4a3c" />
      <path d="M 356 880 L 450 588 L 520 588 L 426 880 Z" fill="#fff" opacity={0.07} />
      {/* дверь кафе */}
      <rect x={930} y={600} width={140} height={300} fill="#1a3e33" />
      <rect x={946} y={620} width={108} height={150} fill="#8f8a86" />
      <rect x={958} y={680} width={84} height={26} rx={4} fill="#fff" />
      <text x={1000} y={699} textAnchor="middle" fontFamily={INTER} fontWeight={700} fontSize={16} fill="#222">OPEN 7–7</text>
      <circle cx={1056} cy={790} r={6} fill="#d9b25a" />
      {/* маркиза */}
      {Array.from({ length: 17 }, (_, i) => {
        const x = 312 + i * 46;
        return <path key={i} d={`M ${x} 466 L ${x + 46} 466 L ${x + 46} 552 A 23 23 0 0 1 ${x} 552 Z`} fill={i % 2 ? "#f7ecdb" : "#e2523f"} />;
      })}
      <rect x={310} y={460} width={784} height={10} fill="#c43f30" />
      <StringLights x1={318} x2={1086} y={578} t={t} n={32} seg={8} sag={14} />
      {/* голуби на карнизе вывески */}
      <Pigeon x={440} y={460} t={t} seed={1} />
      <Pigeon x={498} y={460} t={t} seed={2} flip />
      <Pigeon x={960} y={460} t={t} seed={3} />
      {/* роллета и закрытый магазин справа */}
      <rect x={1326} y={445} width={310} height={455} fill="#3d3b5c" />
      {Array.from({ length: 24 }, (_, i) => <rect key={i} x={1340} y={510 + i * 16} width={282} height={9} fill="#6f6c90" />)}
      <rect x={1326} y={445} width={310} height={50} fill="#2c2a44" />
      <rect x={1662} y={445} width={258} height={455} fill="#2c2a44" />
      <Grad x={1680} y={540} w={240} h={340} stops={[[0, "#3e4a86"], [1, "#2e3666"]]} />
      <rect x={1760} y={664} width={110} height={40} rx={5} fill="#c9433a" />
      <text x={1815} y={692} textAnchor="middle" fontFamily={INTER} fontWeight={800} fontSize={22} letterSpacing={2} fill="#fff">CLOSED</text>
      {/* растения и столик у витрины */}
      <PotPlant x={350} y={900} s={0.8} t={t} />
      <PotPlant x={900} y={900} s={0.8} t={t} />
      <g>
        <ellipse cx={520} cy={782} rx={64} ry={12} fill="#f4efe6" />
        <rect x={516} y={786} width={8} height={110} fill="#2b2b33" />
        <ellipse cx={520} cy={898} rx={40} ry={7} fill="#2b2b33" />
        <ellipse cx={500} cy={772} rx={16} ry={8} fill="#e0a55c" />
        <rect x={540} y={758} width={14} height={20} rx={2} fill="#efe9df" />
        {[440, 600].map((x, i) => (
          <g key={x} fill="#3a3a46">
            <rect x={x - 30} y={810} width={60} height={9} rx={3} />
            <rect x={x - 28} y={818} width={6} height={82} />
            <rect x={x + 22} y={818} width={6} height={82} />
            <rect x={i ? x + 22 : x - 28} y={730} width={6} height={88} />
          </g>
        ))}
      </g>
      {/* меловая доска-штендер */}
      <g transform="translate(1012 900)">
        <path d="M -40 0 L -28 -150 L 28 -150 L 40 0 Z" fill="#4a3324" />
        <path d="M -32 -8 L -22 -140 L 22 -140 L 32 -8 Z" fill="#1d2420" />
        <text x={0} y={-108} textAnchor="middle" fontFamily={CHALK} fontSize={24} fill="#f2ecdf">TODAY</text>
        <text x={0} y={-76} textAnchor="middle" fontFamily={CHALK} fontSize={18} fill="#e9e1cf">flat white</text>
        <text x={0} y={-50} textAnchor="middle" fontFamily={CHALK} fontSize={18} fill="#e9e1cf">croissant</text>
      </g>
      {/* фонарь */}
      {params.lamp !== false ? (
        <g>
          <path d="M 1148 990 L 1148 360 Q 1148 300 1200 296 L 1226 300" fill="none" stroke="#4a4560" strokeWidth={16} strokeLinecap="round" />
          <path d="M 1196 286 L 1250 296 L 1244 318 L 1192 308 Z" fill="#3a3550" />
          <rect x={1134} y={940} width={30} height={56} rx={4} fill="#3a3550" />
          <Glow x={1222} y={316} r={150} color="#fff3d2" o={0.95} />
          <Shaft x={1222} y={316} w={60} len={640} ang={-6} o={0.22} />
        </g>
      ) : null}
      {/* почтовый ящик */}
      <g transform="translate(1380 900)">
        <rect x={-46} y={-190} width={92} height={190} rx={8} fill="#d7392f" />
        <path d="M -54 -190 Q -54 -246 0 -246 Q 54 -246 54 -190 Z" fill="#e2463a" />
        <rect x={-58} y={-196} width={116} height={14} rx={4} fill="#b92e26" />
        <rect x={-26} y={-150} width={52} height={7} rx={3} fill="#3a1414" />
        <rect x={-22} y={-110} width={44} height={30} rx={3} fill="#f4e7d2" />
        <rect x={-50} y={-14} width={100} height={14} fill="#b92e26" />
      </g>
      {/* тротуар, бордюр, дорога */}
      <Grad x={0} y={900} w={1920} h={110} stops={[[0, "#a39dc8"], [1, "#8c86b6"]]} />
      {Array.from({ length: 13 }, (_, i) => <line key={i} x1={i * 160} y1={900} x2={i * 160 - 40} y2={1010} stroke="#8a84b4" strokeWidth={2} />)}
      <line x1={0} y1={950} x2={1920} y2={950} stroke="#9690c0" strokeWidth={2} />
      <rect y={1010} width={1920} height={16} fill="#d4cfe6" />
      <Grad x={0} y={1026} w={1920} h={54} stops={[[0, "#454266"], [1, "#2e2c48"]]} />
    </Svg>
  );
};

// ── Класс / кафе с большой меловой доской ─────────────────────────
// Мел пишется оверлеями chalk и chalkfigs (координаты доски: x 300–1620, y 100–600)
export const Classroom: React.FC<P> = ({ t, params }) => {
  const poster = str(params.poster, "1987");
  return (
    <Svg>
      <Grad w={1920} h={1080} stops={[[0, "#3d2c33"], [1, "#5a3f3a"]]} />
      {Array.from({ length: 40 }, (_, i) => <line key={i} x1={i * 48} y1={0} x2={i * 48} y2={700} stroke="#2e2128" strokeWidth={2} opacity={0.6} />)}
      {/* окно слева: закат */}
      <rect x={-20} y={110} width={230} height={570} fill="#2a1d24" />
      <Grad x={0} y={130} w={190} h={530} stops={[[0, "#7376c0"], [0.5, "#d6a8c6"], [1, "#f7c79a"]]} />
      <rect x={90} y={130} width={10} height={530} fill="#2a1d24" />
      <rect x={0} y={395} width={190} height={10} fill="#2a1d24" />
      <Glow x={120} y={600} r={380} color="#ffc9a0" o={0.45} />
      <Shaft x={190} y={250} w={140} len={900} ang={-58} color="#ffd9b0" o={0.12} />
      {/* доска */}
      <rect x={270} y={70} width={1380} height={560} rx={8} fill="#9c6b45" />
      <rect x={292} y={92} width={1336} height={516} fill="#24372d" />
      {[[600, 300, 420], [1200, 220, 380], [900, 480, 460], [1450, 450, 300]].map(([x, y, r], i) => (
        <ellipse key={i} cx={x} cy={y} rx={r} ry={r * 0.55} fill="#3d5546" opacity={0.28} />
      ))}
      <rect x={292} y={92} width={1336} height={516} fill="none" stroke="#1a2a22" strokeWidth={6} opacity={0.6} />
      <rect x={280} y={626} width={1360} height={18} rx={4} fill="#8a5c3a" />
      <rect x={340} y={616} width={34} height={10} rx={3} fill="#f4f1ea" />
      <rect x={430} y={618} width={22} height={8} rx={3} fill="#9fd0ff" />
      {/* лампы */}
      {[1500, 1760].map((x, i) => (
        <g key={x}>
          <line x1={x} y1={0} x2={x} y2={70} stroke="#20161a" strokeWidth={3} />
          <path d={`M ${x - 40} 110 Q ${x} 60 ${x + 40} 110 Z`} fill="#2e2226" />
          <ellipse cx={x} cy={111} rx={30} ry={6} fill="#fff1c9" />
          <Glow x={x} y={150} r={260} color="#ffdca6" o={0.65 + Math.sin(t * 2 + i) * 0.04} />
        </g>
      ))}
      {/* полки с банками и растениями */}
      {[190, 335].map((y, r) => (
        <g key={y}>
          <rect x={1660} y={y} width={260} height={10} fill="#7a5236" />
          {Array.from({ length: 5 }, (_, i) => {
            const x = 1680 + i * 50;
            return i % 2 ? (
              <g key={i}>
                <path d={`M ${x} ${y} L ${x + 4} ${y - 34} L ${x + 30} ${y - 34} L ${x + 34} ${y} Z`} fill="#b65a3a" />
                {[-30, 0, 30].map((a) => <ellipse key={a} cx={x + 17} cy={y - 50} rx={7} ry={18} fill="#6aa66a" transform={`rotate(${a} ${x + 17} ${y - 34})`} />)}
              </g>
            ) : (
              <g key={i}>
                <rect x={x} y={y - 46} width={32} height={46} rx={5} fill={rand(i + r * 7) > 0.5 ? "#efe6d6" : "#d9b78c"} />
                <rect x={x} y={y - 30} width={32} height={8} fill="#5b7fc4" />
              </g>
            );
          })}
        </g>
      ))}
      {/* постер */}
      <rect x={1700} y={440} width={180} height={240} fill="#2a1d1a" />
      <rect x={1710} y={450} width={160} height={220} fill="#ecd3a8" />
      <circle cx={1790} cy={540} r={52} fill="#9b4a30" />
      <text x={1790} y={652} textAnchor="middle" fontFamily={INTER} fontWeight={800} fontSize={30} fill="#2a1d1a">{poster}</text>
      {/* панели внизу */}
      <rect x={0} y={680} width={1920} height={14} fill="#94633f" />
      <Grad x={0} y={694} w={1920} h={206} stops={[[0, "#7c5136"], [1, "#6a432e"]]} />
      {Array.from({ length: 16 }, (_, i) => <rect key={i} x={14 + i * 120} y={712} width={100} height={170} rx={6} fill="none" stroke="#5a3826" strokeWidth={4} />)}
      <Grad x={0} y={900} w={1920} h={180} stops={[[0, "#3d2720"], [1, "#2a1a16"]]} />
      {Array.from({ length: 8 }, (_, i) => <line key={i} x1={0} y1={920 + i * 22} x2={1920} y2={920 + i * 22} stroke="#24160f" strokeWidth={2} opacity={0.6} />)}
    </Svg>
  );
};

// ── Гостиная / столовая: розовые обои в горошек, рамки, окно в сумерках ─
export const Living: React.FC<P> = ({ t, params }) => {
  const u = useUid();
  const wall = str(params.wall, "#b88884");
  return (
    <Svg>
      <defs>
        <pattern id={`dot${u}`} width={64} height={64} patternUnits="userSpaceOnUse">
          <circle cx={16} cy={16} r={5} fill="#fff" opacity={0.13} />
          <circle cx={48} cy={48} r={5} fill="#fff" opacity={0.13} />
        </pattern>
      </defs>
      <Grad w={1920} h={1080} stops={[[0, wall], [1, "#9a6c6e"]]} />
      <rect width={1920} height={760} fill={`url(#dot${u})`} />
      <Glow x={900} y={300} r={700} color="#ffd8b0" o={0.35} />
      {/* рамки */}
      {[[220, 230, 150, 160], [420, 280, 120, 150], [580, 220, 110, 130]].map(([x, y, w, h], i) => (
        <g key={i}>
          <rect x={x} y={y} width={w} height={h} fill="#6a4630" />
          <rect x={x + 10} y={y + 10} width={w - 20} height={h - 20} fill="#f6ead2" />
          <circle cx={x + w / 2 - 14} cy={y + h / 2} r={13} fill="#3a3030" />
          <circle cx={x + w / 2 + 14} cy={y + h / 2} r={13} fill="#3a3030" />
        </g>
      ))}
      {/* окно с занавесками */}
      <rect x={1370} y={160} width={380} height={440} fill="#efe4d2" />
      <Grad x={1390} y={180} w={340} h={400} stops={[[0, "#5658a0"], [0.6, "#c48cb4"], [1, "#f7c28c"]]} />
      <rect x={1555} y={180} width={10} height={400} fill="#efe4d2" />
      <rect x={1390} y={370} width={340} height={10} fill="#efe4d2" />
      <Glow x={1560} y={560} r={300} color="#ffc69a" o={0.5} />
      <path d={`M 1290 140 Q 1330 ${380 + Math.sin(t) * 4} 1300 640 L 1360 640 Q 1380 380 1350 140 Z`} fill="#5b8c88" />
      <path d={`M 1830 140 Q 1790 ${380 + Math.sin(t + 1) * 4} 1820 640 L 1760 640 Q 1740 380 1770 140 Z`} fill="#5b8c88" />
      <rect x={1270} y={130} width={580} height={14} rx={7} fill="#5a3a2a" />
      {/* плинтус и пол */}
      <rect x={0} y={760} width={1920} height={18} fill="#e9d6c6" />
      <Grad x={0} y={778} w={1920} h={122} stops={[[0, "#8c5f58"], [1, "#7a5250"]]} />
      <Grad x={0} y={900} w={1920} h={180} stops={[[0, "#6a4334"], [1, "#4a2e25"]]} />
      {Array.from({ length: 12 }, (_, i) => <line key={i} x1={i * 180} y1={900} x2={i * 180 - 90} y2={1080} stroke="#583727" strokeWidth={3} />)}
    </Svg>
  );
};

// ── Тёмная «научная» сцена: синяя сетка, свечение ───────────────────
export const LabDark: React.FC<P> = ({ t, params }) => {
  const u = useUid();
  const accent = str(params.accent, "#5fd4ff");
  return (
    <Svg>
      <defs>
        <pattern id={`grid${u}`} width={64} height={64} patternUnits="userSpaceOnUse">
          <path d="M 64 0 H 0 V 64" fill="none" stroke="#3a5ea8" strokeWidth={1.2} />
        </pattern>
      </defs>
      <Grad w={1920} h={1080} stops={[[0, "#0e1838"], [0.6, "#13234e"], [1, "#0b1430"]]} />
      <rect width={1920} height={1080} fill={`url(#grid${u})`} opacity={0.35} />
      <Glow x={960} y={480} r={760} color="#2a4f9e" o={0.6} rx={1100} />
      {/* пол-платформа */}
      <ellipse cx={960} cy={905} rx={760} ry={70} fill="#1c3570" opacity={0.7} />
      <ellipse cx={960} cy={905} rx={760} ry={70} fill="none" stroke={accent} strokeWidth={2} opacity={0.35} />
      <ellipse cx={960} cy={905} rx={520} ry={46} fill="none" stroke={accent} strokeWidth={1.5} opacity={0.2} />
      {Array.from({ length: 40 }, (_, i) => {
        const y = (rand(i) * 1100 - t * (10 + rand(i + 2) * 20) + 2200) % 1100;
        return <circle key={i} cx={rand(i + 5) * 1920} cy={y} r={1.5 + rand(i + 1) * 2} fill={accent} opacity={0.25 + 0.25 * Math.sin(t * 2 + i)} />;
      })}
    </Svg>
  );
};

// Король на портрете (для галереи)
const KingPortrait: React.FC<{ x: number; y: number; w: number; h: number; name?: string; sub?: string; bar?: number }> = ({ x, y, w, h, name, sub, bar }) => (
  <g>
    <rect x={x - 22} y={y - 22} width={w + 44} height={h + 44} rx={6} fill="#d6a845" />
    <rect x={x - 10} y={y - 10} width={w + 20} height={h + 20} fill="#9a6b26" />
    <Grad x={x} y={y} w={w} h={h} stops={[[0, "#6b5134"], [1, "#3e2c1c"]]} />
    <Glow x={x + w / 2} y={y + h * 0.4} r={w * 0.6} color="#d9b47a" o={0.35} />
    <path d={`M ${x + w * 0.12} ${y + h} L ${x + w * 0.28} ${y + h * 0.62} L ${x + w * 0.72} ${y + h * 0.62} L ${x + w * 0.88} ${y + h} Z`} fill="#5e2638" />
    <rect x={x + w * 0.46} y={y + h * 0.62} width={w * 0.08} height={h * 0.38} fill="#d9a83a" />
    <ellipse cx={x + w / 2} cy={y + h * 0.42} rx={w * 0.17} ry={h * 0.19} fill={SKINS.fair} />
    {Array.from({ length: 7 }, (_, i) => <ellipse key={i} cx={x + w * (0.27 + i * 0.077)} cy={y + h * 0.61} rx={w * 0.06} ry={h * 0.035} fill="#fbf6ee" />)}
    <path d={`M ${x + w * 0.38} ${y + h * 0.26} L ${x + w * 0.36} ${y + h * 0.16} L ${x + w * 0.43} ${y + h * 0.21} L ${x + w * 0.5} ${y + h * 0.13} L ${x + w * 0.57} ${y + h * 0.21} L ${x + w * 0.64} ${y + h * 0.16} L ${x + w * 0.62} ${y + h * 0.26} Z`} fill="#f0c24b" />
    {[0.43, 0.5, 0.57].map((k) => <circle key={k} cx={x + w * k} cy={y + h * 0.235} r={w * 0.012} fill="#c0392b" />)}
    {[0.455, 0.545].map((k) => (
      <g key={k}>
        <circle cx={x + w * k} cy={y + h * 0.4} r={w * 0.025} fill="#fbf6ee" />
        <circle cx={x + w * k} cy={y + h * 0.4} r={w * 0.011} fill="#1d1614" />
      </g>
    ))}
    <line x1={x + w * 0.47} y1={y + h * 0.5} x2={x + w * 0.53} y2={y + h * 0.5} stroke="#3b2620" strokeWidth={3} />
    {name ? (
      <g>
        <rect x={x + w * 0.2} y={y + h + 34} width={w * 0.6} height={46} rx={6} fill="#2a1a10" opacity={0.85} />
        <text x={x + w / 2} y={y + h + 66} textAnchor="middle" fontFamily={INTER} fontWeight={800} fontSize={24} letterSpacing={4} fill="#f2d48a">{name}</text>
      </g>
    ) : null}
    {sub ? <text x={x + w / 2} y={y + h + 108} textAnchor="middle" fontFamily={INTER} fontWeight={600} fontSize={22} fill="#f2d48a">{sub}</text> : null}
    {bar !== undefined ? (
      <g>
        <rect x={x + w * 0.15} y={y + h + 122} width={w * 0.7} height={16} rx={8} fill="#2a1a10" />
        <rect x={x + w * 0.15} y={y + h + 122} width={w * 0.7 * clamp(bar)} height={16} rx={8} fill="#f2a65a" />
      </g>
    ) : null}
  </g>
);

// ── Дворцовая галерея: портреты королей, красные шторы, свеча ────────
// params: names ("PHILIP III|CHARLES II"), subs (подписи через |), bars ("0.5|0.8")
export const Gallery: React.FC<P> = ({ t, params }) => {
  const u = useUid();
  const names = str(params.names, "").split("|");
  const subs = str(params.subs, "").split("|");
  const bars = str(params.bars, "").split("|").filter(Boolean).map(Number);
  return (
    <Svg>
      <defs>
        <pattern id={`dm${u}`} width={110} height={130} patternUnits="userSpaceOnUse">
          <ellipse cx={27} cy={32} rx={16} ry={24} fill="#6b4630" opacity={0.5} />
          <ellipse cx={82} cy={97} rx={16} ry={24} fill="#6b4630" opacity={0.5} />
        </pattern>
      </defs>
      <Grad w={1920} h={1080} stops={[[0, "#4e3222"], [1, "#3a2418"]]} />
      <rect width={1920} height={860} fill={`url(#dm${u})`} />
      {[[560, 260], [1380, 220], [-60, 160]].map(([x, w], i) => (
        <g key={i}>
          <Grad x={x} y={0} w={w} h={1080} horiz stops={[[0, "#7d1d1d"], [0.3, "#c0392f"], [0.6, "#962626"], [1, "#c8443a"]]} />
          {Array.from({ length: 4 }, (_, k) => <rect key={k} x={x + k * (w / 4) + w / 8} y={0} width={6} height={1080} fill="#6a1515" opacity={0.5} />)}
        </g>
      ))}
      <KingPortrait x={110} y={160} w={420} h={510} name={names[0] || undefined} sub={subs[0] || undefined} bar={bars[0]} />
      <KingPortrait x={890} y={160} w={420} h={510} name={names[1] || undefined} sub={subs[1] || undefined} bar={bars[1]} />
      <rect x={0} y={860} width={1920} height={30} fill="#c89a52" />
      <Grad x={0} y={890} w={1920} h={190} stops={[[0, "#3b2316"], [1, "#24150d"]]} />
      {/* свеча */}
      <g transform="translate(1720 860)">
        <rect x={-6} y={-60} width={12} height={160} fill="#b98c40" />
        <rect x={-46} y={-70} width={92} height={14} rx={4} fill="#c89a52" />
        <rect x={-14} y={-200} width={28} height={130} rx={4} fill="#f8eedd" />
        <path d={`M 0 ${-250 + Math.sin(t * 9) * 3} Q 14 -222 0 -204 Q -14 -222 0 ${-250 + Math.sin(t * 9) * 3} Z`} fill="#ffd27a" />
        <Glow x={0} y={-220} r={260} color="#ffbe6a" o={0.75 + Math.sin(t * 7) * 0.08} />
      </g>
    </Svg>
  );
};

// ── Крыльцо на закате: дом, перила, кресла-качалки ставятся пропом ───
export const Porch: React.FC<P> = ({ t }) => (
  <Svg>
    <Grad w={1920} h={900} stops={[[0, "#7c6cb0"], [0.45, "#e9928a"], [0.8, "#f8c68c"], [1, "#fde3b4"]]} />
    <Glow x={1350} y={640} r={420} color="#fff0c8" o={0.9} />
    <circle cx={1350} cy={640} r={70} fill="#fff4da" />
    <path d="M 560 700 Q 900 600 1200 680 T 1920 650 L 1920 900 L 560 900 Z" fill="#8a5f8e" opacity={0.75} />
    <path d="M 560 760 Q 1000 700 1400 760 T 1920 740 L 1920 900 L 560 900 Z" fill="#6c4a78" />
    {/* стена дома */}
    <Grad x={0} y={0} w={560} h={900} stops={[[0, "#c58a64"], [1, "#a96e4f"]]} />
    {Array.from({ length: 22 }, (_, i) => <line key={i} x1={0} y1={i * 42} x2={560} y2={i * 42} stroke="#94593e" strokeWidth={3} />)}
    <rect x={120} y={260} width={280} height={330} fill="#efe4d2" />
    <Grad x={136} y={276} w={248} h={298} stops={[[0, "#ffe2a8"], [1, "#f1aa62"]]} />
    <rect x={256} y={276} width={8} height={298} fill="#efe4d2" />
    <Glow x={260} y={430} r={260} color="#ffd59a" o={0.5} />
    <rect x={0} y={0} width={1920} height={56} fill="#4a2c22" />
    {/* столбы и перила */}
    {[580, 1880].map((x) => <rect key={x} x={x - 18} y={56} width={36} height={844} fill="#5a3527" />)}
    <rect x={560} y={760} width={1360} height={16} fill="#5a3527" />
    {Array.from({ length: 22 }, (_, i) => <rect key={i} x={600 + i * 60} y={776} width={14} height={124} fill="#5a3527" />)}
    <Grad x={0} y={900} w={1920} h={180} stops={[[0, "#8a5a3c"], [1, "#5e3a26"]]} />
    {Array.from({ length: 7 }, (_, i) => <line key={i} x1={0} y1={920 + i * 26} x2={1920} y2={920 + i * 26} stroke="#6a422c" strokeWidth={3} />)}
    {Array.from({ length: 3 }, (_, i) => {
      const x = ((t * 18 + i * 600) % 2200) - 140;
      return <path key={i} d={`M ${x} ${300 + i * 60} q 10 -8 20 0 q 10 -8 20 0`} fill="none" stroke="#5a3a5a" strokeWidth={3} />;
    })}
  </Svg>
);

// ── Деревня: домики, забор, грядки, флажки ──────────────────────────
export const Village: React.FC<P> = ({ t, params }) => {
  const eve = params.tod === "evening";
  return (
    <Svg>
      <Grad w={1920} h={900} stops={eve ? [[0, "#6f6cb4"], [0.6, "#f0a38c"], [1, "#fbd59a"]] : [[0, "#8ec2ec"], [1, "#e6f3fb"]]} />
      <Glow x={1500} y={260} r={300} color={eve ? "#ffe0b0" : "#fffbe8"} o={0.7} />
      {[0, 1, 2].map((i) => {
        const x = ((t * 8 + i * 700) % 2400) - 300;
        return (
          <g key={i} fill="#fff" opacity={0.85}>
            <ellipse cx={x} cy={150 + i * 50} rx={90} ry={30} />
            <ellipse cx={x + 60} cy={136 + i * 50} rx={60} ry={34} />
          </g>
        );
      })}
      <path d="M 0 640 Q 400 520 900 610 T 1920 580 L 1920 900 L 0 900 Z" fill={eve ? "#6e7f5a" : "#86b86a"} />
      <path d="M 0 720 Q 600 640 1200 710 T 1920 690 L 1920 900 L 0 900 Z" fill={eve ? "#5d7048" : "#6fa456"} />
      {[[180, 470, "#e8d2a8", "#b8452f"], [560, 500, "#d9a77a", "#7a4a8a"], [1250, 480, "#f0e0c0", "#3f6f9a"], [1620, 510, "#e3b98a", "#b8452f"]].map(([x, y, wall, roof], i) => (
        <g key={i}>
          <rect x={(x as number) - 120} y={y as number} width={240} height={230} fill={wall as string} />
          <path d={`M ${(x as number) - 150} ${y} L ${x} ${(y as number) - 120} L ${(x as number) + 150} ${y} Z`} fill={roof as string} />
          <rect x={(x as number) - 30} y={(y as number) + 120} width={60} height={110} fill="#6a4632" />
          <rect x={(x as number) - 100} y={(y as number) + 50} width={50} height={50} fill={eve ? "#ffd58c" : "#9fc6e6"} />
          <rect x={(x as number) + 50} y={(y as number) + 50} width={50} height={50} fill={eve ? "#ffd58c" : "#9fc6e6"} />
        </g>
      ))}
      {[[930, 640], [80, 690], [1840, 650]].map(([x, y], i) => (
        <g key={i}>
          <rect x={x - 12} y={y} width={24} height={110} fill="#6a4a32" />
          <circle cx={x} cy={y - 30} r={80} fill="#4f8a4a" />
          <circle cx={x - 40} cy={y} r={56} fill="#5a9a52" />
          <circle cx={x + 44} cy={y - 6} r={52} fill="#447c42" />
        </g>
      ))}
      {/* флажки */}
      {[[0, 960], [960, 1920]].map(([a, b], s) => {
        const n = 14;
        return (
          <g key={s}>
            <path d={`M ${a} 90 Q ${(a + b) / 2} 190 ${b} 90`} fill="none" stroke="#5a4a3a" strokeWidth={2.5} />
            {Array.from({ length: n }, (_, i) => {
              const k = (i + 0.5) / n;
              const x = a + (b - a) * k;
              const y = 90 + 4 * 100 * k * (1 - k) * 1;
              const sw = Math.sin(t * 2 + i) * 4;
              return <path key={i} d={`M ${x - 18} ${y} L ${x + 18} ${y} L ${x + sw} ${y + 44} Z`} fill={["#e8574a", "#f2c14b", "#4fb3a9", "#5b8be0", "#f07fa8"][i % 5]} />;
            })}
          </g>
        );
      })}
      {/* грядки и забор */}
      <Grad x={0} y={820} w={1920} h={260} stops={[[0, "#8a6a44"], [1, "#6a4e32"]]} />
      {Array.from({ length: 6 }, (_, r) => (
        <g key={r}>
          <rect x={60 + r * 310} y={940} width={260} height={46} rx={20} fill="#5a3e28" />
          {Array.from({ length: 6 }, (_, i) => <ellipse key={i} cx={84 + r * 310 + i * 42} cy={936} rx={14} ry={18} fill={i % 2 ? "#5fa652" : "#4e9446"} />)}
        </g>
      ))}
      {Array.from({ length: 33 }, (_, i) => <path key={i} d={`M ${i * 60 + 10} 900 L ${i * 60 + 10} 812 L ${i * 60 + 24} 798 L ${i * 60 + 38} 812 L ${i * 60 + 38} 900 Z`} fill="#f2ead8" />)}
      <rect x={0} y={830} width={1920} height={10} fill="#e3d8c0" />
      <rect x={0} y={870} width={1920} height={10} fill="#e3d8c0" />
    </Svg>
  );
};

// ── Саванна на закате: акации, большое солнце ────────────────────────
export const Savanna: React.FC<P> = ({ t }) => (
  <Svg>
    <Grad w={1920} h={900} stops={[[0, "#c9628a"], [0.4, "#f3925e"], [0.8, "#fbc77a"], [1, "#fde2a8"]]} />
    <Glow x={1250} y={700} r={520} color="#fff0c0" o={0.9} />
    <circle cx={1250} cy={700} r={140} fill="#fff1c8" />
    <path d="M 0 760 Q 500 700 1000 750 T 1920 730 L 1920 900 L 0 900 Z" fill="#c76f4a" opacity={0.8} />
    {[[300, 760, 1.2], [1580, 740, 1.5], [860, 780, 0.8]].map(([x, y, s], i) => (
      <g key={i} transform={`translate(${x} ${y}) scale(${s})`} fill="#3a1f2a">
        <path d="M -6 0 L -2 -120 Q -40 -150 -70 -160 L -66 -166 Q -30 -156 0 -132 Q 30 -170 70 -175 L 72 -168 Q 34 -160 6 -122 L 8 0 Z" />
        <ellipse cx={-60} cy={-176} rx={90} ry={18} />
        <ellipse cx={60} cy={-186} rx={100} ry={20} />
        <ellipse cx={0} cy={-196} rx={70} ry={16} />
      </g>
    ))}
    <Grad x={0} y={820} w={1920} h={260} stops={[[0, "#b0623a"], [1, "#7a3e26"]]} />
    {Array.from({ length: 70 }, (_, i) => {
      const x = rand(i) * 1960;
      const y = 830 + rand(i + 1) * 240;
      const sw = Math.sin(t * 1.5 + i) * 3;
      return <path key={i} d={`M ${x} ${y} l ${-6 + sw} -26 M ${x} ${y} l ${sw} -34 M ${x} ${y} l ${6 + sw} -24`} stroke="#5e2e1c" strokeWidth={3} strokeLinecap="round" />;
    })}
  </Svg>
);

// ── Остров в море: волны, кораблики, берег на переднем плане ─────────
// params: ships (сколько кораблей, по умолчанию 0)
export const Island: React.FC<P> = ({ t, params }) => {
  const ships = num(params.ships, 0);
  return (
    <Svg>
      <Grad w={1920} h={640} stops={[[0, "#6d86c8"], [0.7, "#e9b4b6"], [1, "#f8d3a8"]]} />
      <Glow x={400} y={600} r={400} color="#fff1d0" o={0.7} />
      <Grad x={0} y={600} w={1920} h={320} stops={[[0, "#5c7fbf"], [1, "#2f5a94"]]} />
      {Array.from({ length: 9 }, (_, r) =>
        Array.from({ length: 10 }, (_, i) => {
          const x = ((i * 230 + r * 90 + t * (12 + r * 3)) % 2300) - 200;
          return <path key={`${r}-${i}`} d={`M ${x} ${630 + r * 30} q 20 -8 40 0`} fill="none" stroke="#a9c4ea" strokeWidth={2.5} opacity={0.55} />;
        }),
      )}
      <path d="M 1100 640 Q 1300 520 1520 560 Q 1680 520 1800 640 Z" fill="#4f8a5a" />
      <path d="M 1080 642 Q 1440 610 1820 642 L 1820 650 L 1080 650 Z" fill="#e8c99a" />
      {[[1300, 560], [1420, 540], [1560, 555]].map(([x, y], i) => (
        <g key={i}>
          <path d={`M ${x} ${y + 40} Q ${x + 6} ${y} ${x + 10} ${y - 40}`} stroke="#6a4a32" strokeWidth={6} fill="none" />
          {[-60, -20, 20, 60, 100].map((a) => <ellipse key={a} cx={x + 10} cy={y - 40} rx={34} ry={8} fill="#3f7a48" transform={`rotate(${a + Math.sin(t + i) * 3} ${x + 10} ${y - 40}) translate(28 0)`} />)}
        </g>
      ))}
      {Array.from({ length: ships }, (_, i) => {
        const x = 200 + i * 300 + ((t * 10) % 200);
        const y = 680 + (i % 2) * 40 + Math.sin(t * 1.5 + i) * 3;
        return (
          <g key={i} transform={`translate(${x} ${y})`}>
            <path d="M -60 0 L 60 0 L 46 22 L -46 22 Z" fill="#5a3a2a" />
            <rect x={-3} y={-110} width={6} height={110} fill="#4a3022" />
            <path d="M 4 -104 Q 50 -60 4 -14 Z" fill="#f4ecdc" />
            <path d="M -4 -96 Q -40 -60 -4 -24 Z" fill="#e9dcc4" />
          </g>
        );
      })}
      <Grad x={0} y={860} w={1920} h={220} stops={[[0, "#ecd3a6"], [1, "#d8b886"]]} />
      <path d={`M 0 870 Q 480 ${850 + Math.sin(t) * 6} 960 868 T 1920 862 L 1920 880 L 0 880 Z`} fill="#fff" opacity={0.5} />
    </Svg>
  );
};

// ── Лес с лучами света ───────────────────────────────────────────────
export const Forest: React.FC<P> = ({ t }) => (
  <Svg>
    <Grad w={1920} h={1080} stops={[[0, "#9cc7a0"], [0.6, "#5f9a72"], [1, "#2f5e46"]]} />
    {Array.from({ length: 16 }, (_, i) => <rect key={i} x={rand(i) * 1920} y={0} width={30 + rand(i + 1) * 30} height={900} fill="#5b8f74" opacity={0.6} />)}
    {Array.from({ length: 9 }, (_, i) => <rect key={i} x={rand(i + 20) * 1920} y={0} width={50 + rand(i + 21) * 40} height={900} fill="#3f6f55" />)}
    <path d="M 0 120 Q 300 60 600 140 T 1200 110 T 1920 130 L 1920 0 L 0 0 Z" fill="#2f5e44" />
    {[300, 820, 1350].map((x, i) => (
      <Shaft key={x} x={x} y={-40} w={160} len={1100} ang={-18} o={0.22 + Math.sin(t * 0.6 + i) * 0.06} />
    ))}
    <Grad x={0} y={860} w={1920} h={220} stops={[[0, "#3f6e3c"], [1, "#2a4c2c"]]} />
    {Array.from({ length: 24 }, (_, i) => {
      const x = rand(i + 40) * 1920;
      return (
        <g key={i} transform={`translate(${x} ${880 + rand(i + 41) * 120})`}>
          {[-50, -25, 0, 25, 50].map((a) => <ellipse key={a} cx={0} cy={-30} rx={8} ry={30} fill="#4d8a4a" transform={`rotate(${a + Math.sin(t + i) * 2} 0 0)`} />)}
        </g>
      );
    })}
    {[[-40, 140], [1820, 160]].map(([x, w], i) => <rect key={i} x={x} y={0} width={w} height={1080} fill="#264534" />)}
  </Svg>
);

// ── Студия: мягкий бежевый фон, круг света на полу ───────────────────
export const Studio: React.FC<P> = ({ params }) => {
  const c = str(params.color, "#efdcc4");
  return (
    <Svg>
      <Grad w={1920} h={1080} stops={[[0, c], [1, "#d6b896"]]} />
      <Glow x={960} y={420} r={800} color="#fff6e8" o={0.7} rx={1100} />
      <ellipse cx={960} cy={905} rx={620} ry={70} fill="#fff4e4" opacity={0.6} />
      <rect x={0} y={900} width={1920} height={180} fill="#c9a985" opacity={0.25} />
    </Svg>
  );
};

export const LOCATIONS3: Record<string, React.FC<P>> = {
  "cafe-street": CafeStreet,
  classroom: Classroom,
  living: Living,
  "lab-dark": LabDark,
  gallery: Gallery,
  porch: Porch,
  village: Village,
  savanna: Savanna,
  island: Island,
  forest: Forest,
  studio: Studio,
};
