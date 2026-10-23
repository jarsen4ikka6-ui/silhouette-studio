// Персонаж-силуэт в стиле Last Soul: чёрное тело, большая голова, глаза с веками.
// Одежда, причёска, поза и эмоция — параметры. Начало координат — между ступнями.
import React, { useId } from "react";
import type { Actor, Arms, Legs, Mood } from "./types";
import { clamp, lerp, rand } from "./util";

export const BODY = "#0a0a0c";
export const HEIGHT = 390; // рост в пикселях при scale 1 (до макушки)

const HIP_Y = -125;
const SHOULDER_Y = -232;
const HEAD_Y = -316;
const HEAD_R = 72;
const UPPER_ARM = 58;
const FOREARM = 54;
const THIGH = 62;
const SHIN = 63;

type Limb = [number, number]; // углы плеча и предплечья (бедра и голени), градусы от «вниз», + вправо
type PoseA = { la: Limb; ra: Limb; ll: Limb; rl: Limb; bob: number; lean: number; tilt: number; sit: number };
type EyeP = { lid: number; tilt: number; smile: number; size: number };

const armPose = (a: Arms, t: number, dir: number): Pick<PoseA, "la" | "ra"> => {
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
      // хлопает себя по карману
      const pat = Math.max(0, Math.sin(t * 7)) * 8;
      return { la: [-7 - b, -4], ra: [20 + pat * 0.4, -14 + pat] };
    }
    case "ear":
      return { la: [-7 - b, -4], ra: [60, -165] };
    case "write": {
      const w = Math.sin(t * 11) * 4;
      return { la: [-10, 39], ra: [10 + w * 0.5, -39 + w] };
    }
    case "point":
      return { la: [-7 - b, -4], ra: [108, 102] };
    case "shrug":
      return { la: [-38, -138], ra: [38, 138] };
    case "walk": {
      const s = Math.sin(t * Math.PI * 2) * 20;
      return { la: [-6 + s, -2 + s * 1.4], ra: [6 - s, 2 - s * 1.4] };
    }
    default:
      return { la: [-7 - b, -4 - b], ra: [7 + b, 4 + b] };
  }
};

const legPose = (l: Legs, t: number, dir: number): Pick<PoseA, "ll" | "rl" | "bob" | "sit"> => {
  if (l === "walk" || l === "run") {
    const speed = l === "run" ? 1.6 : 1;
    const p = t * Math.PI * 2 * speed;
    const amp = l === "run" ? 34 : 22;
    const s = Math.sin(p) * amp;
    const d = dir === 0 ? 1 : dir;
    // колено сгибается, когда нога уходит назад
    const kl = Math.max(0, -Math.sin(p)) * 22 * d;
    const kr = Math.max(0, Math.sin(p)) * 22 * d;
    return { ll: [s * d, s * d - kl], rl: [-s * d, -s * d - kr], bob: -Math.abs(Math.cos(p)) * (l === "run" ? 9 : 5), sit: 0 };
  }
  if (l === "sit") return { ll: [-3, -3], rl: [3, 3], bob: 0, sit: 1 };
  return { ll: [-3, -3], rl: [3, 3], bob: 0, sit: 0 };
};

const MOODS: Record<Mood, EyeP> = {
  neutral: { lid: 0.14, tilt: 0, smile: 0, size: 1 },
  tired: { lid: 0.52, tilt: 4, smile: 0, size: 1 },
  sad: { lid: 0.36, tilt: 16, smile: 0, size: 1 },
  happy: { lid: 0.04, tilt: 0, smile: 0.5, size: 1.04 },
  angry: { lid: 0.36, tilt: -20, smile: 0, size: 1 },
  surprised: { lid: 0, tilt: 0, smile: 0, size: 1.2 },
  sleep: { lid: 1, tilt: 0, smile: 0, size: 1 },
};

const MOOD_HEAD: Record<Mood, number> = { neutral: 0, tired: 6, sad: 9, happy: -3, angry: -2, surprised: -4, sleep: 10 };

