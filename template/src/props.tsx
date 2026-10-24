// Библиотека предметов. Каждый рисуется вокруг точки (x, y) = место, где предмет стоит на полу
// (или его центр, если он висит в воздухе). Новые предметы под сценарии пишем в src/custom/props.tsx.
import React, { useId } from "react";
import { CUSTOM_PROPS } from "./custom/props";
import { PROPS3 } from "./props3";
import { PROPS_TOON } from "./props-toon";
import { PROPS_TOON2 } from "./props-toon2";
import type { Prop } from "./types";
import { along, clamp, ease, fadeWindow, rand } from "./util";

type PP = { t: number; params: Record<string, number | string | boolean> };
const useUid = () => useId().replace(/[^a-zA-Z0-9]/g, "");
const num = (v: unknown, d: number) => (typeof v === "number" ? v : d);

// Старый городской телефон на тумбочке. handset: false — трубку уже сняли
const Landline: React.FC<PP> = ({ params }) => (
  <g>
    <rect x={-70} y={-150} width={140} height={150} rx={6} fill="#2a2522" />
    <rect x={-62} y={-110} width={124} height={6} fill="#1d1916" />
    <path d="M -46 -150 L -40 -186 Q 0 -196 40 -186 L 46 -150 Z" fill="#7a2f2a" />
    <circle cx={0} cy={-170} r={13} fill="#d9cfc0" />
    {params.handset !== false ? <path d="M -52 -192 Q 0 -210 52 -192 L 50 -182 Q 0 -196 -50 -182 Z" fill="#8e3a33" /> : null}
    <path d="M 40 -160 q 30 10 22 40 q -8 30 20 40" fill="none" stroke="#5a2420" strokeWidth={4} />
  </g>
);

// Тетрадка в клеточку (держат в руках)
const Notebook: React.FC<PP> = ({ t, params }) => {
  const lines = num(params.lines, 7);
  const grow = num(params.writeAt, -1) >= 0 ? clamp((t - num(params.writeAt, 0)) / 1.2) : 1;
  return (
    <g transform="rotate(-8)">
      <rect x={-64} y={-44} width={128} height={88} rx={4} fill="#f3f0e6" />
      <line x1={0} y1={-44} x2={0} y2={44} stroke="#b9b3a3" strokeWidth={2} />
      {Array.from({ length: 9 }, (_, i) => <line key={`h${i}`} x1={-60} y1={-36 + i * 9} x2={60} y2={-36 + i * 9} stroke="#c6d4e6" strokeWidth={1} />)}
      {Array.from({ length: 14 }, (_, i) => <line key={`v${i}`} x1={-60 + i * 9} y1={-40} x2={-60 + i * 9} y2={40} stroke="#c6d4e6" strokeWidth={1} />)}
      {Array.from({ length: lines }, (_, i) => {
        const last = i === lines - 1;
        const w = 30 + rand(i + 3) * 22;
        return <line key={i} x1={i % 2 ? 6 : -56} y1={-30 + Math.floor(i / 2) * 18} x2={(i % 2 ? 6 : -56) + w * (last ? grow : 1)} y2={-30 + Math.floor(i / 2) * 18} stroke="#2b3f8f" strokeWidth={3} strokeLinecap="round" />;
      })}
    </g>
  );
};

