// Ещё предметы стиля toon: то, о чём говорит диктор, должно быть видно в кадре.
// (0, 0) — нижняя середина предмета (для настольных — точка на столе или на полу). Крупно — scale 2–4 и камера insert.
// t-card — банковская карта, t-envelope — конверт, t-terminal — терминал с суммой, t-receipt — длинный чек,
// t-taxi — такси, t-shawarma — шаурма, t-pizza — коробки пиццы, t-cash-rain — дождь из купюр, t-cash-pile — гора денег,
// t-phone — телефон с чатом, t-bread — хлеб с ценником, t-globe — глобус, t-cart — сумка-тележка, t-stool — табурет,
// t-crowd — массовка (класс, очередь, прохожие, толпа)
import React from "react";
import { RUBIK } from "./fonts";
import { ToonCharacter } from "./Toon";
import type { Look } from "./types";
import { clamp, ease, rand } from "./util";

type PP = { t: number; params: Record<string, number | string | boolean> };
const OL = "#1c1a24";
const W = 3;
const str = (v: unknown, d: string) => (typeof v === "string" ? v : d);
const num = (v: unknown, d: number) => (typeof v === "number" ? v : d);

// знак бесконечности линией (в шрифте он выглядит как «oo»): w — ширина
const Inf: React.FC<{ x: number; y: number; w: number; color?: string }> = ({ x, y, w, color = "#f6c63b" }) => (
  <path
    transform={`translate(${x} ${y}) scale(${w / 60})`}
    d="M 0 0 C 8 -13 28 -13 28 0 C 28 13 8 13 0 0 C -8 -13 -28 -13 -28 0 C -28 13 -8 13 0 0 Z"
    fill="none"
    stroke={color}
    strokeWidth={60 / w * 7}
    strokeLinejoin="round"
  />
);

// банковская карта: params.name — имя на карте, params.balance — что на балансе («∞»), params.color
const Card: React.FC<PP> = ({ t, params }) => {
  const c = str(params.color, "#1d1f2b");
  const shine = ((t * 0.5) % 2) * 520 - 160;
  return (
    <g transform="translate(-170 -214)">
      <defs>
        <clipPath id="tcardclip">
          <rect width={340} height={214} rx={20} />
        </clipPath>
      </defs>
      <rect width={340} height={214} rx={20} fill={c} stroke={OL} strokeWidth={W} />
      <g clipPath="url(#tcardclip)">
        <path d={`M ${shine} -20 l 60 0 l -120 260 l -60 0 Z`} fill="#fff" opacity={0.12} />
        <circle cx={300} cy={30} r={90} fill="#fff" opacity={0.05} />
      </g>
      <rect x={34} y={64} width={54} height={42} rx={8} fill="#e6c068" stroke={OL} strokeWidth={2} />
      <path d="M 34 85 H 88 M 61 64 V 106" stroke="#b8923e" strokeWidth={2} />
      <text x={34} y={176} fontFamily={RUBIK} fontWeight={700} fontSize={22} fill="#e9e6dd" letterSpacing={3}>
        {str(params.name, "ТВОЯ КАРТА")}
      </text>
      {str(params.balance, "∞") === "∞" ? (
        <Inf x={272} y={70} w={80} />
      ) : (
        <text x={310} y={92} textAnchor="end" fontFamily={RUBIK} fontWeight={900} fontSize={56} fill="#f6c63b">
          {str(params.balance, "")}
        </text>
      )}
    </g>
  );
};

// конверт: params.open — открыт (видна карта), params.label — подпись
const Envelope: React.FC<PP> = ({ params }) => (
  <g transform="translate(-150 -190)">
    {params.open ? (
      <g transform="translate(40 -60) rotate(-6)">
        <rect width={220} height={138} rx={14} fill="#1d1f2b" stroke={OL} strokeWidth={W} />
        <rect x={22} y={40} width={36} height={28} rx={5} fill="#e6c068" />
        <Inf x={172} y={104} w={50} />
      </g>
    ) : null}
    <rect y={0} width={300} height={190} rx={10} fill="#efe6d2" stroke={OL} strokeWidth={W} />
    <path d={params.open ? "M 0 0 L 150 -90 L 300 0" : "M 4 6 L 150 106 L 296 6"} fill={params.open ? "#e3d7bd" : "none"} stroke={OL} strokeWidth={W} strokeLinejoin="round" />
    <path d="M 4 186 L 120 96 M 296 186 L 180 96" stroke="#c9bb9d" strokeWidth={2.4} />
    <rect x={226} y={18} width={52} height={60} rx={4} fill="#e2574c" stroke={OL} strokeWidth={2} />
    <text x={30} y={160} fontFamily={RUBIK} fontWeight={600} fontSize={20} fill="#6b5a44">
      {str(params.label, "")}
    </text>
  </g>
);

