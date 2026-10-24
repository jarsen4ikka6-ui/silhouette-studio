// Одна сцена: локация + персонажи под камерой, сверху передний план, плёнка, инфографика и текст
import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { bodyBox, Character, headTop } from "./Character";
import { Hud, mouthAt, ToonBubble, useFilm } from "./film";
import { toonBodyBox, ToonCharacter } from "./Toon";
import { Foreground, LookLayer, OverShoulder, Rain, Vignette } from "./Fx";
import { LOCATIONS } from "./locations";
import { PropView } from "./props";
import { CardView, OverlayView, SCENE_OVERLAYS, SceneOverlay, SpeechText } from "./Texts";
import type { Actor, Scene, ShotSpec } from "./types";
import { along, clamp, ease } from "./util";

const W = 1920;
const H = 1080;

type Placed = { a: Actor; x: number; y: number };

// Какую долю роста героя показывает план (высота кадра = рост × k)
const SHOT_K: Record<string, number> = { full: 1.75, medium: 1.15, close: 0.8, face: 0.55 };
// Размытие фона по умолчанию (px экрана). В toon фон всегда мягкий, люди резкие
const SHOT_DOF: Record<string, number> = { wide: 0, full: 0, medium: 2, close: 5, face: 7, insert: 3, pov: 0, ots: 4 };
const TOON_DOF: Record<string, number> = { wide: 2.5, full: 3, medium: 4, close: 6, face: 8, insert: 3, pov: 1, ots: 5 };
type BoxFn = typeof bodyBox;

// Активный план в момент t: базовый или последняя склейка до t
const activeShot = (scene: Scene, t: number) => {
  const c = scene.camera ?? {};
  const cuts = [...(c.cuts ?? [])].sort((a, b) => a.at - b.at);
  const index = cuts.filter((x) => t >= x.at).length;
  const spec: ShotSpec = index ? cuts[index - 1] : c;
  const from = index ? cuts[index - 1].at : 0;
  const to = index < cuts.length ? cuts[index].at : scene.dur;
  return { spec, from, to, index };
};

// «Камера в руке»: плавное дрожание из суммы синусов (одинаковое на каждом рендере)
const shake = (t: number, seed: number) => Math.sin(t * 1.3 + seed) * 0.6 + Math.sin(t * 2.9 + seed * 2.1) * 0.3 + Math.sin(t * 5.3 + seed * 0.7) * 0.1;

