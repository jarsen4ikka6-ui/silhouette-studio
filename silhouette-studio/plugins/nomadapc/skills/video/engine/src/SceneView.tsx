// Одна сцена: локация + персонажи под камерой, сверху эффекты и текст
import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { Character, headTop } from "./Character";
import { Rain, Vignette } from "./Fx";
import { LOCATIONS } from "./locations";
import { PropView } from "./props";
import { CardView, OverlayView, SpeechText } from "./Texts";
import type { Scene } from "./types";
import { along, clamp } from "./util";

const W = 1920;
const H = 1080;

// Камера: зум и точка фокуса, которые плавно меняются за сцену
const cameraAt = (scene: Scene, p: number) => {
  const c = scene.camera ?? {};
  const z = Math.max(1, along(c.zoom, p, 1));
  let fx = W / 2;
  let fy = H / 2;
  if (c.focus) {
    const f = c.focus as [number, number] | [[number, number], [number, number]];
    if (Array.isArray(f[0])) {
      const [a, b] = f as [[number, number], [number, number]];
      fx = along([a[0], b[0]], p, fx);
      fy = along([a[1], b[1]], p, fy);
    } else {
      [fx, fy] = f as [number, number];
    }
  }
  // не даём камере выехать за край картинки
  fx = clamp(fx, W / 2 / z, W - W / 2 / z);
  fy = clamp(fy, H / 2 / z, H - H / 2 / z);
  return { z, fx, fy };
};

export const SceneView: React.FC<{ scene: Scene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
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
  const cam = cameraAt(scene, p);
  const toScreen = (x: number, y: number) => ({ x: (x - cam.fx) * cam.z + W / 2, y: (y - cam.fy) * cam.z + H / 2 });
  const actors = (scene.actors ?? []).map((a) => ({ a, x: along(a.x, p, W / 2), y: along(a.y, p, 900) }));

  return (
    <AbsoluteFill style={{ background: "#000", opacity, overflow: "hidden" }}>
      <div style={{ position: "absolute", width: W, height: H, transformOrigin: "0 0", transform: `translate(${W / 2}px, ${H / 2}px) scale(${cam.z}) translate(${-cam.fx}px, ${-cam.fy}px)` }}>
        <Loc t={t} params={scene.params ?? {}} />
        <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
          {(scene.props ?? []).filter((pr) => !pr.front).map((pr, i) => <PropView key={`b${i}`} prop={pr} t={t} p={p} />)}
          {actors.map(({ a, x, y }) => (
            <Character key={a.id} actor={a} t={t} x={x} y={y} />
          ))}
          {(scene.props ?? []).filter((pr) => pr.front).map((pr, i) => <PropView key={`f${i}`} prop={pr} t={t} p={p} />)}
        </svg>
      </div>
      {scene.rain ? <Rain t={t} density={typeof scene.rain === "number" ? scene.rain : 1} /> : null}
      <Vignette strength={scene.vignette ?? 0.6} />
      {(scene.overlays ?? []).map((o, i) => (
        <OverlayView key={i} o={o} t={t} />
      ))}
      {(scene.texts ?? []).map((tx, i) => {
        const who = actors.find((x) => x.a.id === tx.actor);
        let pos = { x: tx.x ?? W / 2, y: tx.y ?? 200 };
        if (who && tx.x === undefined) {
          const top = headTop(who.a, who.x, who.y);
          pos = toScreen(top.x, top.y - 30);
          if (tx.kind === "notif") pos = toScreen(top.x + 90 * (who.a.scale ?? 1), top.y + 60);
          pos.y = Math.max(tx.kind === "notif" ? 200 : 150, pos.y);
        }
        if (tx.kind === "offscreen" && tx.x === undefined) pos = { x: tx.side === "left" ? 330 : W - 330, y: 360 };
        return <SpeechText key={i} item={tx} t={t} x={pos.x} y={pos.y} />;
      })}
    </AbsoluteFill>
  );
};
