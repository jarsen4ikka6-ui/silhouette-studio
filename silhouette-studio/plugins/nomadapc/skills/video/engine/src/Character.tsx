// Персонаж в стиле Awaken: чёрная голова с белыми глазами и бровями, цветная куртка,
// тонкие чёрные руки и ноги, тёплая кромка света по краю. Начало координат — между ступнями.
import React, { useId } from "react";
import type { Actor, Arms, Legs, Mood } from "./types";
import { clamp, lerp, rand } from "./util";

export const BODY = "#0d0d10";
export const HEIGHT = 390; // рост в пикселях при scale 1 (до макушки)
export const HEAD_R = 46;
export const HEAD_Y = -HEIGHT + HEAD_R;
export const SIT_DROP = 75; // насколько опускается таз, когда персонаж сидит

const SHOULDER_Y = -286;
const HIP_Y = -170;
const UPPER_ARM = 66;
const FOREARM = 62;
const THIGH = 86;
const SHIN = 84;
const LIMB = 9; // толщина рук и ног
const DEFAULT_RIM = "#f6a95c";

type Limb = [number, number]; // углы плеча и предплечья (бедра и голени), градусы от «вниз», + вправо
type PoseA = { la: Limb; ra: Limb; ll: Limb; rl: Limb; bob: number; tilt: number; sit: number };
// лицо: веко сверху (0..1), подъём бровей, наклон бровей (+ домиком), улыбка (+ вверх, − грусть), рот «о», размер глаз
type Face = { lid: number; brow: number; browTilt: number; smile: number; o: number; size: number };

const armPose = (a: Arms, t: number): Pick<PoseA, "la" | "ra"> => {
  const b = Math.sin(t * 1.7) * 1.6;
  switch (a) {
    case "phone":
      return { la: [-14, 158], ra: [14, -158] };
    case "mug":
      return { la: [-7 - b, -4], ra: [20, -125 + b] };
    case "reach":
      return { la: [-62, -84], ra: [7 + b, 4] };
    case "cheer": {
      const w = Math.sin(t * 9) * 7;
      return { la: [-122 + w, -152 + w], ra: [122 - w, 152 - w] };
    }
    case "hips":
      return { la: [-45, 42], ra: [45, -42] };
    case "think":
      return { la: [-7 - b, -4], ra: [10, -172] };
    case "pocket": {
      const pat = Math.max(0, Math.sin(t * 7)) * 8;
      return { la: [-7 - b, -4], ra: [20 + pat * 0.4, -14 + pat] };
    }
    case "ear":
      return { la: [-7 - b, -4], ra: [60, -165] };
    case "write": {
      const w = Math.sin(t * 11) * 4;
      return { la: [-10, 39], ra: [10 + w * 0.5, -39 + w] };
    }
    case "chalk": {
      // пишет мелом на доске: рука поднята вперёд и ходит
      const w = Math.sin(t * 6) * 9;
      return { la: [-7 - b, -4], ra: [118 + w * 0.3, 128 + w] };
    }
    case "point":
      return { la: [-7 - b, -4], ra: [108, 102] };
    case "shrug":
      return { la: [-38, -138], ra: [38, 138] };
    case "wave": {
      const w = Math.sin(t * 8) * 16;
      return { la: [-7 - b, -4], ra: [118, 168 + w] };
    }
    case "hold":
      // держит что-то перед собой двумя руками (тарелку, коробку)
      return { la: [-18, 70], ra: [18, -70] };
    case "fold":
      return { la: [-16, 96], ra: [16, -96] };
    case "walk": {
      const s = Math.sin(t * Math.PI * 2) * 20;
      return { la: [-6 + s, -2 + s * 1.4], ra: [6 - s, 2 - s * 1.4] };
    }
    default:
      return { la: [-6 - b, -3 - b], ra: [6 + b, 3 + b] };
  }
};

