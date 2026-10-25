// Локации стиля toon (мультсериал «Что, если бы ты…»): ночная тёмно-синяя палитра, плоские формы без обводки,
// тёплые лампы и цветные пятна. Фон всегда немного размыт камерой — персонажи с обводкой читаются поверх.
// Пол на y≈900. t-shop, t-kitchen, t-class, t-corridor, t-street, t-room, t-entrance, t-city, t-plain
import React, { useId } from "react";
import { RUBIK } from "./fonts";
import { rand } from "./util";
import { useWord } from "./words";

type P = { t: number; params: Record<string, number | string | boolean> };
const useUid = () => useId().replace(/[^a-zA-Z0-9]/g, "");
const num = (v: unknown, d: number) => (typeof v === "number" ? v : d);
const str = (v: unknown, d: string) => (typeof v === "string" ? v : d);

const Svg: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <svg viewBox="0 0 1920 1080" width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
    {children}
  </svg>
);

const VGrad: React.FC<{ x?: number; y?: number; w: number; h: number; stops: [number, string][]; rx?: number }> = ({ x = 0, y = 0, w, h, stops, rx }) => {
  const u = useUid();
  return (
    <g>
      <defs>
        <linearGradient id={`tv${u}`} x1="0" y1="0" x2="0" y2="1">
          {stops.map(([o, c], i) => (
            <stop key={i} offset={o} stopColor={c} />
          ))}
        </linearGradient>
      </defs>
      <rect x={x} y={y} width={w} height={h} rx={rx} fill={`url(#tv${u})`} />
    </g>
  );
};

// мягкое пятно света
const Halo: React.FC<{ x: number; y: number; r: number; color?: string; o?: number; ry?: number }> = ({ x, y, r, color = "#ffd79a", o = 0.6, ry }) => {
  const u = useUid();
  return (
    <g>
      <defs>
        <radialGradient id={`th${u}`}>
          <stop offset="0" stopColor={color} stopOpacity={o} />
          <stop offset="0.45" stopColor={color} stopOpacity={o * 0.35} />
          <stop offset="1" stopColor={color} stopOpacity={0} />
        </radialGradient>
      </defs>
      <ellipse cx={x} cy={y} rx={r} ry={ry ?? r} fill={`url(#th${u})`} />
    </g>
  );
};

const BOX_COLORS = ["#e2574c", "#f2b134", "#4fb0c6", "#7bc47f", "#e98ab7", "#f4e9d2", "#8b7bd8", "#f08a3c"];

// стеллаж с цветными коробками и банками
const Shelf: React.FC<{ x: number; y: number; w: number; rows?: number; seed: number; empty?: boolean }> = ({ x, y, w, rows = 4, seed, empty }) => {
  const rowH = 118;
  return (
    <g>
      <rect x={x - 12} y={y - 16} width={w + 24} height={rows * rowH + 30} rx={6} fill="#141c36" />
      {Array.from({ length: rows }, (_, r) => {
        const by = y + (r + 1) * rowH;
        const items: React.ReactNode[] = [];
        let cx = x + 6;
        let i = 0;
        while (!empty && cx < x + w - 30) {
          const k = seed * 31 + r * 7 + i;
          const bw = 30 + rand(k) * 44;
          const bh = 46 + rand(k + 3) * 52;
          const c = BOX_COLORS[Math.floor(rand(k + 5) * BOX_COLORS.length)];
          const jar = rand(k + 9) > 0.72;
          items.push(
            jar ? (
              <g key={i}>
                <rect x={cx} y={by - bh * 0.8} width={bw * 0.8} height={bh * 0.8} rx={bw * 0.25} fill={c} />
                <rect x={cx + 2} y={by - bh * 0.8 - 8} width={bw * 0.8 - 4} height={10} rx={3} fill="#d9d4c7" />
              </g>
            ) : (
              <g key={i}>
                <rect x={cx} y={by - bh} width={bw} height={bh} rx={3} fill={c} />
                <rect x={cx + 5} y={by - bh * 0.62} width={bw - 10} height={bh * 0.22} rx={2} fill="#fff" opacity={0.55} />
              </g>
            ),
          );
          cx += (jar ? bw * 0.8 : bw) + 5;
          i++;
        }
        return (
          <g key={r}>
            {items}
            <rect x={x - 12} y={by} width={w + 24} height={12} fill="#2a355e" />
            <rect x={x - 12} y={by + 12} width={w + 24} height={4} fill="#0e1428" />
          </g>
        );
      })}
    </g>
  );
};