const cameraAt = (scene: Scene, t: number, actors: Placed[], box: BoxFn = bodyBox, dofs = SHOT_DOF) => {
  const c = scene.camera ?? {};
  const legacy = c.zoom !== undefined || c.focus !== undefined;
  const { spec, from, to, index } = activeShot(scene, t);
  const p = clamp((t - from) / Math.max(0.01, to - from));
  let z = 1;
  let fx = W / 2;
  let fy = H / 2;
  const shot = spec.shot ?? (legacy ? undefined : "wide");

  if (legacy && index === 0 && !c.shot) {
    const pp = clamp(t / scene.dur);
    z = Math.max(1, along(c.zoom, pp, 1));
    if (c.focus) {
      const f = c.focus as [number, number] | [[number, number], [number, number]];
      if (Array.isArray(f[0])) {
        const [a, b] = f as [[number, number], [number, number]];
        fx = along([a[0], b[0]], pp, fx);
        fy = along([a[1], b[1]], pp, fy);
      } else [fx, fy] = f as [number, number];
    }
  } else {
    const who = typeof spec.on === "string" ? actors.find((x) => x.a.id === spec.on) : undefined;
    const pt = Array.isArray(spec.on) ? spec.on : null;
    const target = who ?? (shot && SHOT_K[shot] ? actors[0] : undefined);
    if (shot === "insert" || shot === "pov" || (shot === "wide" && spec.size)) {
      const size = spec.size ?? (shot === "wide" ? W : 700);
      z = W / size;
      if (pt) [fx, fy] = pt;
      else if (target) {
        const b = box(target.a, target.x, target.y);
        fx = b.headX;
        fy = (b.top + b.feet) / 2;
      }
    } else if (shot === "ots") {
      // через плечо: держим цель средним планом, а плечо героя рисуем поверх
      if (target) {
        const b = box(target.a, target.x, target.y);
        z = H / (b.h * 1.05);
        fx = b.headX;
        fy = b.headY + (0.14 * H) / z;
      } else if (pt) {
        z = W / (spec.size ?? 900);
        [fx, fy] = pt;
      }
    } else if (shot && SHOT_K[shot] && target) {
      const b = box(target.a, target.x, target.y);
      z = H / (b.h * SHOT_K[shot]);
      const dir = target.a.facing === "left" ? -1 : target.a.facing === "right" ? 1 : 0;
      // запас места туда, куда смотрит герой
      fx = b.headX + (dir * W * (shot === "full" ? 0.12 : 0.16)) / z;
      fy = shot === "full" ? (b.top + b.feet) / 2 - (0.02 * H) / z : b.headY + ((shot === "face" ? 0.06 : 0.14) * H) / z;
    } else if (pt) [fx, fy] = pt;
  }

  // движение камеры за время плана
  const move = spec.move ?? (legacy && index === 0 ? "static" : "push");
  const amt = spec.amount ?? 0.06;
  const e = ease(p);
  let dx = 0;
  let dy = 0;
  if (move === "push") z *= 1 + amt * e;
  if (move === "pull") z *= 1 + amt * (1 - e);
  if (move === "left") dx = -amt * 2 * (e - 0.5);
  if (move === "right") dx = amt * 2 * (e - 0.5);
  if (move === "up") dy = -amt * 2 * (e - 0.5);
  if (move === "down") dy = amt * 2 * (e - 0.5);
  if (move === "drift") {
    z *= 1 + amt * 0.5 * e;
    dx = Math.sin(t * 0.35) * amt * 0.4;
  }
  const hand = spec.handheld ?? (shot === "pov" ? 0.5 : 0);
  if (dx || dy || hand) z = Math.max(z, 1.04 + hand * 0.03);
  fx += (dx * W) / z;
  fy += (dy * H) / z;
  let rot = 0;
  if (hand > 0) {
    fx += (shake(t, 1) * 14 * hand) / z;
    fy += (shake(t, 5) * 10 * hand) / z;
    rot = shake(t, 9) * 0.6 * hand;
  }
  z = clamp(z, 1, 8);
  fx = clamp(fx, W / 2 / z, W - W / 2 / z);
  fy = clamp(fy, H / 2 / z, H - H / 2 / z);
  const dof = spec.dof ?? (shot ? dofs[shot] ?? 0 : 0);
  return { z, fx, fy, rot, dof, shot, spec };
};

