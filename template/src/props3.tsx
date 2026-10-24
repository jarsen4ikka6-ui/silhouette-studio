// Предметы в стиле Awaken (к новым локациям). Точка (x, y) — место на полу, как в props.tsx.
// longtable, cafetable, rockchair, potplant, streetlamp, bed, crib, car, ship, bird, bunting, holo, genes, desk, candle
import React, { useId } from "react";
import { BODY } from "./Character";
import { INTER } from "./fonts";
import { Glow, PotPlant } from "./locations3";
import { clamp, rand } from "./util";

type PP = { t: number; params: Record<string, number | string | boolean> };
const useUid = () => useId().replace(/[^a-zA-Z0-9]/g, "");
const num = (v: unknown, d: number) => (typeof v === "number" ? v : d);
const str = (v: unknown, d: string) => (typeof v === "string" ? v : d);

// Длинный обеденный стол (ставить front: true — закрывает ноги сидящих). params: w, cloth, food
const LongTable: React.FC<PP> = ({ params }) => {
  const w = num(params.w, 1300);
  const cloth = str(params.cloth, "#f2e6d4");
  return (
    <g>
      <rect x={-w / 2} y={-168} width={w} height={22} rx={6} fill="#8a5a3a" />
      <path d={`M ${-w / 2 - 10} -160 L ${w / 2 + 10} -160 L ${w / 2 + 24} -40 L ${-w / 2 - 24} -40 Z`} fill={cloth} />
      <path d={`M ${-w / 2 - 24} -40 L ${w / 2 + 24} -40 L ${w / 2 + 24} -28 L ${-w / 2 - 24} -28 Z`} fill="#d8c8b2" />
      {Array.from({ length: Math.floor(w / 140) }, (_, i) => <line key={i} x1={-w / 2 + 70 + i * 140} y1={-160} x2={-w / 2 + 62 + i * 140 - (i - w / 280) * 2} y2={-40} stroke="#e3d4be" strokeWidth={4} />)}
      <rect x={-w / 2 + 30} y={-28} width={22} height={28} fill="#6a4228" />
      <rect x={w / 2 - 52} y={-28} width={22} height={28} fill="#6a4228" />
      {params.food !== false
        ? Array.from({ length: Math.floor(w / 220) }, (_, i) => {
            const x = -w / 2 + 120 + i * 220;
            return (
              <g key={i}>
                <ellipse cx={x} cy={-170} rx={42} ry={10} fill="#fbf8f2" />
                <ellipse cx={x} cy={-174} rx={22} ry={7} fill={["#d9874a", "#7fae5a", "#c94f3d"][i % 3]} />
                <rect x={x + 60} y={-206} width={16} height={36} rx={3} fill="#e8f0f6" opacity={0.8} />
              </g>
            );
          })
        : null}
    </g>
  );
};

// Круглый столик кафе с чашкой
const CafeTable: React.FC<PP> = ({ params }) => (
  <g>
    <ellipse cx={0} cy={-150} rx={92} ry={16} fill="#f4efe6" />
    <rect x={-5} y={-146} width={10} height={140} fill="#2b2b33" />
    <ellipse cx={0} cy={-3} rx={50} ry={8} fill="#2b2b33" />
    {params.cup !== false ? (
      <g>
        <ellipse cx={-26} cy={-156} rx={22} ry={6} fill="#fbf8f2" />
        <rect x={-38} y={-184} width={24} height={26} rx={4} fill="#fbf8f2" />
        <path d="M -14 -178 q 12 2 0 14" fill="none" stroke="#fbf8f2" strokeWidth={4} />
      </g>
    ) : null}
  </g>
);

// Кресло-качалка (качается, если rock не false)
const RockChair: React.FC<PP> = ({ t, params }) => {
  const a = params.rock === false ? 0 : Math.sin(t * 1.6) * 3;
  return (
    <g transform={`rotate(${a} 0 -10)`} fill="none" stroke="#5a3424" strokeWidth={12} strokeLinecap="round">
      <path d="M -110 -6 Q 0 26 110 -6" />
      <line x1={-70} y1={-2} x2={-62} y2={-96} />
      <line x1={70} y1={-2} x2={62} y2={-96} />
      <path d="M -80 -96 L 84 -96" strokeWidth={18} />
      <path d="M 70 -96 L 96 -290" />
      <path d="M 40 -100 L 62 -280" strokeWidth={8} />
      <path d="M -70 -150 L 50 -150" strokeWidth={8} />
      <line x1={-70} y1={-150} x2={-70} y2={-100} strokeWidth={8} />
    </g>
  );
};