// окно с огнями ночного города
const NightWindow: React.FC<{ x: number; y: number; w: number; h: number; seed?: number }> = ({ x, y, w, h, seed = 1 }) => (
  <g>
    <rect x={x - 14} y={y - 14} width={w + 28} height={h + 28} rx={8} fill="#2c3866" />
    <VGrad x={x} y={y} w={w} h={h} stops={[[0, "#1a2350"], [1, "#30407a"]]} />
    {Array.from({ length: 9 }, (_, i) => {
      const bw = w / 6 + rand(seed * 11 + i) * w * 0.12;
      const bx = x + (i / 8) * w - bw / 2;
      const bh = h * (0.25 + rand(seed * 13 + i) * 0.45);
      return (
        <g key={i}>
          <rect x={bx} y={y + h - bh} width={bw} height={bh} fill="#141a38" />
          {Array.from({ length: 8 }, (_, j) =>
            rand(seed * 17 + i * 9 + j) > 0.55 ? <rect key={j} x={bx + 6 + (j % 3) * (bw / 3.2)} y={y + h - bh + 12 + Math.floor(j / 3) * 26} width={8} height={11} fill="#f6c86a" opacity={0.85} /> : null,
          )}
        </g>
      );
    })}
    <rect x={x + w / 2 - 5} y={y} width={10} height={h} fill="#2c3866" />
    <rect x={x} y={y + h * 0.48} width={w} height={8} fill="#2c3866" />
  </g>
);

// тёмный пол с бликом
const Floor: React.FC<{ y?: number; c1?: string; c2?: string }> = ({ y = 860, c1 = "#1b2442", c2 = "#0f152b" }) => <VGrad y={y} w={1920} h={1080 - y} stops={[[0, c1], [1, c2]]} />;

const Dust: React.FC<{ t: number; n?: number; color?: string }> = ({ t, n = 26, color = "#ffe9b8" }) => (
  <g>
    {Array.from({ length: n }, (_, i) => {
      const x = rand(i + 70) * 1920 + Math.sin(t * 0.5 + i) * 26;
      const y = 120 + ((rand(i + 90) * 760 - t * 14) % 760 + 760) % 760;
      return <circle key={i} cx={x} cy={y} r={1.6 + rand(i) * 2.2} fill={color} opacity={0.35 + rand(i + 5) * 0.3} />;
    })}
  </g>
);

// люди на заднем плане: плоские, без лиц, приглушённые (фон и так размыт камерой)
const Bystander: React.FC<{ x: number; y?: number; s?: number; seed: number; dir?: number }> = ({ x, y = 870, s = 0.6, seed, dir = 1 }) => {
  const c = ["#5a6fa8", "#a0566a", "#5f8a6a", "#8a6a4a", "#6a5a9a"][Math.floor(rand(seed) * 5)];
  const h = ["#2a2024", "#4a3024", "#1c1c22", "#6a4a2a"][Math.floor(rand(seed + 1) * 4)];
  return (
    <g transform={`translate(${x} ${y}) scale(${s * dir} ${s})`} opacity={0.75}>
      <rect x={-30} y={-150} width={22} height={150} rx={10} fill="#232a44" />
      <rect x={8} y={-150} width={22} height={150} rx={10} fill="#232a44" />
      <rect x={-58} y={-320} width={116} height={190} rx={40} fill={c} />
      <circle cx={0} cy={-372} r={58} fill="#c9c4bb" />
      <path d="M -60 -380 Q -56 -440 0 -440 Q 56 -440 60 -380 Q 30 -400 -60 -380 Z" fill={h} />
    </g>
  );
};

// подвесная лампа с тёплым светом
const Pendant: React.FC<{ x: number; y: number; color?: string; light?: string; o?: number; r?: number }> = ({ x, y, color = "#d8483a", light = "#ffcf7a", o = 0.45, r = 520 }) => (
  <g>
    <line x1={x} y1={0} x2={x} y2={y - 70} stroke="#151a30" strokeWidth={4} />
    <path d={`M ${x - 90} ${y} Q ${x} ${y - 100} ${x + 90} ${y} Z`} fill={color} />
    <ellipse cx={x} cy={y} rx={60} ry={10} fill="#fff3c8" />
    <Halo x={x} y={y + 80} r={r} ry={r * 0.75} color={light} o={o} />
  </g>
);

// ценник «АКЦИЯ» на полке
const Tag: React.FC<{ x: number; y: number; text?: string }> = ({ x, y, text }) => {
  const w = useWord();
  return (
  <g transform={`translate(${x} ${y}) rotate(-4)`}>
    <rect x={-46} y={-16} width={92} height={32} rx={4} fill="#f6d23b" />
    <text y={8} textAnchor="middle" fontFamily={RUBIK} fontWeight={900} fontSize={20} fill="#c8302a">
      {text ?? w("promo")}
    </text>
  </g>
  );
};