// платёжный терминал: params.sum — сумма на экране, params.paid — с какой секунды «ОПЛАЧЕНО» (зелёный экран)
const Terminal: React.FC<PP> = ({ t, params }) => {
  const paid = typeof params.paid === "number" && t >= params.paid;
  const pop = paid ? 1 + Math.sin(clamp((t - (params.paid as number)) / 0.3) * Math.PI) * 0.06 : 1;
  return (
    <g transform="translate(-80 -250)">
      <rect width={160} height={250} rx={22} fill="#262a36" stroke={OL} strokeWidth={W} />
      <g transform={`translate(80 72) scale(${pop}) translate(-80 -72)`}>
        <rect x={16} y={18} width={128} height={96} rx={8} fill={paid ? "#2fb36a" : "#11161f"} stroke={OL} strokeWidth={2} />
        {paid ? (
          <g>
            <path d="M 56 66 l 16 16 l 32 -36" fill="none" stroke="#fff" strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />
            <text x={80} y={106} textAnchor="middle" fontFamily={RUBIK} fontWeight={800} fontSize={15} fill="#fff">
              ОПЛАЧЕНО
            </text>
          </g>
        ) : (
          <g>
            <text x={80} y={46} textAnchor="middle" fontFamily={RUBIK} fontWeight={600} fontSize={14} fill="#7fe0a6">
              СУММА
            </text>
            <text x={80} y={86} textAnchor="middle" fontFamily={RUBIK} fontWeight={800} fontSize={str(params.sum, "").length > 7 ? 24 : 30} fill="#7fe0a6">
              {str(params.sum, "0")}
            </text>
          </g>
        )}
      </g>
      {[0, 1, 2, 3].map((r) => [0, 1, 2].map((c) => <rect key={`${r}${c}`} x={28 + c * 38} y={132 + r * 26} width={28} height={18} rx={4} fill={r === 3 && c === 2 ? "#2fb36a" : r === 3 && c === 0 ? "#e2574c" : "#cfd3dc"} />))}
    </g>
  );
};

// длинный чек: разматывается за params.time секунд до длины params.len
const Receipt: React.FC<PP> = ({ t, params }) => {
  const len = num(params.len, 260) * ease(clamp(t / num(params.time, 1.5)));
  const zig = Array.from({ length: 9 }, (_, i) => `L ${40 - i * 10} ${len + (i % 2 ? 8 : 0)}`).join(" ");
  return (
    <g>
      <path d={`M -40 0 L 40 0 ${zig} Z`} fill="#f7f4ec" stroke={OL} strokeWidth={2.4} strokeLinejoin="round" />
      {Array.from({ length: Math.floor(len / 18) }, (_, i) => (
        <rect key={i} x={-30} y={12 + i * 18} width={30 + rand(i + 3) * 30} height={5} rx={2} fill="#b9b4a8" />
      ))}
    </g>
  );
};

