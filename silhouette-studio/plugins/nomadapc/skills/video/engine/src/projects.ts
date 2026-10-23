import type { Project } from "./types";

// Все ролики студии = все раскадровки data/*.json (их пишет npm run timing).
// Имя композиции = имя файла: data/01-bez-telefonov.json -> 01-bez-telefonov
const ctx = require.context("../data", false, /\.json$/);
export const PROJECTS: [string, Project][] = ctx
  .keys()
  .filter((k) => k.startsWith("./"))
  .map((k) => [k.slice(2, -5).replace(/[^a-zA-Z0-9-]/g, "-"), ctx<Project>(k)] as [string, Project])
  .filter(([, p]) => Array.isArray(p?.scenes) && p.scenes.length > 0);