// Ночной магазинчик у дома. params: sign — вывеска («ПРОДУКТЫ 24»), window — окно с хлебным лотком (true), people — покупатели на фоне (true), empty — пустые полки
const TShop: React.FC<P> = ({ t, params }) => {
  const w = useWord();
  const empty = params.empty === true;
  return (
  <Svg>
    <VGrad w={1920} h={900} stops={[[0, "#1c2348"], [1, "#2e3368"]]} />
    <Shelf x={60} y={250} w={640} seed={1} empty={empty} />
    <Shelf x={1220} y={250} w={640} seed={2} empty={empty} />
    {!empty && [[150, 368], [520, 486], [1330, 368], [1700, 604], [380, 722]].map(([x, y], i) => (
      <Tag key={i} x={x} y={y} text={i % 2 ? "−50%" : undefined} />
    ))}
    {params.window === false ? (
      <Shelf x={760} y={250} w={400} seed={3} empty={empty} />
    ) : (
      <g>
        <NightWindow x={800} y={280} w={320} h={260} seed={4} />
        {/* хлебный лоток под окном */}
        <rect x={770} y={600} width={380} height={260} rx={8} fill="#5a3f2c" />
        {[0, 1, 2].map((r) => (
          <g key={r}>
            <rect x={780} y={680 + r * 70} width={360} height={8} fill="#3d2a1e" />
            {!empty && Array.from({ length: 5 }, (_, i) => (
              <ellipse key={i} cx={815 + i * 72} cy={664 + r * 70} rx={30} ry={17} fill={["#d79a52", "#c6843e", "#e0b070"][(i + r) % 3]} />
            ))}
          </g>
        ))}
        <rect x={880} y={570} width={160} height={36} rx={6} fill="#f6d23b" />
        <text x={960} y={597} textAnchor="middle" fontFamily={RUBIK} fontWeight={900} fontSize={24} fill="#5a3f2c">
          {w("bread")}
        </text>
      </g>
    )}
    {/* вывеска */}
    <rect x={720} y={100} width={480} height={110} rx={16} fill="#121935" />
    <rect x={732} y={112} width={456} height={86} rx={10} fill="none" stroke="#ff6b5a" strokeWidth={4} opacity={0.9} />
    <Halo x={960} y={155} r={300} ry={110} color="#ff7a5c" o={0.35} />
    <text x={960} y={176} textAnchor="middle" fontFamily={RUBIK} fontWeight={800} fontSize={58} fill="#ffd6c9" letterSpacing={3}>
      {str(params.sign, w("shop24"))}
    </text>
    {/* тёплые лампы под потолком */}
    {[300, 1620].map((lx) => (
      <g key={lx}>
        <rect x={lx - 90} y={34} width={180} height={14} rx={7} fill="#fff1d2" />
        <Halo x={lx} y={90} r={460} ry={300} color="#ffd9a0" o={0.3} />
      </g>
    ))}
    <Floor c1="#262848" c2="#12142a" />
    {Array.from({ length: 12 }, (_, i) => (
      <line key={i} x1={i * 180 - 60} y1={860} x2={i * 200 - 260} y2={1080} stroke="#30325e" strokeWidth={3} />
    ))}
    {params.people === false ? null : (
      <g>
        <Bystander x={250} seed={3} s={0.55} />
        <Bystander x={1720} seed={8} s={0.5} dir={-1} />
      </g>
    )}
    {/* тёплый свет у кассы */}
    <Halo x={1400} y={760} r={620} ry={360} color="#ffb870" o={0.22} />
    <Dust t={t} />
  </Svg>
  );
};

