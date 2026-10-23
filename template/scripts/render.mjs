// Рендер ролика в MP4.
// Запуск: npm run render -- <ролик>                — весь ролик -> out/<ролик>.mp4
//         npm run render -- <ролик> --seconds 10   — только первые 10 секунд (быстрый тест)
//         npm run render -- <ролик> --small        — и сразу лёгкая копия для телефона (out/<ролик>-small.mp4)
import { spawn, spawnSync } from "node:child_process";
import { mkdirSync, statSync } from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";

const { values, positionals } = parseArgs({ allowPositionals: true, options: { seconds: { type: "string" }, from: { type: "string", default: "0" }, out: { type: "string" }, concurrency: { type: "string" }, small: { type: "boolean" } } });
const id = positionals[0];
if (!id) throw new Error("Укажи ролик: npm run render -- <ролик> (имя файла из data/ без .json)");
const out = values.out ?? `out/${id}${values.seconds ? "-test" : ""}.mp4`;
const args = [path.join("node_modules", "@remotion", "cli", "remotion-cli.js"), "render", id, out, "--gl=angle", "--codec=h264", "--crf=18"];
if (values.seconds) {
  const a = Math.round(Number(values.from) * 30);
  args.push(`--frames=${a}-${a + Math.round(Number(values.seconds) * 30) - 1}`);
}
if (values.concurrency) args.push(`--concurrency=${values.concurrency}`);

mkdirSync("out", { recursive: true });
const t0 = Date.now();
console.log(`Рендер ${id} -> ${out}`);
const child = spawn(process.execPath, args, { stdio: ["inherit", "pipe", "pipe"] });
let lastPct = -10;
const onData = (b) => {
  for (const line of b.toString().split(/\r?\n|\r/)) {
    if (!line.trim() || /^Bundling \d+%/.test(line)) continue;
    const m = line.match(/Rendered (\d+)\/(\d+)/);
    if (m) {
      const pct = Math.floor((Number(m[1]) / Number(m[2])) * 100);
      if (pct >= lastPct + 10 || m[1] === m[2]) {
        lastPct = pct;
        console.log(`  ${pct}%  (${m[1]}/${m[2]} кадров)`);
      }
      continue;
    }
    console.log(line);
  }
};
child.stdout.on("data", onData);
child.stderr.on("data", onData);
child.on("exit", (code) => {
  const sec = (Date.now() - t0) / 1000;
  if (code === 0) console.log(`\nГотово за ${Math.floor(sec / 60)} мин ${Math.round(sec % 60)} с -> ${out} (${(statSync(out).size / 1048576).toFixed(1)} МБ)`);
  else console.log(`\nРендер упал с кодом ${code} через ${sec.toFixed(0)} с`);
  if (code === 0 && values.small && !values.seconds && !values.out) {
    const r = spawnSync(process.execPath, ["scripts/small.mjs", id], { stdio: "inherit" });
    process.exit(r.status ?? 1);
  }
  process.exit(code ?? 1);
});
