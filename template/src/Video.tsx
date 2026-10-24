// Весь ролик: сцены подряд, музыка по главам, звуки
import { Audio } from "@remotion/media";
import React, { useMemo } from "react";
import { AbsoluteFill, Sequence, staticFile, useVideoConfig } from "remotion";
import { HeroSkin, skinOf } from "./Character";
import { Film } from "./film";
import { toonSkin } from "./Toon";
import { SceneView } from "./SceneView";
import type { Project, Sfx } from "./types";
import { dbToGain } from "./util";

// Звонкие звуки приглушаем отдельно, чтобы они не выпрыгивали из микса
const SFX_GAIN: Record<string, number> = { ding: 0.5, alarm: 0.45, buzz: 0.6, step: 0.55, birds: 0.6, tick: 0.5, click: 0.7, rise: 0.7, whoosh: 0.7, sigh: 0.9, zap: 0.55, dial: 0.4 };
// фоновые звуки сцены. Шума толпы («crowd») нет и не будет: он звучит как ветер и портит ролик — такой фон просто не играет
const AMBIENCE_GAIN: Record<string, number> = { rain: 0.55, "rain-indoor": 0.22, birds: 0.35, room: 0.2 };

export const timeline = (project: Project) => {
  let acc = 0;
  return project.scenes.map((s) => {
    const start = acc;
    acc += s.dur;
    return { scene: s, start, end: acc };
  });
};

export const filmOf = (project: Project) => ({ style: project.style ?? "silhouette", env: project.voiceEnv, voiceAt: project.voiceAt ?? 0, hud: project.hud });

export const totalDuration = (project: Project) => project.scenes.reduce((a, s) => a + s.dur, 0);

// Диктор: если есть озвучка, музыку держим тише
const VOICE_DUCK_DB = -8;

const XFADE = 2;

export const FilmVideo: React.FC<{ project: Project }> = ({ project }) => {
  const { fps } = useVideoConfig();
  const tl = useMemo(() => timeline(project), [project]);
  const total = totalDuration(project);
  const sfxGain = dbToGain(project.sfxDb ?? -10);
  const musicGain = dbToGain((project.musicDb ?? -14) + (project.voice ? VOICE_DUCK_DB : 0));
  const voiceGain = dbToGain(project.voiceDb ?? 0);

  // звуки сцен + шаги для идущих персонажей
  const sfx = useMemo(() => {
    const list: Sfx[] = [];
    tl.forEach(({ scene, start }) => {
      (scene.sfx ?? []).forEach((x) => list.push({ ...x, at: start + x.at }));
      (scene.actors ?? []).forEach((a) => {
        if (a.legs !== "walk" && a.legs !== "run") return;
        const every = a.legs === "run" ? 0.31 : 0.5;
        for (let tt = 0.25; tt < scene.dur - 0.1; tt += every) list.push({ name: "step", at: start + tt, volume: 0.8 });
      });
    });
    return list;
  }, [tl]);

  const parts = project.music ?? [];

  return (
    <Film.Provider value={filmOf(project)}>
    <HeroSkin.Provider value={project.style === "toon" ? toonSkin(project.hero) : skinOf(project.hero)}>
    <AbsoluteFill style={{ background: "#000" }}>
      {tl.map(({ scene, start, end }, i) => {
        const from = Math.round(start * fps);
        const dur = Math.max(1, Math.round(end * fps) - from);
        return (
          <Sequence key={i} from={from} durationInFrames={dur} premountFor={Math.round(fps * 0.5)} name={`${i + 1}. ${scene.card ? scene.card.kind : scene.location} ${scene.note ?? ""}`}>
            <SceneView scene={scene} start={start} />
            {scene.ambience && AMBIENCE_GAIN[scene.ambience] ? (
              <Audio src={staticFile(`sfx/${scene.ambience === "rain-indoor" ? "rain" : scene.ambience}.wav`)} loop volume={(f) => sfxGain * (AMBIENCE_GAIN[scene.ambience!] ?? 0.3) * Math.min(1, f / 8, (dur - f) / 8)} />
            ) : null}
          </Sequence>
        );
      })}
      {project.musicFile ? (
        <Audio src={staticFile(project.musicFile)} loop volume={(f) => musicGain * Math.min(1, f / fps, (total * fps - f) / (2.5 * fps))} />
      ) : (
        parts.map((p, i) => {
          const start = Math.max(0, p.from - (i ? XFADE / 2 : 0));
          const end = i + 1 < parts.length ? parts[i + 1].from + XFADE / 2 : total;
          const from = Math.round(start * fps);
          const dur = Math.max(1, Math.round(end * fps) - from);
          const fi = i === 0 ? 1 : XFADE * fps;
          const fo = i + 1 < parts.length ? XFADE * fps : 2.5 * fps;
          const g = musicGain * dbToGain(p.db ?? 0);
          return (
            <Sequence key={`m${i}`} from={from} durationInFrames={dur} layout="none" name={`music ${p.mood}`}>
              <Audio src={staticFile(`music/${project.id}-${i + 1}.wav`)} volume={(f) => g * Math.min(1, f / fi, (dur - f) / fo)} />
            </Sequence>
          );
        })
      )}
      {project.voice ? (
        <Sequence from={Math.round((project.voiceAt ?? 0) * fps)} layout="none" name="voice">
          <Audio src={staticFile(project.voice)} volume={voiceGain} />
        </Sequence>
      ) : null}
      {sfx.map((x, i) => (
        <Sequence key={`s${i}`} from={Math.max(0, Math.round(x.at * fps))} durationInFrames={Math.round(fps * 4)} layout="none">
          <Audio src={staticFile(`sfx/${x.name}.wav`)} volume={sfxGain * (SFX_GAIN[x.name] ?? 1) * (x.volume ?? 1)} />
        </Sequence>
      ))}
    </AbsoluteFill>
    </HeroSkin.Provider>
    </Film.Provider>
  );
};
