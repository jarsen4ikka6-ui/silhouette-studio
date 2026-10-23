// Звуковые эффекты синтезом -> public/sfx/*.wav. Без чужих записей и авторских прав.
// Запуск: npm run sfx
import { FS, TAU, buf, env, fade, makeLoop, makeNoise, noiseHit, normalize, reverb, svf, writeWav } from "./dsp.mjs";

const OUT = "public/sfx";
const save = (name, b, peak = 0.85) => {
  writeWav(`${OUT}/${name}.wav`, [normalize(b, peak)]);
  console.log(`  sfx/${name}.wav`);
};

// дождь: шелест + отдельные капли, играет по кругу
{
  const b = buf(8.5);
  const rnd = makeNoise(7);
  const hp = svf();
  const lp = svf();
  for (let i = 0; i < b.length; i++) {
    const n = rnd();
    b[i] = hp(n, 4200, 0.6).band * 0.5 + lp(n, 500, 0.5).low * 0.6;
  }
  const r2 = makeNoise(99);
  for (let k = 0; k < 260; k++) noiseHit(b, (r2() * 0.5 + 0.5) * 8.3, 2500 + (r2() + 1) * 2500, 90, 0.35, k + 3, 3);
  save("rain", makeLoop(b), 0.7);
}

// комната: тихий низкий гул
{
  const b = buf(8.5);
  const rnd = makeNoise(5);
  const lp = svf();
  for (let i = 0; i < b.length; i++) b[i] = lp(rnd(), 260, 0.5).low + Math.sin((TAU * 60 * i) / FS) * 0.01;
  save("room", makeLoop(b), 0.5);
}

// птицы: короткие трели на фоне лёгкого ветра
{
  const b = buf(8.5);
  const rnd = makeNoise(17);
  const lp = svf();
  for (let i = 0; i < b.length; i++) b[i] = lp(rnd(), 350, 0.5).low * 0.25;
  const r = makeNoise(31);
  let t = 0.2;
  while (t < 7.8) {
    const notes = 2 + Math.floor((r() + 1) * 3);
    const base = 2600 + (r() + 1) * 1400;
    for (let k = 0; k < notes; k++) {
      const st = t + k * 0.09;
      const dur = 0.05 + (r() + 1) * 0.03;
      const i0 = Math.floor(st * FS);
      let ph = 0;
      for (let i = 0; i < dur * FS && i0 + i < b.length; i++) {
        const x = i / (dur * FS);
        const f = base * (1 + 0.35 * Math.sin(x * Math.PI)) + (k % 2) * 300;
        ph += (TAU * f) / FS;
        b[i0 + i] += Math.sin(ph) * Math.sin(x * Math.PI) * 0.35;
      }
    }
    t += 0.5 + (r() + 1) * 0.9;
  }
  save("birds", makeLoop(b), 0.6);
}

// уведомление «динь»
{
  const b = buf(1.6);
  for (let i = 0; i < b.length; i++) {
    const t = i / FS;
    b[i] = Math.sin(TAU * 1318.5 * t) * env(t, 0.003, 4) * 0.6 + Math.sin(TAU * 1975.5 * (t - 0.09)) * env(t - 0.09, 0.003, 3.5) * (t > 0.09 ? 0.5 : 0);
  }
  save("ding", reverb(b, 0.25), 0.7);
}

// будильник телефона: три пары писков
{
  const b = buf(1.9);
  for (let i = 0; i < b.length; i++) {
    const t = i / FS;
    const ph = t % 0.6;
    const on = ph < 0.1 || (ph > 0.16 && ph < 0.26) ? 1 : 0;
    b[i] = on * (Math.sin(TAU * 1760 * t) * 0.6 + Math.sin(TAU * 3520 * t) * 0.15);
  }
  const s = svf();
  for (let i = 0; i < b.length; i++) b[i] = s(b[i], 3000, 0.7).low;
  save("alarm", b, 0.6);
}

// вибрация телефона
{
  const b = buf(1.2);
  for (let i = 0; i < b.length; i++) {
    const t = i / FS;
    const on = t % 0.45 < 0.3 ? 1 : 0;
    b[i] = on * Math.sign(Math.sin(TAU * 170 * t)) * 0.5;
  }
  const s = svf();
  for (let i = 0; i < b.length; i++) b[i] = s(b[i], 400, 0.7).low;
  save("buzz", fade(b, 0.01, 0.05), 0.6);
}

