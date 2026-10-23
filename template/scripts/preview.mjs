// Превью ролика картинками.
// Запуск: npm run preview -- <ролик>            — листы 3×3 со всеми сценами -> out/preview/<ролик>-sheet-N.jpg
//         npm run preview -- <ролик> 3 5        — отдельные кадры сцен 3 и 5 -> out/preview/<ролик>-03.jpg
//         npm run preview -- <ролик> --at 0.8   — кадр на 80% длины сцены (по умолчанию 0.6)
// <ролик> — имя файла раскадровки из data/ без .json
import { bundle } from "@remotion/bundler";
import { getCompositions, renderStill, selectComposition } from "@remotion/renderer";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";

const { values, positionals } = parseArgs({ allowPositionals: true, options: { at: { type: "string", default: "0.6" }, scale: { type: "string", default: "0.5" } } });
const id = positionals[0];
const only = positionals.slice(1).map(Number).filter(Boolean);
const at = Number(values.at);
const opts = { chromiumOptions: { gl: "angle" }, logLevel: "error" };

const t0 = Date.now();
console.log("Собираю проект...");
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
if (!id) {
  const all = (await getCompositions(serveUrl, opts)).map((c) => c.id).filter((x) => x !== "Sheet");
  console.log(`Укажи ролик: npm run preview -- <ролик>. Есть: ${all.join(", ") || "пока ни одного (сначала npm run timing)"}`);
  process.exit(1);
}
const composition = await selectComposition({ serveUrl, id, ...opts });
const project = composition.props.project;
mkdirSync("out/preview", { recursive: true });

if (!only.length) {
  // листы по 9 сцен
  const pages = Math.ceil(project.scenes.length / 9);
  for (let page = 0; page < pages; page++) {
    const inputProps = { id, page, at };
    const sheet = await selectComposition({ serveUrl, id: "Sheet", inputProps, ...opts });
    const output = `out/preview/${id}-sheet-${page + 1}.jpg`;
    await renderStill({ serveUrl, composition: sheet, inputProps, frame: 0, output, imageFormat: "jpeg", jpegQuality: 82, ...opts });
    console.log(`${output}  (сцены ${page * 9 + 1}–${Math.min(project.scenes.length, page * 9 + 9)})`);
  }
} else {
  let start = 0;
  for (const [i, s] of project.scenes.entries()) {
    const n = i + 1;
    const a = start;
    start += s.dur;
    if (!only.includes(n)) continue;
    const frame = Math.min(composition.durationInFrames - 1, Math.round((a + s.dur * at) * project.fps));
    const output = `out/preview/${id}-${String(n).padStart(2, "0")}.jpg`;
    await renderStill({ serveUrl, composition, frame, output, imageFormat: "jpeg", jpegQuality: 85, scale: Number(values.scale), ...opts });
    console.log(`${output}  (${a.toFixed(1)} c) ${s.note ?? ""}`);
  }
}
console.log(`Готово за ${((Date.now() - t0) / 1000).toFixed(0)} c`);