// такси: едет, если x задан [откуда, куда]; params.color, params.flip — смотрит влево
// Такси седан: КАПОТ И ФАРА СПРАВА — по умолчанию смотрит и едет вправо. Едет влево (x: [больше, меньше]) —
// движок сам разворачивает его (flip), руками ставить flip нужно только для стоящей машины, смотрящей влево.
// Узнаётся спереди: длинный капот, пологое лобовое стекло, жёлтая фара; сзади: короткий багажник, крутое заднее стекло, красный фонарь
const Taxi: React.FC<PP> = ({ t, params }) => {
  const c = str(params.color, "#f6c63b");
  const spin = (t * 400) % 360;
  const Wheel: React.FC<{ x: number }> = ({ x }) => (
    <g transform={`translate(${x} -40) rotate(${spin})`}>
      <circle r={40} fill="#1b1d26" stroke={OL} strokeWidth={W} />
      <circle r={17} fill="#9aa1b3" />
      <rect x={-3} y={-17} width={6} height={34} fill="#6b7180" />
    </g>
  );
  return (
    <g>
      <ellipse cx={0} cy={-4} rx={270} ry={14} fill="#000" opacity={0.25} />
      {/* луч фары вперёд */}
      <path d="M 268 -104 L 420 -150 L 420 -40 Z" fill="#fff3c2" opacity={0.12} />
      {/* кузов: слева короткий багажник и крутое заднее стекло, справа пологое лобовое и длинный капот */}
      <path d="M -262 -50 L -262 -112 Q -260 -138 -232 -140 L -160 -146 L -124 -214 Q -116 -228 -96 -228 L 30 -228 Q 52 -228 66 -214 L 128 -152 L 232 -142 Q 270 -136 272 -100 L 272 -50 Z" fill={c} stroke={OL} strokeWidth={W} strokeLinejoin="round" />
      <path d="M -146 -150 L -114 -210 L -44 -210 L -44 -150 Z" fill="#a9d8ef" stroke={OL} strokeWidth={2.4} />
      <path d="M -28 -150 L -28 -210 L 26 -210 Q 42 -210 52 -198 L 104 -150 Z" fill="#a9d8ef" stroke={OL} strokeWidth={2.4} />
      <line x1={-36} y1={-148} x2={-36} y2={-56} stroke={OL} strokeWidth={2} opacity={0.5} />
      <rect x={-262} y={-118} width={534} height={24} fill="#1c1a24" />
      {Array.from({ length: 17 }, (_, i) => <rect key={i} x={-262 + i * 32} y={i % 2 ? -118 : -106} width={16} height={12} fill="#f4f1ea" />)}
      <rect x={-84} y={-258} width={90} height={32} rx={6} fill="#f4f1ea" stroke={OL} strokeWidth={2.4} />
      {/* надпись не зеркалится, когда машина развёрнута */}
      <text x={-39} y={-235} textAnchor="middle" fontFamily={RUBIK} fontWeight={800} fontSize={20} fill={OL} transform={params._flip ? "translate(-78 0) scale(-1 1)" : undefined}>
        ТАКСИ
      </text>
      {/* фара спереди, фонарь сзади, бамперы */}
      <ellipse cx={262} cy={-80} rx={9} ry={12} fill="#fff3c2" stroke={OL} strokeWidth={2} />
      <rect x={-266} y={-88} width={12} height={22} rx={3} fill="#e2574c" stroke={OL} strokeWidth={2} />
      <rect x={250} y={-62} width={30} height={14} rx={5} fill="#9aa1b3" stroke={OL} strokeWidth={2} />
      <rect x={-272} y={-62} width={26} height={14} rx={5} fill="#9aa1b3" stroke={OL} strokeWidth={2} />
      <Wheel x={-160} />
      <Wheel x={170} />
    </g>
  );
};

// шаурма в фольге
const Shawarma: React.FC<PP> = () => (
  <g transform="rotate(-12)">
    <path d="M -46 0 L -54 -150 Q 0 -176 54 -150 L 46 0 Z" fill="#c7cbd3" stroke={OL} strokeWidth={W} strokeLinejoin="round" />
    <path d="M -54 -150 Q -60 -230 0 -236 Q 60 -230 54 -150 Q 0 -176 -54 -150 Z" fill="#e7c48b" stroke={OL} strokeWidth={W} />
    <path d="M -40 -168 Q -30 -206 -6 -190 Q 10 -216 30 -192 Q 46 -200 42 -166" fill="#8a4b2a" stroke={OL} strokeWidth={2} />
    <circle cx={-18} cy={-200} r={9} fill="#7bc47f" stroke={OL} strokeWidth={1.6} />
    <circle cx={22} cy={-206} r={8} fill="#e2574c" stroke={OL} strokeWidth={1.6} />
    <path d="M -44 -60 L 44 -70 M -46 -110 L 46 -116" stroke="#9aa0ad" strokeWidth={2} />
  </g>
);

