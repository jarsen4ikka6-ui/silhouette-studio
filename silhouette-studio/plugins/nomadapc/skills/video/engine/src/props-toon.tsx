// Предметы стиля toon: с тёмной обводкой, как персонажи. Обычно front: true (стоят перед людьми).
// t-counter — касса с терминалом, t-table — стол с клетчатой скатертью, t-desk — школьная парта,
// t-chair — стул и t-sofa — диван для сидящих (без front), t-money — пачка денег, t-bag — пакет с продуктами, t-tv — телевизор с новостями (params.text — бегущая строка)
import React from "react";
import { RUBIK } from "./fonts";

type PP = { t: number; params: Record<string, number | string | boolean> };
const OL = "#1c1a24";
const W = 3;
const str = (v: unknown, d: string) => (typeof v === "string" ? v : d);
const num = (v: unknown, d: number) => (typeof v === "number" ? v : d);

// ВЫСОТЫ (рост персонажа 390): стол и парта — 130 (ниже груди сидящего: видны грудь и голова; стоящему — чуть ниже пояса),
// прилавок — 170 (продавец за ним виден по пояс, как у конкурента), сиденье стула и табурета — 88, дивана — 96.
// Предмет на поверхность ставь через "on": "t-table" — движок сам поставит его на столешницу (TOPS в scripts/build-timing.mjs)

// касса: (0, 0) — середина прилавка на полу; ширина params.w (по умолчанию 620), цвет params.color. Верх прилавка на высоте 170
const Counter: React.FC<PP> = ({ params }) => {
  const w = num(params.w, 620);
  const c = str(params.color, "#4c5a86");
  return (
    <g>
      <rect x={-w / 2} y={-158} width={w} height={158} rx={8} fill={c} stroke={OL} strokeWidth={W} />
      <rect x={-w / 2 - 14} y={-170} width={w + 28} height={22} rx={6} fill="#6f7eae" stroke={OL} strokeWidth={W} />
      <rect x={-w / 2 + 24} y={-128} width={w - 48} height={100} rx={6} fill="#000" opacity={0.15} />
      {/* терминал */}
      <g transform={`translate(${w / 2 - 110} -170)`}>
        <rect x={-30} y={-70} width={60} height={70} rx={8} fill="#2a2d3a" stroke={OL} strokeWidth={W} />
        <rect x={-22} y={-62} width={44} height={26} rx={3} fill="#7fe0a6" />
        {[0, 1, 2].map((r) => [0, 1, 2].map((cc) => <rect key={`${r}${cc}`} x={-20 + cc * 14} y={-30 + r * 9} width={10} height={6} rx={1.5} fill="#cfd3dc" />))}
      </g>
      {/* лента и товары */}
      <rect x={-w / 2 + 20} y={-178} width={w * 0.45} height={10} rx={4} fill="#2a2d3a" />
      <rect x={-w / 2 + 60} y={-216} width={44} height={40} rx={4} fill="#f2b134" stroke={OL} strokeWidth={2.4} />
      <rect x={-w / 2 + 120} y={-226} width={30} height={52} rx={10} fill="#4fb0c6" stroke={OL} strokeWidth={2.4} />
    </g>
  );
};

// стол: (0, 0) — середина на полу, столешница на высоте 130. params.cloth: false — без скатерти, params.w — ширина (560)
const Table: React.FC<PP> = ({ params }) => {
  const w = num(params.w, 560);
  const cloth = params.cloth !== false;
  const u = `tt${Math.round(w)}`;
  return (
    <g>
      <defs>
        <pattern id={u} width={40} height={40} patternUnits="userSpaceOnUse">
          <rect width={40} height={40} fill="#f4ede0" />
          <rect width={20} height={20} fill="#e2574c" opacity={0.75} />
          <rect x={20} y={20} width={20} height={20} fill="#e2574c" opacity={0.75} />
        </pattern>
      </defs>
      <rect x={-w / 2 + 30} y={-112} width={18} height={112} fill="#5a3f2c" stroke={OL} strokeWidth={W} />
      <rect x={w / 2 - 48} y={-112} width={18} height={112} fill="#5a3f2c" stroke={OL} strokeWidth={W} />
      {cloth ? (
        <path d={`M ${-w / 2 - 10} -130 L ${w / 2 + 10} -130 L ${w / 2 + 22} -72 L ${-w / 2 - 22} -72 Z`} fill={`url(#${u})`} stroke={OL} strokeWidth={W} strokeLinejoin="round" />
      ) : (
        <rect x={-w / 2 - 10} y={-130} width={w + 20} height={24} rx={6} fill="#8a6446" stroke={OL} strokeWidth={W} />
      )}
    </g>
  );
};

// школьная парта: столешница на высоте 130
const Desk: React.FC<PP> = () => (
  <g>
    <rect x={-150} y={-110} width={14} height={110} fill="#6b7280" stroke={OL} strokeWidth={W} />
    <rect x={136} y={-110} width={14} height={110} fill="#6b7280" stroke={OL} strokeWidth={W} />
    <rect x={-170} y={-130} width={340} height={24} rx={6} fill="#c79a74" stroke={OL} strokeWidth={W} />
    <rect x={-140} y={-106} width={280} height={40} fill="#8a6446" stroke={OL} strokeWidth={W} />
  </g>
);