// Кухня дома вечером: тёплые стены, красный абажур, деревянные шкафчики, холодильник с магнитами, окно со шторами, часы.
// params: window (true), lampX — где абажур (960)
const TKitchen: React.FC<P> = ({ t, params }) => {
  const sec = (t * 6) % 360;
  return (
    <Svg>
      <VGrad w={1920} h={900} stops={[[0, "#3e2c3e"], [1, "#5a3c40"]]} />
      {Array.from({ length: 24 }, (_, i) => (
        <rect key={i} x={i * 80 + 30} y={0} width={18} height={900} fill="#fff" opacity={0.025} />
      ))}
      {/* плитка-фартук */}
      {Array.from({ length: 20 }, (_, i) =>
        Array.from({ length: 4 }, (_, j) => <rect key={`${i}-${j}`} x={980 + i * 46} y={520 + j * 46} width={42} height={42} rx={4} fill={(i + j) % 2 ? "#d9cdb4" : "#cfc0a4"} opacity={0.55} />),
      )}
      {/* верхние шкафчики */}
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <rect x={1000 + i * 290} y={190} width={270} height={240} rx={10} fill="#8a5a3c" />
          <rect x={1016 + i * 290} y={206} width={238} height={208} rx={6} fill="#7a4e33" />
          <rect x={1120 + i * 290} y={390} width={40} height={8} rx={4} fill="#e8dcc4" />
        </g>
      ))}
      {/* столешница, нижние шкафы, чайник */}
      <rect x={970} y={700} width={950} height={22} fill="#d9c8a6" />
      <rect x={980} y={722} width={940} height={150} fill="#7a4e33" />
      {[0, 1, 2].map((i) => (
        <rect key={i} x={1090 + i * 300} y={780} width={40} height={8} rx={4} fill="#e8dcc4" />
      ))}
      <path d="M 1520 700 L 1530 630 Q 1570 610 1610 630 L 1620 700 Z" fill="#e2574c" />
      <path d="M 1620 650 Q 1650 650 1650 680" fill="none" stroke="#e2574c" strokeWidth={8} />
      <rect x={1560} y={612} width={20} height={10} rx={4} fill="#2a2a2a" />
      {/* полка с банками */}
      <rect x={160} y={140} width={440} height={14} fill="#8a5a3c" />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <g key={i}>
          <rect x={180 + i * 70} y={78} width={46} height={62} rx={10} fill={["#e2574c", "#f2b134", "#7bc47f", "#e98ab7", "#f08a3c", "#4fb0c6"][i]} opacity={0.85} />
          <rect x={184 + i * 70} y={70} width={38} height={12} rx={3} fill="#e8dcc4" />
        </g>
      ))}
      {/* холодильник */}
      <rect x={740} y={330} width={200} height={540} rx={20} fill="#e6e2d8" />
      <line x1={740} y1={520} x2={940} y2={520} stroke="#b4ad9e" strokeWidth={5} />
      <rect x={910} y={400} width={10} height={80} rx={5} fill="#b4ad9e" />
      {[["#e2574c", 790, 380], ["#f2b134", 850, 600], ["#4fb0c6", 800, 650], ["#7bc47f", 860, 420]].map(([c, x, y], i) => (
        <rect key={i} x={x as number} y={y as number} width={34} height={26} rx={5} fill={c as string} />
      ))}
      <rect x={780} y={440} width={70} height={56} fill="#f4f1ea" transform="rotate(-4 815 468)" />
      {/* окно со шторами */}
      {params.window === false ? null : (
        <g>
          <NightWindow x={180} y={230} w={400} h={330} seed={7} />
          <path d="M 150 210 L 270 210 Q 240 400 280 590 L 150 590 Z" fill="#c8583a" />
          <path d="M 610 210 L 490 210 Q 520 400 480 590 L 610 590 Z" fill="#c8583a" />
          <rect x={140} y={196} width={480} height={16} rx={8} fill="#5a3f2c" />
          <rect x={160} y={586} width={440} height={18} rx={4} fill="#e8dcc4" />
        </g>
      )}
      {/* часы */}
      <g transform="translate(1290 110)">
        <circle r={46} fill="#f4f1ea" stroke="#5a3f2c" strokeWidth={8} />
        <line x1={0} y1={0} x2={0} y2={-28} stroke="#2a2a2a" strokeWidth={5} strokeLinecap="round" />
        <line x1={0} y1={0} x2={22} y2={6} stroke="#2a2a2a" strokeWidth={5} strokeLinecap="round" />
        <line x1={0} y1={0} x2={Math.sin((sec * Math.PI) / 180) * 34} y2={-Math.cos((sec * Math.PI) / 180) * 34} stroke="#e2574c" strokeWidth={2} />
      </g>
      <Pendant x={num(params.lampX, 960)} y={240} />
      {/* деревянный пол */}
      <Floor c1="#5a3a2c" c2="#2e1e18" />
      {Array.from({ length: 8 }, (_, i) => (
        <line key={i} x1={0} y1={880 + i * 28 + i * i * 2} x2={1920} y2={880 + i * 28 + i * i * 2} stroke="#2a1a14" strokeWidth={2} opacity={0.5} />
      ))}
      <Dust t={t} n={18} />
    </Svg>
  );
};