// Растение в горшке (обёртка над тем, что в локациях)
const Plant: React.FC<PP> = ({ t, params }) => <PotPlant x={0} y={0} t={t} pot={str(params.pot, "#b0643e")} leaf={str(params.leaf, "#5f9a5c")} />;

// Уличный фонарь со светом
const StreetLamp: React.FC<PP> = ({ params }) => (
  <g>
    <rect x={-8} y={-560} width={16} height={560} fill="#3a3550" />
    <rect x={-18} y={-50} width={36} height={50} rx={4} fill="#2e2a44" />
    <path d="M -34 -560 L 34 -560 L 22 -620 L -22 -620 Z" fill="#2e2a44" />
    <rect x={-22} y={-620} width={44} height={50} fill="#fff0c8" opacity={0.9} />
    {params.light !== false ? <Glow x={0} y={-590} r={200} color="#ffe6b0" /> : null}
  </g>
);

// Кровать (вид сбоку). params: blanket
const Bed: React.FC<PP> = ({ params }) => (
  <g>
    <rect x={-260} y={-260} width={30} height={260} rx={8} fill="#6a4228" />
    <rect x={230} y={-170} width={30} height={170} rx={8} fill="#6a4228" />
    <rect x={-240} y={-120} width={480} height={60} rx={10} fill="#7d5134" />
    <rect x={-235} y={-160} width={470} height={46} rx={16} fill="#f2ece2" />
    <ellipse cx={-170} cy={-168} rx={58} ry={22} fill="#fbf8f2" />
    <path d="M -110 -176 Q 60 -196 240 -170 L 250 -112 L -110 -112 Z" fill={str(params.blanket, "#c96f5b")} />
    <rect x={-240} y={-60} width={12} height={60} fill="#5a3424" />
    <rect x={228} y={-60} width={12} height={60} fill="#5a3424" />
  </g>
);

// Детская кроватка с прутьями
const Crib: React.FC<PP> = () => (
  <g fill="#e8d2b0">
    <rect x={-150} y={-230} width={300} height={14} rx={6} />
    <rect x={-150} y={-90} width={300} height={14} rx={6} />
    {Array.from({ length: 11 }, (_, i) => <rect key={i} x={-146 + i * 28} y={-222} width={8} height={136} />)}
    <rect x={-160} y={-240} width={16} height={240} rx={4} fill="#d4b98f" />
    <rect x={144} y={-240} width={16} height={240} rx={4} fill="#d4b98f" />
    <rect x={-140} y={-110} width={280} height={22} rx={8} fill="#f6f1ea" />
  </g>
);

// Машина сбоку. params: color, drive (скорость px/с — едет вправо)
const Car: React.FC<PP> = ({ t, params }) => {
  const c = str(params.color, "#d9574a");
  const dx = num(params.drive, 0) * t;
  const wr = t * num(params.drive, 0) * 0.02;
  return (
    <g transform={`translate(${dx} 0)`}>
      <path d="M -220 -40 L -220 -110 Q -210 -130 -170 -134 L -110 -138 L -60 -200 Q -50 -210 -30 -210 L 100 -210 Q 120 -210 134 -196 L 180 -140 Q 220 -134 226 -110 L 226 -40 Z" fill={c} />
      <path d="M -88 -142 L -46 -192 L 30 -192 L 30 -142 Z" fill="#cfe0f2" />
      <path d="M 46 -142 L 46 -192 L 104 -192 Q 112 -192 120 -184 L 156 -142 Z" fill="#cfe0f2" />
      <rect x={210} y={-104} width={18} height={14} rx={4} fill="#fff1c0" />
      {[-130, 130].map((x) => (
        <g key={x} transform={`translate(${x} -40) rotate(${wr * 57})`}>
          <circle r={42} fill="#1d1d24" />
          <circle r={18} fill="#9a9aa6" />
          <line x1={-18} y1={0} x2={18} y2={0} stroke="#5a5a66" strokeWidth={4} />
        </g>
      ))}
    </g>
  );
};

