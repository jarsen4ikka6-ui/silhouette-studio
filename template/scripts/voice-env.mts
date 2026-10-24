// Громкость озвучки по кадрам — по ней в стиле toon открывается рот у того, кто сейчас говорит.
// Запуск: npm run env -- <ролик>   (обычно сам вызывается из npm run timing)
// Берёт озвучку из transcripts/<ролик>.json (поле voice, файл в public/), пишет transcripts/<ролик>.env.json:
// { fps: 30, env: [0..100, …] } — одно число на каждую 1/30 секунды, 100 = громкая речь.
import { registerMediabunnyServer } from "@mediabunny/server";
import { ALL_FORMATS, Conversion, FilePathSource, Input, NullTarget, Output, WavOutputFormat } from "mediabunny";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const RATE = 16000;
const FPS = 30;
const name = process.argv[2];
if (!name || !/^[a-zA-Z0-9-]+$/.test(name)) throw new Error("Укажи имя ролика: npm run env -- 01-bez-telefonov");
const tr = JSON.parse(await readFile(`transcripts/${name}.json`, "utf8"));
const file = process.argv[3] ?? path.join("public", tr.voice);

registerMediabunnyServer();
const chunks: { startFrame: number; waveform: Float32Array }[] = [];
using input = new Input({ formats: ALL_FORMATS, source: new FilePathSource(file) });
const audioTrack = await input.getPrimaryAudioTrack();
if (audioTrack === null) throw new Error("В файле нет звука.");
const conversion = await Conversion.init({
  input,
  output: new Output({ format: new WavOutputFormat(), target: new NullTarget() }),
  video: { discard: true },
  audio: (track) => {
    if (track.id !== audioTrack.id) return { discard: true };
    return {
      codec: "pcm-f32",
      forceTranscode: true,
      numberOfChannels: 1,
      sampleFormat: "f32",
      sampleRate: RATE,
      process: (sample) => {
        const waveform = new Float32Array(sample.allocationSize({ format: "f32", planeIndex: 0 }) / Float32Array.BYTES_PER_ELEMENT);
        sample.copyTo(waveform, { format: "f32", planeIndex: 0 });
        chunks.push({ startFrame: Math.round(sample.timestamp * RATE), waveform });
        return sample;
      },
    };
  },
});
if (!conversion.isValid) throw new Error("Не получилось прочитать аудио.");
await conversion.execute();

const total = chunks.reduce((m, c) => Math.max(m, c.startFrame + c.waveform.length), 0);
const wave = new Float32Array(total);
for (const c of chunks) {
  const dst = Math.max(0, c.startFrame);
  const src = Math.max(0, -c.startFrame);
  const len = Math.min(c.waveform.length - src, wave.length - dst);
  if (len > 0) wave.set(c.waveform.subarray(src, src + len), dst);
}

// RMS в окне кадра (с небольшим перекрытием, чтобы рот не дёргался)
const hop = RATE / FPS;
const n = Math.ceil(total / hop);
const rms = new Float32Array(n);
for (let i = 0; i < n; i++) {
  const a = Math.max(0, Math.round((i - 0.5) * hop));
  const b = Math.min(total, Math.round((i + 1.5) * hop));
  let s = 0;
  for (let k = a; k < b; k++) s += wave[k] * wave[k];
  rms[i] = Math.sqrt(s / Math.max(1, b - a));
}
// нормируем по громкой речи (95-й перцентиль), а не по самому громкому крику
const sorted = Array.from(rms).filter((v) => v > 1e-4).sort((x, y) => x - y);
const ref = sorted[Math.floor(sorted.length * 0.95)] ?? 1;
const env = Array.from(rms, (v) => Math.min(100, Math.round((v / ref) * 100)));
await writeFile(`transcripts/${name}.env.json`, JSON.stringify({ fps: FPS, env }));
console.log(`Громкость озвучки: ${n} кадров (${(total / RATE).toFixed(1)} c) -> transcripts/${name}.env.json`);