// коробки пиццы стопкой: params.n, params.open — верхняя открыта
const Pizza: React.FC<PP> = ({ params }) => {
  const n = num(params.n, 3);
  return (
    <g>
      {Array.from({ length: n }, (_, i) => (
        <g key={i} transform={`translate(${(i % 2) * 10 - 5} ${-i * 34})`}>
          <rect x={-120} y={-34} width={240} height={34} rx={4} fill="#f0dcb4" stroke={OL} strokeWidth={W} />
          <rect x={-40} y={-26} width={80} height={16} rx={3} fill="#e2574c" />
        </g>
      ))}
      {params.open ? (
        <g transform={`translate(0 ${-n * 34})`}>
          <path d="M -120 0 L -120 -200 L 120 -200 L 120 0" fill="#e7d0a2" stroke={OL} strokeWidth={W} />
          <ellipse cx={0} cy={-6} rx={108} ry={22} fill="#e9a74a" stroke={OL} strokeWidth={2.4} />
          {[-60, -20, 30, 70, 0].map((x, i) => <circle key={i} cx={x} cy={-8 + (i % 2) * 6} r={10} fill="#c8402f" />)}
        </g>
      ) : null}
    </g>
  );
};

// купюры падают сверху. Ставить в (960, 0): params.w — ширина полосы, params.n — сколько купюр, params.h — до какой высоты падают
const CashRain: React.FC<PP> = ({ t, params }) => {
  const w = num(params.w, 1800);
  const h = num(params.h, 1080);
  const n = num(params.n, 40);
  return (
    <g>
      {Array.from({ length: n }, (_, i) => {
        const sp = 260 + rand(i + 11) * 220;
        const y = ((rand(i + 5) * (h + 200) + t * sp) % (h + 200)) - 120;
        const x = -w / 2 + rand(i + 1) * w + Math.sin(t * 2 + i) * 30;
        const r = Math.sin(t * 3 + i * 1.7) * 50;
        const sy = 0.4 + Math.abs(Math.sin(t * 4 + i)) * 0.6;
        return (
          <g key={i} transform={`translate(${x} ${y}) rotate(${r}) scale(1 ${sy})`}>
            <rect x={-46} y={-22} width={92} height={44} rx={5} fill="#9fd08a" stroke={OL} strokeWidth={2.2} />
            <circle r={12} fill="#7ab868" />
          </g>
        );
      })}
    </g>
  );
};

// гора денег на полу: params.w — ширина
const CashPile: React.FC<PP> = ({ params }) => {
  const w = num(params.w, 700);
  const bills = Array.from({ length: Math.round(w / 9) }, (_, i) => {
    const u = rand(i * 3 + 1) * 2 - 1;
    const hgt = (1 - u * u) * w * 0.28;
    return { x: (u * w) / 2, y: -rand(i * 3 + 2) * hgt, r: rand(i * 3 + 5) * 80 - 40 };
  }).sort((a, b) => b.y - a.y);
  return (
    <g>
      <ellipse cx={0} cy={-10} rx={w / 2} ry={w * 0.05} fill="#000" opacity={0.25} />
      {bills.map((b, i) => (
        <g key={i} transform={`translate(${b.x} ${b.y}) rotate(${b.r})`}>
          <rect x={-40} y={-18} width={80} height={36} rx={4} fill={i % 3 ? "#9fd08a" : "#8cc477"} stroke={OL} strokeWidth={2} />
        </g>
      ))}
    </g>
  );
};