const legPose = (l: Legs, t: number, dir: number): Pick<PoseA, "ll" | "rl" | "bob" | "sit"> => {
  if (l === "walk" || l === "run") {
    const speed = l === "run" ? 1.6 : 1;
    const p = t * Math.PI * 2 * speed;
    const amp = l === "run" ? 34 : 22;
    const s = Math.sin(p) * amp;
    const d = dir === 0 ? 1 : dir;
    const kl = Math.max(0, -Math.sin(p)) * 22 * d;
    const kr = Math.max(0, Math.sin(p)) * 22 * d;
    return { ll: [s * d, s * d - kl], rl: [-s * d, -s * d - kr], bob: -Math.abs(Math.cos(p)) * (l === "run" ? 9 : 5), sit: 0 };
  }
  if (l === "sit") return { ll: [-2, -2], rl: [2, 2], bob: 0, sit: 1 };
  return { ll: [-2, -2], rl: [2, 2], bob: 0, sit: 0 };
};

const FACES: Record<Mood, Face> = {
  neutral: { lid: 0, brow: 0, browTilt: 0, smile: 0.4, o: 0, size: 1 },
  happy: { lid: 0, brow: 3, browTilt: -4, smile: 1, o: 0, size: 1 },
  sad: { lid: 0.12, brow: 1, browTilt: 20, smile: -0.8, o: 0, size: 0.96 },
  worried: { lid: 0, brow: 2, browTilt: 18, smile: -0.2, o: 0, size: 1.05 },
  tired: { lid: 0.48, brow: -2, browTilt: 0, smile: 0, o: 0, size: 1 },
  angry: { lid: 0.18, brow: -2, browTilt: -24, smile: -0.4, o: 0, size: 1 },
  surprised: { lid: 0, brow: 7, browTilt: 4, smile: 0, o: 1, size: 1.18 },
  smug: { lid: 0.4, brow: 1, browTilt: -6, smile: 0.9, o: 0, size: 1 },
  sleep: { lid: 1, brow: -2, browTilt: 0, smile: 0, o: 0, size: 1 },
};

const MOOD_HEAD: Record<Mood, number> = { neutral: 0, tired: 5, sad: 7, worried: 2, happy: -2, angry: -2, surprised: -3, smug: -1, sleep: 8 };

const rad = (d: number) => (d * Math.PI) / 180;
const step = (x: number, y: number, ang: number, len: number): [number, number] => [x + Math.sin(rad(ang)) * len, y + Math.cos(rad(ang)) * len];
const mixLimb = (a: Limb, b: Limb, k: number): Limb => [lerp(a[0], b[0], k), lerp(a[1], b[1], k)];

