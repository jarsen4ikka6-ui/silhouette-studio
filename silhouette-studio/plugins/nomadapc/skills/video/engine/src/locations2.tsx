// Локации для ролика «Без телефонов» и всё, что пригодится дальше:
// город, планета, кафе, перекрёсток днём, подъезд, Лондон, схема мозга, лаборатория,
// сетка комнат, метро, двор вечером, старая комната, телеграф 1859, космос.
import React, { useId } from "react";
import { clamp, ease, rand } from "./util";

type P = { t: number; params: Record<string, number | string | boolean> };
const useUid = () => useId().replace(/[^a-zA-Z0-9]/g, "");
const num = (v: unknown, d: number) => (typeof v === "number" ? v : d);
const Svg: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <svg viewBox="0 0 1920 1080" width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
    {children}
  </svg>
);
// 1 до момента at, дальше плавно гаснет до 0
const offK = (t: number, at: unknown, len = 1.2) => (typeof at === "number" ? 1 - clamp((t - at) / len) : 1);

// ── Ночной город сверху: окна и синие точки экранов ───────────────
// screensOffAt — гаснут экраны телефонов волной; blackoutAt — гаснет весь свет
export const City: React.FC<P> = ({ t, params }) => {
  const u = useUid();
  const dawn = params.tod === "dawn";
  const so = num(params.screensOffAt, Infinity);
  const bo = params.blackoutAt;
  const light = offK(t, bo, 1.5);
  return (
    <Svg>
      <defs>
        <linearGradient id={`cs${u}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={dawn ? "#2a3b63" : "#0a0f1c"} />
          <stop offset="1" stopColor={dawn ? "#d99a7a" : "#26304a"} />
        </linearGradient>
        <filter id={`cb${u}`}>
          <feGaussianBlur stdDeviation={3} />
        </filter>
      </defs>
      <rect width={1920} height={1080} fill={`url(#cs${u})`} />
      {!dawn ? Array.from({ length: 60 }, (_, i) => <circle key={i} cx={rand(i) * 1920} cy={rand(i + 7) * 420} r={1 + rand(i + 2) * 1.6} fill="#dfe8ff" opacity={0.5} />) : null}
      {/* три ряда домов: дальние размыты */}
      {[0, 1, 2].map((row) => {
        const n = [16, 12, 9][row];
        const base = [700, 820, 1000][row];
        const fill = ["#18213a", "#121a2d", "#0b101c"][row];
        return (
          <g key={row} filter={row === 0 ? `url(#cb${u})` : undefined}>
            {Array.from({ length: n }, (_, i) => {
              const w = 1920 / n + 10;
              const x = i * (1920 / n) - 5;
              const h = 180 + rand(i + row * 31) * [260, 360, 420][row];
              const y = base - h;
              const cols = Math.max(2, Math.floor(w / 26));
              const rows = Math.floor(h / 30);
              return (
                <g key={i}>
                  <rect x={x} y={y} width={w} height={1080 - y} fill={fill} />
                  {Array.from({ length: cols * rows }, (_, k) => {
                    const r = rand(i * 13 + k * 1.7 + row * 101);
                    if (r > 0.36) return null;
                    const cx = x + 8 + (k % cols) * ((w - 16) / cols);
                    const cy = y + 14 + Math.floor(k / cols) * 30;
                    // синие — это люди с телефонами, они гаснут волной слева направо
                    const blue = r < 0.12;
                    const wave = so + (cx / 1920) * 1.6 + rand(k + i) * 0.4;
                    const op = blue ? (t < wave ? 1 : clamp(1 - (t - wave) / 0.25)) : light;
                    if (op <= 0) return null;
                    return <rect key={k} x={cx} y={cy} width={10} height={14} fill={blue ? "#8fc8ff" : "#f2c66d"} opacity={(0.4 + r) * op} />;
                  })}
                </g>
              );
            })}
          </g>
        );
      })}
    </Svg>
  );
};

// ── Земля из космоса с огнями городов ─────────────────────────────
// lightsOffAt — синие огоньки (телефоны) гаснут по всей планете
export const Globe: React.FC<P> = ({ t, params }) => {
  const u = useUid();
  const so = num(params.lightsOffAt, Infinity);
  const spin = t * 6;
  return (
    <Svg>
      <defs>
        <radialGradient id={`gl${u}`} cx="0.4" cy="0.35">
          <stop offset="0" stopColor="#2b5a9a" />
          <stop offset="0.7" stopColor="#13284d" />
          <stop offset="1" stopColor="#081226" />
        </radialGradient>
        <radialGradient id={`ga${u}`}>
          <stop offset="0.82" stopColor="#6fb4ff" stopOpacity={0} />
          <stop offset="0.9" stopColor="#6fb4ff" stopOpacity={0.35} />
          <stop offset="1" stopColor="#6fb4ff" stopOpacity={0} />
        </radialGradient>
        <clipPath id={`gc${u}`}>
          <circle cx={960} cy={560} r={380} />
        </clipPath>
      </defs>
      <rect width={1920} height={1080} fill="#03050b" />
      {Array.from({ length: 140 }, (_, i) => <circle key={i} cx={rand(i) * 1920} cy={rand(i + 3) * 1080} r={0.8 + rand(i + 5) * 1.6} fill="#fff" opacity={0.3 + rand(i + 9) * 0.5} />)}
      <circle cx={960} cy={560} r={470} fill={`url(#ga${u})`} />
      <circle cx={960} cy={560} r={380} fill={`url(#gl${u})`} />
      <g clipPath={`url(#gc${u})`}>
        {/* материки — пятна, которые медленно едут */}
        {Array.from({ length: 9 }, (_, i) => {
          const x = ((rand(i) * 1100 + spin) % 1100) + 410;
          const y = 300 + rand(i + 4) * 520;
          return <ellipse key={i} cx={x} cy={y} rx={70 + rand(i + 1) * 110} ry={40 + rand(i + 2) * 80} fill="#0f1f2f" opacity={0.9} transform={`rotate(${rand(i + 3) * 60 - 30} ${x} ${y})`} />;
        })}
        {Array.from({ length: 260 }, (_, i) => {
          const x = ((rand(i + 50) * 1100 + spin) % 1100) + 410;
          const y = 220 + rand(i + 80) * 680;
          const blue = rand(i + 7) < 0.5;
          const wave = so + (x - 580) / 800 + rand(i) * 0.5;
          const op = blue ? (t < wave ? 1 : clamp(1 - (t - wave) / 0.3)) : 1;
          return op > 0 ? <circle key={i} cx={x} cy={y} r={blue ? 2.6 : 2} fill={blue ? "#9ad2ff" : "#ffd27a"} opacity={0.8 * op} /> : null;
        })}
        <circle cx={1180} cy={380} r={420} fill="#000" opacity={0} />
        <circle cx={1300} cy={720} r={600} fill="#000" opacity={0.35} />
      </g>
    </Svg>
  );
};

// ── Кафе: стойка, меню, терминал ─────────────────────────────────
export const Cafe: React.FC<P> = ({ t }) => {
  const u = useUid();
  return (
    <Svg>
      <defs>
        <linearGradient id={`kw${u}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5a4334" />
          <stop offset="1" stopColor="#7a5a42" />
        </linearGradient>
        <radialGradient id={`kl${u}`}>
          <stop offset="0" stopColor="#ffd99a" stopOpacity={0.5} />
          <stop offset="1" stopColor="#ffd99a" stopOpacity={0} />
        </radialGradient>
      </defs>
      <rect width={1920} height={1080} fill={`url(#kw${u})`} />
      <rect y={900} width={1920} height={180} fill="#2e231c" />
      {/* меню на доске */}
      <rect x={1180} y={140} width={560} height={300} rx={8} fill="#1f2421" stroke="#3b2c22" strokeWidth={12} />
      <text x={1460} y={210} textAnchor="middle" fontFamily="Caveat" fontSize={56} fill="#f3eee2">МЕНЮ</text>
      {["капучино .......... 220", "латте ................ 240", "круассан ........... 180"].map((s, i) => (
        <text key={i} x={1230} y={280 + i * 52} fontFamily="Caveat" fontSize={40} fill="#e9e1cf">{s}</text>
      ))}
      {/* лампы */}
      {[400, 900].map((x, i) => (
        <g key={x}>
          <line x1={x} y1={0} x2={x} y2={180} stroke="#1c1511" strokeWidth={4} />
          <path d={`M ${x - 50} 230 Q ${x} 160 ${x + 50} 230 Z`} fill="#1c1511" />
          <circle cx={x} cy={250} r={300} fill={`url(#kl${u})`} opacity={0.9 + Math.sin(t * 2 + i) * 0.05} style={{ mixBlendMode: "screen" }} />
        </g>
      ))}
      {/* полки с чашками */}
      {[0, 1].map((r) => (
        <g key={r}>
          <rect x={160} y={360 + r * 120} width={880} height={12} fill="#3b2c22" />
          {Array.from({ length: 9 }, (_, i) => <rect key={i} x={190 + i * 96} y={318 + r * 120} width={46} height={42} rx={8} fill={i % 3 ? "#efe7d8" : "#c9a27a"} />)}
        </g>
      ))}
      {/* стойка */}
      <rect x={0} y={640} width={1920} height={30} fill="#2b201a" />
      <rect x={0} y={670} width={1920} height={240} fill="#43322a" />
      {Array.from({ length: 10 }, (_, i) => <rect key={i} x={i * 200} y={690} width={180} height={200} rx={4} fill="#4b382f" />)}
      {/* кофемашина и терминал */}
      <rect x={360} y={500} width={240} height={140} rx={10} fill="#9aa3ad" />
      <rect x={390} y={530} width={180} height={40} rx={6} fill="#5f6873" />
      <rect x={1380} y={570} width={90} height={70} rx={10} fill="#22262c" />
      <rect x={1392} y={580} width={66} height={34} rx={4} fill="#5ec27a" opacity={0.85} />
    </Svg>
  );
};

// ── Перекрёсток днём ─────────────────────────────────────────────
export const Crossroad: React.FC<P> = ({ t, params }) => {
  const u = useUid();
  const eve = params.tod === "evening";
  return (
    <Svg>
      <defs>
        <linearGradient id={`rs${u}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={eve ? "#3a4a78" : "#7fb4e6"} />
          <stop offset="1" stopColor={eve ? "#e6a27a" : "#d9ecfa"} />
        </linearGradient>
      </defs>
      <rect width={1920} height={1080} fill={`url(#rs${u})`} />
      {[0, 1, 2, 3, 4, 5, 6].map((i) => {
        const x = i * 290 - 40;
        const h = 300 + rand(i + 2) * 260;
        const c = ["#8a93a6", "#a4a2a0", "#7c8698", "#b0a597", "#8e97a4", "#9c9fae", "#a39a8f"][i];
        return (
          <g key={i}>
            <rect x={x} y={760 - h} width={270} height={h} fill={c} />
            {Array.from({ length: 4 * Math.floor(h / 70) }, (_, k) => (
              <rect key={k} x={x + 26 + (k % 4) * 60} y={790 - h + Math.floor(k / 4) * 70} width={34} height={42} fill={eve && rand(k + i) < 0.4 ? "#f2c66d" : "#5d6f8a"} opacity={0.85} />
            ))}
          </g>
        );
      })}
      <rect y={760} width={1920} height={60} fill="#b9b6b0" />
      <rect y={820} width={1920} height={260} fill="#4c4f56" />
      {Array.from({ length: 9 }, (_, i) => <rect key={i} x={560 + i * 90} y={850} width={50} height={200} fill="#e9e9e4" opacity={0.85} />)}
      {/* светофор */}
      <rect x={300} y={430} width={16} height={340} fill="#2a2d33" />
      <rect x={276} y={360} width={64} height={150} rx={10} fill="#2a2d33" />
      <circle cx={308} cy={392} r={18} fill={Math.floor(t / 4) % 2 ? "#5a2020" : "#ff4a3a"} />
      <circle cx={308} cy={474} r={18} fill={Math.floor(t / 4) % 2 ? "#3ad86a" : "#1d4a2a"} />
      {/* деревья */}
      {[1500, 1760].map((x) => (
        <g key={x}>
          <rect x={x - 10} y={620} width={20} height={150} fill="#4a3a2c" />
          <circle cx={x} cy={600} r={70} fill={eve ? "#3a5a3a" : "#5c9a52"} />
        </g>
      ))}
    </Svg>
  );
};

// ── Подъезд: крашеные стены, почтовые ящики, лампочка ─────────────
export const Entrance: React.FC<P> = ({ t }) => (
  <Svg>
    <rect width={1920} height={1080} fill="#cfd3c4" />
    <rect y={460} width={1920} height={460} fill="#4f7a6a" />
    <rect y={452} width={1920} height={10} fill="#3c5e52" />
    <rect y={920} width={1920} height={160} fill="#6b5f55" />
    {Array.from({ length: 24 }, (_, i) => <rect key={i} x={i * 80} y={920} width={78} height={160} fill={i % 2 ? "#71645a" : "#665a50"} />)}
    {/* почтовые ящики */}
    <rect x={1160} y={380} width={520} height={300} rx={6} fill="#5d6a73" />
    {Array.from({ length: 15 }, (_, i) => (
      <g key={i}>
        <rect x={1176 + (i % 5) * 100} y={396 + Math.floor(i / 5) * 92} width={88} height={80} rx={4} fill="#73828c" />
        <rect x={1196 + (i % 5) * 100} y={412 + Math.floor(i / 5) * 92} width={48} height={8} rx={3} fill="#3e474d" />
        <text x={1252 + (i % 5) * 100} y={462 + Math.floor(i / 5) * 92} fontFamily="Montserrat" fontSize={20} fill="#e6eaec">{i + 1}</text>
      </g>
    ))}
    {/* дверь квартиры и объявление */}
    <rect x={220} y={300} width={300} height={620} rx={4} fill="#5a3b2a" />
    <circle cx={480} cy={640} r={12} fill="#c9a24a" />
    <rect x={700} y={300} width={170} height={210} fill="#f3f0e6" transform="rotate(-3 785 405)" />
    <text x={720} y={360} fontFamily="Caveat" fontSize={34} fill="#2b3f8f" transform="rotate(-3 785 405)">Телефоны</text>
    <text x={720} y={400} fontFamily="Caveat" fontSize={34} fill="#2b3f8f" transform="rotate(-3 785 405)">соседей —</text>
    <text x={720} y={440} fontFamily="Caveat" fontSize={34} fill="#2b3f8f" transform="rotate(-3 785 405)">кв. 12</text>
    {/* лампочка */}
    <line x1={960} y1={0} x2={960} y2={110} stroke="#333" strokeWidth={3} />
    <circle cx={960} cy={126} r={18} fill="#fff1b8" opacity={0.85 + Math.sin(t * 13) * 0.05} />
    <circle cx={960} cy={126} r={420} fill="#fff1b8" opacity={0.12} />
  </Svg>
);

// ── Лондон в сумерках: Биг-Бен, дома в ряд ───────────────────────
export const London: React.FC<P> = () => {
  const u = useUid();
  return (
    <Svg>
      <defs>
        <linearGradient id={`ls${u}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2c3554" />
          <stop offset="1" stopColor="#c98f74" />
        </linearGradient>
      </defs>
      <rect width={1920} height={1080} fill={`url(#ls${u})`} />
      {/* Биг-Бен */}
      <g fill="#1d2232">
        <rect x={1440} y={260} width={130} height={560} />
        <rect x={1426} y={330} width={158} height={150} />
        <path d="M 1426 260 L 1505 110 L 1584 260 Z" />
        <rect x={1500} y={70} width={10} height={50} />
      </g>
      <circle cx={1505} cy={405} r={54} fill="#f2dfa8" />
      <circle cx={1505} cy={405} r={54} fill="none" stroke="#1d2232" strokeWidth={6} />
      <line x1={1505} y1={405} x2={1505} y2={366} stroke="#1d2232" strokeWidth={6} />
      <line x1={1505} y1={405} x2={1532} y2={418} stroke="#1d2232" strokeWidth={5} />
      {/* дома в ряд */}
      {Array.from({ length: 6 }, (_, i) => {
        const x = i * 250 - 30;
        return (
          <g key={i}>
            <rect x={x} y={420} width={240} height={420} fill={["#4a3a3a", "#3f3a44", "#4a4035", "#3c3a3f", "#47383a", "#3f3d36"][i]} />
            <path d={`M ${x} 420 L ${x + 120} 360 L ${x + 240} 420 Z`} fill="#2b2528" />
            {[0, 1, 2, 3, 4, 5].map((k) => <rect key={k} x={x + 30 + (k % 3) * 66} y={470 + Math.floor(k / 3) * 120} width={44} height={74} fill={rand(i * 7 + k) < 0.45 ? "#f2c66d" : "#2a3042"} />)}
            <rect x={x + 96} y={720} width={50} height={120} fill="#1d1a1c" />
          </g>
        );
      })}
      <rect y={840} width={1920} height={40} fill="#5b5a5f" />
      <rect y={880} width={1920} height={200} fill="#2b2c31" />
      {Array.from({ length: 8 }, (_, i) => <rect key={i} x={i * 260 + 40} y={975} width={130} height={10} fill="#d9d6c9" opacity={0.7} />)}
    </Svg>
  );
};

// ── Схема мозга: профиль головы, гиппокамп растёт к growAt ────────
export const Brain: React.FC<P> = ({ t, params }) => {
  const u = useUid();
  const g = ease(clamp((t - num(params.growAt, 1)) / 2.5));
  const shrink = params.shrink === true;
  const s = shrink ? 1 - g * 0.35 : 1 + g * 0.45;
  return (
    <Svg>
      <defs>
        <radialGradient id={`bb${u}`} cx="0.5" cy="0.45">
          <stop offset="0" stopColor="#1f2c4a" />
          <stop offset="1" stopColor="#0a0f1c" />
        </radialGradient>
        <radialGradient id={`hg${u}`}>
          <stop offset="0" stopColor="#ffd86a" stopOpacity={0.9} />
          <stop offset="1" stopColor="#ffd86a" stopOpacity={0} />
        </radialGradient>
      </defs>
      <rect width={1920} height={1080} fill={`url(#bb${u})`} />
      {/* голова в профиль */}
      <path d="M 700 900 L 720 760 Q 600 720 610 600 Q 560 590 590 540 Q 560 480 620 440 Q 640 220 900 190 Q 1180 170 1260 400 Q 1310 560 1200 680 L 1210 900 Z" fill="#0d1220" stroke="#3e5a8a" strokeWidth={5} />
      {/* мозг */}
      <path d="M 700 420 Q 700 250 900 240 Q 1150 230 1200 410 Q 1230 520 1110 560 Q 980 600 860 560 Q 720 540 700 420 Z" fill="#c98aa0" opacity={0.85} />
      {Array.from({ length: 9 }, (_, i) => (
        <path key={i} d={`M ${740 + i * 50} ${300 + (i % 2) * 40} q 30 40 0 ${80 + (i % 3) * 30}`} fill="none" stroke="#a8667f" strokeWidth={6} strokeLinecap="round" />
      ))}
      {/* гиппокамп */}
      <g transform={`translate(960 520) scale(${s})`}>
        <circle r={110} fill={`url(#hg${u})`} opacity={0.5 + g * 0.5} />
        <path d="M -60 0 Q -40 -36 0 -26 Q 40 -16 56 10 Q 40 34 10 20 Q -20 8 -40 26 Z" fill="#ffd86a" />
      </g>
      <line x1={1010} y1={540} x2={1360} y2={620} stroke="#ffd86a" strokeWidth={3} strokeDasharray="10 8" opacity={0.8} />
      <text x={1380} y={630} fontFamily="Montserrat" fontWeight={700} fontSize={44} fill="#ffd86a">гиппокамп</text>
    </Svg>
  );
};

// ── Белая лаборатория: пустая комната, стул, часы ─────────────────
// timerAt + timerFrom — на стене идёт обратный отсчёт
export const Lab: React.FC<P> = ({ t, params }) => {
  const u = useUid();
  const at = num(params.timerAt, -1);
  const left = at >= 0 ? Math.max(0, num(params.timerFrom, 900) - Math.max(0, t - at) * num(params.timerSpeed, 1)) : -1;
  return (
    <Svg>
      <defs>
        <linearGradient id={`lw${u}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e9edf1" />
          <stop offset="1" stopColor="#cdd4dc" />
        </linearGradient>
      </defs>
      <rect width={1920} height={1080} fill={`url(#lw${u})`} />
      <rect y={880} width={1920} height={200} fill="#b7c0ca" />
      <rect y={872} width={1920} height={10} fill="#a3adb8" />
      {/* лампы под потолком */}
      {[480, 960, 1440].map((x) => <rect key={x} x={x - 140} y={40} width={280} height={20} rx={8} fill="#ffffff" />)}
      {/* зеркальное окно наблюдения */}
      <rect x={1340} y={260} width={460} height={260} rx={6} fill="#2a323d" />
      <rect x={1360} y={280} width={420} height={220} fill="#3c4756" />
      <path d="M 1380 300 L 1480 300 L 1400 480 Z" fill="#fff" opacity={0.08} />
      {left >= 0 ? (
        <g>
          <rect x={720} y={150} width={480} height={170} rx={14} fill="#1b2230" />
          <text x={960} y={275} textAnchor="middle" fontFamily="Montserrat" fontWeight={700} fontSize={120} fill="#ff5a4a">
            {`${Math.floor(left / 60)}:${String(Math.floor(left % 60)).padStart(2, "0")}`}
          </text>
        </g>
      ) : null}
    </Svg>
  );
};

// ── Сетка из маленьких комнат (вид как у кукольного дома) ─────────
export const Grid: React.FC<P> = ({ t, params }) => {
  const cols = num(params.cols, 10);
  const rows = num(params.rows, 6);
  const cw = 1920 / cols;
  const ch = 1080 / rows;
  return (
    <Svg>
      <rect width={1920} height={1080} fill="#0d1018" />
      {Array.from({ length: cols * rows }, (_, i) => {
        const x = (i % cols) * cw;
        const y = Math.floor(i / cols) * ch;
        const flash = Math.max(0, 1 - ((t * 0.7 + rand(i) * 6) % 6) / 0.3);
        const sx = x + cw * 0.38;
        const sy = y + ch * 0.82;
        const k = ch / 180;
        return (
          <g key={i}>
            <rect x={x + 4} y={y + 4} width={cw - 8} height={ch - 8} fill="#e2e7ec" />
            <rect x={x + 4} y={y + ch - 22} width={cw - 8} height={18} fill="#b7c0ca" />
            {/* человечек на стуле */}
            <g transform={`translate(${sx} ${sy}) scale(${k})`} fill="#0a0a0c">
              <rect x={-24} y={-48} width={48} height={8} />
              <rect x={-22} y={-40} width={6} height={40} />
              <rect x={16} y={-40} width={6} height={40} />
              <rect x={-16} y={-104} width={28} height={58} rx={12} />
              <circle cx={0} cy={-122} r={18} />
            </g>
            <rect x={x + cw * 0.66} y={y + ch * 0.6} width={cw * 0.12} height={ch * 0.22} fill="#cfd5dc" />
            <circle cx={x + cw * 0.72} cy={y + ch * 0.58} r={cw * 0.04} fill="#e23b32" />
            {flash > 0 ? <rect x={x + 4} y={y + 4} width={cw - 8} height={ch - 8} fill="#fff6b0" opacity={flash * 0.7} /> : null}
          </g>
        );
      })}
    </Svg>
  );
};

// ── Вагон метро: сиденья, поручни, огни туннеля в окнах ───────────
export const Metro: React.FC<P> = ({ t }) => {
  const u = useUid();
  return (
    <Svg>
      <defs>
        <linearGradient id={`mw${u}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#c9cfc9" />
          <stop offset="1" stopColor="#a9b0aa" />
        </linearGradient>
        <clipPath id={`mc${u}`}>
          {[0, 1, 2].map((i) => <rect key={i} x={140 + i * 600} y={240} width={460} height={240} rx={30} />)}
        </clipPath>
      </defs>
      <rect width={1920} height={1080} fill={`url(#mw${u})`} />
      <rect width={1920} height={70} fill="#e9ece6" />
      <g clipPath={`url(#mc${u})`}>
        <rect width={1920} height={1080} fill="#0b0d12" />
        {Array.from({ length: 10 }, (_, i) => {
          const x = 1920 - ((t * 2400 + i * 420) % 2200);
          return <rect key={i} x={x} y={300 + (i % 3) * 50} width={140} height={6} rx={3} fill="#ffcf7a" opacity={0.7} />;
        })}
      </g>
      {[0, 1, 2].map((i) => <rect key={i} x={140 + i * 600} y={240} width={460} height={240} rx={30} fill="none" stroke="#8e958f" strokeWidth={10} />)}
      {/* поручни */}
      <rect y={110} width={1920} height={12} fill="#d8dcd6" />
      {/* реклама над окнами */}
      {["КУРСЫ АНГЛИЙСКОГО", "ОКНА ПВХ · СКИДКИ", "ДОСТАВКА ПИЦЦЫ"].map((txt, i) => (
        <g key={txt}>
          <rect x={190 + i * 600} y={140} width={360} height={84} rx={6} fill="#f4f1e8" stroke="#8e958f" strokeWidth={4} />
          <text x={370 + i * 600} y={178} textAnchor="middle" fontFamily="Montserrat, sans-serif" fontWeight={800} fontSize={24} fill="#c0392b">{txt}</text>
          <text x={370 + i * 600} y={208} textAnchor="middle" fontFamily="Montserrat, sans-serif" fontWeight={600} fontSize={20} fill="#3d4a5c">8 800 555-35-35</text>
        </g>
      ))}
      {[420, 1020, 1620].map((x) => <rect key={x} x={x} y={110} width={12} height={800} fill="#d8dcd6" />)}
      {/* сиденья */}
      <rect y={680} width={1920} height={60} rx={10} fill="#3d5b8c" />
      <rect y={600} width={1920} height={80} rx={10} fill="#476aa0" />
      <rect y={740} width={1920} height={340} fill="#5a605c" />
      <rect y={880} width={1920} height={200} fill="#43484a" />
    </Svg>
  );
};

// ── Двор вечером: панельный дом, фонари, деревья ──────────────────
export const Yard: React.FC<P> = ({ t }) => {
  const u = useUid();
  return (
    <Svg>
      <defs>
        <linearGradient id={`ys${u}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2e3a66" />
          <stop offset="0.7" stopColor="#c47e74" />
          <stop offset="1" stopColor="#f0b07a" />
        </linearGradient>
        <radialGradient id={`yl${u}`}>
          <stop offset="0" stopColor="#ffe0a0" stopOpacity={0.6} />
          <stop offset="1" stopColor="#ffe0a0" stopOpacity={0} />
        </radialGradient>
      </defs>
      <rect width={1920} height={1080} fill={`url(#ys${u})`} />
      <rect x={160} y={180} width={1600} height={640} fill="#3b3f52" />
      {Array.from({ length: 16 * 9 }, (_, i) => (
        <rect key={i} x={200 + (i % 16) * 98} y={210 + Math.floor(i / 16) * 66} width={50} height={40} fill={rand(i * 2.3) < 0.42 ? "#f2c66d" : "#262a3a"} opacity={0.9} />
      ))}
      <rect y={820} width={1920} height={260} fill="#3a3a3a" />
      <rect y={820} width={1920} height={20} fill="#555" />
      {[1, 2, 3].map((i) => (
        <g key={i}>
          <rect x={i * 480 - 6} y={520} width={12} height={320} fill="#151515" />
          <circle cx={i * 480} cy={520} r={16} fill="#ffe8b0" />
          <circle cx={i * 480} cy={520} r={260} fill={`url(#yl${u})`} opacity={0.85 + Math.sin(t * 1.5 + i) * 0.05} style={{ mixBlendMode: "screen" }} />
        </g>
      ))}
      {[120, 1800].map((x) => (
        <g key={x}>
          <rect x={x - 12} y={600} width={24} height={240} fill="#211a15" />
          <circle cx={x} cy={560} r={110} fill="#22301f" />
          <circle cx={x + 60} cy={610} r={70} fill="#1c2a1a" />
        </g>
      ))}
    </Svg>
  );
};

// ── Старая комната: обои, стол у окна, абажур ─────────────────────
export const OldRoom: React.FC<P> = ({ t }) => {
  const u = useUid();
  return (
    <Svg>
      <defs>
        <pattern id={`wp${u}`} width={80} height={80} patternUnits="userSpaceOnUse">
          <rect width={80} height={80} fill="#6c5a48" />
          <circle cx={40} cy={40} r={6} fill="#7c6a56" />
          <circle cx={0} cy={0} r={6} fill="#7c6a56" />
          <circle cx={80} cy={80} r={6} fill="#7c6a56" />
        </pattern>
        <radialGradient id={`ol${u}`}>
          <stop offset="0" stopColor="#ffd38a" stopOpacity={0.55} />
          <stop offset="1" stopColor="#ffd38a" stopOpacity={0} />
        </radialGradient>
      </defs>
      <rect width={1920} height={1080} fill={`url(#wp${u})`} />
      <rect y={880} width={1920} height={200} fill="#3a2b20" />
      <rect x={300} y={160} width={420} height={460} fill="#24314d" />
      <rect x={290} y={150} width={440} height={480} fill="none" stroke="#4a3626" strokeWidth={20} />
      <rect x={500} y={160} width={16} height={460} fill="#4a3626" />
      <circle cx={420} cy={260} r={22} fill="#e6edff" opacity={0.7} />
      {/* абажур */}
      <line x1={1100} y1={0} x2={1100} y2={200} stroke="#222" strokeWidth={4} />
      <path d="M 1010 290 Q 1100 180 1190 290 Z" fill="#b5523a" />
      <circle cx={1100} cy={300} r={520} fill={`url(#ol${u})`} opacity={0.9 + Math.sin(t * 2) * 0.04} style={{ mixBlendMode: "screen" }} />
      {/* комод с фото */}
      <rect x={1460} y={620} width={340} height={260} rx={6} fill="#3e2c20" />
      {[0, 1, 2].map((i) => <rect key={i} x={1476} y={636 + i * 82} width={308} height={70} rx={4} fill="#4a3627" />)}
      <rect x={1500} y={520} width={90} height={100} fill="#d9c9a8" stroke="#3a2b20" strokeWidth={6} />
      <rect x={1640} y={540} width={110} height={80} fill="#d9c9a8" stroke="#3a2b20" strokeWidth={6} />
    </Svg>
  );
};

// ── Телеграф 1859: деревянная контора, провода искрят, сияние ─────
export const Telegraph: React.FC<P> = ({ t, params }) => {
  const u = useUid();
  const sp = num(params.sparkAt, 1);
  const on = t > sp;
  return (
    <Svg>
      <defs>
        <linearGradient id={`tw${u}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4a3424" />
          <stop offset="1" stopColor="#5e4330" />
        </linearGradient>
        <linearGradient id={`au${u}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#39e6a0" stopOpacity={0.15} />
          <stop offset="0.5" stopColor="#9a6bff" stopOpacity={0.6} />
          <stop offset="1" stopColor="#ff5a8a" stopOpacity={0.2} />
        </linearGradient>
        <radialGradient id={`cd${u}`}>
          <stop offset="0" stopColor="#ffd38a" stopOpacity={0.5} />
          <stop offset="1" stopColor="#ffd38a" stopOpacity={0} />
        </radialGradient>
      </defs>
      <rect width={1920} height={1080} fill={`url(#tw${u})`} />
      {Array.from({ length: 12 }, (_, i) => <rect key={i} x={i * 160} y={0} width={4} height={900} fill="#3a281b" />)}
      <rect y={880} width={1920} height={200} fill="#2e2016" />
      {/* окно с сиянием */}
      <rect x={1240} y={160} width={500} height={400} fill="#0b1328" />
      <path d={`M 1240 ${360 + Math.sin(t) * 20} Q 1400 ${240 + Math.sin(t * 1.3) * 30} 1520 ${320 + Math.sin(t * 0.8) * 20} T 1740 ${260 + Math.sin(t * 1.1) * 25} L 1740 460 L 1240 460 Z`} fill={`url(#au${u})`} opacity={0.9} />
      <rect x={1230} y={150} width={520} height={420} fill="none" stroke="#2e2016" strokeWidth={20} />
      <rect x={1482} y={160} width={16} height={400} fill="#2e2016" />
      {/* провода к аппарату */}
      <path d="M 0 300 Q 400 340 760 560" fill="none" stroke="#1d140d" strokeWidth={6} />
      {/* стол и аппарат */}
      <rect x={500} y={640} width={700} height={24} fill="#2e2016" />
      <rect x={530} y={664} width={24} height={220} fill="#2e2016" />
      <rect x={1146} y={664} width={24} height={220} fill="#2e2016" />
      <rect x={700} y={580} width={160} height={60} rx={6} fill="#6d4b2a" />
      <rect x={740} y={560} width={90} height={14} rx={4} fill="#b88a3a" />
      <circle cx={830} cy={556} r={10} fill="#1d140d" />
      <rect x={900} y={590} width={80} height={50} fill="#e9ddc0" />
      {/* свеча */}
      <rect x={1060} y={580} width={18} height={60} fill="#efe6d2" />
      <ellipse cx={1069} cy={572} rx={6} ry={12} fill="#ffcf5a" />
      <circle cx={1069} cy={572} r={260} fill={`url(#cd${u})`} style={{ mixBlendMode: "screen" }} />
      {/* искры */}
      {on
        ? Array.from({ length: 26 }, (_, i) => {
            const ph = (t * 3 + rand(i)) % 1;
            const a = rand(i + 2) * Math.PI * 2;
            const d = ph * (80 + rand(i + 5) * 120);
            return <circle key={i} cx={780 + Math.cos(a) * d} cy={560 + Math.sin(a) * d - ph * 30} r={3 + rand(i) * 3} fill="#fff1a0" opacity={(1 - ph) * (0.6 + 0.4 * Math.sin(t * 40 + i))} />;
          })
        : null}
      {on ? <circle cx={780} cy={560} r={70} fill="#fff4b0" opacity={0.3 + 0.3 * Math.abs(Math.sin(t * 25))} /> : null}
    </Svg>
  );
};

// ── Космос: Солнце, выброс плазмы, орбита Земли ───────────────────
// cmeAt — когда вылетает выброс; earth — где Земля: 0..1 по видимой дуге орбиты
export const Space: React.FC<P> = ({ t, params }) => {
  const u = useUid();
  const k = ease(clamp((t - num(params.cmeAt, 1)) / 3));
  const ex = num(params.earth, 0.75);
  const orbit = (p: number) => ({ x: 380 + Math.cos(-0.55 + p * 1.1) * 1300, y: 540 + Math.sin(-0.55 + p * 1.1) * 1300 * 0.55 });
  const e = orbit(ex);
  return (
    <Svg>
      <defs>
        <radialGradient id={`sn${u}`}>
          <stop offset="0" stopColor="#fff7d0" />
          <stop offset="0.35" stopColor="#ffb340" />
          <stop offset="1" stopColor="#ff6a1a" stopOpacity={0} />
        </radialGradient>
        <radialGradient id={`cm${u}`}>
          <stop offset="0" stopColor="#ffb340" stopOpacity={0} />
          <stop offset="0.6" stopColor="#ff8a3a" stopOpacity={0.25} />
          <stop offset="1" stopColor="#ffd06a" stopOpacity={0.7} />
        </radialGradient>
      </defs>
      <rect width={1920} height={1080} fill="#03040a" />
      {Array.from({ length: 160 }, (_, i) => <circle key={i} cx={rand(i) * 1920} cy={rand(i + 3) * 1080} r={0.6 + rand(i + 5) * 1.6} fill="#fff" opacity={0.25 + rand(i + 9) * 0.5} />)}
      <path d={`M ${orbit(0).x} ${orbit(0).y} ${Array.from({ length: 30 }, (_, i) => { const o = orbit((i + 1) / 30); return `L ${o.x} ${o.y}`; }).join(" ")}`} fill="none" stroke="#6f8bbf" strokeWidth={3} strokeDasharray="12 12" opacity={0.6} />
      <circle cx={130} cy={540} r={520} fill={`url(#sn${u})`} />
      <circle cx={130} cy={540} r={190} fill="#ffd36a" />
      {k > 0 ? (
        <g opacity={1 - Math.max(0, k - 0.85) * 4}>
          <path d={`M 300 ${540 - 60} Q ${300 + k * 900} ${540 - 120 - k * 260} ${320 + k * 1500} ${540 - k * 80} Q ${300 + k * 900} ${540 + 120 + k * 260} 300 ${540 + 60} Z`} fill={`url(#cm${u})`} />
        </g>
      ) : null}
      <circle cx={e.x} cy={e.y} r={30} fill="#3d7bd9" />
      <path d={`M ${e.x - 20} ${e.y - 10} q 14 -12 30 0 q -6 18 -22 16 Z`} fill="#4fae5a" />
      <circle cx={e.x} cy={e.y} r={44} fill="none" stroke="#9ad2ff" strokeWidth={2} opacity={0.6} />
    </Svg>
  );
};

export const LOCATIONS2: Record<string, React.FC<P>> = {
  city: City,
  globe: Globe,
  cafe: Cafe,
  crossroad: Crossroad,
  entrance: Entrance,
  london: London,
  brain: Brain,
  lab: Lab,
  grid: Grid,
  metro: Metro,
  yard: Yard,
  oldroom: OldRoom,
  telegraph: Telegraph,
  space: Space,
};