// телефон с чатом: params.title — название чата, params.msgs — сообщения через «|», params.badge — счётчик,
// сообщения появляются по одному каждые params.every секунд
const Phone: React.FC<PP> = ({ t, params }) => {
  const msgs = str(params.msgs, "").split("|").filter(Boolean);
  const every = num(params.every, 0.6);
  const shown = msgs.filter((_, i) => t >= i * every);
  const badge = num(params.badge, 0);
  const cnt = badge ? Math.round(badge * ease(clamp(t / Math.max(1, msgs.length * every)))) : 0;
  return (
    <g transform="translate(-150 -560)">
      <rect width={300} height={560} rx={40} fill="#1a1d24" stroke={OL} strokeWidth={W} />
      <rect x={16} y={20} width={268} height={520} rx={28} fill="#eef1f7" />
      <rect x={16} y={20} width={268} height={70} rx={28} fill="#3a6fd8" />
      <rect x={16} y={60} width={268} height={30} fill="#3a6fd8" />
      <text x={36} y={66} fontFamily={RUBIK} fontWeight={700} fontSize={22} fill="#fff">
        {str(params.title, "ЧАТ")}
      </text>
      {cnt ? (
        <g transform="translate(248 56)">
          <circle r={20} fill="#e2574c" stroke="#fff" strokeWidth={3} />
          <text y={7} textAnchor="middle" fontFamily={RUBIK} fontWeight={800} fontSize={18} fill="#fff">
            {cnt}
          </text>
        </g>
      ) : null}
      {shown.slice(-6).map((m, i) => {
        const mine = m.startsWith(">");
        const txt = mine ? m.slice(1) : m;
        const k = clamp((t - msgs.indexOf(m) * every) / 0.25);
        return (
          <g key={i} transform={`translate(${mine ? 270 : 30} ${110 + i * 70}) scale(${0.8 + 0.2 * k})`} opacity={k}>
            <rect x={mine ? -Math.min(230, txt.length * 11 + 30) : 0} width={Math.min(230, txt.length * 11 + 30)} height={52} rx={16} fill={mine ? "#c9f0b8" : "#fff"} stroke="#d0d5e0" strokeWidth={1.5} />
            <text x={mine ? -Math.min(230, txt.length * 11 + 30) + 15 : 15} y={33} fontFamily={RUBIK} fontWeight={600} fontSize={18} fill="#22232b">
              {txt.length > 19 ? `${txt.slice(0, 18)}…` : txt}
            </text>
          </g>
        );
      })}
    </g>
  );
};

// хлеб с ценником: params.price — «300 ₽», params.old — старая цена (зачёркнута)
const Bread: React.FC<PP> = ({ params }) => (
  <g>
    <path d="M -110 0 Q -130 -96 -40 -110 Q 0 -122 60 -110 Q 132 -96 112 0 Z" fill="#d79a52" stroke={OL} strokeWidth={W} strokeLinejoin="round" />
    {[-60, -10, 40].map((x) => (
      <path key={x} d={`M ${x} -96 q 18 30 26 -2`} fill="none" stroke="#a8692e" strokeWidth={4} strokeLinecap="round" />
    ))}
    {params.price ? (
      <g transform="translate(90 -150) rotate(8)">
        <line x1={-30} y1={60} x2={0} y2={30} stroke={OL} strokeWidth={2} />
        <rect x={-10} y={-10} width={130} height={params.old ? 82 : 56} rx={8} fill="#f6c63b" stroke={OL} strokeWidth={W} />
        {params.old ? (
          <text x={55} y={20} textAnchor="middle" fontFamily={RUBIK} fontWeight={700} fontSize={22} fill="#6b5a2a" textDecoration="line-through">
            {str(params.old, "")}
          </text>
        ) : null}
        <text x={55} y={params.old ? 60 : 30} textAnchor="middle" fontFamily={RUBIK} fontWeight={900} fontSize={30} fill={params.old ? "#c8402f" : OL}>
          {str(params.price, "")}
        </text>
      </g>
    ) : null}
  </g>
);