// Столик с шахматами и двумя табуретками
const Chess: React.FC<PP> = () => (
  <g>
    <rect x={-80} y={-150} width={160} height={14} rx={3} fill="#3b2f26" />
    <rect x={-10} y={-136} width={20} height={136} fill="#2b221b" />
    <rect x={-60} y={-6} width={120} height={8} rx={3} fill="#2b221b" />
    {Array.from({ length: 16 }, (_, i) => (
      <rect key={i} x={-64 + (i % 8) * 16} y={-160 + Math.floor(i / 8) * 5} width={16} height={5} fill={(i + Math.floor(i / 8)) % 2 ? "#d8c9a8" : "#5b4636"} />
    ))}
    {[-44, -20, 18, 40].map((x, i) => <path key={i} d={`M ${x - 5} -160 L ${x + 5} -160 L ${x + 3} -${176 + (i % 2) * 8} L ${x - 3} -${176 + (i % 2) * 8} Z`} fill={i < 2 ? "#f1ece0" : "#141414"} />)}
    {[-150, 150].map((x) => (
      <g key={x}>
        <rect x={x - 34} y={-92} width={68} height={12} rx={3} fill="#3b2f26" />
        <rect x={x - 28} y={-80} width={8} height={80} fill="#2b221b" />
        <rect x={x + 20} y={-80} width={8} height={80} fill="#2b221b" />
      </g>
    ))}
  </g>
);

// Тумба с красной кнопкой. pressAt — когда нажали (вспышка-молния)
const ShockButton: React.FC<PP> = ({ t, params }) => {
  const u = useUid();
  const presses = String(params.pressAt ?? "").split(",").filter(Boolean).map(Number);
  const flash = presses.reduce((m, p) => Math.max(m, t >= p ? clamp(1 - (t - p) / 0.5) : 0), 0);
  return (
    <g>
      <defs>
        <radialGradient id={`fl${u}`}>
          <stop offset="0" stopColor="#fff6b0" stopOpacity={0.9} />
          <stop offset="1" stopColor="#ffd84a" stopOpacity={0} />
        </radialGradient>
      </defs>
      <rect x={-60} y={-260} width={120} height={260} rx={8} fill="#cfd5dc" />
      <rect x={-70} y={-270} width={140} height={18} rx={6} fill="#e6eaee" />
      <ellipse cx={0} cy={-276} rx={40} ry={12} fill="#7b1d1d" />
      <path d={`M -34 -276 Q -34 ${-306 + flash * 10} 0 ${-308 + flash * 10} Q 34 ${-306 + flash * 10} 34 -276 Z`} fill="#e23b32" />
      <path d="M 6 -236 L -14 -196 L 0 -196 L -8 -160 L 18 -206 L 4 -206 L 14 -236 Z" fill="#f2c94c" />
      {flash > 0 ? <circle cx={0} cy={-290} r={260} fill={`url(#fl${u})`} opacity={flash} style={{ mixBlendMode: "screen" }} /> : null}
    </g>
  );
};

// Лампочка-идея над головой
const Bulb: React.FC<PP> = ({ t }) => {
  const u = useUid();
  const pop = ease(clamp(t / 0.35));
  return (
    <g transform={`scale(${0.6 + 0.4 * pop})`}>
      <defs>
        <radialGradient id={`bg${u}`}>
          <stop offset="0" stopColor="#fff3b8" stopOpacity={0.8} />
          <stop offset="1" stopColor="#ffd86a" stopOpacity={0} />
        </radialGradient>
      </defs>
      <circle r={110} fill={`url(#bg${u})`} opacity={0.75 + Math.sin(t * 5) * 0.15} />
      <circle cy={-6} r={34} fill="#ffe58a" />
      <rect x={-16} y={24} width={32} height={22} rx={4} fill="#b9b2a2" />
      <path d="M -10 -4 L -4 8 L 4 -8 L 10 4" fill="none" stroke="#c98a1c" strokeWidth={3} />
    </g>
  );
};

