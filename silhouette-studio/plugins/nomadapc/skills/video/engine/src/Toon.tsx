// Стиль «toon» (сериал «Что, если бы ты…»): большая белая круглая голова, чёрные глаза-овалы и густые брови,
// настоящая одежда с объёмом, белые руки-варежки, кеды. Всё обведено тёмным контуром.
// Скелет и позы те же, что у обычного персонажа (Character.tsx), поэтому ключи доски работают одинаково.
// talk (0..1) — насколько открыт рот прямо сейчас: его считает сцена по громкости озвучки, пока говорит этот персонаж.
import React, { useId } from "react";
import { CUSTOM_PARTS } from "./custom/characters";
import { blink, CUT, darken, type Limb, lighten, poseAt, rad, SKINS, SPREAD, step } from "./Character";
import type { Actor, Look } from "./types";
import { clamp, lerp } from "./util";

export const TOON_HEIGHT = 390;
export const TOON_R = 62; // голова большая: почти треть роста
export const TOON_HEAD_Y = -TOON_HEIGHT + TOON_R;
export const TOON_SIT = 75;
export const TOON_FACE = "#f8f6f1"; // белое лицо и руки — как у конкурента
const OL = "#1c1a24"; // контур
const OLW = 3; // толщина контура
const SHOULDER_Y = -256;
const HIP_Y = -150;
const UPPER = 56;
const FORE = 52;
const THIGH = 76;
const SHIN = 74;
const LEG_W = 29;
const SLEEVE_W = 27;
const HAND_R = 14;
const INK = "#16141b";

// Кожа в стиле toon по умолчанию белая; свой цвет — как обычно, через skin
export const toonSkin = (look: Look = {}) => (look.skin ? SKINS[look.skin] ?? look.skin : TOON_FACE);
const toonHair = (look: Look) => look.hairColor ?? (look.hair === "curls" ? "#c9c6c2" : "#3a2a24");

// Брови и рот по настроению: (наклон бровей, подъём)
const toonCut = (top: string) => (top === "shirt" ? { bottom: -150, flare: 2 } : top === "jacket" ? { bottom: -140, flare: 4 } : top === "hoodie" ? { bottom: -138, flare: 3 } : CUT[top] ?? CUT.jacket);

export type ToonPartProps = { t: number; dir: number; look: Look; R: number; shY: number; hipY: number; bottom: number; halfTop: number; halfBot: number };

