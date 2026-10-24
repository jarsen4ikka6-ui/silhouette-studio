// Лист превью: 9 сцен ролика сеткой 3×3 с номерами — чтобы проверить весь ролик глазами за пару картинок
import React from "react";
import { AbsoluteFill, Freeze } from "remotion";
import { HeroSkin, skinOf } from "./Character";
import { PROJECTS } from "./projects";
import { SceneView } from "./SceneView";
import { timeline } from "./Video";

export const SheetView: React.FC<{ id: string; page: number; at: number }> = ({ id, page, at }) => {
  const project = PROJECTS.find(([k]) => k === id)?.[1];
  if (!project) return <AbsoluteFill style={{ background: "#000", color: "#fff", fontSize: 48 }}>Нет ролика {id}</AbsoluteFill>;
  const cells = timeline(project).slice(page * 9, page * 9 + 9);
  return (
    <HeroSkin.Provider value={skinOf(project.hero)}>
    <AbsoluteFill style={{ background: "#000" }}>
      {cells.map(({ scene }, i) => {
        const n = page * 9 + i + 1;
        const frame = Math.max(0, Math.round(scene.dur * at * project.fps));
        return (
          <div key={n} style={{ position: "absolute", left: (i % 3) * 640, top: Math.floor(i / 3) * 360, width: 640, height: 360, overflow: "hidden" }}>
            <div style={{ position: "absolute", width: 1920, height: 1080, transform: "scale(0.3333)", transformOrigin: "0 0" }}>
              <Freeze frame={frame}>
                <SceneView scene={scene} />
              </Freeze>
            </div>
            <div style={{ position: "absolute", left: 0, top: 0, background: "#000", color: "#ffd400", font: "700 30px sans-serif", padding: "2px 10px" }}>{n}</div>
          </div>
        );
      })}
    </AbsoluteFill>
    </HeroSkin.Provider>
  );
};