// Воспоминание-фотография, висит в воздухе. icon: steps | rings | dog
const Memory: React.FC<PP> = ({ t, params }) => {
  const icon = String(params.icon ?? "steps");
  const fy = Math.sin(t * 1.2 + num(params.seed, 0)) * 8;
  return (
    <g transform={`translate(0 ${fy}) rotate(${num(params.rot, -4)})`}>
      <rect x={-92} y={-74} width={184} height={160} rx={6} fill="#efe9dc" />
      <rect x={-80} y={-62} width={160} height={118} fill="#41506e" />
      {icon === "steps" ? (
        <g fill="#f2d7a0">
          {[0, 1, 2, 3].map((i) => <ellipse key={i} cx={-50 + i * 32} cy={(i % 2 ? -14 : 14)} rx={9} ry={15} transform={`rotate(70 ${-50 + i * 32} ${i % 2 ? -14 : 14})`} />)}
        </g>
      ) : icon === "rings" ? (
        <g fill="none" stroke="#f2c66d" strokeWidth={8}>
          <circle cx={-16} cy={0} r={26} />
          <circle cx={18} cy={0} r={26} />
        </g>
      ) : (
        <g fill="#0a0a0c">
          <ellipse cx={0} cy={18} rx={44} ry={24} />
          <circle cx={36} cy={-10} r={20} />
          <path d="M 44 -26 l 10 -16 l 4 20 Z M 26 -26 l -2 -18 l 12 12 Z" />
          <path d="M -40 10 q -20 -20 -14 -36" stroke="#0a0a0c" strokeWidth={8} fill="none" />
        </g>
      )}
    </g>
  );
};

// Голосовое сообщение ▶ с волной. goneAt — рассыпается в пыль
const VoiceMsg: React.FC<PP> = ({ t, params }) => {
  const gone = num(params.goneAt, Infinity);
  const k = t > gone ? clamp((t - gone) / 2.2) : 0;
  return (
    <g>
      <g opacity={1 - k}>
        <rect x={-170} y={-44} width={340} height={88} rx={44} fill="#e9eef6" />
        <circle cx={-118} cy={0} r={28} fill="#3d7bd9" />
        <path d="M -126 -14 L -104 0 L -126 14 Z" fill="#fff" />
        {Array.from({ length: 18 }, (_, i) => {
          const h = 8 + rand(i + 4) * 34;
          return <rect key={i} x={-76 + i * 12} y={-h / 2} width={6} height={h} rx={3} fill="#5a6b88" />;
        })}
      </g>
      {k > 0
        ? Array.from({ length: 40 }, (_, i) => {
            const x = -170 + rand(i) * 340;
            const y = -40 + rand(i + 9) * 80 - k * (60 + rand(i + 2) * 160);
            return <circle key={i} cx={x + k * 40 * (rand(i + 5) - 0.5)} cy={y} r={3 + rand(i + 1) * 3} fill="#e9eef6" opacity={(1 - k) * 0.9} />;
          })
        : null}
    </g>
  );
};

// Конверт, который улетает: tx, ty — куда (относительно старта), за fly секунд
const Envelope: React.FC<PP> = ({ t, params }) => {
  const k = ease(clamp(t / num(params.fly, 3)));
  const x = num(params.tx, 0) * k;
  const y = num(params.ty, 0) * k - Math.sin(k * Math.PI) * 80;
  return (
    <g transform={`translate(${x} ${y}) scale(${1 - k * 0.6}) rotate(${k * 18})`} opacity={1 - Math.max(0, k - 0.8) * 5}>
      <rect x={-60} y={-38} width={120} height={76} rx={4} fill="#efe6d2" />
      <path d="M -60 -38 L 0 6 L 60 -38" fill="none" stroke="#c9bb9c" strokeWidth={4} />
      <rect x={30} y={-30} width={22} height={26} fill="#c94b3c" />
    </g>
  );
};