export const ToonCharacter: React.FC<{ actor: Actor; t: number; x: number; y: number; talk?: number }> = ({ actor, t, x, y, talk = 0 }) => {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const s = actor.scale ?? 1;
  const look = actor.look ?? {};
  const { pose, face, look: gaze, dir, arms, prevArms, k, mood } = poseAt(actor, t);
  const top = look.top ?? "jacket";
  const skin = toonSkin(look);
  const hairC = toonHair(look);
  const cloth = look.color ?? "#3d6a45";
  const pants = look.pants === "skin" ? skin : look.pants ?? (top === "dress" || look.skirt ? skin : "#2f3540");
  const cut = toonCut(top);
  const rim = actor.rim === "none" || actor.rim === "" ? null : actor.rim ?? "#e8954a";
  const rimS = actor.rimSide === "right" ? 1 : -1;
  const side = dir !== 0;
  const R = TOON_R;
  const part = look.extra ? CUSTOM_PARTS[look.extra] : undefined;

  const drop = pose.sit * TOON_SIT;
  const breathe = pose.sit > 0.5 || pose.bob !== 0 ? 0 : Math.sin(t * 2.1 + x * 0.01) * 1.3;
  const yb = pose.bob + drop;
  const hipY = HIP_Y + yb;
  const shY = SHOULDER_Y + yb + breathe;
  // говорящий чуть кивает головой в такт словам
  const nod = talk * 2.2;
  const headX = Math.sin(rad(pose.tilt)) * 6 + dir * 4;
  const headY = TOON_HEAD_Y + yb + breathe * 1.3 + pose.tilt * 0.5 + nod;
  const bottom = Math.min(cut.bottom + (top === "robe" || top === "dress" ? 0 : drop), look.skirt ? -50 : 0);
  const halfTop = side ? 33 : 47;
  const halfBot = (side ? 33 : 44) + cut.flare + (look.skirt ? 24 : 0);
  const tx = side ? dir * 3 : 0;

  // ноги
  const legs = ([-1, 1] as const).map((sd) => {
    const L = sd < 0 ? pose.ll : pose.rl;
    const hx = side ? sd * 6 : sd * 18;
    if (pose.sit > 0.5) {
      if (side) {
        const knee: [number, number] = [hx + dir * THIGH * 0.95, hipY + 4];
        return { hip: [hx, hipY] as [number, number], knee, foot: [knee[0] - dir * 2, -4] as [number, number] };
      }
      const knee: [number, number] = [sd * 26, hipY + 20];
      return { hip: [hx, hipY] as [number, number], knee, foot: [sd * 24, -4] as [number, number] };
    }
    const stand = side && Math.abs(L[0]) < 6 ? sd * dir * 7 : 0;
    const knee = step(hx, hipY, L[0] + stand * 0.5, THIGH);
    const foot = step(knee[0], knee[1], L[1] + stand * 0.5, SHIN - 6);
    return { hip: [hx, hipY] as [number, number], knee, foot };
  });

  // руки
  const sym = Math.abs(pose.la[0] + pose.ra[0]) < 2 && Math.abs(pose.la[1] + pose.ra[1]) < 2;
  const fwd = Math.sin(rad(pose.ra[1])) * dir >= 0 ? pose.ra : pose.la;
  const armsPts = ([-1, 1] as const).map((sd) => {
    // боком: в симметричной позе обе руки как ближняя (предплечье вперёд), иначе одна выворачивается за спину
    // плечо при этом почти вертикально, чтобы рука не шла зигзагом
    const A0: Limb = side && sym ? [Math.abs(fwd[0]) < 50 ? fwd[0] * 0.3 : fwd[0], fwd[1]] : sd < 0 ? pose.la : pose.ra;
    const sp = !side && Math.abs(A0[0]) < 30 ? (SPREAD[top] ?? 4) + (look.skirt ? 8 : 0) : 0;
    const A: Limb = [A0[0] + sd * sp, A0[1] + sd * sp * 0.5];
    const sx = side ? tx + sd * 5 : sd * (halfTop - 7);
    const sy = shY + 14;
    const elbow = step(sx, sy, A[0], UPPER);
    const hand = step(elbow[0], elbow[1], A[1], FORE);
    return { sh: [sx, sy] as [number, number], elbow, hand, sd };
  });

  const showPhone = arms === "phone" && k > 0.6;
  const showPhoneOut = prevArms === "phone" && arms !== "phone" && k < 0.6;
  const phoneAt: [number, number] = showPhoneOut ? armsPts[0].hand : [(armsPts[0].hand[0] + armsPts[1].hand[0]) / 2, (armsPts[0].hand[1] + armsPts[1].hand[1]) / 2 - 6];

  const torso = `M ${tx - halfTop + 10} ${shY - 6} Q ${tx} ${shY - 13} ${tx + halfTop - 10} ${shY - 6} Q ${tx + halfTop + 3} ${shY - 2} ${tx + halfTop} ${shY + 20} L ${tx + halfBot} ${bottom - 10} Q ${tx + halfBot} ${bottom} ${tx + halfBot - 10} ${bottom} L ${tx - halfBot + 10} ${bottom} Q ${tx - halfBot} ${bottom} ${tx - halfBot} ${bottom - 10} L ${tx - halfTop} ${shY + 20} Q ${tx - halfTop - 3} ${shY - 2} ${tx - halfTop + 10} ${shY - 6} Z`;
  const sleeveC = top === "none" ? skin : top === "tee" ? cloth : darken(cloth, 0.04);
  const shortSleeve = top === "tee" || top === "none";
  const back = -(dir || 1);
  const hairStyle = look.hair ?? "short";
  const under = look.under ?? (top === "hoodie" ? lighten(cloth, 0.12) : undefined);

  // толстая линия с контуром (рука в рукаве, нога в штанине)
  // три точки — плавная дуга, проходящая через среднюю (локоть, колено), как резиновая рука
  const Stroke: React.FC<{ pts: [number, number][]; w: number; color: string; mono?: string }> = ({ pts, w, color, mono }) => {
    let d = `M ${pts.map((q) => q.join(" ")).join(" L ")}`;
    if (pts.length === 3) {
      const [a, m, b] = pts;
      const c = [2 * m[0] - (a[0] + b[0]) / 2, 2 * m[1] - (a[1] + b[1]) / 2];
      d = `M ${a[0]} ${a[1]} Q ${c[0]} ${c[1]} ${b[0]} ${b[1]}`;
    }
    return (
      <g>
        <path d={d} fill="none" stroke={mono ?? OL} strokeWidth={w + OLW * 2} strokeLinecap="round" strokeLinejoin="round" />
        <path d={d} fill="none" stroke={mono ?? color} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />
      </g>
    );
  };

  const Hand: React.FC<{ at: [number, number]; sd: number; mono?: string }> = ({ at, sd, mono }) => (
    <g transform={`translate(${at[0]} ${at[1]})`}>
      <ellipse cx={-sd * 8} cy={-7} rx={5.5} ry={7} transform={`rotate(${-sd * 30} ${-sd * 8} -7)`} fill={mono ?? skin} stroke={mono ?? OL} strokeWidth={OLW * 0.8} />
      <circle r={HAND_R} fill={mono ?? skin} stroke={mono ?? OL} strokeWidth={OLW * 0.8} />
    </g>
  );

  const Arm: React.FC<{ a: (typeof armsPts)[number]; mono?: string }> = ({ a, mono }) => {
    // рукав кончается чуть раньше кисти
    const toWrist = (k0: number): [number, number] => [lerp(a.elbow[0], a.hand[0], k0), lerp(a.elbow[1], a.hand[1], k0)];
    if (shortSleeve) {
      const mid: [number, number] = [lerp(a.sh[0], a.elbow[0], 0.5), lerp(a.sh[1], a.elbow[1], 0.5)];
      return (
        <g>
          <Stroke pts={[mid, a.elbow, toWrist(0.75)]} w={11} color={skin} mono={mono} />
          {top === "none" ? <Stroke pts={[a.sh, mid]} w={11} color={skin} mono={mono} /> : <Stroke pts={[a.sh, mid]} w={SLEEVE_W} color={sleeveC} mono={mono} />}
          <Hand at={a.hand} sd={a.sd * (dir < 0 ? -1 : 1)} mono={mono} />
        </g>
      );
    }
    const wrist = toWrist(0.72);
    return (
      <g>
        <Stroke pts={[a.sh, a.elbow, wrist]} w={SLEEVE_W} color={sleeveC} mono={mono} />
        {/* манжета */}
        {!mono && (top === "jacket" || top === "hoodie") ? <circle cx={wrist[0]} cy={wrist[1]} r={SLEEVE_W / 2 - 0.5} fill={darken(cloth, 0.18)} /> : null}
        <Hand at={a.hand} sd={a.sd * (dir < 0 ? -1 : 1)} mono={mono} />
      </g>
    );
  };

  const Shoe: React.FC<{ at: [number, number]; d: number; far?: boolean; mono?: string }> = ({ at, d, far, mono }) => {
    const c = look.shoes ?? "#ecebe8";
    const fill = mono ?? (far ? darken(c, 0.22) : c);
    if (!d)
      // анфас: носок смотрит на зрителя
      return (
        <g transform={`translate(${at[0]} ${at[1]})`}>
          <path d="M -21 3 Q -24 -19 0 -21 Q 24 -19 21 3 Q 0 7 -21 3 Z" fill={fill} stroke={mono ?? OL} strokeWidth={OLW * 0.8} strokeLinejoin="round" />
          {mono ? null : <path d="M -20 -2 Q 0 2 20 -2" fill="none" stroke="#b9b7b2" strokeWidth={2} />}
        </g>
      );
    return (
      <g transform={`translate(${at[0]} ${at[1]}) scale(${d} 1)`}>
        <path d="M -15 4 Q -19 -18 -1 -20 Q 13 -20 23 -10 Q 31 -3 26 4 Q 5 7 -15 4 Z" fill={fill} stroke={mono ?? OL} strokeWidth={OLW * 0.8} strokeLinejoin="round" />
        {mono ? null : <path d="M -16 0 Q 5 3 28 0" fill="none" stroke="#b9b7b2" strokeWidth={2} />}
      </g>
    );
  };

  // волосы сзади головы (хвост, пучок, длинные) и капюшон
  const HairBack: React.FC<{ mono?: string }> = ({ mono }) => {
    const c = (v: string) => mono ?? v;
    const st = { stroke: mono ?? OL, strokeWidth: OLW };
    return (
      <g transform={`translate(${headX} ${headY})`}>
        {hairStyle === "ponytail" ? <ellipse cx={back * (R - 2)} cy={-4} rx={17} ry={32} transform={`rotate(${back * -24} ${back * (R - 2)} -4)`} fill={c(hairC)} {...st} /> : null}
        {hairStyle === "long" ? <path d={`M ${-R - 4} -10 Q ${-R - 10} 70 ${-R + 10} 84 L ${R - 10} 84 Q ${R + 10} 70 ${R + 4} -10 Z`} fill={c(hairC)} {...st} /> : null}
        {hairStyle === "bun" ? <circle cx={back * 8} cy={-R - 10} r={24} fill={c(hairC)} {...st} /> : null}
      </g>
    );
  };

  // капюшон кофты лежит на плечах вокруг шеи
  const Hood: React.FC<{ mono?: string }> = ({ mono }) =>
    under || top === "hoodie" ? (
      <path d={`M ${tx - 30} ${shY + 6} Q ${tx - 36} ${shY - 20} ${tx} ${shY - 22} Q ${tx + 36} ${shY - 20} ${tx + 30} ${shY + 6} Q ${tx} ${shY - 6} ${tx - 30} ${shY + 6} Z`} fill={mono ?? under ?? lighten(cloth, 0.1)} stroke={mono ?? OL} strokeWidth={OLW} strokeLinejoin="round" />
    ) : null;

  const HairFront: React.FC<{ mono?: string }> = ({ mono }) => {
    const c = (v: string) => mono ?? v;
    const st = { stroke: mono ?? OL, strokeWidth: OLW, strokeLinejoin: "round" as const };
    const hc = look.hatColor ?? "#e3b234";
    const off = dir * 8; // в три четверти чёлка смещена вперёд
    // чёлка: зубцы от правого виска к левому
    const fringe = (n: number, depth: number, y0: number) =>
      Array.from({ length: n + 1 }, (_, i) => {
        const xx = R - 2 - ((2 * R - 4) * i) / n;
        const yy = y0 + (i % 2 ? depth : 0) + Math.abs(xx) * 0.12;
        return `L ${xx + off * (1 - Math.abs(xx) / R)} ${yy}`;
      }).join(" ");
    const cap = (y0: number, depth: number, n = 8) => `M ${-R - 1} 6 A ${R + 1} ${R + 1} 0 0 1 ${R + 1} 6 ${fringe(n, depth, y0)} Z`;
    let hair: React.ReactNode = null;
    if (hairStyle === "short") hair = <path d={cap(-30, 13)} fill={c(hairC)} {...st} />;
    if (hairStyle === "spiky") {
      const spikes = Array.from({ length: 13 }, (_, i) => {
        const a = rad(-190 + i * 16.5);
        const r = i % 2 ? R + 4 : R + 22;
        return `L ${Math.cos(a) * r} ${Math.sin(a) * r}`;
      }).join(" ");
      hair = <path d={`M ${-R - 2} 4 ${spikes} L ${R + 2} 4 ${fringe(8, 16, -26)} Z`} fill={c(hairC)} {...st} />;
    }
    if (hairStyle === "bun" || hairStyle === "ponytail" || hairStyle === "long" || hairStyle === "headband")
      hair = <path d={`M ${-R - 1} 10 A ${R + 1} ${R + 1} 0 0 1 ${R + 1} 10 Q ${R - 10} -34 ${off} -36 Q ${-R + 10} -34 ${-R - 1} 10 Z`} fill={c(hairC)} {...st} />;
    if (hairStyle === "curls")
      hair = (
        <g>
          {Array.from({ length: 11 }, (_, i) => {
            const a = rad(-180 + i * 18);
            return <circle key={i} cx={Math.cos(a) * (R - 2)} cy={Math.sin(a) * (R - 2) - 6} r={15} fill={c(hairC)} {...st} />;
          })}
        </g>
      );
    const scarfC = look.hatColor ?? look.hairColor ?? "#e9d9b8";
    return (
      <g transform={`translate(${headX} ${headY})`}>
        {hair}
        {hairStyle === "headband" ? <path d={`M ${-R + 1} -22 Q 0 -40 ${R - 1} -22 L ${R} -10 Q 0 -28 ${-R} -10 Z`} fill={c(look.hatColor ?? "#e8784a")} {...st} /> : null}
        {hairStyle === "scarf" ? (
          <g>
            {/* платок: закрывает макушку, уши и щёки, узел под подбородком; лицо — в овальном вырезе, из-под платка видна седая чёлка */}
            <path d={`M ${off * 0.4 - 26} ${R - 4} L ${off * 0.4 + 6} ${R + 30} L ${off * 0.4 + 30} ${R - 6} Z`} fill={c(scarfC)} {...st} />
            <path
              fillRule="evenodd"
              d={`M ${-R - 10} 14 Q ${-R - 12} ${-R - 14} 0 ${-R - 12} Q ${R + 12} ${-R - 14} ${R + 10} 14 Q ${R + 4} ${R} ${off * 0.4} ${R + 6} Q ${-R - 4} ${R} ${-R - 10} 14 Z M ${off * 0.6 - 48} 8 A 48 52 0 1 0 ${off * 0.6 + 48} 8 A 48 52 0 1 0 ${off * 0.6 - 48} 8 Z`}
              fill={c(scarfC)}
              {...st}
            />
            {mono ? null : (
              <g>
                <path d={`M ${off * 0.6 - 46} -6 Q ${off * 0.6 - 30} -48 ${off * 0.6} -44 Q ${off * 0.6 + 34} -46 ${off * 0.6 + 46} -6 Q ${off * 0.6 + 20} -26 ${off * 0.6} -22 Q ${off * 0.6 - 24} -26 ${off * 0.6 - 46} -6 Z`} fill={look.hairColor ?? "#c9c6c2"} stroke={OL} strokeWidth={2} />
                {[[-58, -30], [52, -36], [-64, 18], [62, 16], [-14, -66], [24, -64], [-40, -58], [44, -58], [-50, 46], [48, 44]].map(([px, py], i) => (
                  <g key={i}>
                    {[0, 72, 144, 216, 288].map((a2) => (
                      <circle key={a2} cx={px + Math.cos((a2 * Math.PI) / 180) * 5} cy={py + Math.sin((a2 * Math.PI) / 180) * 5} r={3.6} fill="#c8433d" />
                    ))}
                    <circle cx={px} cy={py} r={2.4} fill="#f4d36b" />
                  </g>
                ))}
              </g>
            )}
          </g>
        ) : null}
        {look.hat === "beanie" ? (
          <g>
            <path d={`M ${-R - 5} -18 Q ${-R - 6} ${-R - 34} 0 ${-R - 22} Q ${R + 6} ${-R - 34} ${R + 5} -18 Z`} fill={c(hc)} {...st} />
            {mono ? null : Array.from({ length: 9 }, (_, i) => <path key={i} d={`M ${-R + 6 + i * 14.5} -34 Q ${-R * 0.6 + i * 9.5} ${-R - 6} ${-26 + i * 6.5} ${-R - 16}`} fill="none" stroke={darken(hc, 0.14)} strokeWidth={2} opacity={0.7} />)}
            <path d={`M ${-R - 7} -40 Q 0 -50 ${R + 7} -40 L ${R + 6} -16 Q 0 -24 ${-R - 6} -16 Z`} fill={c(darken(hc, 0.05))} {...st} />
            {mono ? null : Array.from({ length: 15 }, (_, i) => <line key={i} x1={-R - 1 + i * 9} y1={-42 + Math.abs(i - 7) * 0.3} x2={-R - 1 + i * 9} y2={-20} stroke={darken(hc, 0.2)} strokeWidth={1.6} opacity={0.6} />)}
          </g>
        ) : null}
        {look.hat === "cap" ? (
          <g>
            <path d={`M ${-R - 2} -12 A ${R + 2} ${R + 2} 0 0 1 ${R + 2} -12 Z`} fill={c(look.hatColor ?? "#2d4e8a")} {...st} />
            <path d={`M ${(dir || 1) * 6} -14 Q ${(dir || 1) * (R + 30)} -16 ${(dir || 1) * (R + 34)} -6 Q ${(dir || 1) * R * 0.6} -2 ${(dir || 1) * 6} -8 Z`} fill={c(darken(look.hatColor ?? "#2d4e8a", 0.15))} {...st} />
          </g>
        ) : null}
        {look.hat === "crown" ? <path d={`M -36 ${-R + 8} L -40 ${-R - 30} L -20 ${-R - 12} L 0 ${-R - 38} L 20 ${-R - 12} L 40 ${-R - 30} L 36 ${-R + 8} Z`} fill={c(look.hatColor ?? "#f1c24b")} {...st} /> : null}
      </g>
    );
  };

  // всё тело; mono — одним цветом (для тёплой кромки света)
  const Body: React.FC<{ mono?: string }> = ({ mono }) => (
    <g>
      <HairBack mono={mono} />
      {side ? <Arm a={armsPts[0]} mono={mono} /> : null}
      {legs.map((l, i) => (
        <g key={i}>
          {/* штанина кончается внутри ботинка */}
          <Stroke pts={[l.hip, l.knee, [l.foot[0], l.foot[1] - 12]]} w={pants === skin ? 12 : LEG_W} color={pants} mono={mono} />
          <Shoe at={[l.foot[0] + (dir ? dir * 4 : 0), Math.min(l.foot[1] + 2, 0)]} d={dir} far={side && i === 0} mono={mono} />
        </g>
      ))}
      {/* шея */}
      <rect x={headX - 6} y={headY + R - 6} width={12} height={shY - headY - R + 10} fill={mono ?? OL} />
      <path d={torso} fill={mono ?? `url(#tc${uid})`} stroke={mono ?? OL} strokeWidth={OLW} strokeLinejoin="round" />
      {mono ? null : <Clothes />}
      <Hood mono={mono} />
      {(side ? armsPts.slice(1) : armsPts).map((a, i) => (
        <Arm key={i} a={a} mono={mono} />
      ))}
      <circle cx={headX} cy={headY} r={R} fill={mono ?? skin} stroke={mono ?? OL} strokeWidth={OLW} />
      <HairFront mono={mono} />
    </g>
  );

  // детали одежды: молния, резинка, карманы, кофта под курткой, фартук, воротник
  const Clothes: React.FC = () => {
    const dk = darken(cloth, 0.22);
    const mid = side ? tx + dir * 8 : tx;
    return (
      <g>
        {under && top !== "hoodie" && !side ? (
          <g>
            <path d={`M ${mid - 14} ${shY - 4} L ${mid + 14} ${shY - 4} L ${mid + 11} ${bottom - 2} L ${mid - 11} ${bottom - 2} Z`} fill={under} stroke={OL} strokeWidth={OLW * 0.7} />
            <line x1={mid - 6} y1={shY + 4} x2={mid - 7} y2={shY + 44} stroke="#f2f0ec" strokeWidth={2.4} strokeLinecap="round" />
            <line x1={mid + 6} y1={shY + 4} x2={mid + 7} y2={shY + 44} stroke="#f2f0ec" strokeWidth={2.4} strokeLinecap="round" />
          </g>
        ) : null}
        {top === "jacket" ? (
          <g>
            <path d={`M ${tx - halfBot + 2} ${bottom - 12} L ${tx + halfBot - 2} ${bottom - 12}`} stroke={dk} strokeWidth={9} />
            {Array.from({ length: 9 }, (_, i) => (
              <line key={i} x1={tx - halfBot + 6 + i * ((2 * halfBot - 12) / 8)} y1={bottom - 16} x2={tx - halfBot + 6 + i * ((2 * halfBot - 12) / 8)} y2={bottom - 8} stroke={darken(cloth, 0.35)} strokeWidth={1.4} />
            ))}
            {!side ? <line x1={mid + (under ? 15 : 0)} y1={shY + 2} x2={mid + (under ? 13 : 0)} y2={bottom - 3} stroke={darken(cloth, 0.3)} strokeWidth={2.2} /> : null}
            {!side ? <path d={`M ${tx + 14} ${hipY - 22} L ${tx + 24} ${hipY - 4}`} stroke={darken(cloth, 0.3)} strokeWidth={2} strokeLinecap="round" /> : null}
            {!side ? <path d={`M ${tx - 14} ${hipY - 22} L ${tx - 24} ${hipY - 4}`} stroke={darken(cloth, 0.3)} strokeWidth={2} strokeLinecap="round" /> : null}
          </g>
        ) : null}
        {top === "hoodie" && !side ? (
          <g>
            <path d={`M ${tx - 22} ${bottom - 34} L ${tx + 22} ${bottom - 34} L ${tx + 28} ${bottom - 10} L ${tx - 28} ${bottom - 10} Z`} fill="none" stroke={darken(cloth, 0.25)} strokeWidth={2} />
            <line x1={tx - 6} y1={shY + 4} x2={tx - 7} y2={shY + 46} stroke="#f2f0ec" strokeWidth={2.4} strokeLinecap="round" />
            <line x1={tx + 6} y1={shY + 4} x2={tx + 7} y2={shY + 46} stroke="#f2f0ec" strokeWidth={2.4} strokeLinecap="round" />
          </g>
        ) : null}
        {top === "shirt" ? (
          <g>
            <path d={`M ${tx - 16} ${shY - 8} L ${tx - 2} ${shY + 10} L ${tx - 20} ${shY + 8} Z`} fill={lighten(cloth, 0.15)} stroke={OL} strokeWidth={OLW * 0.7} strokeLinejoin="round" />
            <path d={`M ${tx + 16} ${shY - 8} L ${tx + 2} ${shY + 10} L ${tx + 20} ${shY + 8} Z`} fill={lighten(cloth, 0.15)} stroke={OL} strokeWidth={OLW * 0.7} strokeLinejoin="round" />
            {!side ? [0, 1, 2].map((i) => <circle key={i} cx={tx} cy={shY + 22 + i * 26} r={2.4} fill={darken(cloth, 0.3)} />) : null}
          </g>
        ) : null}
        {top === "coat" || top === "raincoat" ? (
          <g>
            {!side ? [0, 1, 2].map((i) => <circle key={i} cx={tx + 8} cy={shY + 34 + i * 34} r={3.6} fill={darken(cloth, 0.4)} />) : null}
            <path d={`M ${tx - 8} ${shY - 6} L ${tx + 6} ${shY + 26} L ${tx + 16} ${shY - 6}`} fill="none" stroke={darken(cloth, 0.3)} strokeWidth={2.2} strokeLinejoin="round" />
          </g>
        ) : null}
        {top === "robe" ? <path d={`M ${tx - halfTop - 4} ${hipY + 8} Q ${tx} ${hipY + 16} ${tx + halfTop + 4} ${hipY + 8}`} fill="none" stroke={look.trim ?? dk} strokeWidth={9} strokeLinecap="round" /> : null}
        {look.apron ? (
          <g>
            <path d={`M ${tx - 24} ${shY + 26} L ${tx + 24} ${shY + 26} L ${tx + halfBot - 4} ${Math.max(bottom, hipY + 70)} L ${tx - halfBot + 4} ${Math.max(bottom, hipY + 70)} Z`} fill={look.apron} stroke={OL} strokeWidth={OLW * 0.8} strokeLinejoin="round" />
            <line x1={tx - 20} y1={shY + 26} x2={tx - 14} y2={shY - 4} stroke={look.apron} strokeWidth={4} />
            <line x1={tx + 20} y1={shY + 26} x2={tx + 14} y2={shY - 4} stroke={look.apron} strokeWidth={4} />
          </g>
        ) : null}
        {part?.body ? <part.body t={t} dir={dir} look={look} R={R} shY={shY} hipY={hipY} bottom={bottom} halfTop={halfTop} halfBot={halfBot} /> : null}
      </g>
    );
  };

  // лицо: чёрные овальные глаза с бликом, густые брови, рот (открывается под речь)
  const bl = mood === "sleep" ? 1 : blink(t, actor.id.length * 13 + (actor.id.charCodeAt(0) || 0));
  const fx = headX + dir * 16 + gaze.x * 4;
  const fy = headY + 8 + gaze.y * 3;
  const spacing = side ? 14 : 18;
  const erx = 5.6 * face.size;
  const ery = 8.2 * face.size;
  const lid = clamp(face.lid + bl * (1 - face.lid));
  const closed = lid > 0.85;
  const browW = 5.2;
  const talkOpen = clamp(talk);
  const mouthY = fy + 27;

  let mouth: React.ReactNode;
  if (talkOpen > 0.06 || face.smile > 0.85) {
    // открытый рот: тёмный, с розовым языком
    const open = Math.max(talkOpen, face.smile > 0.85 ? 0.35 : 0);
    const w = 15 + open * 6;
    const h = 3 + open * 13;
    const cy0 = mouthY - 2;
    mouth = (
      <g>
        <path d={`M ${fx - w / 2} ${cy0} Q ${fx} ${cy0 - 2 + (face.smile < 0 ? 3 : 0)} ${fx + w / 2} ${cy0} Q ${fx + w * 0.42} ${cy0 + h} ${fx} ${cy0 + h} Q ${fx - w * 0.42} ${cy0 + h} ${fx - w / 2} ${cy0} Z`} fill="#5b1d26" stroke={OL} strokeWidth={2} strokeLinejoin="round" />
        {h > 7 ? <ellipse cx={fx + 1} cy={cy0 + h - 3} rx={w * 0.26} ry={2.6} fill="#e0707a" /> : null}
      </g>
    );
  } else if (face.o > 0.5) mouth = <ellipse cx={fx} cy={mouthY} rx={4.5} ry={6} fill="#5b1d26" stroke={OL} strokeWidth={2} />;
  else mouth = <path d={`M ${fx - 8} ${mouthY - 1} Q ${fx + 1} ${mouthY - 1 + face.smile * 6} ${fx + 9} ${mouthY - 2 - face.smile * 1.5}`} fill="none" stroke={INK} strokeWidth={3} strokeLinecap="round" />;

  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <defs>
        <filter id={`tsh${uid}`} x="-50%" y="-200%" width="200%" height="500%">
          <feGaussianBlur stdDeviation={6} />
        </filter>
        <filter id={`tg${uid}`} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation={12} />
        </filter>
        <linearGradient id={`tc${uid}`} x1={rimS < 0 ? 0 : 1} x2={rimS < 0 ? 1 : 0} y1={0} y2={0.2}>
          <stop offset="0%" stopColor={lighten(cloth, 0.12)} />
          <stop offset="50%" stopColor={cloth} />
          <stop offset="100%" stopColor={darken(cloth, 0.16)} />
        </linearGradient>
      </defs>
      {pose.sit < 0.5 ? <ellipse cx={0} cy={2} rx={50} ry={8} fill="#000" opacity={0.35} filter={`url(#tsh${uid})`} /> : null}
      {actor.glow ? (
        <g filter={`url(#tg${uid})`} opacity={0.75 + Math.sin(t * 6) * 0.15}>
          <Body mono={actor.glow} />
        </g>
      ) : null}
      {rim ? (
        <g transform={`translate(${rimS * 2.6} -1.2)`} opacity={0.9}>
          <Body mono={rim} />
        </g>
      ) : null}
      <Body />
      {/* лицо */}
      {([-1, 1] as const).map((sd) => {
        const cx = fx + sd * spacing + (side ? dir * (sd === dir ? 2 : -2) : 0);
        const by = fy - ery - 9 - face.brow * 1.3;
        const tiltY = Math.tan(rad(face.browTilt)) * 9;
        return (
          <g key={sd}>
            {closed ? (
              <path d={`M ${cx - erx - 1} ${fy + 1} Q ${cx} ${fy + 5} ${cx + erx + 1} ${fy + 1}`} fill="none" stroke={INK} strokeWidth={3} strokeLinecap="round" />
            ) : (
              <g>
                <ellipse cx={cx + gaze.x * 1.5} cy={fy + (ery * lid) / 2} rx={erx} ry={ery * (1 - lid)} fill={INK} />
                <circle cx={cx + gaze.x * 1.5 + 1.8} cy={fy - ery * 0.35 + (ery * lid) / 2} r={1.7} fill="#fff" opacity={lid > 0.5 ? 0 : 1} />
              </g>
            )}
            {look.hat === "beanie" && by < headY - 24 ? null : <line x1={cx + sd * 9} y1={by} x2={cx - sd * 7} y2={by - tiltY} stroke={INK} strokeWidth={browW} strokeLinecap="round" />}
          </g>
        );
      })}
      {mouth}
      {look.beard === "mustache" || look.beard === "beard" ? <path d={`M ${fx - 13} ${mouthY - 6} Q ${fx} ${mouthY - 13} ${fx + 13} ${mouthY - 6} Q ${fx} ${mouthY - 3} ${fx - 13} ${mouthY - 6} Z`} fill={hairC} stroke={OL} strokeWidth={1.6} /> : null}
      {look.beard === "beard" ? <path d={`M ${headX - R + 10} ${headY + 22} Q ${headX} ${headY + R + 26} ${headX + R - 10} ${headY + 22} Q ${headX + R * 0.5} ${headY + R - 4} ${fx} ${mouthY + 8} Q ${headX - R * 0.5} ${headY + R - 4} ${headX - R + 10} ${headY + 22} Z`} fill={hairC} stroke={OL} strokeWidth={2} /> : null}
      {look.glasses ? (
        <g fill="none" stroke="#5a4636" strokeWidth={2.2}>
          <circle cx={fx - spacing} cy={fy} r={12} />
          <circle cx={fx + spacing} cy={fy} r={12} />
          <line x1={fx - spacing + 12} y1={fy - 2} x2={fx + spacing - 12} y2={fy - 2} />
        </g>
      ) : null}
      {part?.head ? (
        <g transform={`translate(${headX} ${headY})`}>
          <part.head t={t} dir={dir} look={look} R={R} shY={shY} hipY={hipY} bottom={bottom} halfTop={halfTop} halfBot={halfBot} />
        </g>
      ) : null}
      {mood === "sleep"
        ? [0, 1, 2].map((i) => {
            const ph = (t * 0.6 + i / 3) % 1;
            return (
              <text key={i} x={headX + 50 + ph * 30} y={headY - 50 - ph * 60} fontFamily="sans-serif" fontWeight={800} fontSize={18 + ph * 10} fill="#f4f1ea" opacity={Math.sin(ph * Math.PI)}>
                z
              </text>
            );
          })
        : null}
      {showPhone || showPhoneOut ? (
        <g transform={`translate(${phoneAt[0]} ${phoneAt[1]})`}>
          <rect x={-13} y={-24} width={26} height={42} rx={5} fill="#1a1d24" stroke={OL} strokeWidth={2} />
          <rect x={-10} y={-20} width={20} height={32} rx={3} fill="#7fb8ff" opacity={0.85} />
        </g>
      ) : null}
      {arms === "mug" ? (
        <g transform={`translate(${armsPts[1].hand[0] - 4} ${armsPts[1].hand[1] - 16})`}>
          <rect x={-11} y={0} width={22} height={26} rx={4} fill="#efe9df" stroke={OL} strokeWidth={2} />
        </g>
      ) : null}
    </g>
  );
};

// Макушка и коробка тела — для облачков и камеры
export const toonHeadTop = (actor: Actor, x: number, y: number) => {
  const s = actor.scale ?? 1;
  const sit = actor.legs === "sit" ? TOON_SIT : 0;
  return { x, y: y + (-TOON_HEIGHT + sit) * s };
};
export const toonBodyBox = (actor: Actor, x: number, y: number) => {
  const s = actor.scale ?? 1;
  const sit = actor.legs === "sit" ? TOON_SIT : 0;
  return { headX: x, headY: y + (TOON_HEAD_Y + sit) * s, top: y + (-TOON_HEIGHT + sit) * s, feet: y, h: (TOON_HEIGHT - sit) * s, headR: TOON_R * s };
};