// Класс: зелёная доска, окна с цветами, плакаты, часы, лампы. params: board — надпись на доске
const TClass: React.FC<P> = ({ t, params }) => (
  <Svg>
    <VGrad w={1920} h={900} stops={[[0, "#3e5e6c"], [1, "#52727c"]]} />
    <rect x={0} y={640} width={1920} height={240} fill="#46646e" />
    <rect x={0} y={636} width={1920} height={8} fill="#2f4a54" />
    <rect x={480} y={170} width={960} height={420} rx={10} fill="#5a3f2c" />
    <rect x={500} y={190} width={920} height={380} rx={6} fill="#2f5a45" />
    <text x={960} y={330} textAnchor="middle" fontFamily={RUBIK} fontWeight={600} fontSize={56} fill="#e9efe6" opacity={0.85}>
      {str(params.board, "")}
    </text>
    {params.board ? null : (
      <g opacity={0.5} stroke="#e9efe6" strokeWidth={4} fill="none" strokeLinecap="round">
        <path d="M 560 260 h 120 M 560 300 h 200 M 560 340 h 160" />
        <path d="M 1150 420 q 40 -80 80 0 t 80 0" />
      </g>
    )}
    <rect x={520} y={566} width={880} height={14} fill="#7a5b44" />
    {/* часы над доской */}
    <g transform="translate(960 110)">
      <circle r={40} fill="#f4f1ea" stroke="#2f3a44" strokeWidth={7} />
      <line x1={0} y1={0} x2={0} y2={-24} stroke="#2a2a2a" strokeWidth={5} strokeLinecap="round" />
      <line x1={0} y1={0} x2={18} y2={10} stroke="#2a2a2a" strokeWidth={5} strokeLinecap="round" />
    </g>
    {/* плакаты по бокам доски */}
    <g transform="rotate(-2 420 120)">
      <rect x={380} y={40} width={80} height={110} rx={4} fill="#f6d23b" />
      <text x={420} y={112} textAnchor="middle" fontFamily={RUBIK} fontWeight={900} fontSize={48} fill="#c8302a">
        А
      </text>
    </g>
    <g transform="rotate(3 1500 100)">
      <rect x={1460} y={40} width={80} height={110} rx={4} fill="#9fd0e3" />
      <text x={1500} y={112} textAnchor="middle" fontFamily={RUBIK} fontWeight={900} fontSize={44} fill="#2f5aa8">
        π
      </text>
    </g>
    {[90, 1540].map((wx, i) => (
      <g key={i}>
        <rect x={wx} y={180} width={290} height={380} rx={8} fill="#cfe6ee" />
        <rect x={wx + 12} y={192} width={266} height={356} fill="#9fd0e3" />
        <rect x={wx + 140} y={192} width={10} height={356} fill="#cfe6ee" />
        <rect x={wx - 10} y={556} width={310} height={16} rx={4} fill="#e8e4da" />
        <g transform={`translate(${wx + 60} 556)`}>
          <rect x={-22} y={-40} width={44} height={40} rx={6} fill="#c8583a" />
          <circle cx={-14} cy={-58} r={20} fill="#5fae7a" />
          <circle cx={14} cy={-62} r={22} fill="#4f9a6a" />
        </g>
        <rect x={wx + 40} y={660} width={210} height={100} rx={8} fill="#d8dde0" opacity={0.7} />
        <Halo x={wx + 145} y={380} r={380} color="#fff6dc" o={0.3} />
      </g>
    ))}
    {[480, 1440].map((x) => (
      <Halo key={x} x={x} y={30} r={500} ry={200} color="#fff1d2" o={0.25} />
    ))}
    <Floor c1="#6a5240" c2="#3a2f27" />
    <Dust t={t} n={22} color="#fffbe8" />
  </Svg>
);

// Школьный коридор: шкафчики, доска объявлений, лампы
const TCorridor: React.FC<P> = ({ t }) => (
  <Svg>
    <VGrad w={1920} h={900} stops={[[0, "#3a4a6e"], [1, "#46597f"]]} />
    {Array.from({ length: 14 }, (_, i) => {
      const c = ["#4f8fc0", "#e2574c", "#f2b134", "#5fae7a"][i % 4];
      return (
        <g key={i}>
          <rect x={30 + i * 136} y={330} width={128} height={530} rx={6} fill={c} />
          <rect x={44 + i * 136} y={350} width={100} height={210} rx={4} fill="#000" opacity={0.12} />
          {[0, 1, 2, 3].map((j) => (
            <rect key={j} x={56 + i * 136} y={372 + j * 18} width={76} height={6} rx={3} fill="#000" opacity={0.22} />
          ))}
          <rect x={130 + i * 136} y={600} width={8} height={40} rx={4} fill="#e6e6e6" />
        </g>
      );
    })}
    {/* доска объявлений */}
    <rect x={720} y={90} width={480} height={210} rx={8} fill="#a8774e" />
    <rect x={736} y={106} width={448} height={178} fill="#c99a6a" />
    {([[760, 120, "#f4f1ea", -3], [900, 130, "#f6d23b", 4], [1040, 118, "#e98ab7", -2], [800, 200, "#9fd0e3", 2], [960, 196, "#f4f1ea", -4]] as [number, number, string, number][]).map(([x, y, c, r], i) => (
      <g key={i} transform={`rotate(${r} ${x} ${y})`}>
        <rect x={x} y={y} width={120} height={74} fill={c} />
        <circle cx={x + 60} cy={y + 8} r={6} fill="#e2574c" />
      </g>
    ))}
    {([[200, 140, "#f6c63b"], [1500, 150, "#7bc47f"]] as [number, number, string][]).map(([x, y, c], i) => (
      <rect key={i} x={x} y={y} width={200} height={140} rx={6} fill={c} opacity={0.9} transform={`rotate(${(i - 0.5) * 5} ${x} ${y})`} />
    ))}
    {[320, 960, 1600].map((lx) => (
      <g key={lx}>
        <rect x={lx - 110} y={30} width={220} height={14} rx={7} fill="#fff1d2" />
        <Halo x={lx} y={70} r={520} ry={260} color="#ffe2b0" o={0.25} />
      </g>
    ))}
    <Floor c1="#3a3e5c" c2="#1b1d33" />
    <Dust t={t} n={14} />
  </Svg>
);

