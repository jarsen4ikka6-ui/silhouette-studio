// Библиотека локаций. Каждая — SVG 1920×1080, нарисованное кодом.
// Это базовая библиотека плагина. Новые локации под сценарии пишем в src/custom/locations.tsx —
// его обновление плагина не перезаписывает.
import React, { useId } from "react";
import { CUSTOM_LOCATIONS } from "./custom/locations";
import { LOCATIONS2 } from "./locations2";
import { LOCATIONS3 } from "./locations3";
import { clamp, rand } from "./util";

type P = { t: number; params: Record<string, number | string | boolean> };

const useUid = () => useId().replace(/[^a-zA-Z0-9]/g, "");

// Дождь за окном: косые штрихи внутри прямоугольника
const WindowRain: React.FC<{ t: number; x: number; y: number; w: number; h: number; n?: number }> = ({ t, x, y, w, h, n = 70 }) => (
  <g opacity={0.5}>
    {Array.from({ length: n }, (_, i) => {
      const sp = 900 + rand(i) * 500;
      const yy = y + ((rand(i + 3) * h + t * sp) % (h + 80)) - 40;
      const xx = x + rand(i + 9) * w;
      const len = 22 + rand(i + 1) * 26;
      return <line key={i} x1={xx} y1={yy} x2={xx - len * 0.22} y2={yy + len} stroke="#9fb4d8" strokeWidth={1.6} strokeLinecap="round" />;
    })}
  </g>
);

// Окна в домах: детерминированно горят тёплым, иногда холодным
const Windows: React.FC<{ x: number; y: number; cols: number; rows: number; cw: number; ch: number; gap: number; seed: number; on?: number }> = ({ x, y, cols, rows, cw, ch, gap, seed, on = 0.35 }) => (
  <g>
    {Array.from({ length: cols * rows }, (_, i) => {
      const r = rand(seed + i * 1.7);
      if (r > on) return null;
      const cx = x + (i % cols) * (cw + gap);
      const cy = y + Math.floor(i / cols) * (ch + gap);
      const warm = rand(seed + i * 3.1) > 0.18;
      return <rect key={i} x={cx} y={cy} width={cw} height={ch} rx={1.5} fill={warm ? "#f2c66d" : "#9ec3ff"} opacity={0.45 + r} />;
    })}
  </g>
);