// стул для сидящего (legs: "sit"): ставить в тот же x, что и человек, без front — он позади ног
const Chair: React.FC<PP> = ({ params }) => {
  const c = str(params.color, "#b0703e");
  return (
    <g>
      <rect x={-52} y={-250} width={104} height={170} rx={14} fill={c} stroke={OL} strokeWidth={W} />
      <rect x={-38} y={-232} width={76} height={20} rx={6} fill="#000" opacity={0.15} />
      <rect x={-56} y={-6 - 64} width={12} height={70} fill="#5a3f2c" stroke={OL} strokeWidth={W} />
      <rect x={44} y={-6 - 64} width={12} height={70} fill="#5a3f2c" stroke={OL} strokeWidth={W} />
      <rect x={-68} y={-88} width={136} height={22} rx={8} fill={c} stroke={OL} strokeWidth={W} />
    </g>
  );
};

// диван: params.w — ширина, params.color
const Sofa: React.FC<PP> = ({ params }) => {
  const w = num(params.w, 420);
  const c = str(params.color, "#5a6fa8");
  return (
    <g>
      <rect x={-w / 2} y={-230} width={w} height={150} rx={26} fill={c} stroke={OL} strokeWidth={W} />
      <rect x={-w / 2 - 34} y={-150} width={56} height={140} rx={20} fill={c} stroke={OL} strokeWidth={W} />
      <rect x={w / 2 - 22} y={-150} width={56} height={140} rx={20} fill={c} stroke={OL} strokeWidth={W} />
      <rect x={-w / 2 + 14} y={-96} width={w - 28} height={80} rx={16} fill={c} stroke={OL} strokeWidth={W} />
      <rect x={-w / 2 + 14} y={-96} width={w - 28} height={18} rx={9} fill="#fff" opacity={0.12} />
    </g>
  );
};

// пачка денег (params.n — сколько пачек стопкой)
const Money: React.FC<PP> = ({ params }) => {
  const n = num(params.n, 1);
  return (
    <g>
      {Array.from({ length: n }, (_, i) => (
        <g key={i} transform={`translate(${(i % 2) * 8} ${-i * 22})`}>
          <rect x={-46} y={-22} width={92} height={22} rx={4} fill="#9fd08a" stroke={OL} strokeWidth={2.6} />
          <rect x={-10} y={-24} width={20} height={26} fill="#f4ede0" stroke={OL} strokeWidth={2} />
        </g>
      ))}
    </g>
  );
};

// пакет с продуктами
const Bag: React.FC<PP> = () => (
  <g>
    <path d="M -10 -110 L -46 -150 L -30 -96" fill="#f4e9d2" stroke={OL} strokeWidth={2.6} />
    <rect x={-40} y={-140} width={30} height={60} rx={6} fill="#f2b134" stroke={OL} strokeWidth={2.4} />
    <circle cx={14} cy={-128} r={16} fill="#7bc47f" stroke={OL} strokeWidth={2.4} />
    <path d="M -56 -110 L 56 -110 L 46 0 L -46 0 Z" fill="#f4e9d2" stroke={OL} strokeWidth={W} strokeLinejoin="round" />
    <path d="M -30 -110 Q 0 -150 30 -110" fill="none" stroke={OL} strokeWidth={W} />
  </g>
);

// телевизор: новости. params.text — бегущая строка, params.title — заголовок
const Tv: React.FC<PP> = ({ t, params }) => {
  const text = str(params.text, "СРОЧНО");
  return (
    <g>
      <rect x={-260} y={-320} width={520} height={320} rx={18} fill="#1d2030" stroke={OL} strokeWidth={W} />
      <rect x={-240} y={-300} width={480} height={262} rx={8} fill="#2f5aa8" />
      <circle cx={0} cy={-190} r={46} fill="#f8f6f1" stroke={OL} strokeWidth={2.4} />
      <rect x={-50} y={-144} width={100} height={70} rx={20} fill="#e2574c" stroke={OL} strokeWidth={2.4} />
      <rect x={-240} y={-100} width={480} height={34} fill="#e2574c" />
      <text x={-228} y={-74} fontFamily={RUBIK} fontWeight={800} fontSize={24} fill="#fff">
        {str(params.title, "НОВОСТИ")}
      </text>
      <svg x={-240} y={-66} width={480} height={28} overflow="hidden">
        <rect width={480} height={28} fill="#f4ede0" />
        <text x={480 - ((t * 120) % (480 + text.length * 15))} y={21} fontFamily={RUBIK} fontWeight={600} fontSize={20} fill={OL}>
          {text}
        </text>
      </svg>
      <rect x={-60} y={0} width={120} height={12} rx={4} fill="#1d2030" stroke={OL} strokeWidth={2} />
    </g>
  );
};

export const PROPS_TOON: Record<string, React.FC<PP>> = {
  "t-counter": Counter,
  "t-table": Table,
  "t-desk": Desk,
  "t-money": Money,
  "t-bag": Bag,
  "t-tv": Tv,
  "t-chair": Chair,
  "t-sofa": Sofa,
};