// Ночная улица спального района: дома с окнами, магазинчики с вывесками, деревья, машина, фонарь, луна.
// params: lampX — где фонарь (1450), shops — вывески внизу (true), car — машина у тротуара (true)
const TStreet: React.FC<P> = ({ t, params }) => {
  const lx = num(params.lampX, 1450);
  const w = useWord();
  return (
    <Svg>
      <VGrad w={1920} h={900} stops={[[0, "#0f1533"], [1, "#27336a"]]} />
      {Array.from({ length: 70 }, (_, i) => (
        <circle key={i} cx={rand(i + 300) * 1920} cy={rand(i + 400) * 300} r={1 + rand(i) * 1.6} fill="#fff" opacity={0.3 + 0.4 * Math.abs(Math.sin(t * 0.8 + i))} />
      ))}
      <circle cx={1700} cy={110} r={46} fill="#f4ecd0" opacity={0.9} />
      <Halo x={1700} y={110} r={160} color="#f4ecd0" o={0.25} />
      {[[40, 170, 420], [500, 260, 360], [860, 120, 500], [1280, 230, 300], [1580, 150, 360]].map(([x, top, w], i) => (
        <g key={i}>
          <rect x={x} y={top} width={w} height={900 - top} fill={i % 2 ? "#1d2650" : "#232d5c"} />
          {Array.from({ length: Math.floor(w / 70) * Math.floor((640 - top) / 80) }, (_, j) => {
            const cols = Math.floor(w / 70);
            const cx = x + 22 + (j % cols) * 70;
            const cy = top + 30 + Math.floor(j / cols) * 80;
            return rand(i * 50 + j) > 0.45 ? <rect key={j} x={cx} y={cy} width={34} height={44} rx={3} fill="#f6c86a" opacity={0.85} /> : <rect key={j} x={cx} y={cy} width={34} height={44} rx={3} fill="#151c3d" />;
          })}
        </g>
      ))}
      {/* магазинчики на первых этажах */}
      {params.shops === false
        ? null
        : ([
            [100, w("kebab"), "#f08a3c"],
            [620, w("pharmacy"), "#5fd08a"],
            [1520, w("shop"), "#ff6b5a"],
          ] as [number, string, string][]).map(([x, label, c], i) => (
            <g key={i}>
              <rect x={x} y={660} width={360} height={200} fill="#141a38" />
              <rect x={x + 20} y={720} width={320} height={140} fill="#ffcf8a" opacity={0.55} />
              <rect x={x + 20} y={720} width={320} height={140} fill="none" stroke="#141a38" strokeWidth={6} />
              <line x1={x + 180} y1={720} x2={x + 180} y2={860} stroke="#141a38" strokeWidth={6} />
              <rect x={x + 10} y={666} width={340} height={46} rx={6} fill="#0c1026" />
              <text x={x + 180} y={701} textAnchor="middle" fontFamily={RUBIK} fontWeight={900} fontSize={34} fill={c} letterSpacing={2}>
                {label}
              </text>
              <Halo x={x + 180} y={690} r={230} ry={80} color={c} o={0.35} />
              <Halo x={x + 180} y={860} r={260} ry={70} color="#ffcf8a" o={0.3} />
            </g>
          ))}
      {/* деревья */}
      {[540, 1060, 1280].map((x, i) => (
        <g key={i}>
          <rect x={x - 9} y={700} width={18} height={180} fill="#141a30" />
          <circle cx={x} cy={680} r={70} fill="#1d3a3a" />
          <circle cx={x - 46} cy={710} r={50} fill="#1a3434" />
          <circle cx={x + 48} cy={712} r={52} fill="#1a3434" />
        </g>
      ))}
      {/* фонарь */}
      <rect x={lx - 7} y={420} width={14} height={470} fill="#111733" />
      <path d={`M ${lx - 7} 430 Q ${lx - 7} 400 ${lx - 60} 404`} fill="none" stroke="#111733" strokeWidth={12} />
      <ellipse cx={lx - 72} cy={410} rx={30} ry={12} fill="#ffe0a0" />
      <Halo x={lx - 72} y={560} r={360} ry={420} color="#ffcf7a" o={0.38} />
      <rect x={0} y={860} width={1920} height={40} fill="#3a4370" />
      <Floor y={900} c1="#1a2142" c2="#0c1126" />
      {/* машина у тротуара */}
      {params.car === false ? null : (
        <g transform="translate(1700 1000) scale(0.9)" opacity={0.9}>
          <path d="M -230 -40 Q -236 -110 -180 -116 L -120 -122 L -64 -186 L 90 -186 L 150 -122 Q 236 -114 236 -70 L 236 -40 Z" fill="#7a2f3a" />
          <path d="M -100 -126 L -54 -172 L 10 -172 L 10 -126 Z M 26 -126 L 26 -172 L 84 -172 L 128 -126 Z" fill="#33406e" />
          <circle cx={-130} cy={-36} r={34} fill="#0c0f1e" />
          <circle cx={140} cy={-36} r={34} fill="#0c0f1e" />
          {/* фара спереди (справа) и красный фонарь сзади — чтобы было видно, где перед */}
          <rect x={224} y={-90} width={12} height={18} rx={4} fill="#ffe9a8" />
          <rect x={-236} y={-90} width={10} height={18} rx={3} fill="#d9443c" />
        </g>
      )}
      <Dust t={t} n={12} color="#ffe0a0" />
    </Svg>
  );
};