// ── Спальня ночью ────────────────────────────────────────────────
export const Bedroom: React.FC<P> = ({ t, params }) => {
  const u = useUid();
  const lampOn = params.lamp === true || params.lamp === "on";
  const offAt = typeof params.lampOffAt === "number" ? params.lampOffAt : Infinity;
  const lamp = lampOn ? clamp(1 - (t - offAt) / 0.12) : 0;
  // время суток: night (по умолчанию) | dawn | morning
  const tod = String(params.tod ?? "night");
  const day = tod !== "night";
  const sky = tod === "dawn" ? ["#3b4a7a", "#f0a77a"] : tod === "morning" ? ["#7fb4e6", "#fff0d0"] : ["#141d31", "#2d3e5f"];
  const beam = day ? "#ffd9a0" : "#8fb0e8";
  const rainy = params.rain === undefined ? !day : params.rain === true;
  return (
    <svg viewBox="0 0 1920 1080" width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
      <defs>
        <linearGradient id={`wall${u}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1a2131" />
          <stop offset="1" stopColor="#273147" />
        </linearGradient>
        <linearGradient id={`floor${u}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#151b27" />
          <stop offset="1" stopColor="#0c1018" />
        </linearGradient>
        <linearGradient id={`sky${u}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={sky[0]} />
          <stop offset="1" stopColor={sky[1]} />
        </linearGradient>
        <linearGradient id={`cur${u}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#1c2335" />
          <stop offset="0.5" stopColor="#2a3450" />
          <stop offset="1" stopColor="#1c2335" />
        </linearGradient>
        <radialGradient id={`lamp${u}`}>
          <stop offset="0" stopColor="#ffd98a" stopOpacity={0.55} />
          <stop offset="0.4" stopColor="#f2b45d" stopOpacity={0.18} />
          <stop offset="1" stopColor="#f2b45d" stopOpacity={0} />
        </radialGradient>
        <radialGradient id={`moon${u}`}>
          <stop offset="0" stopColor="#dfe8ff" stopOpacity={0.5} />
          <stop offset="1" stopColor="#dfe8ff" stopOpacity={0} />
        </radialGradient>
        <linearGradient id={`beam${u}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={beam} stopOpacity={day ? 0.22 : 0.1} />
          <stop offset="1" stopColor={beam} stopOpacity={0} />
        </linearGradient>
        <filter id={`soft${u}`}>
          <feGaussianBlur stdDeviation={3} />
        </filter>
        <clipPath id={`glass${u}`}>
          <rect x={330} y={190} width={420} height={420} />
        </clipPath>
      </defs>
      <rect width={1920} height={800} fill={`url(#wall${u})`} />
      <rect y={800} width={1920} height={280} fill={`url(#floor${u})`} />
      <rect y={792} width={1920} height={14} fill="#10141d" />
      {/* окно */}
      <g clipPath={`url(#glass${u})`}>
        <rect x={330} y={190} width={420} height={420} fill={`url(#sky${u})`} />
        {day ? (
          <circle cx={600} cy={tod === "dawn" ? 470 : 280} r={tod === "dawn" ? 60 : 46} fill="#fff4d8" opacity={0.9} />
        ) : (
          <>
            <circle cx={650} cy={270} r={120} fill={`url(#moon${u})`} />
            <circle cx={650} cy={270} r={26} fill="#e6edff" opacity={0.85} />
          </>
        )}
        <g filter={`url(#soft${u})`}>
          <rect x={320} y={470} width={110} height={160} fill="#111827" />
          <rect x={440} y={420} width={90} height={210} fill="#0f1522" />
          <rect x={545} y={500} width={120} height={130} fill="#121a2a" />
          <rect x={670} y={450} width={90} height={180} fill="#0e1420" />
          <Windows x={338} y={485} cols={4} rows={5} cw={14} ch={10} gap={10} seed={3} />
          <Windows x={452} y={436} cols={3} rows={7} cw={14} ch={10} gap={10} seed={11} />
          <Windows x={556} y={514} cols={4} rows={4} cw={14} ch={10} gap={10} seed={23} />
          <Windows x={680} y={466} cols={3} rows={6} cw={14} ch={10} gap={10} seed={41} />
        </g>
        {rainy ? <WindowRain t={t} x={330} y={190} w={420} h={420} /> : null}
      </g>
      <rect x={312} y={172} width={456} height={456} fill="none" stroke="#0f131d" strokeWidth={22} />
      <rect x={532} y={190} width={16} height={420} fill="#0f131d" />
      <rect x={330} y={402} width={420} height={14} fill="#0f131d" />
      <rect x={292} y={620} width={496} height={22} rx={4} fill="#121722" />
      {/* шторы */}
      <path d="M 200 120 L 330 120 Q 312 400 345 700 L 210 700 Q 236 400 200 120 Z" fill={`url(#cur${u})`} />
      <path d="M 750 120 L 880 120 Q 846 400 870 700 L 735 700 Q 768 400 750 120 Z" fill={`url(#cur${u})`} />
      <rect x={170} y={108} width={740} height={14} rx={7} fill="#0e121b" />
      {/* лунный свет на полу */}
      <polygon points="330,806 750,806 980,1080 420,1080" fill={`url(#beam${u})`} />
      {/* картина */}
      <rect x={1180} y={250} width={220} height={160} rx={6} fill="#1a2233" stroke="#121826" strokeWidth={10} />
      <path d="M 1196 396 L 1260 330 L 1300 370 L 1340 320 L 1384 396 Z" fill="#232d43" />
      {/* тумбочка и лампа */}
      <rect x={860} y={760} width={160} height={150} rx={6} fill="#141925" />
      <rect x={872} y={800} width={136} height={6} fill="#0f131c" />
      <rect x={932} y={712} width={16} height={50} fill="#1d2433" />
      <ellipse cx={940} cy={762} rx={36} ry={7} fill="#1d2433" />
      <path d="M 900 650 L 980 650 L 1000 714 L 880 714 Z" fill={lamp > 0 ? "#f0c77a" : "#262e40"} opacity={lamp > 0 ? 0.6 + 0.4 * lamp : 1} />
      {lamp > 0 ? <circle cx={940} cy={700} r={520} fill={`url(#lamp${u})`} opacity={lamp} style={{ mixBlendMode: "screen" }} /> : null}
      {/* кровать */}
      <rect x={1750} y={560} width={60} height={350} rx={8} fill="#121722" />
      <polygon points="1040,760 1760,760 1800,840 1010,840" fill="#33405f" />
      <path d="M 1100 770 Q 1300 800 1500 772 Q 1620 790 1740 776" fill="none" stroke="#2a3552" strokeWidth={6} />
      <rect x={1590} y={722} width={150} height={52} rx={22} fill="#4a5878" />
      <rect x={1010} y={840} width={790} height={46} fill="#232c44" />
      <rect x={1010} y={886} width={790} height={24} fill="#0e1118" />
      {/* утренний свет заливает комнату */}
      {day ? <rect width={1920} height={1080} fill={tod === "dawn" ? "#ff9a6a" : "#ffe2b0"} opacity={tod === "dawn" ? 0.14 : 0.24} style={{ mixBlendMode: "screen" }} /> : null}
    </svg>
  );
};

// ── Кухня утром ──────────────────────────────────────────────────
export const Kitchen: React.FC<P> = ({ t, params }) => {
  const u = useUid();
  const xs = typeof params.crosses === "number" ? params.crosses : 9;
  const h = typeof params.hour === "number" ? params.hour : 7.8;
  return (
    <svg viewBox="0 0 1920 1080" width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
      <defs>
        <linearGradient id={`kw${u}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7d8a9a" />
          <stop offset="1" stopColor="#95a2b1" />
        </linearGradient>
        <linearGradient id={`ks${u}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f3dfb6" />
          <stop offset="1" stopColor="#b9d0e4" />
        </linearGradient>
        <linearGradient id={`kb${u}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff6dc" stopOpacity={0.22} />
          <stop offset="1" stopColor="#fff6dc" stopOpacity={0} />
        </linearGradient>
        <linearGradient id={`kf${u}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#b4bec9" />
          <stop offset="1" stopColor="#d3dae2" />
        </linearGradient>
        <linearGradient id={`kfl${u}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#525b69" />
          <stop offset="1" stopColor="#3a414d" />
        </linearGradient>
      </defs>
      <rect width={1920} height={920} fill={`url(#kw${u})`} />
      <rect y={910} width={1920} height={170} fill={`url(#kfl${u})`} />
      {/* окно */}
      <rect x={150} y={190} width={420} height={330} fill={`url(#ks${u})`} />
      <circle cx={470} cy={260} r={50} fill="#fff3d4" opacity={0.7} />
      <rect x={140} y={180} width={440} height={350} fill="none" stroke="#5f6a79" strokeWidth={18} />
      <rect x={352} y={190} width={14} height={330} fill="#5f6a79" />
      <rect x={120} y={520} width={480} height={20} rx={4} fill="#6a7584" />
      <polygon points="150,190 570,190 1250,1080 300,1080" fill={`url(#kb${u})`} />
      {/* часы на стене */}
      <circle cx={1400} cy={300} r={50} fill="#e8ecef" stroke="#5f6a79" strokeWidth={8} />
      {(() => {
        const mAng = ((h % 1) * 360 * Math.PI) / 180;
        const hAng = (((h % 12) / 12) * 360 * Math.PI) / 180;
        return (
          <g stroke="#2b313b" strokeLinecap="round">
            <line x1={1400} y1={300} x2={1400 + Math.sin(hAng) * 26} y2={300 - Math.cos(hAng) * 26} strokeWidth={6} />
            <line x1={1400} y1={300} x2={1400 + Math.sin(mAng) * 36} y2={300 - Math.cos(mAng) * 36} strokeWidth={4} />
          </g>
        );
      })()}
      {/* верхние шкафы */}
      <rect x={650} y={200} width={680} height={210} rx={6} fill="#6a7787" />
      {[0, 1, 2, 3].map((i) => (
        <g key={i}>
          <rect x={662 + i * 168} y={212} width={156} height={186} rx={4} fill="#717e8f" />
          <rect x={732 + i * 168} y={370} width={16} height={6} rx={3} fill="#4a5462" />
        </g>
      ))}
      {/* плитка */}
      <rect x={620} y={530} width={740} height={130} fill="#8794a4" />
      {Array.from({ length: 13 }, (_, i) => <line key={i} x1={620 + i * 62} y1={530} x2={620 + i * 62} y2={660} stroke="#7c8999" strokeWidth={2} />)}
      <line x1={620} y1={595} x2={1360} y2={595} stroke="#7c8999" strokeWidth={2} />
      {/* столешница и тумбы */}
      <rect x={600} y={650} width={780} height={34} rx={4} fill="#3e4652" />
      <rect x={616} y={684} width={748} height={230} fill="#5c6777" />
      {[0, 1, 2, 3].map((i) => (
        <g key={i}>
          <rect x={628 + i * 184} y={698} width={172} height={200} rx={4} fill="#636e7f" />
          <rect x={700 + i * 184} y={712} width={28} height={6} rx={3} fill="#454e5b" />
        </g>
      ))}
      <rect x={720} y={606} width={70} height={46} rx={6} fill="#2f3640" />
      <rect x={1180} y={590} width={44} height={62} rx={8} fill="#c55a43" opacity={0.8} />
      {/* холодильник с календарём */}
      <rect x={1470} y={220} width={320} height={694} rx={18} fill={`url(#kf${u})`} />
      <line x1={1470} y1={470} x2={1790} y2={470} stroke="#9aa5b1" strokeWidth={4} />
      <rect x={1500} y={300} width={12} height={130} rx={6} fill="#8d98a5" />
      <rect x={1500} y={510} width={12} height={180} rx={6} fill="#8d98a5" />
      <g transform="rotate(-2 1640 640)">
        <rect x={1548} y={530} width={190} height={220} rx={4} fill="#f6f4ef" />
        <rect x={1548} y={530} width={190} height={34} rx={4} fill="#c94b3c" />
        <circle cx={1643} cy={528} r={9} fill="#3d7bd9" />
        {Array.from({ length: 28 }, (_, i) => {
          const cx = 1562 + (i % 7) * 25.5;
          const cy = 580 + Math.floor(i / 7) * 40;
          return (
            <g key={i}>
              <rect x={cx} y={cy} width={20} height={30} fill="none" stroke="#d5d1c8" strokeWidth={1.5} />
              {i < xs ? (
                <g stroke="#d33a2c" strokeWidth={3.5} strokeLinecap="round">
                  <line x1={cx + 3} y1={cy + 5} x2={cx + 17} y2={cy + 25} />
                  <line x1={cx + 17} y1={cy + 5} x2={cx + 3} y2={cy + 25} />
                </g>
              ) : null}
            </g>
          );
        })}
      </g>
      <rect x={1700} y={330} width={46} height={46} rx={8} fill="#f2c66d" transform="rotate(8 1723 353)" />
      {/* пылинки в луче */}
      {Array.from({ length: 24 }, (_, i) => {
        const x = 300 + rand(i) * 700 + Math.sin(t * 0.4 + i) * 20;
        const y = 300 + ((rand(i + 5) * 600 + t * 12) % 600);
        return <circle key={i} cx={x} cy={y} r={1.5 + rand(i + 2) * 2} fill="#fff6dc" opacity={0.35} />;
      })}
    </svg>
  );
};

// ── Улица ночью под дождём ────────────────────────────────────────
export const Street: React.FC<P> = ({ t }) => {
  const u = useUid();
  const lamps = [260, 860, 1460, 2060];
  return (
    <svg viewBox="0 0 1920 1080" width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
      <defs>
        <linearGradient id={`ss${u}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0c111d" />
          <stop offset="1" stopColor="#25324f" />
        </linearGradient>
        <linearGradient id={`fog${u}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8aa0c8" stopOpacity={0} />
          <stop offset="0.6" stopColor="#8aa0c8" stopOpacity={0.16} />
          <stop offset="1" stopColor="#8aa0c8" stopOpacity={0} />
        </linearGradient>
        <radialGradient id={`bloom${u}`}>
          <stop offset="0" stopColor="#fff1c4" stopOpacity={0.9} />
          <stop offset="0.15" stopColor="#ffd98a" stopOpacity={0.45} />
          <stop offset="1" stopColor="#ffd98a" stopOpacity={0} />
        </radialGradient>
        <linearGradient id={`cone${u}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffd98a" stopOpacity={0.2} />
          <stop offset="1" stopColor="#ffd98a" stopOpacity={0.02} />
        </linearGradient>
        <linearGradient id={`refl${u}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffd98a" stopOpacity={0.35} />
          <stop offset="1" stopColor="#ffd98a" stopOpacity={0} />
        </linearGradient>
        <radialGradient id={`pool${u}`}>
          <stop offset="0" stopColor="#ffd98a" stopOpacity={0.28} />
          <stop offset="1" stopColor="#ffd98a" stopOpacity={0} />
        </radialGradient>
        <filter id={`fb${u}`}>
          <feGaussianBlur stdDeviation={4} />
        </filter>
        <filter id={`rb${u}`}>
          <feGaussianBlur stdDeviation={10} />
        </filter>
      </defs>
      <rect width={1920} height={1080} fill={`url(#ss${u})`} />
      {/* дальние дома в тумане */}
      <g fill="#1c2742" filter={`url(#fb${u})`}>
        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <rect key={i} x={i * 230 - 40} y={360 + rand(i) * 140} width={200} height={500} />
        ))}
      </g>
      <rect y={420} width={1920} height={360} fill={`url(#fog${u})`} />
      {/* ближние дома */}
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const x = i * 340 - 60;
        const y = 250 + rand(i + 20) * 160;
        return (
          <g key={i}>
            <rect x={x} y={y} width={300} height={820 - y} fill="#111827" />
            <Windows x={x + 28} y={y + 30} cols={6} rows={Math.floor((760 - y) / 44)} cw={22} ch={26} gap={20} seed={i * 17 + 5} on={0.32} />
          </g>
        );
      })}
      {/* тротуар и дорога */}
      <rect y={820} width={1920} height={80} fill="#1a2131" />
      <rect y={896} width={1920} height={10} fill="#2a3346" />
      <rect y={906} width={1920} height={174} fill="#0f141e" />
      {Array.from({ length: 7 }, (_, i) => (
        <rect key={i} x={i * 320 + 40} y={1000} width={150} height={10} rx={3} fill="#3a4152" opacity={0.6} />
      ))}
      {/* фонари */}
      {lamps.map((x, i) => (
        <g key={i}>
          <polygon points={`${x - 30},372 ${x + 30},372 ${x + 200},880 ${x - 200},880`} fill={`url(#cone${u})`} />
          <ellipse cx={x} cy={872} rx={230} ry={36} fill={`url(#pool${u})`} />
          <rect x={x - 7} y={360} width={14} height={500} fill="#090c12" />
          <rect x={x - 26} y={350} width={52} height={22} rx={6} fill="#090c12" />
          <circle cx={x} cy={376} r={240} fill={`url(#bloom${u})`} opacity={0.85 + Math.sin(t * 2 + i) * 0.04} style={{ mixBlendMode: "screen" }} />
          <rect x={x - 14} y={910} width={28} height={170} fill={`url(#refl${u})`} filter={`url(#rb${u})`} />
        </g>
      ))}
    </svg>
  );
};

// ── Луг днём: яркий финал ─────────────────────────────────────────
export const Meadow: React.FC<P> = ({ t }) => {
  const u = useUid();
  return (
    <svg viewBox="0 0 1920 1080" width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
      <defs>
        <linearGradient id={`ms${u}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4b9be8" />
          <stop offset="0.7" stopColor="#a9d8ff" />
          <stop offset="1" stopColor="#e6f4ff" />
        </linearGradient>
        <radialGradient id={`sun${u}`}>
          <stop offset="0" stopColor="#fffbe6" stopOpacity={1} />
          <stop offset="0.12" stopColor="#fff2b8" stopOpacity={0.8} />
          <stop offset="1" stopColor="#fff2b8" stopOpacity={0} />
        </radialGradient>
        <linearGradient id={`mh${u}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5cbd5f" />
          <stop offset="1" stopColor="#2f8a3e" />
        </linearGradient>
        <filter id={`mb${u}`}>
          <feGaussianBlur stdDeviation={6} />
        </filter>
      </defs>
      <rect width={1920} height={1080} fill={`url(#ms${u})`} />
      <circle cx={1500} cy={230} r={420} fill={`url(#sun${u})`} />
      <g fill="#fff" opacity={0.85} filter={`url(#mb${u})`}>
        {[0, 1, 2].map((i) => {
          const x = ((200 + i * 620 + t * 14) % 2300) - 200;
          const y = 170 + i * 60;
          return (
            <g key={i}>
              <ellipse cx={x} cy={y} rx={130} ry={34} />
              <ellipse cx={x + 60} cy={y - 24} rx={80} ry={36} />
              <ellipse cx={x - 50} cy={y - 14} rx={60} ry={28} />
            </g>
          );
        })}
      </g>
      <path d="M 0 640 Q 300 560 640 610 T 1300 590 T 1920 620 L 1920 1080 L 0 1080 Z" fill="#9fd68f" opacity={0.9} />
      <path d="M 0 720 Q 420 620 860 690 T 1920 680 L 1920 1080 L 0 1080 Z" fill="#74c06a" />
      {/* одинокое дерево */}
      <rect x={1488} y={560} width={22} height={140} fill="#3d5a2c" />
      <circle cx={1500} cy={540} r={70} fill="#3f8a3c" />
      <circle cx={1450} cy={570} r={50} fill="#3f8a3c" />
      <circle cx={1552} cy={572} r={52} fill="#3a8037" />
      <path d="M -50 1080 L -50 880 Q 500 760 960 780 Q 1420 760 1970 880 L 1970 1080 Z" fill={`url(#mh${u})`} />
      {/* трава и цветы по линии холма */}
      {Array.from({ length: 90 }, (_, i) => {
        const x = (i / 90) * 1960 - 20;
        const k = (x - 960) / 1010;
        const y = 780 + k * k * 100 + 8;
        const sway = Math.sin(t * 2 + i * 0.7) * 3;
        return <path key={i} d={`M ${x} ${y + 8} q ${2 + sway} -14 ${4 + sway * 2} -24`} stroke="#2f8a3e" strokeWidth={4} fill="none" strokeLinecap="round" />;
      })}
      {Array.from({ length: 40 }, (_, i) => (
        <circle key={i} cx={rand(i) * 1920} cy={860 + rand(i + 4) * 200} r={4 + rand(i + 1) * 3} fill={rand(i + 8) > 0.5 ? "#fff7c2" : "#ffffff"} opacity={0.9} />
      ))}
      {/* золотые пылинки */}
      {Array.from({ length: 30 }, (_, i) => {
        const x = rand(i + 30) * 1920 + Math.sin(t * 0.6 + i) * 30;
        const y = 300 + ((rand(i + 50) * 600 - t * 18) % 600 + 600) % 600;
        return <circle key={i} cx={x} cy={y} r={2 + rand(i) * 2} fill="#fff4c8" opacity={0.6} />;
      })}
    </svg>
  );
};

export const LOCATIONS: Record<string, React.FC<P>> = {
  bedroom: Bedroom,
  kitchen: Kitchen,
  street: Street,
  meadow: Meadow,
  ...LOCATIONS2,
  ...LOCATIONS3,
  ...CUSTOM_LOCATIONS,
};