// Парусник (качается на волнах)
const Ship: React.FC<PP> = ({ t, params }) => {
  const sail = str(params.sail, "#f4ecdc");
  const r = Math.sin(t * 1.3) * 2;
  return (
    <g transform={`rotate(${r}) translate(${num(params.drive, 0) * t} 0)`}>
      <path d="M -200 -60 L 210 -60 L 160 0 L -170 0 Z" fill="#5a3424" />
      <rect x={-200} y={-74} width={410} height={16} fill="#7d5134" />
      {[-80, 70].map((x, i) => (
        <g key={x}>
          <rect x={x - 5} y={-420 + i * 40} width={10} height={360 - i * 40} fill="#4a2c1e" />
          <path d={`M ${x + 8} ${-400 + i * 40} Q ${x + 120} ${-280 + i * 30} ${x + 8} ${-100}`} fill={sail} />
          <path d={`M ${x - 8} ${-380 + i * 40} Q ${x - 90} ${-270 + i * 30} ${x - 8} ${-130}`} fill={sail} opacity={0.85} />
        </g>
      ))}
      <path d={`M -80 -420 l 50 12 l -50 12 Z`} fill="#c94f3d" />
    </g>
  );
};

// Птица в полёте (машет крыльями). params: drive — скорость по x
const Bird: React.FC<PP> = ({ t, params }) => {
  const f = Math.sin(t * 9 + num(params.seed, 0)) * 16;
  return (
    <g transform={`translate(${num(params.drive, 120) * t} ${Math.sin(t * 1.2) * 10})`} fill="none" stroke={str(params.color, "#2a2030")} strokeWidth={5} strokeLinecap="round">
      <path d={`M -34 ${-f} Q -16 -8 0 0 Q 16 -8 34 ${-f}`} />
    </g>
  );
};

// Гирлянда-флажки между двумя точками. params: w, sag
const Bunting: React.FC<PP> = ({ t, params }) => {
  const w = num(params.w, 900);
  const sag = num(params.sag, 90);
  const n = Math.floor(w / 60);
  return (
    <g>
      <path d={`M ${-w / 2} 0 Q 0 ${sag * 2} ${w / 2} 0`} fill="none" stroke="#5a4a3a" strokeWidth={2.5} />
      {Array.from({ length: n }, (_, i) => {
        const k = (i + 0.5) / n;
        const x = -w / 2 + w * k;
        const y = 4 * sag * k * (1 - k);
        return <path key={i} d={`M ${x - 18} ${y} L ${x + 18} ${y} L ${x + Math.sin(t * 2 + i) * 4} ${y + 44} Z`} fill={["#e8574a", "#f2c14b", "#4fb3a9", "#5b8be0", "#f07fa8"][i % 5]} />;
      })}
    </g>
  );
};

// Голограмма человека (светящийся контур с сеткой). params: color
const Holo: React.FC<PP> = ({ t, params }) => {
  const c = str(params.color, "#5fd4ff");
  const u = useUid();
  const scan = ((t * 140) % 420) - 400;
  return (
    <g>
      <defs>
        <clipPath id={`hc${u}`}>
          <circle cx={0} cy={-344} r={44} />
          <path d="M -60 -290 Q 0 -306 60 -290 L 70 -160 L 40 0 L -40 0 L -70 -160 Z" />
        </clipPath>
      </defs>
      <ellipse cx={0} cy={0} rx={110} ry={18} fill={c} opacity={0.3} />
      <Glow x={0} y={-200} r={240} color={c} o={0.5} />
      <g clipPath={`url(#hc${u})`}>
        <rect x={-80} y={-400} width={160} height={400} fill={c} opacity={0.28} />
        {Array.from({ length: 20 }, (_, i) => <line key={i} x1={-80} y1={-400 + i * 20} x2={80} y2={-400 + i * 20} stroke={c} strokeWidth={1.5} opacity={0.6} />)}
        <rect x={-80} y={scan} width={160} height={14} fill="#fff" opacity={0.5} />
      </g>
      <circle cx={0} cy={-344} r={44} fill="none" stroke={c} strokeWidth={3} />
      <path d="M -60 -290 Q 0 -306 60 -290 L 70 -160 L 40 0 L -40 0 L -70 -160 Z" fill="none" stroke={c} strokeWidth={3} />
    </g>
  );
};