// глобус: вращается; params.mark — точка на нём (true)
const Globe: React.FC<PP> = ({ t, params }) => {
  const R = 200;
  const rot = (t * 30) % 360;
  return (
    <g transform={`translate(0 ${-R})`}>
      <defs>
        <clipPath id="tglobe">
          <circle r={R} />
        </clipPath>
      </defs>
      <circle r={R} fill="#2f5aa8" stroke={OL} strokeWidth={W} />
      <g clipPath="url(#tglobe)">
        {[
          [-60, -60, 70, 50],
          [40, 30, 90, 60],
          [140, -40, 60, 80],
          [240, 50, 80, 40],
          [320, -80, 50, 40],
        ].map(([lon, y, w, h], i) => {
          const a = ((lon + rot) % 360) - 180;
          const x = Math.sin((a * Math.PI) / 180) * R;
          const vis = Math.cos((a * Math.PI) / 180);
          return vis > 0 ? <ellipse key={i} cx={x} cy={y} rx={w * vis} ry={h} fill="#7bc47f" opacity={0.9} /> : null;
        })}
        {[-120, -60, 0, 60, 120].map((y) => (
          <ellipse key={y} cx={0} cy={y} rx={Math.sqrt(R * R - y * y)} ry={8} fill="none" stroke="#9fc3ff" strokeWidth={1.5} opacity={0.5} />
        ))}
        {[0, 1, 2, 3].map((i) => {
          const a = (((i * 45 + rot) % 180) - 90) * (Math.PI / 180);
          return <ellipse key={i} cx={0} cy={0} rx={Math.abs(Math.sin(a)) * R} ry={R} fill="none" stroke="#9fc3ff" strokeWidth={1.5} opacity={0.5} />;
        })}
      </g>
      <path d={`M ${-R * 0.6} ${-R * 0.55} A ${R} ${R} 0 0 1 ${R * 0.2} ${-R * 0.95}`} fill="none" stroke="#fff" strokeWidth={10} strokeLinecap="round" opacity={0.25} />
      {params.mark ? <circle cx={-30} cy={-60} r={12 + Math.sin(t * 6) * 3} fill="#f6c63b" stroke={OL} strokeWidth={2} /> : null}
    </g>
  );
};

// сумка-тележка бабушки в клетку
const Cart: React.FC<PP> = ({ params }) => {
  const c = str(params.color, "#c8402f");
  return (
    <g>
      <defs>
        <pattern id="tcartp" width={24} height={24} patternUnits="userSpaceOnUse">
          <rect width={24} height={24} fill={c} />
          <rect width={24} height={6} y={9} fill="#2c3b2e" opacity={0.6} />
          <rect width={6} height={24} x={9} fill="#2c3b2e" opacity={0.6} />
        </pattern>
      </defs>
      <path d="M 40 -20 L 50 -250" stroke="#3a3f4c" strokeWidth={6} />
      <rect x={20} y={-262} width={60} height={14} rx={7} fill="#3a3f4c" />
      <rect x={-50} y={-200} width={96} height={170} rx={14} fill="url(#tcartp)" stroke={OL} strokeWidth={W} />
      <circle cx={-30} cy={-16} r={16} fill="#1b1d26" stroke={OL} strokeWidth={2} />
      <circle cx={30} cy={-16} r={16} fill="#1b1d26" stroke={OL} strokeWidth={2} />
    </g>
  );
};

// табурет для сидящего (как t-chair, без спинки)
const Stool: React.FC<PP> = ({ params }) => {
  const c = str(params.color, "#8a5a38");
  return (
    <g>
      <rect x={-46} y={-70} width={12} height={70} fill="#5a3f2c" stroke={OL} strokeWidth={W} />
      <rect x={34} y={-70} width={12} height={70} fill="#5a3f2c" stroke={OL} strokeWidth={W} />
      <rect x={-58} y={-88} width={116} height={22} rx={8} fill={c} stroke={OL} strokeWidth={W} />
    </g>
  );
};