const rad = (d: number) => (d * Math.PI) / 180;
const step = (x: number, y: number, ang: number, len: number): [number, number] => [x + Math.sin(rad(ang)) * len, y + Math.cos(rad(ang)) * len];

const mixLimb = (a: Limb, b: Limb, k: number): Limb => [lerp(a[0], b[0], k), lerp(a[1], b[1], k)];

const darken = (hex: string, k: number) => {
  const n = parseInt(hex.replace("#", ""), 16);
  const f = (v: number) => Math.round(v * (1 - k));
  return `rgb(${f((n >> 16) & 255)},${f((n >> 8) & 255)},${f(n & 255)})`;
};

// Поза в момент t с плавным переходом между ключами
const resolve = (actor: Actor, t: number) => {
  const dirOf = (f?: string) => (f === "left" ? -1 : f === "right" ? 1 : 0);
  const base = { at: 0, arms: actor.arms ?? "rest", legs: actor.legs ?? "stand", mood: actor.mood ?? "neutral", lookX: actor.lookX ?? dirOf(actor.facing) * 0.5, lookY: actor.lookY ?? 0, facing: actor.facing ?? "front" };
  const keys = [base, ...(actor.keys ?? [])];
  // накапливаем значения по ключам, чтобы каждый ключ наследовал предыдущий
  const filled: typeof base[] = [];
  keys.forEach((k, i) => filled.push({ ...(i ? filled[i - 1] : base), ...k } as typeof base));
  let i = 0;
  while (i + 1 < filled.length && t >= filled[i + 1].at) i++;
  const cur = filled[i];
  const prev = filled[Math.max(0, i - 1)];
  const BLEND = 0.4;
  const k = i === 0 ? 1 : clamp((t - cur.at) / BLEND);
  const kk = k * k * (3 - 2 * k);

  // поворот (facing в ключе) — мгновенный, позы рук и ног смешиваются как обычно
  const dir = dirOf(cur.facing);
  const pa = (x: typeof base) => ({ ...armPose(x.arms, t, dirOf(x.facing)), ...legPose(x.legs, t, dirOf(x.facing)) });
  const A = pa(prev);
  const B = pa(cur);
  const pose: PoseA = {
    la: mixLimb(A.la, B.la, kk),
    ra: mixLimb(A.ra, B.ra, kk),
    ll: mixLimb(A.ll, B.ll, kk),
    rl: mixLimb(A.rl, B.rl, kk),
    bob: lerp(A.bob, B.bob, kk),
    sit: lerp(A.sit, B.sit, kk),
    lean: 0,
    tilt: lerp(MOOD_HEAD[prev.mood], MOOD_HEAD[cur.mood], kk),
  };
  const ea = MOODS[prev.mood];
  const eb = MOODS[cur.mood];
  const eye: EyeP = { lid: lerp(ea.lid, eb.lid, kk), tilt: lerp(ea.tilt, eb.tilt, kk), smile: lerp(ea.smile, eb.smile, kk), size: lerp(ea.size, eb.size, kk) };
  const look = { x: lerp(prev.lookX, cur.lookX, kk), y: lerp(prev.lookY, cur.lookY, kk) };
  return { pose, eye, look, dir, arms: cur.arms, prevArms: prev.arms, k: kk, mood: cur.mood };
};

// Моргание: раз в 3–4 секунды на 4 кадра
const blink = (t: number, seed: number) => {
  const period = 3.4 + rand(seed) * 1.2;
  const ph = (t + rand(seed + 7) * period) % period;
  return ph < 0.13 ? Math.sin((ph / 0.13) * Math.PI) : 0;
};