// Столбики «генов»: n цветных колонок разной высоты, растут при появлении
const Genes: React.FC<PP> = ({ t, params }) => {
  const n = num(params.n, 8);
  const g = clamp(t / 1.2);
  const cols = ["#5fd4ff", "#f2a65a", "#8be08b", "#f07fa8", "#b18cff"];
  return (
    <g>
      {Array.from({ length: n }, (_, i) => {
        const h = (120 + rand(i + 3) * 260) * g;
        const x = (i - (n - 1) / 2) * 70;
        return (
          <g key={i}>
            <rect x={x - 22} y={-h} width={44} height={h} rx={8} fill={cols[i % cols.length]} opacity={0.85} />
            <rect x={x - 22} y={-h} width={44} height={10} rx={5} fill="#fff" opacity={0.5} />
          </g>
        );
      })}
    </g>
  );
};

// Письменный стол с лампой (front: true, если персонаж сидит за ним)
const Desk: React.FC<PP> = ({ params }) => (
  <g>
    <rect x={-240} y={-190} width={480} height={20} rx={4} fill="#7d5134" />
    <rect x={-230} y={-170} width={150} height={170} fill="#6a4228" />
    <rect x={-216} y={-150} width={122} height={60} rx={4} fill="none" stroke="#5a3424" strokeWidth={3} />
    <rect x={200} y={-170} width={20} height={170} fill="#6a4228" />
    {params.lamp !== false ? (
      <g>
        <path d="M 150 -190 L 150 -280 L 100 -320" fill="none" stroke="#2b2b33" strokeWidth={7} />
        <path d="M 70 -318 L 130 -340 L 128 -300 Z" fill="#2b2b33" />
        <Glow x={100} y={-290} r={160} color="#ffe2b0" />
      </g>
    ) : null}
    <rect x={-60} y={-210} width={120} height={20} rx={2} fill="#f4efe6" />
  </g>
);

// Свеча на подсвечнике
const Candle: React.FC<PP> = ({ t }) => (
  <g>
    <rect x={-30} y={-14} width={60} height={14} rx={4} fill="#c89a52" />
    <rect x={-12} y={-110} width={24} height={96} rx={4} fill="#f8eedd" />
    <path d={`M 0 ${-150 + Math.sin(t * 9) * 3} Q 12 -126 0 -112 Q -12 -126 0 ${-150 + Math.sin(t * 9) * 3} Z`} fill="#ffd27a" />
    <Glow x={0} y={-128} r={180} color="#ffbe6a" o={0.75 + Math.sin(t * 7) * 0.08} />
  </g>
);

// Табличка-вывеска на стене. params: text
const Sign: React.FC<PP> = ({ params }) => (
  <g>
    <rect x={-160} y={-60} width={320} height={60} rx={8} fill={str(params.bg, "#1f4a3c")} />
    <text x={0} y={-18} textAnchor="middle" fontFamily={INTER} fontWeight={800} fontSize={30} letterSpacing={3} fill="#fbf1d4">
      {str(params.text, "SIGN")}
    </text>
  </g>
);

// Тень сидящего зрителя на переднем плане (силуэт со спины)
const Back: React.FC<PP> = () => (
  <g fill={BODY}>
    <circle cx={0} cy={-250} r={60} />
    <path d="M -110 0 Q -110 -180 0 -190 Q 110 -180 110 0 Z" />
  </g>
);

export const PROPS3: Record<string, React.FC<PP>> = {
  longtable: LongTable,
  cafetable: CafeTable,
  rockchair: RockChair,
  potplant: Plant,
  streetlamp: StreetLamp,
  bed: Bed,
  crib: Crib,
  car: Car,
  ship: Ship,
  bird: Bird,
  bunting: Bunting,
  holo: Holo,
  genes: Genes,
  desk: Desk,
  candle: Candle,
  sign: Sign,
  back: Back,
};