// Комната героя: стол с ноутбуком и лампой, кровать, окно, плакат, книжная полка, гирлянда, ковёр
const TRoom: React.FC<P> = ({ t, params }) => (
  <Svg>
    <VGrad w={1920} h={900} stops={[[0, "#2e3060"], [1, "#433f70"]]} />
    {params.window === false ? null : <NightWindow x={760} y={200} w={420} h={340} seed={9} />}
    {/* гирлянда */}
    <path d="M 0 60 Q 240 130 480 60 Q 720 130 960 60 Q 1200 130 1440 60 Q 1680 130 1920 60" fill="none" stroke="#1a1f38" strokeWidth={3} />
    {Array.from({ length: 24 }, (_, i) => {
      const x = i * 80 + 40;
      const y = 60 + Math.sin(((x % 480) / 480) * Math.PI) * 36;
      const c = ["#ffcf6a", "#ff7a6a", "#7ad0ff", "#9cf08a"][i % 4];
      const on = 0.5 + 0.5 * Math.sin(t * 3 + i * 1.3);
      return (
        <g key={i}>
          <circle cx={x} cy={y + 10} r={9} fill={c} opacity={0.6 + on * 0.4} />
          <Halo x={x} y={y + 10} r={40} color={c} o={0.35 * on} />
        </g>
      );
    })}
    <rect x={260} y={170} width={220} height={300} rx={6} fill="#e2574c" transform="rotate(-3 370 320)" />
    <circle cx={370} cy={300} r={60} fill="#f6c63b" transform="rotate(-3 370 320)" />
    {/* книжная полка */}
    <rect x={1300} y={210} width={420} height={14} fill="#8a5a3c" />
    <rect x={1300} y={350} width={420} height={14} fill="#8a5a3c" />
    {[0, 1].map((r) =>
      Array.from({ length: 11 }, (_, i) => {
        const h = 70 + rand(r * 20 + i) * 50;
        return <rect key={`${r}${i}`} x={1312 + i * 36} y={(r ? 350 : 210) - h} width={30} height={h} rx={3} fill={["#e2574c", "#4f8fc0", "#f2b134", "#7bc47f", "#8b7bd8", "#e98ab7"][(i + r * 3) % 6]} opacity={0.85} />;
      }),
    )}
    {/* кровать справа */}
    <rect x={1360} y={640} width={560} height={200} rx={18} fill="#4f8fc0" />
    <rect x={1500} y={640} width={420} height={60} rx={14} fill="#3f78a8" />
    <rect x={1360} y={600} width={170} height={90} rx={30} fill="#eef0f6" />
    <rect x={1340} y={520} width={34} height={360} rx={10} fill="#5a3f2c" />
    {/* стол слева с ноутбуком и лампой */}
    <rect x={120} y={640} width={460} height={24} rx={6} fill="#8a6446" />
    <rect x={140} y={664} width={24} height={210} fill="#6e4f37" />
    <rect x={536} y={664} width={24} height={210} fill="#6e4f37" />
    <path d="M 220 640 L 230 560 L 350 560 L 360 640 Z" fill="#2a2f44" />
    <rect x={238} y={568} width={104} height={64} fill="#7ad0ff" opacity={0.8} />
    <Halo x={290} y={600} r={160} color="#7ad0ff" o={0.35} />
    <line x1={470} y1={640} x2={450} y2={540} stroke="#1a1f38" strokeWidth={8} />
    <path d="M 410 560 L 500 520 L 520 560 Z" fill="#f2b134" />
    <Halo x={470} y={600} r={420} ry={280} color="#ffcf7a" o={0.5} />
    <Floor c1="#3a2e48" c2="#1a1528" />
    {/* ковёр */}
    <ellipse cx={960} cy={960} rx={520} ry={70} fill="#8a3a4a" opacity={0.7} />
    <ellipse cx={960} cy={960} rx={440} ry={52} fill="none" stroke="#e8b04a" strokeWidth={6} opacity={0.5} />
    <Dust t={t} n={18} />
  </Svg>
);