const rgb = (hex: string) => {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
export const darken = (hex: string, k: number) => {
  const [r, g, b] = rgb(hex);
  const f = (v: number) => Math.round(v * (1 - k));
  return `rgb(${f(r)},${f(g)},${f(b)})`;
};
export const lighten = (hex: string, k: number) => {
  const [r, g, b] = rgb(hex);
  const f = (v: number) => Math.round(v + (255 - v) * k);
  return `rgb(${f(r)},${f(g)},${f(b)})`;
};

// Поза в момент t с плавным переходом между ключами
const resolve = (actor: Actor, t: number) => {
  const dirOf = (f?: string) => (f === "left" ? -1 : f === "right" ? 1 : 0);
  const base = { at: 0, arms: actor.arms ?? "rest", legs: actor.legs ?? "stand", mood: actor.mood ?? "neutral", lookX: actor.lookX ?? dirOf(actor.facing) * 0.6, lookY: actor.lookY ?? 0, facing: actor.facing ?? "front" };
  const keys = [base, ...(actor.keys ?? [])];
  const filled: typeof base[] = [];
  keys.forEach((k, i) => filled.push({ ...(i ? filled[i - 1] : base), ...k } as typeof base));
  let i = 0;
  while (i + 1 < filled.length && t >= filled[i + 1].at) i++;
  const cur = filled[i];
  const prev = filled[Math.max(0, i - 1)];
  const BLEND = 0.4;
  const k = i === 0 ? 1 : clamp((t - cur.at) / BLEND);
  const kk = k * k * (3 - 2 * k);

  const dir = dirOf(cur.facing);
  // в профиль влево руки зеркалятся, чтобы жесты (указать, помахать) шли вперёд
  const mirror = (a: Pick<PoseA, "la" | "ra">) => ({ la: [-a.ra[0], -a.ra[1]] as Limb, ra: [-a.la[0], -a.la[1]] as Limb });
  const pa = (x: typeof base) => {
    const arm = armPose(x.arms, t);
    return { ...(dirOf(x.facing) < 0 ? mirror(arm) : arm), ...legPose(x.legs, t, dirOf(x.facing)) };
  };
  const A = pa(prev);
  const B = pa(cur);
  const pose: PoseA = {
    la: mixLimb(A.la, B.la, kk),
    ra: mixLimb(A.ra, B.ra, kk),
    ll: mixLimb(A.ll, B.ll, kk),
    rl: mixLimb(A.rl, B.rl, kk),
    bob: lerp(A.bob, B.bob, kk),
    sit: lerp(A.sit, B.sit, kk),
    tilt: lerp(MOOD_HEAD[prev.mood] ?? 0, MOOD_HEAD[cur.mood] ?? 0, kk),
  };
  const fa = FACES[prev.mood] ?? FACES.neutral;
  const fb = FACES[cur.mood] ?? FACES.neutral;
  const face = Object.fromEntries(Object.keys(fa).map((key) => [key, lerp(fa[key as keyof Face], fb[key as keyof Face], kk)])) as Face;
  const look = { x: lerp(prev.lookX, cur.lookX, kk), y: lerp(prev.lookY, cur.lookY, kk) };
  return { pose, face, look, dir, arms: cur.arms, prevArms: prev.arms, k: kk, mood: cur.mood };
};

// Моргание: раз в 3–4 секунды на 4 кадра
const blink = (t: number, seed: number) => {
  const period = 3.4 + rand(seed) * 1.2;
  const ph = (t + rand(seed + 7) * period) % period;
  return ph < 0.13 ? Math.sin((ph / 0.13) * Math.PI) : 0;
};

// Длина одежды: где кончается низ (y) и насколько расширяется книзу
const CUT: Record<string, { bottom: number; flare: number }> = {
  jacket: { bottom: -158, flare: 4 },
  hoodie: { bottom: -160, flare: 3 },
  tee: { bottom: -168, flare: 2 },
  none: { bottom: -165, flare: 2 },
  coat: { bottom: -112, flare: 8 },
  raincoat: { bottom: -112, flare: 10 },
  dress: { bottom: -78, flare: 34 },
  robe: { bottom: -8, flare: 36 },
};

export const Character: React.FC<{ actor: Actor; t: number; x: number; y: number }> = ({ actor, t, x, y }) => {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const s = actor.scale ?? 1;
  const look = actor.look ?? {};
  const { pose, face, look: gaze, dir, arms, prevArms, k, mood } = resolve(actor, t);
  const top = look.top ?? "jacket";
  const cloth = top === "none" ? "#1b1b22" : look.color ?? "#2f9e94";
  const pants = look.pants ?? BODY;
  const cut = CUT[top] ?? CUT.jacket;
  const rim = actor.rim === "none" || actor.rim === "" ? null : actor.rim ?? DEFAULT_RIM;
  const rimS = actor.rimSide === "right" ? 1 : -1;
  const side = dir !== 0;

  const drop = pose.sit * SIT_DROP;
  const breathe = pose.sit > 0.5 || pose.bob !== 0 ? 0 : Math.sin(t * 2.1 + x * 0.01) * 1.2;
  const yb = pose.bob + drop;
  const hipY = HIP_Y + yb;
  const shY = SHOULDER_Y + yb + breathe;
  const headX = Math.sin(rad(pose.tilt)) * 5 + dir * 5;
  const headY = HEAD_Y + yb + breathe * 1.3 + pose.tilt * 0.5;
  const bottom = Math.min(cut.bottom + (top === "robe" || top === "dress" ? 0 : drop), look.skirt ? -60 : 0);
  const halfTop = side ? 22 : 30;
  const halfBot = (side ? 24 : 31) + cut.flare + (look.skirt ? 26 : 0);
  const sx0 = side ? dir * 3 : 0; // в профиль тело чуть смещено вперёд

  // ноги
  const legs = ([-1, 1] as const).map((sd) => {
    const L = sd < 0 ? pose.ll : pose.rl;
    const hx = side ? sd * 4 : sd * 12;
    if (pose.sit > 0.5) {
      if (side) {
        const knee: [number, number] = [hx + dir * THIGH * 0.9, hipY + 6];
        return { hip: [hx, hipY] as [number, number], knee, foot: [knee[0] - dir * 4, 0] as [number, number] };
      }
      const knee: [number, number] = [sd * 22, hipY + 22];
      return { hip: [hx, hipY] as [number, number], knee, foot: [sd * 20, 0] as [number, number] };
    }
    const knee = step(hx, hipY, L[0], THIGH);
    const foot = step(knee[0], knee[1], L[1], SHIN);
    return { hip: [hx, hipY] as [number, number], knee, foot };
  });

  // руки
  const armsPts = ([-1, 1] as const).map((sd) => {
    const A = sd < 0 ? pose.la : pose.ra;
    const sx = side ? sx0 + sd * 6 : sd * (halfTop - 4);
    const sy = shY + 12;
    const elbow = step(sx, sy, A[0], UPPER_ARM);
    const hand = step(elbow[0], elbow[1], A[1], FOREARM);
    return { sh: [sx, sy] as [number, number], elbow, hand };
  });

  const showPhone = arms === "phone" && k > 0.6;
  const showPhoneOut = prevArms === "phone" && arms !== "phone" && k < 0.6;
  const phoneAt: [number, number] = showPhoneOut ? armsPts[0].hand : [(armsPts[0].hand[0] + armsPts[1].hand[0]) / 2, (armsPts[0].hand[1] + armsPts[1].hand[1]) / 2 - 4];
  const showMug = arms === "mug";

  const tx = sx0;
  const torso = `M ${tx - halfTop + 8} ${shY - 6} Q ${tx} ${shY - 14} ${tx + halfTop - 8} ${shY - 6} Q ${tx + halfTop + 2} ${shY - 3} ${tx + halfTop} ${shY + 16} L ${tx + halfBot} ${bottom - 10} Q ${tx + halfBot} ${bottom} ${tx + halfBot - 10} ${bottom} L ${tx - halfBot + 10} ${bottom} Q ${tx - halfBot} ${bottom} ${tx - halfBot} ${bottom - 10} L ${tx - halfTop} ${shY + 16} Q ${tx - halfTop - 2} ${shY - 3} ${tx - halfTop + 8} ${shY - 6} Z`;
  const sleeveC = top === "none" ? cloth : darken(cloth, 0.08);
  const sleeveLen = top === "tee" ? 0.45 : 1;

  // Волосы и шапки — в координатах головы (центр головы = 0,0)
  const back = -(dir || 1); // где затылок
  const hairColor = look.hairColor ?? (look.hair === "curls" ? "#eeeae2" : BODY);
  const HairBack: React.FC<{ c: (v: string) => string }> = ({ c }) => (
    <g transform={`translate(${headX} ${headY})`}>
      {look.hair === "ponytail" ? <ellipse cx={back * 44} cy={-6} rx={15} ry={27} transform={`rotate(${back * -26} ${back * 44} -6)`} fill={c(hairColor)} /> : null}
      {look.hair === "bun" ? <circle cx={back * 22 + (dir ? 0 : 20)} cy={-HEAD_R - 2} r={15} fill={c(hairColor)} /> : null}
      {look.hair === "long" ? <path d={`M ${-HEAD_R} -6 Q ${-HEAD_R - 6} 56 ${-HEAD_R + 10} 66 L ${HEAD_R - 10} 66 Q ${HEAD_R + 6} 56 ${HEAD_R} -6 Z`} fill={c(hairColor)} /> : null}
      {look.hair === "curls"
        ? Array.from({ length: 11 }, (_, i) => {
            const a = rad(-175 + i * 17);
            return <circle key={i} cx={Math.cos(a) * (HEAD_R + 1)} cy={Math.sin(a) * (HEAD_R + 1) - 2} r={11 + rand(i) * 3} fill={c(hairColor)} />;
          })
        : null}
      {top === "hoodie" || top === "raincoat" ? <ellipse cx={back * 8} cy={30} rx={HEAD_R * 0.95} ry={HEAD_R * 0.6} fill={c(darken(cloth, 0.2))} /> : null}
    </g>
  );
  const HairFront: React.FC<{ c: (v: string) => string }> = ({ c }) => {
    const hc = look.hatColor ?? "#1d2533";
    return (
      <g transform={`translate(${headX} ${headY})`}>
        {look.hair === "headband" ? <path d={`M ${-HEAD_R + 3} -19 Q 0 -34 ${HEAD_R - 3} -19 L ${HEAD_R - 1} -10 Q 0 -25 ${-HEAD_R + 1} -10 Z`} fill={c(look.hairColor ?? "#e8e8e8")} /> : null}
        {look.hair === "scarf" ? (
          <path d={`M ${-HEAD_R - 4} 12 A ${HEAD_R + 4} ${HEAD_R + 4} 0 0 1 ${HEAD_R + 4} 12 L ${HEAD_R - 6} 18 Q 0 -40 ${-HEAD_R + 6} 18 Z`} fill={c(look.hairColor ?? "#8e3b46")} />
        ) : null}
        {look.hat === "cap" ? (
          <g>
            <path d={`M ${-HEAD_R - 1} -8 A ${HEAD_R + 1} ${HEAD_R + 1} 0 0 1 ${HEAD_R + 1} -8 Z`} fill={c(hc)} />
            <path d={`M ${-HEAD_R} -8 Q 0 -18 ${HEAD_R} -8`} fill="none" stroke={c(darken(hc, 0.25))} strokeWidth={3} />
            <rect x={(dir || 1) > 0 ? HEAD_R - 14 : -HEAD_R - 26} y={-11} width={40} height={8} rx={4} fill={c(darken(hc, 0.12))} />
          </g>
        ) : null}
        {look.hat === "crown" ? (
          <path d={`M -30 ${-HEAD_R + 6} L -34 ${-HEAD_R - 26} L -17 ${-HEAD_R - 10} L 0 ${-HEAD_R - 32} L 17 ${-HEAD_R - 10} L 34 ${-HEAD_R - 26} L 30 ${-HEAD_R + 6} Z`} fill={c(look.hatColor ?? "#f1c24b")} />
        ) : null}
        {look.hat === "beanie" ? <path d={`M ${-HEAD_R - 2} -4 A ${HEAD_R + 2} ${HEAD_R + 4} 0 0 1 ${HEAD_R + 2} -4 Z`} fill={c(hc)} /> : null}
      </g>
    );
  };

  // Силуэт целиком. mono — залить всё одним цветом (для кромки света и свечения)
  const Shape: React.FC<{ mono?: string }> = ({ mono }) => {
    const c = (v: string) => mono ?? v;
    return (
      <g>
        <HairBack c={c} />
        {legs.map((l, i) => (
          <g key={`l${i}`}>
            <polyline points={`${l.hip[0]},${l.hip[1]} ${l.knee[0]},${l.knee[1]} ${l.foot[0]},${l.foot[1]}`} fill="none" stroke={c(pants)} strokeWidth={pants === BODY ? LIMB : LIMB + 3} strokeLinecap="round" strokeLinejoin="round" />
            <ellipse cx={l.foot[0] + (dir || (i ? 1 : -1)) * 6} cy={l.foot[1] - 3} rx={12} ry={6.5} fill={c(look.shoes ?? BODY)} />
          </g>
        ))}
        <path d={torso} fill={mono ?? `url(#cl${uid})`} />
        {!mono && top !== "none" ? (
          <g>
            {/* воротник и застёжка */}
            <path d={`M ${tx - 10} ${shY - 9} L ${tx} ${shY + 12} L ${tx + 10} ${shY - 9}`} fill="none" stroke={lighten(cloth, 0.35)} strokeWidth={3} strokeLinejoin="round" opacity={0.8} />
            {top === "robe" ? (
              <g>
                <rect x={tx - 5} y={shY + 10} width={10} height={bottom - shY - 10} fill="#f5efe4" />
                <path d={`M ${tx - halfTop - 4} ${shY + 2} Q ${tx} ${shY + 26} ${tx + halfTop + 4} ${shY + 2}`} fill="none" stroke="#f5efe4" strokeWidth={10} strokeLinecap="round" />
              </g>
            ) : side ? (
              <line x1={tx + dir * (halfTop - 7)} y1={shY + 14} x2={tx + dir * (halfBot - 8)} y2={bottom - 6} stroke={darken(cloth, 0.2)} strokeWidth={2} opacity={0.6} />
            ) : (
              <line x1={tx} y1={shY + 12} x2={tx} y2={bottom - 4} stroke={darken(cloth, 0.22)} strokeWidth={2} opacity={0.55} />
            )}
          </g>
        ) : null}
        <circle cx={headX} cy={headY} r={HEAD_R} fill={c(BODY)} />
        <HairFront c={c} />
        {armsPts.map((a, i) => {
          const mid: [number, number] = [lerp(a.sh[0], a.elbow[0], sleeveLen), lerp(a.sh[1], a.elbow[1], sleeveLen)];
          return (
            <g key={`a${i}`}>
              <polyline points={`${a.elbow[0]},${a.elbow[1]} ${a.hand[0]},${a.hand[1]}`} fill="none" stroke={c(BODY)} strokeWidth={LIMB} strokeLinecap="round" />
              {sleeveLen < 1 ? <line x1={mid[0]} y1={mid[1]} x2={a.elbow[0]} y2={a.elbow[1]} stroke={c(BODY)} strokeWidth={LIMB} strokeLinecap="round" /> : null}
              <line x1={a.sh[0]} y1={a.sh[1]} x2={mid[0]} y2={mid[1]} stroke={c(sleeveC)} strokeWidth={top === "none" ? LIMB + 2 : 19} strokeLinecap="round" />
              <circle cx={a.hand[0]} cy={a.hand[1]} r={7.5} fill={c(BODY)} />
            </g>
          );
        })}
      </g>
    );
  };

  // лицо
  const bl = mood === "sleep" ? 0 : blink(t, actor.id.length * 13 + (actor.id.charCodeAt(0) || 0));
  const fx = headX + dir * 16 + gaze.x * 3;
  const fy = headY + 2 + gaze.y * 3;
  const spacing = side ? 10 : 12.5;
  const erx = 9.5 * face.size;
  const ery = 10.5 * face.size;
  const lid = clamp(face.lid + bl * (1 - face.lid));
  const closed = lid > 0.92;
  const glassC = "#d8dde4";

  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <defs>
        <filter id={`glow${uid}`} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation={12} />
        </filter>
        <filter id={`soft${uid}`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation={0.7} />
        </filter>
        <filter id={`shadow${uid}`} x="-50%" y="-200%" width="200%" height="500%">
          <feGaussianBlur stdDeviation={6} />
        </filter>
        <linearGradient id={`cl${uid}`} x1={rimS < 0 ? 0 : 1} x2={rimS < 0 ? 1 : 0} y1={0} y2={0.3}>
          <stop offset="0%" stopColor={lighten(cloth, 0.18)} />
          <stop offset="45%" stopColor={cloth} />
          <stop offset="100%" stopColor={darken(cloth, 0.22)} />
        </linearGradient>
        <radialGradient id={`ph${uid}`}>
          <stop offset="0%" stopColor="#bfe0ff" stopOpacity={0.28} />
          <stop offset="100%" stopColor="#7fb8ff" stopOpacity={0} />
        </radialGradient>
      </defs>
      {pose.sit < 0.5 ? <ellipse cx={0} cy={2} rx={44} ry={7} fill="#000" opacity={0.32} filter={`url(#shadow${uid})`} /> : null}
      {actor.glow ? (
        <g filter={`url(#glow${uid})`} opacity={0.75 + Math.sin(t * 6) * 0.15}>
          <Shape mono={actor.glow} />
        </g>
      ) : null}
      {rim ? (
        <g transform={`translate(${rimS * 2.2} -1.4)`} filter={`url(#soft${uid})`} opacity={0.92}>
          <Shape mono={rim} />
        </g>
      ) : null}
      <Shape />
      {/* лицо: белые глаза, брови, рот */}
      {([-1, 1] as const).map((sd) => {
        const cx = fx + sd * spacing;
        const cid = `eye${uid}${sd}`;
        const by = fy - ery - 6 - face.brow;
        const tiltY = Math.tan(rad(face.browTilt)) * 12;
        return (
          <g key={sd}>
            {closed ? (
              <path d={`M ${cx - erx} ${fy + 1} Q ${cx} ${fy + 6} ${cx + erx} ${fy + 1}`} fill="none" stroke="#f4f1ea" strokeWidth={2.6} strokeLinecap="round" />
            ) : (
              <g>
                <clipPath id={cid}>
                  <ellipse cx={cx} cy={fy} rx={erx} ry={ery} />
                </clipPath>
                <g clipPath={`url(#${cid})`}>
                  <ellipse cx={cx} cy={fy} rx={erx} ry={ery} fill="#f4f1ea" />
                  <circle cx={cx + gaze.x * 3.6} cy={fy + 1 + gaze.y * 4} r={4.9 * Math.min(1.1, face.size)} fill="#111216" />
                  <rect x={cx - 14} y={fy - ery - 20} width={28} height={20 + 2 * ery * lid} fill={BODY} />
                </g>
              </g>
            )}
            {/* бровь: внутренний конец (к носу) поднимается при грусти и опускается при злости */}
            {look.hat === "cap" ? null : <line x1={cx + sd * 6.5} y1={by} x2={cx - sd * 6.5} y2={by - tiltY} stroke="#f4f1ea" strokeWidth={2.6} strokeLinecap="round" />}
          </g>
        );
      })}
      {face.o > 0.5 ? (
        <ellipse cx={fx} cy={fy + 22} rx={3.6} ry={4.6} fill="#f4f1ea" />
      ) : (
        <path d={`M ${fx - 5.5} ${fy + 21} Q ${fx} ${fy + 21 + face.smile * 4.5} ${fx + 5.5} ${fy + 21}`} fill="none" stroke="#f4f1ea" strokeWidth={2.4} strokeLinecap="round" />
      )}
      {mood === "sleep"
        ? [0, 1, 2].map((i) => {
            const ph = (t * 0.6 + i / 3) % 1;
            return (
              <text key={i} x={headX + 40 + ph * 30} y={headY - 40 - ph * 60} fontFamily="Inter, sans-serif" fontWeight={700} fontSize={16 + ph * 10} fill="#f4f1ea" opacity={Math.sin(ph * Math.PI)}>
                z
              </text>
            );
          })
        : null}
      {look.glasses ? (
        <g fill="none" stroke={glassC} strokeWidth={2.2}>
          <circle cx={fx - spacing} cy={fy} r={erx + 3.5} />
          <circle cx={fx + spacing} cy={fy} r={erx + 3.5} />
          <line x1={fx - spacing + erx + 3.5} y1={fy - 2} x2={fx + spacing - erx - 3.5} y2={fy - 2} />
        </g>
      ) : null}
      {showMug ? (
        <g transform={`translate(${armsPts[1].hand[0] - 3} ${armsPts[1].hand[1] - 12})`}>
          <rect x={-9} y={0} width={19} height={22} rx={3} fill="#efe9df" />
          <rect x={-9} y={6} width={19} height={7} fill="#b9845a" />
          {[0, 1].map((i) => (
            <path key={i} d={`M ${-3 + i * 7} -4 q 4 -7 0 -14 q -4 -7 0 -15`} fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" opacity={0.25 + 0.2 * Math.sin(t * 3 + i * 2)} transform={`translate(0 ${-((t * 10 + i * 6) % 8)})`} />
          ))}
        </g>
      ) : null}
      {showPhone || showPhoneOut ? (
        <g transform={`translate(${phoneAt[0]} ${phoneAt[1]})`}>
          {actor.phoneLight !== false ? <circle cx={0} cy={-20} r={80} fill={`url(#ph${uid})`} style={{ mixBlendMode: "screen" }} /> : null}
          <rect x={-11} y={-20} width={22} height={36} rx={4} fill="#1a1d24" stroke="#8fc6ff" strokeWidth={1.6} />
        </g>
      ) : null}
      {arms === "chalk" ? <rect x={armsPts[1].hand[0] - 2} y={armsPts[1].hand[1] - 10} width={4} height={12} rx={1.5} fill="#f4f1ea" /> : null}
    </g>
  );
};

// Где находится макушка персонажа (для текста над головой)
export const headTop = (actor: Actor, x: number, y: number) => {
  const s = actor.scale ?? 1;
  const sit = actor.legs === "sit" ? SIT_DROP : 0;
  return { x, y: y + (-HEIGHT + sit) * s };
};

// Центр головы и рост — для камеры (крупные планы, «через плечо»)
export const bodyBox = (actor: Actor, x: number, y: number) => {
  const s = actor.scale ?? 1;
  const sit = actor.legs === "sit" ? SIT_DROP : 0;
  return { headX: x, headY: y + (HEAD_Y + sit) * s, top: y + (-HEIGHT + sit) * s, feet: y, h: (HEIGHT - sit) * s, headR: HEAD_R * s };
};