// Лондонское чёрное такси (вид сбоку, едет вправо)
const Cab: React.FC<PP> = ({ t }) => (
  <g>
    <path d="M -230 -40 L -230 -120 Q -226 -140 -200 -142 L -150 -146 Q -120 -230 -40 -232 L 90 -232 Q 150 -230 170 -150 L 220 -142 Q 244 -138 244 -110 L 244 -40 Z" fill="#101317" />
    <path d="M -128 -150 Q -104 -214 -40 -216 L 10 -216 L 10 -150 Z" fill="#3c4a5e" />
    <path d="M 26 -216 L 88 -216 Q 136 -214 152 -150 L 26 -150 Z" fill="#3c4a5e" />
    <rect x={-10} y={-252} width={50} height={20} rx={4} fill="#f2c66d" />
    <rect x={200} y={-118} width={34} height={18} rx={4} fill="#ffe3a0" />
    {[-150, 150].map((x) => (
      <g key={x} transform={`translate(${x} -40) rotate(${t * 200})`}>
        <circle r={44} fill="#07080a" />
        <circle r={20} fill="#6c7380" />
        <rect x={-3} y={-20} width={6} height={40} fill="#3a404b" />
      </g>
    ))}
  </g>
);

// Волны вибрации у кармана
const Buzz: React.FC<PP> = ({ t }) => (
  <g fill="none" stroke="#bfe0ff" strokeWidth={4} strokeLinecap="round">
    {[0, 1, 2].map((i) => {
      const ph = (t * 2 + i / 3) % 1;
      return (
        <g key={i} opacity={(1 - ph) * 0.8}>
          <path d={`M ${22 + ph * 40} -20 q ${10 + ph * 10} 20 0 40`} />
          <path d={`M ${-22 - ph * 40} -20 q ${-10 - ph * 10} 20 0 40`} />
        </g>
      );
    })}
  </g>
);

// Синяя линия навигатора, гаснет к fadeAt
const Route: React.FC<PP> = ({ t, params }) => {
  const k = clamp((t - num(params.fadeAt, 1)) / 1.5);
  return (
    <g opacity={1 - k}>
      <path d="M -300 0 Q -150 -80 0 -20 T 300 -60" fill="none" stroke="#3d8bff" strokeWidth={14} strokeLinecap="round" strokeDasharray="30 22" strokeDashoffset={-t * 60} />
      <circle cx={300} cy={-60} r={22} fill="#3d8bff" />
      <circle cx={300} cy={-60} r={9} fill="#fff" />
    </g>
  );
};

// Телефон, лежащий экраном вверх (на тумбочке). glow — экран светится
const PhoneFlat: React.FC<PP> = ({ t, params }) => {
  const u = useUid();
  const on = params.glow !== false;
  return (
    <g>
      <defs>
        <radialGradient id={`pg${u}`}>
          <stop offset="0" stopColor="#bfe0ff" stopOpacity={0.6} />
          <stop offset="1" stopColor="#7fb8ff" stopOpacity={0} />
        </radialGradient>
      </defs>
      {on ? <ellipse cx={0} cy={-10} rx={110} ry={50} fill={`url(#pg${u})`} opacity={0.7 + Math.sin(t * 2) * 0.1} /> : null}
      <path d="M -40 0 L 40 0 L 30 -14 L -30 -14 Z" fill="#16181d" stroke="#9fcfff" strokeWidth={2} />
    </g>
  );
};

// Простой стол
const Table: React.FC<PP> = ({ params }) => {
  const w = num(params.w, 300);
  const h = num(params.h, 170);
  const c = String(params.color ?? "#3b2f26");
  return (
    <g>
      <rect x={-w / 2} y={-h} width={w} height={16} rx={4} fill={c} />
      <rect x={-w / 2 + 16} y={-h + 16} width={14} height={h - 16} fill={c} opacity={0.85} />
      <rect x={w / 2 - 30} y={-h + 16} width={14} height={h - 16} fill={c} opacity={0.85} />
    </g>
  );
};

// Стул (спинка слева, если flip — справа)
const Chair: React.FC<PP> = ({ params }) => {
  const c = String(params.color ?? "#2a2f3a");
  return (
    <g>
      <rect x={-50} y={-100} width={100} height={14} rx={4} fill={c} />
      <rect x={-46} y={-86} width={10} height={86} fill={c} />
      <rect x={36} y={-86} width={10} height={86} fill={c} />
      <rect x={-50} y={-230} width={12} height={130} rx={4} fill={c} />
    </g>
  );
};

