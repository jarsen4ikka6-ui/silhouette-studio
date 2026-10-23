// Лёгкая копия ролика для телефона и мессенджеров: 720p, меньше 30 МБ.
// Запуск: npm run small -- <ролик>   -> out/<ролик>-small.mp4
// Берёт ffmpeg, который уже лежит внутри Remotion — ставить ничего не нужно.
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, rmSync, statSync } from "node:fs";
import path from "node:path";

const id = process.argv[2];
if (!id) throw new Error("Укажи ролик: npm run small -- <ролик>");
const src = `out/${id}.mp4`;
if (!existsSync(src)) throw new Error(`Нет ${src} — сначала npm run render -- ${id}`);
const target = Number(process.argv[3] ?? 27); // МБ

const base = path.join("node_modules", "@remotion");
const dir = readdirSync(base).find((d) => d.startsWith("compositor-") && existsSync(path.join(base, d, process.platform === "win32" ? "ffmpeg.exe" : "ffmpeg")));
if (!dir) throw new Error("Не нашёл ffmpeg внутри Remotion — переустанови зависимости: npm install");
const ff = path.join(base, dir, process.platform === "win32" ? "ffmpeg.exe" : "ffmpeg");
const probe = spawnSync(path.join(base, dir, process.platform === "win32" ? "ffprobe.exe" : "ffprobe"), ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", src], { encoding: "utf8" });
const sec = Number(probe.stdout.trim());
if (!sec) throw new Error("Не смог прочитать длину ролика");

// битрейт видео под нужный размер (звук 96 кбит/с)
const kbps = Math.max(250, Math.floor((target * 8192) / sec - 96));
const out = `out/${id}-small.mp4`;
const common = ["-y", "-v", "error", "-i", src, "-vf", "scale=1280:720", "-c:v", "libx264", "-preset", "slow", "-b:v", `${kbps}k`, "-maxrate", `${Math.round(kbps * 1.6)}k`, "-bufsize", `${kbps * 3}k`, "-passlogfile", "out/small-pass"];
console.log(`Сжимаю ${src} -> ${out} (видео ${kbps} кбит/с)...`);
for (const [pass, extra] of [[1, ["-an", "-f", "mp4", process.platform === "win32" ? "NUL" : "/dev/null"]], [2, ["-c:a", "aac", "-b:a", "96k", "-movflags", "+faststart", out]]]) {
  const r = spawnSync(ff, [...common, "-pass", String(pass), ...extra], { stdio: "inherit" });
  if (r.status !== 0) process.exit(r.status ?? 1);
}
for (const f of readdirSync("out")) if (f.startsWith("small-pass")) rmSync(path.join("out", f));
console.log(`Готово: ${out} (${(statSync(out).size / 1048576).toFixed(1)} МБ)`);