export const Character: React.FC<{ actor: Actor; t: number; x: number; y: number }> = ({ actor, t, x, y }) => {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const s = actor.scale ?? 1;
  const look = actor.look ?? {};
  const { pose, eye, look: gaze, dir, arms, prevArms, k, mood } = resolve(actor, t);
  const top = look.top ?? "none";
  const cloth = look.color ?? "#c0392b";
  const sleeve = top === "hoodie" || top === "raincoat" ? darken(cloth, 0.14) : BODY;
  const pants = look.pants ?? BODY;

  const drop = pose.sit * 62;
  const yb = pose.bob + drop;
  const hipY = HIP_Y + yb;
  const shY = SHOULDER_Y + yb;
  const headX = Math.sin(rad(pose.tilt)) * 6 + dir * 4;
  const headY = HEAD_Y + yb + pose.tilt * 0.6;

  // ноги
  const legs = ([-1, 1] as const).map((side) => {
    const L = side < 0 ? pose.ll : pose.rl;
    const hx = side * 22;
    if (pose.sit > 0.5) {
      if (dir !== 0) {
        // сидит боком: бедро горизонтально вперёд, голень вниз
        const knee: [number, number] = [hx * 0.4 + dir * (THIGH * 0.85 + (side > 0 ? 6 : -6) * dir), hipY + 4];
        return { hip: [hx * 0.4, hipY] as [number, number], knee, foot: [knee[0] - dir * 6, 0] as [number, number] };
      }
      const knee: [number, number] = [side * 40, hipY + 22];
      return { hip: [hx, hipY] as [number, number], knee, foot: [side * 36, 0] as [number, number] };
    }
    const knee = step(hx, hipY, L[0], THIGH);
    const foot = step(knee[0], knee[1], L[1], SHIN);
    return { hip: [hx, hipY] as [number, number], knee, foot };
  });

  // руки
  const armsPts = ([-1, 1] as const).map((side) => {
    const A = side < 0 ? pose.la : pose.ra;
    const sx = side * 34;
    const sy = shY + 10;
    const elbow = step(sx, sy, A[0], UPPER_ARM);
    const hand = step(elbow[0], elbow[1], A[1], FOREARM);
    return { sh: [sx, sy] as [number, number], elbow, hand };
  });

  const showPhone = arms === "phone" && k > 0.6;
  const showPhoneOut = prevArms === "phone" && arms !== "phone" && k < 0.6;
  const phoneAt: [number, number] = showPhoneOut ? armsPts[0].hand : [(armsPts[0].hand[0] + armsPts[1].hand[0]) / 2, (armsPts[0].hand[1] + armsPts[1].hand[1]) / 2 - 4];
  const showMug = arms === "mug";

  const torso = `M ${-31} ${shY - 8} Q 0 ${shY - 22} 31 ${shY - 8} L 46 ${hipY - 6} Q 48 ${hipY + 12} 28 ${hipY + 12} L -28 ${hipY + 12} Q -48 ${hipY + 12} -46 ${hipY - 6} Z`;

  // Силуэт целиком. mono — залить всё одним цветом (для подсветки и свечения)
  const Shape: React.FC<{ mono?: string }> = ({ mono }) => {
    const c = (v: string) => mono ?? v;
    const hood = top === "hoodie" || top === "raincoat";
    return (
      <g>
        {look.hair === "ponytail" ? (
          <ellipse cx={-(dir || 1) * 64} cy={headY - 18} rx={26} ry={44} transform={`rotate(${-(dir || 1) * 28} ${-(dir || 1) * 64} ${headY - 18})`} fill={c(BODY)} />
        ) : null}
        {look.hair === "bun" ? <circle cx={headX} cy={headY - HEAD_R - 6} r={28} fill={c(BODY)} /> : null}
        {legs.map((l, i) => (
          <g key={`l${i}`}>
            <polyline points={`${l.hip[0]},${l.hip[1]} ${l.knee[0]},${l.knee[1]} ${l.foot[0]},${l.foot[1]}`} fill="none" stroke={c(pants)} strokeWidth={27} strokeLinecap="round" strokeLinejoin="round" />
            <ellipse cx={l.foot[0] + (dir || (i ? 1 : -1)) * 9} cy={l.foot[1] - 2} rx={20} ry={11} fill={c(BODY)} />
          </g>
        ))}
        {look.skirt ? (
          <path d={`M -40 ${hipY - 14} L 40 ${hipY - 14} L 62 ${-36} Q 0 ${-24} -62 ${-36} Z`} fill={c(look.pants ?? darken(cloth, 0.3))} />
        ) : null}
        {hood ? <ellipse cx={headX * 0.7} cy={headY + 46} rx={HEAD_R * 0.98} ry={HEAD_R * 0.56} fill={c(darken(cloth, 0.22))} /> : null}
        <path d={torso} fill={c(top === "none" ? BODY : cloth)} />
        {top === "hoodie" ? (
          <path d={`M -26 ${hipY - 34} L 26 ${hipY - 34} L 22 ${hipY - 8} L -22 ${hipY - 8} Z`} fill={c(darken(cloth, 0.12))} />
        ) : null}
        <circle cx={headX} cy={headY} r={HEAD_R} fill={c(BODY)} />
        {look.hair === "headband" ? (
          <path d={`M ${headX - HEAD_R + 4} ${headY - 30} Q ${headX} ${headY - 52} ${headX + HEAD_R - 4} ${headY - 30} L ${headX + HEAD_R - 1} ${headY - 16} Q ${headX} ${headY - 38} ${headX - HEAD_R + 1} ${headY - 16} Z`} fill={c(look.hairColor ?? "#e8e8e8")} />
        ) : null}
        {look.hair === "scarf" ? (
          <g>
            <path d={`M ${headX - 78} ${headY + 18} A 78 78 0 0 1 ${headX + 78} ${headY + 18} L ${headX + 62} ${headY + 28} Q ${headX} ${headY - 62} ${headX - 62} ${headY + 28} Z`} fill={c(look.hairColor ?? "#8e3b46")} />
            <path d={`M ${headX - 16} ${headY + 64} L ${headX + 16} ${headY + 64} L ${headX + 6} ${headY + 92} L ${headX - 8} ${headY + 90} Z`} fill={c(darken(look.hairColor ?? "#8e3b46", 0.15))} />
          </g>
        ) : null}
        {look.hat === "cap" ? (
          <g>
            <path d={`M ${headX - 74} ${headY - 14} A 74 74 0 0 1 ${headX + 74} ${headY - 14} Z`} fill={c(look.hatColor ?? "#1d2533")} />
            <ellipse cx={headX + (dir || 0) * 62} cy={headY - 14} rx={dir ? 48 : 84} ry={11} fill={c(darken(look.hatColor ?? "#1d2533", 0.25))} />
          </g>
        ) : null}
        {armsPts.map((a, i) => (
          <g key={`a${i}`}>
            <polyline points={`${a.sh[0]},${a.sh[1]} ${a.elbow[0]},${a.elbow[1]} ${a.hand[0]},${a.hand[1]}`} fill="none" stroke={c(sleeve)} strokeWidth={23} strokeLinecap="round" strokeLinejoin="round" />
            <circle cx={a.hand[0]} cy={a.hand[1]} r={14} fill={c(BODY)} />
          </g>
        ))}
      </g>
    );
  };

  const bl = mood === "sleep" ? 0 : blink(t, actor.id.length * 13 + (actor.id.charCodeAt(0) || 0));
  const lid = clamp(eye.lid + bl * (1 - eye.lid));
  const spacing = dir === 0 ? 25 : 21;
  const ex = headX + dir * 18;
  const ey = headY + 4;
  const rx = 14 * eye.size;
  const ry = 18 * eye.size;

  const rimDx = (actor.rimSide === "right" ? 1 : -1) * 5;

  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <defs>
        <filter id={`blur${uid}`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation={1.6} />
        </filter>
        <filter id={`glow${uid}`} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation={14} />
        </filter>
        <filter id={`shadow${uid}`} x="-50%" y="-200%" width="200%" height="500%">
          <feGaussianBlur stdDeviation={8} />
        </filter>
        <radialGradient id={`ph${uid}`}>
          <stop offset="0%" stopColor="#bfe0ff" stopOpacity={0.3} />
          <stop offset="100%" stopColor="#7fb8ff" stopOpacity={0} />
        </radialGradient>
      </defs>
      {pose.sit < 0.5 ? <ellipse cx={0} cy={4} rx={70} ry={12} fill="#000" opacity={0.35} filter={`url(#shadow${uid})`} /> : null}
      {actor.glow ? (
        <g filter={`url(#glow${uid})`} opacity={0.75 + Math.sin(t * 6) * 0.15}>
          <Shape mono={actor.glow} />
        </g>
      ) : null}
      {actor.rim ? (
        <g transform={`translate(${rimDx} -4)`} filter={`url(#blur${uid})`} opacity={0.95}>
          <Shape mono={actor.rim} />
        </g>
      ) : null}
      <Shape />
      {/* глаза */}
      {([-1, 1] as const).map((side) => {
        const cx = ex + side * spacing;
        const cid = `eye${uid}${side}`;
        return (
          <g key={side}>
            <clipPath id={cid}>
              <ellipse cx={cx} cy={ey} rx={rx} ry={ry} />
            </clipPath>
            <g clipPath={`url(#${cid})`}>
              <ellipse cx={cx} cy={ey} rx={rx} ry={ry} fill="#eef1f4" />
              <circle cx={cx + gaze.x * 5} cy={ey + 3 + gaze.y * 6} r={7.5 * eye.size} fill="#59606c" />
              <circle cx={cx + gaze.x * 5 - 2.2} cy={ey + 1 + gaze.y * 6} r={2} fill="#fff" opacity={0.8} />
              <rect x={cx - 30} y={ey - ry - 40} width={60} height={40 + 2 * ry * lid} fill={BODY} transform={`rotate(${eye.tilt * side} ${cx} ${ey})`} />
              {eye.smile > 0.01 ? <ellipse cx={cx} cy={ey + ry * (1.95 - eye.smile * 1.7)} rx={rx * 1.7} ry={ry * 1.1} fill={BODY} /> : null}
            </g>
          </g>
        );
      })}
      {look.glasses ? (
        <g fill="none" stroke="#c9ced6" strokeWidth={4} opacity={0.9}>
          <circle cx={ex - spacing} cy={ey} r={22} />
          <circle cx={ex + spacing} cy={ey} r={22} />
          <line x1={ex - spacing + 22} y1={ey - 4} x2={ex + spacing - 22} y2={ey - 4} />
        </g>
      ) : null}
      {showMug ? (
        <g transform={`translate(${armsPts[1].hand[0] - 4} ${armsPts[1].hand[1] - 18})`}>
          <rect x={-14} y={0} width={30} height={34} rx={5} fill="#e9e4dc" />
          <path d="M 16 8 q 12 0 12 10 q 0 10 -12 10" fill="none" stroke="#e9e4dc" strokeWidth={5} />
          {[0, 1].map((i) => (
            <path key={i} d={`M ${-4 + i * 10} -6 q 6 -10 0 -20 q -6 -10 0 -22`} fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round" opacity={0.25 + 0.2 * Math.sin(t * 3 + i * 2)} transform={`translate(0 ${-((t * 14 + i * 9) % 12)})`} />
          ))}
        </g>
      ) : null}
      {showPhone || showPhoneOut ? (
        <g transform={`translate(${phoneAt[0]} ${phoneAt[1]})`}>
          {actor.phoneLight !== false ? <circle cx={0} cy={-30} r={120} fill={`url(#ph${uid})`} style={{ mixBlendMode: "screen" }} /> : null}
          <rect x={-22} y={-36} width={44} height={70} rx={7} fill="#16181d" stroke="#9fcfff" strokeWidth={2.5} />
        </g>
      ) : null}
    </g>
  );
};

// Где находится макушка персонажа (для текста над головой)
export const headTop = (actor: Actor, x: number, y: number) => {
  const s = actor.scale ?? 1;
  const sit = actor.legs === "sit" ? 62 : 0;
  return { x, y: y + (-HEIGHT + sit) * s };
};