// Массовка: простые люди на фоне. params.kind:
//   "class" — ряды учеников за партами лицом к нам (ставить в x 960, y пола), params.rows (2), params.n — в ряду (5);
//   "queue" — очередь, все смотрят вправо; "street" — прохожие идут; "fans" — толпа лицом к нам, машут руками.
// params.n — сколько человек, params.w — ширина, params.seed — другие люди, params.dim — затемнение (0.25)
const COLORS = ["#e2574c", "#4f8fc0", "#7bc47f", "#e98ab7", "#f08a3c", "#8b7bd8", "#c9a24a", "#5fae9a"];
const HAIRS: Look["hair"][] = ["short", "spiky", "ponytail", "bun", "curls", "long", "short"];
const HAIRC = ["#3a2a24", "#6b3f2a", "#1f1a18", "#d9622b", "#8a5a2c", "#2a2a2a"];
const extraLook = (i: number, seed: number): Look => ({
  top: (["jacket", "hoodie", "tee", "shirt", "coat"] as const)[Math.floor(rand(seed * 7 + i) * 5)],
  color: COLORS[Math.floor(rand(seed * 13 + i * 3) * COLORS.length)],
  hair: HAIRS[Math.floor(rand(seed * 17 + i * 5) * HAIRS.length)],
  hairColor: HAIRC[Math.floor(rand(seed * 19 + i * 7) * HAIRC.length)],
  pants: ["#2f3540", "#3b4a6b", "#4a3b32"][i % 3],
  glasses: rand(seed * 23 + i) > 0.85,
});
const Crowd: React.FC<PP> = ({ t, params }) => {
  const kind = str(params.kind, "fans");
  const seed = num(params.seed, 1);
  const dim = num(params.dim, 0.25);
  const people: React.ReactNode[] = [];
  if (kind === "class") {
    const rows = num(params.rows, 2);
    const n = num(params.n, 5);
    const w = num(params.w, 1500);
    for (let r = rows - 1; r >= 0; r--) {
      const s = 0.62 + (rows - 1 - r) * 0.14;
      const y = -r * 120;
      const row: React.ReactNode[] = [];
      for (let i = 0; i < n; i++) {
        const x = -w / 2 + ((i + 0.5) / n) * w + (r % 2) * 60;
        const id = r * 20 + i;
        const mood = (["happy", "neutral", "surprised", "happy"] as const)[Math.floor(rand(seed + id * 3) * 4)];
        const arms = rand(seed + id * 5) > 0.7 ? "cheer" : "rest";
        row.push(<ToonCharacter key={`p${i}`} t={t + id} x={x} y={y} actor={{ id: `x${id}`, x, look: extraLook(id, seed), legs: "sit", arms, mood, facing: "front", scale: s }} />);
        row.push(
          <g key={`d${i}`} transform={`translate(${x} ${y}) scale(${s})`}>
            <rect x={-110} y={-130} width={220} height={22} rx={6} fill="#c79a74" stroke={OL} strokeWidth={W} />
            <rect x={-96} y={-108} width={192} height={108} fill="#8a6446" stroke={OL} strokeWidth={W} />
          </g>,
        );
      }
      people.push(
        <g key={r} style={{ filter: `brightness(${1 - dim * (0.4 + r * 0.6)})` }}>
          {row}
        </g>,
      );
    }
    return <g>{people}</g>;
  }
  const n = num(params.n, 6);
  const w = num(params.w, 1400);
  const list: { back: boolean; node: React.ReactNode }[] = [];
  for (let i = 0; i < n; i++) {
    const back = kind === "fans" && i % 2 === 1;
    const x = -w / 2 + ((i + 0.5) / n) * w + (rand(seed + i) - 0.5) * 60;
    const s = kind === "fans" ? (back ? 0.72 : 0.85) : 0.8 + rand(seed + i * 3) * 0.12;
    const y = back ? -40 : 0;
    const walk = kind === "street";
    const facing = kind === "queue" ? "right" : walk ? (rand(seed + i * 9) > 0.5 ? "right" : "left") : "front";
    const arms = kind === "fans" ? (rand(seed + i * 11) > 0.4 ? "cheer" : "wave") : walk ? "walk" : rand(seed + i * 11) > 0.6 ? "phone" : "rest";
    const xx = walk ? x + (facing === "right" ? 1 : -1) * t * 60 : x;
    list.push({
      back,
      node: <ToonCharacter key={i} t={t + i * 0.7} x={xx} y={y} actor={{ id: `c${i}`, x: xx, look: extraLook(i, seed), facing, arms, legs: walk ? "walk" : "stand", mood: kind === "fans" ? "happy" : "neutral", scale: s }} />,
    });
  }
  return (
    <g style={{ filter: `brightness(${1 - dim})` }}>
      <g style={{ filter: `brightness(${1 - dim})` }}>{list.filter((p) => p.back).map((p) => p.node)}</g>
      {list.filter((p) => !p.back).map((p) => p.node)}
    </g>
  );
};

export const PROPS_TOON2: Record<string, React.FC<PP>> = {
  "t-card": Card,
  "t-envelope": Envelope,
  "t-terminal": Terminal,
  "t-receipt": Receipt,
  "t-taxi": Taxi,
  "t-shawarma": Shawarma,
  "t-pizza": Pizza,
  "t-cash-rain": CashRain,
  "t-cash-pile": CashPile,
  "t-phone": Phone,
  "t-bread": Bread,
  "t-globe": Globe,
  "t-cart": Cart,
  "t-stool": Stool,
  "t-crowd": Crowd,
};