// start — с какой секунды ролика начинается сцена (нужно для рта под озвучку и плашек сверху)
export const SceneView: React.FC<{ scene: Scene; start?: number }> = ({ scene, start = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const film = useFilm();
  const toon = film.style === "toon";
  const t = frame / fps;
  const p = clamp(t / scene.dur);
  const fin = scene.fadeIn ?? 0;
  const fout = scene.fadeOut ?? 0;
  const opacity = Math.min(fin > 0 ? clamp(t / fin) : 1, fout > 0 ? clamp((scene.dur - t) / fout) : 1);

  if (scene.card) {
    return (
      <AbsoluteFill style={{ opacity }}>
        <CardView card={scene.card} t={t} />
      </AbsoluteFill>
    );
  }

  const Loc = LOCATIONS[scene.location ?? "bedroom"] ?? LOCATIONS.bedroom;
  const actors: Placed[] = (scene.actors ?? []).map((a) => ({ a, x: along(a.x, p, W / 2), y: along(a.y, p, 900) }));
  const box: BoxFn = toon ? toonBodyBox : bodyBox;
  const cam = cameraAt(scene, t, actors, box, toon ? TOON_DOF : SHOT_DOF);
  // рот открывается у того, чья реплика сейчас звучит, — по громкости озвучки
  const texts = scene.texts ?? [];
  const talkOf = (id: string) => {
    if (!toon) return 0;
    const on = texts.some((tx) => tx.actor === id && (tx.kind === "say" || tx.kind === "offscreen") && t >= (tx.at ?? 0) && t <= (tx.at ?? 0) + (tx.mouth ?? tx.dur ?? Infinity));
    return on ? mouthAt(film, start + t) : 0;
  };
  const toScreen = (x: number, y: number) => ({ x: (x - cam.fx) * cam.z + W / 2, y: (y - cam.fy) * cam.z + H / 2 });
  const overlays = scene.overlays ?? [];
  const inScene = overlays.filter((o) => SCENE_OVERLAYS.includes(o.kind));
  const onScreen = overlays.filter((o) => !SCENE_OVERLAYS.includes(o.kind));
  const look = scene.look === false ? null : scene.look ?? {};
  // фон размывается в координатах сцены, поэтому делим на зум
  const bgBlur = cam.dof / cam.z;
  const loc = <Loc t={t} params={scene.params ?? {}} />;
  // кадр-деталь и вид от первого лица: то, на что смотрим (центр кадра), всегда резкое — размываются только края
  const focus =
    (cam.shot === "insert" || cam.shot === "pov") && bgBlur > 0.05
      ? `radial-gradient(ellipse ${(0.5 * W) / cam.z}px ${(0.5 * H) / cam.z}px at ${cam.fx}px ${cam.fy}px, transparent 60%, black 100%)`
      : undefined;
  const over = cam.shot === "ots" && cam.spec.over ? actors.find((x) => x.a.id === cam.spec.over) : undefined;

  return (
    <AbsoluteFill style={{ background: "#000", opacity, overflow: "hidden" }}>
      <div style={{ position: "absolute", width: W, height: H, transformOrigin: "0 0", transform: `translate(${W / 2}px, ${H / 2}px) rotate(${cam.rot}deg) scale(${cam.z}) translate(${-cam.fx}px, ${-cam.fy}px)` }}>
        {focus ? (
          <>
            <div style={{ position: "absolute", inset: 0 }}>{loc}</div>
            <div style={{ position: "absolute", inset: 0, filter: `blur(${bgBlur}px)`, WebkitMaskImage: focus, maskImage: focus }}>{loc}</div>
          </>
        ) : (
          <div style={{ position: "absolute", inset: 0, filter: bgBlur > 0.05 ? `blur(${bgBlur}px)` : undefined }}>{loc}</div>
        )}
        <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
          {inScene.map((o, i) => <SceneOverlay key={`o${i}`} o={o} t={t} />)}
          {(scene.props ?? []).filter((pr) => !pr.front).map((pr, i) => <PropView key={`b${i}`} prop={pr} t={t} p={p} />)}
          {actors.filter((x) => x !== over).map(({ a, x, y }) =>
            toon ? <ToonCharacter key={a.id} actor={a} t={t} x={x} y={y} talk={talkOf(a.id)} /> : <Character key={a.id} actor={a} t={t} x={x} y={y} />,
          )}
          {(scene.props ?? []).filter((pr) => pr.front).map((pr, i) => <PropView key={`f${i}`} prop={pr} t={t} p={p} />)}
        </svg>
      </div>
      {over ? <OverShoulder actor={over.a} t={t} side={cam.spec.overSide ?? (over.x < cam.fx ? "left" : "right")} /> : null}
      {(scene.fg ?? []).map((f, i) => (
        <Foreground key={i} f={f} sx={(f.x - cam.fx) * cam.z * 1.35 + W / 2} t={t} />
      ))}
      {scene.rain ? <Rain t={t} density={typeof scene.rain === "number" ? scene.rain : 1} /> : null}
      {look ? <LookLayer look={look} t={t} frame={frame} /> : null}
      <Vignette strength={scene.vignette ?? (cam.shot === "pov" ? 0.75 : 0.45)} />
      {onScreen.map((o, i) => (
        <OverlayView key={i} o={o} t={t} />
      ))}
      {film.hud?.length ? <Hud items={film.hud} T={start + t} /> : null}
      {texts.map((tx, i) => {
        const who = actors.find((x) => x.a.id === tx.actor);
        if (toon && tx.bubble === false) return null;
        if (toon && tx.kind !== "notif") {
          const at = tx.at ?? 0;
          const dur = tx.dur ?? scene.dur - at;
          const think = tx.kind === "think";
          if (tx.x !== undefined) return <ToonBubble key={i} text={tx.text} t={t} at={at} dur={dur} x={tx.x} y={tx.y ?? 300} tail="down" think={think} />;
          if (!who || tx.kind === "offscreen") {
            // говорящий за кадром: пузырь у края, хвостик смотрит за край
            const left = tx.side === "left";
            return <ToonBubble key={i} text={tx.text} t={t} at={at} dur={dur} x={left ? 60 : W - 60} y={360} tail={left ? "left" : "right"} think={think} />;
          }
          const b = box(who.a, who.x, who.y);
          const head = toScreen(b.headX, b.headY);
          const r = b.headR * cam.z;
          const top = toScreen(b.headX, b.top);
          if (top.y > 300) return <ToonBubble key={i} text={tx.text} t={t} at={at} dur={dur} x={clamp(head.x, 360, W - 360)} y={top.y - 10} tail="down" think={think} />;
          // голова у верхнего края (крупный план) — пузырь сбоку от головы: туда, где нет других голов, иначе где больше места
          const others = actors.filter((o) => o !== who).map((o) => toScreen(box(o.a, o.x, o.y).headX, 0).x - head.x);
          const room = (sd: number) => Math.min(sd > 0 ? W - head.x : head.x, ...others.filter((d) => d * sd > 0).map((d) => Math.abs(d) - r * 1.2));
          const pref = room(1) === room(-1) ? head.x < W / 2 : room(1) > room(-1);
          // примерная ширина пузыря и сколько места ему нужно сбоку от головы
          const bw = Math.min(720, tx.text.length * 21 + 90);
          const gap = r * 1.15 + 30;
          const fits = (rt: boolean) => room(rt ? 1 : -1) >= bw + gap + 30;
          const right = fits(pref) ? pref : fits(!pref) ? !pref : pref;
          // сбоку не помещается (соседи рядом или голова у края) — над головой, прижав к верху кадра
          const estH = 60 + Math.ceil(tx.text.length / 26) * 48;
          if (!fits(right) && top.y > 120) return <ToonBubble key={i} text={tx.text} t={t} at={at} dur={dur} x={clamp(head.x, 360, W - 360)} y={Math.max(top.y - 10, 40 + estH)} tail="down" think={think} />;
          return <ToonBubble key={i} text={tx.text} t={t} at={at} dur={dur} x={clamp(head.x + (right ? gap : -gap), right ? 40 : bw + 30, right ? W - bw - 30 : W - 40)} y={clamp(head.y - r * 0.35, 200, H - 220)} tail={right ? "left" : "right"} think={think} />;
        }
        let pos = { x: tx.x ?? W / 2, y: tx.y ?? 200 };
        if (who && tx.x === undefined) {
          const top = headTop(who.a, who.x, who.y);
          pos = toScreen(top.x, top.y - 30);
          if (tx.kind === "notif") pos = toScreen(top.x + 90 * (who.a.scale ?? 1), top.y + 60);
          pos.y = Math.max(tx.kind === "notif" ? 200 : 150, pos.y);
          pos.x = clamp(pos.x, 260, W - 260);
        }
        if (tx.kind === "offscreen" && tx.x === undefined) pos = { x: tx.side === "left" ? 330 : W - 330, y: 360 };
        return <SpeechText key={i} item={tx} t={t} x={pos.x} y={pos.y} />;
      })}
    </AbsoluteFill>
  );
};