// Подъезд: стены «зелёный низ, светлый верх», почтовые ящики, лестница, мигающая лампа. params: lit — какой ящик подсвечен (номер с 1, 0 — никакой)
const TEntrance: React.FC<P> = ({ t, params }) => {
  const lit = num(params.lit, 7);
  const flick = Math.sin(t * 1.7) > 0.85 ? 0.75 + 0.25 * Math.abs(Math.sin(t * 40)) : 1;
  return (
    <Svg>
      <rect width={1920} height={900} fill="#d8cfb4" />
      <rect y={480} width={1920} height={420} fill="#3f6b5a" />
      <rect y={474} width={1920} height={10} fill="#2c4a3e" />
      {/* почтовые ящики */}
      <g transform="translate(240 300)">
        <rect x={-20} y={-20} width={720} height={330} rx={6} fill="#3b4f7a" />
        {Array.from({ length: 12 }, (_, i) => {
          const x = (i % 6) * 114;
          const y = Math.floor(i / 6) * 150;
          const on = i + 1 === lit;
          return (
            <g key={i}>
              <rect x={x} y={y} width={104} height={136} rx={4} fill={on ? "#5a74b0" : "#4a6094"} />
              <rect x={x + 14} y={y + 20} width={76} height={10} rx={5} fill="#22305a" />
              <text x={x + 52} y={y + 110} textAnchor="middle" fontFamily={RUBIK} fontWeight={700} fontSize={26} fill="#e8e4da">
                {i + 1}
              </text>
              {on ? <Halo x={x + 52} y={y + 68} r={110} color="#ffe6a0" o={0.5} /> : null}
            </g>
          );
        })}
      </g>
      {/* лестница вверх справа */}
      {Array.from({ length: 8 }, (_, i) => (
        <rect key={i} x={1180 + i * 90} y={860 - (i + 1) * 60} width={760 - i * 90} height={60} fill={i % 2 ? "#8a8578" : "#9a9588"} />
      ))}
      <path d="M 1180 640 L 1900 160" stroke="#3a2a22" strokeWidth={10} />
      {Array.from({ length: 9 }, (_, i) => (
        <line key={i} x1={1200 + i * 80} y1={626 - i * 53} x2={1200 + i * 80} y2={800 - i * 60} stroke="#3a2a22" strokeWidth={5} />
      ))}
      <rect x={1000} y={640} width={140} height={110} rx={8} fill="#c8c2b2" />
      {/* лампа */}
      <rect x={900} y={60} width={110} height={40} rx={20} fill="#fff6d8" opacity={flick} />
      <Halo x={955} y={160} r={760} ry={520} color="#ffe0a0" o={0.32 * flick} />
      <Floor c1="#7a6a5a" c2="#3a3028" />
      {Array.from({ length: 10 }, (_, i) => (
        <rect key={i} x={i * 200 - 60} y={880} width={200} height={200} fill={i % 2 ? "#6a5a4a" : "#7a6a58"} opacity={0.3} />
      ))}
      <Dust t={t} n={20} />
    </Svg>
  );
};

// Ночной город: небоскрёбы с огнями, прожекторы по небу. Для «весь мир», «вся страна». params: beams — прожекторы (true)
const TCity: React.FC<P> = ({ t, params }) => (
  <Svg>
    <VGrad w={1920} h={1080} stops={[[0, "#0b0f2a"], [0.6, "#24285e"], [1, "#4a3a6a"]]} />
    {params.beams === false
      ? null
      : [300, 900, 1500].map((x, i) => (
          <g key={i} transform={`translate(${x} 900) rotate(${Math.sin(t * 0.7 + i * 2) * 25})`}>
            <path d="M -16 0 L -160 -1000 L 160 -1000 L 16 0 Z" fill="#cfe0ff" opacity={0.12} />
          </g>
        ))}
    {Array.from({ length: 20 }, (_, i) => {
      const w = 70 + rand(i + 3) * 90;
      const x = i * 100 - 20 + rand(i) * 30;
      const top = 380 + rand(i + 7) * 360;
      const cols = Math.floor(w / 26);
      return (
        <g key={i}>
          <rect x={x} y={top} width={w} height={1080 - top} fill={i % 2 ? "#151a3e" : "#1b2150"} />
          {Array.from({ length: cols * Math.floor((1080 - top) / 34) }, (_, j) =>
            rand(i * 90 + j) > 0.55 ? <rect key={j} x={x + 8 + (j % cols) * 26} y={top + 14 + Math.floor(j / cols) * 34} width={12} height={16} fill="#f6c86a" opacity={0.75} /> : null,
          )}
        </g>
      );
    })}
    <Halo x={960} y={1080} r={1200} ry={300} color="#ff9a6a" o={0.3} />
    <Dust t={t} n={20} color="#cfe0ff" />
  </Svg>
);

// Ровный тёмно-синий фон для инфографики, крупных слов и предметов крупно. params: color — цвет центра
const TPlain: React.FC<P> = ({ t, params }) => {
  const u = useUid();
  return (
    <Svg>
      <defs>
        <radialGradient id={`tp${u}`} cx="0.5" cy="0.45" r="0.75">
          <stop offset="0" stopColor={str(params.color, "#34437e")} />
          <stop offset="1" stopColor="#121836" />
        </radialGradient>
      </defs>
      <rect width={1920} height={1080} fill={`url(#tp${u})`} />
      <Dust t={t} n={30} color="#cfe0ff" />
    </Svg>
  );
};

export const LOCATIONS_TOON: Record<string, React.FC<P>> = {
  "t-shop": TShop,
  "t-kitchen": TKitchen,
  "t-class": TClass,
  "t-corridor": TCorridor,
  "t-street": TStreet,
  "t-room": TRoom,
  "t-plain": TPlain,
  "t-entrance": TEntrance,
  "t-city": TCity,
};