// часы: тик-так
{
  const b = buf(1.1);
  noiseHit(b, 0.0, 3200, 160, 1, 3, 6);
  noiseHit(b, 0.5, 2400, 160, 0.8, 4, 6);
  save("tick", b, 0.6);
}

// шаг
{
  const b = buf(0.4);
  for (let i = 0; i < b.length; i++) {
    const t = i / FS;
    b[i] = Math.sin(TAU * 75 * t) * env(t, 0.004, 40) * 0.8;
  }
  noiseHit(b, 0, 900, 45, 0.6, 9, 0.8);
  save("step", b, 0.7);
}

// щелчок выключателя
{
  const b = buf(0.3);
  noiseHit(b, 0, 2800, 260, 1, 11, 4);
  noiseHit(b, 0.035, 1800, 200, 0.6, 12, 4);
  save("click", b, 0.7);
}

// вздох: выдох через «шум дыхания»
{
  const b = buf(1.7);
  const rnd = makeNoise(21);
  const f1 = svf();
  const f2 = svf();
  for (let i = 0; i < b.length; i++) {
    const t = i / FS;
    const a = t < 0.25 ? t / 0.25 : Math.exp(-(t - 0.25) * 2.4);
    const n = rnd();
    b[i] = (f1(n, 1100 - t * 300, 2.2).band * 0.7 + f2(n, 600 - t * 120, 3).band * 0.5) * a;
  }
  save("sigh", fade(b, 0.02, 0.2), 0.55);
}

// свист перехода
{
  const b = buf(0.9);
  const rnd = makeNoise(41);
  const f = svf();
  for (let i = 0; i < b.length; i++) {
    const t = i / FS;
    const x = t / 0.9;
    b[i] = f(rnd(), 300 + Math.sin(x * Math.PI) * 2400, 1.4).band * Math.sin(x * Math.PI);
  }
  save("whoosh", b, 0.6);
}

// нарастание к светлому финалу: шум и мягкий мажорный аккорд
{
  const b = buf(3.2);
  const rnd = makeNoise(51);
  const f = svf();
  for (let i = 0; i < b.length; i++) {
    const t = i / FS;
    const a = Math.min(1, t / 2.2) * (t > 2.4 ? Math.max(0, 1 - (t - 2.4) / 0.8) : 1);
    b[i] = f(rnd(), 400 + t * 1600, 0.8).band * a * 0.4;
    for (const fr of [523.25, 659.25, 783.99, 1046.5]) b[i] += Math.sin(TAU * fr * t) * a * 0.08;
  }
  save("rise", reverb(b, 0.35), 0.6);
}
// удар током / искра: треск и короткий гул
{
  const b = buf(0.8);
  const rnd = makeNoise(61);
  const f = svf();
  for (let i = 0; i < b.length; i++) {
    const t = i / FS;
    const crackle = rnd() * (Math.sin(TAU * 31 * t) > 0.2 ? 1 : 0.15);
    b[i] = (f(crackle, 3500, 0.9).band * 0.8 + Math.sign(Math.sin(TAU * 120 * t)) * 0.18) * Math.exp(-t * 4.5);
  }
  save("zap", fade(b, 0.003, 0.1), 0.7);
}

// гудок в трубке
{
  const b = buf(1.6);
  for (let i = 0; i < b.length; i++) {
    const t = i / FS;
    b[i] = Math.sin(TAU * 425 * t) * 0.5 * (t < 1.2 ? 1 : 0);
  }
  save("dial", fade(b, 0.01, 0.4), 0.45);
}

// гул толпы: невнятные голоса на фоне (кафе, метро, двор)
{
  const b = buf(8.5);
  const rnd = makeNoise(71);
  const f1 = svf();
  const f2 = svf();
  for (let i = 0; i < b.length; i++) {
    const t = i / FS;
    const n = rnd();
    const m = 0.6 + 0.4 * Math.sin(TAU * 2.3 * t) * Math.sin(TAU * 0.7 * t + 1);
    b[i] = (f1(n, 500 + Math.sin(TAU * 3.1 * t) * 120, 4).band + f2(n, 1200 + Math.sin(TAU * 1.7 * t) * 300, 5).band * 0.6) * m;
  }
  save("crowd", makeLoop(b), 0.45);
}
console.log("Звуки готовы");