// Банкомат
const Atm: React.FC<PP> = ({ t }) => (
  <g>
    <rect x={-90} y={-330} width={180} height={330} rx={10} fill="#3a4556" />
    <rect x={-66} y={-300} width={132} height={96} rx={6} fill="#7fb0e0" opacity={0.85 + Math.sin(t * 3) * 0.05} />
    <text x={0} y={-244} textAnchor="middle" fontFamily="Montserrat" fontWeight={700} fontSize={26} fill="#16324f">PIN: ****</text>
    {Array.from({ length: 12 }, (_, i) => <rect key={i} x={-48 + (i % 3) * 34} y={-186 + Math.floor(i / 3) * 26} width={26} height={18} rx={3} fill="#cfd6df" />)}
    <rect x={-60} y={-70} width={120} height={10} rx={3} fill="#1b2230" />
  </g>
);

// Сумка курьера (кубик на спине)
const Bag: React.FC<PP> = () => (
  <g>
    <rect x={-50} y={-110} width={100} height={110} rx={10} fill="#2ea84f" />
    <rect x={-50} y={-110} width={100} height={20} rx={8} fill="#25863f" />
  </g>
);

// Скамейка
const Bench: React.FC<PP> = () => (
  <g fill="#2b221b">
    <rect x={-150} y={-80} width={300} height={14} rx={4} fill="#4a3a2c" />
    <rect x={-150} y={-150} width={300} height={12} rx={4} fill="#4a3a2c" />
    <rect x={-150} y={-124} width={300} height={12} rx={4} fill="#4a3a2c" />
    <rect x={-134} y={-66} width={12} height={66} />
    <rect x={122} y={-66} width={12} height={66} />
  </g>
);

export const PROPS: Record<string, React.FC<PP>> = {
  landline: Landline,
  notebook: Notebook,
  chess: Chess,
  button: ShockButton,
  bulb: Bulb,
  memory: Memory,
  voicemsg: VoiceMsg,
  envelope: Envelope,
  cab: Cab,
  buzz: Buzz,
  route: Route,
  phoneflat: PhoneFlat,
  table: Table,
  chair: Chair,
  atm: Atm,
  bag: Bag,
  bench: Bench,
  ...PROPS3,
  ...PROPS_TOON,
  ...PROPS_TOON2,
  ...CUSTOM_PROPS,
};

// Предмет на сцене: появление/исчезновение, позиция, масштаб, зеркало
// Предметы с «передом», нарисованные лицом ВПРАВО (машины). Если такой предмет едет влево (x: [больше, меньше]),
// он сам разворачивается — капотом по ходу движения. Явный flip в доске важнее
export const FACES_RIGHT = new Set(["t-taxi", "car"]);

export const PropView: React.FC<{ prop: Prop; t: number; p: number }> = ({ prop, t, p }) => {
  const C = PROPS[prop.kind];
  if (!C) return null;
  const at = prop.at ?? 0;
  const op = prop.at === undefined && prop.dur === undefined ? 1 : fadeWindow(t, at, prop.dur ?? Infinity, 0.3, 0.4);
  if (op <= 0) return null;
  const s = prop.scale ?? 1;
  const moving = Array.isArray(prop.x) ? prop.x[1] - prop.x[0] : Number(prop.params?.drive ?? 0);
  const flip = prop.flip ?? (FACES_RIGHT.has(prop.kind) && moving < 0);
  return (
    <g transform={`translate(${along(prop.x, p, 960)} ${along(prop.y, p, 900)}) scale(${flip ? -s : s} ${s})`} opacity={op}>
      <C t={t - at} params={{ ...(prop.params ?? {}), _flip: flip }} />
    </g>
  );
};
