import React from "react";
import { Composition } from "remotion";
import { SheetView } from "./Sheet";
import { PROJECTS } from "./projects";
import { FilmVideo, totalDuration } from "./Video";

export const RemotionRoot: React.FC = () => (
  <>
    {PROJECTS.map(([id, project]) => (
      <Composition
        key={id}
        id={id}
        component={FilmVideo}
        defaultProps={{ project }}
        durationInFrames={Math.max(1, Math.ceil(totalDuration(project) * project.fps))}
        fps={project.fps}
        width={project.width}
        height={project.height}
      />
    ))}
    {/* лист превью: 9 сцен ролика сеткой 3×3 (npm run preview) */}
    <Composition id="Sheet" component={SheetView} defaultProps={{ id: PROJECTS[0]?.[0] ?? "", page: 0, at: 0.6 }} durationInFrames={30 * 60 * 60} fps={30} width={1920} height={1080} />
  </>
);
