// Постановка сцены: то, что движок поправляет сам, и то, о чём предупреждает перед рендером.
// Правила сняты с ролика конкурента: люди смотрят на собеседника или предмет, рука тянется туда же,
// машины едут капотом вперёд, стол ниже груди сидящего, вещи стоят на поверхности, а не висят.

// Высота верха поверхности над полом при scale 1 (см. src/props-toon.tsx)
export const TOPS = { "t-table": 130, "t-desk": 130, "t-counter": 170, "t-stool": 88, "t-chair": 88, "t-sofa": 96 };
// Полуширина поверхности (для «стоит ли предмет над ней» и «сидит ли человек внутри стола»)
const HALF = {
  "t-table": (p) => (p.params?.w ?? 560) / 2 + 10,
  "t-desk": () => 170,
  "t-counter": (p) => (p.params?.w ?? 620) / 2 + 14,
  "t-stool": () => 50,
  "t-chair": () => 68,
  "t-sofa": (p) => (p.params?.w ?? 420) / 2,
};
const SEATS = new Set(["t-stool", "t-chair", "t-sofa"]);
const TABLES = new Set(["t-table", "t-desk"]);
// мелкие вещи, которые стоят на полу или на поверхности (не в руке и не в воздухе)
const ITEMS = new Set(["t-money", "t-cash-pile", "t-terminal", "t-receipt", "t-pizza", "t-bread", "t-bag"]);
// предметы с «передом», нарисованные лицом вправо: едут влево — разворачиваются (src/props.tsx, FACES_RIGHT)
const VEHICLES = new Set(["t-taxi", "car"]);
// жесты, у которых рука идёт к цели
const AIMED = new Set(["reach", "point"]);

const first = (v) => (Array.isArray(v) ? v[0] : v);
const last = (v) => (Array.isArray(v) ? v[1] : v);
const sc = (o) => o.scale ?? 1;
const dirOf = (f) => (f === "left" ? -1 : f === "right" ? 1 : 0);
const sideWord = (d) => (d < 0 ? "left" : "right");

export function stage(scenes, { toon, warns }) {
  const notes = [];
  scenes.forEach((s, i) => {
    const N = `Сцена ${i + 1}${s.note ? ` («${s.note}»)` : ""}`;
    const props = s.props ?? [];
    const actors = s.actors ?? [];

    // 1. "on": предмет на поверхность — x хозяина (+dx), y = верх поверхности
    for (const p of props) {
      if (!p.on) continue;
      const kind = typeof p.on === "string" ? p.on : p.on.kind;
      const hosts = props.filter((h) => h !== p && h.kind === kind);
      if (!hosts.length || TOPS[kind] === undefined) {
        warns.push(`${N}: «${p.kind}» стоит on: «${kind}», а ${TOPS[kind] === undefined ? "у такого предмета нет верха (можно: " + Object.keys(TOPS).join(", ") + ")" : "такого предмета в сцене нет"}`);
        delete p.on;
        continue;
      }
      const host = p.x === undefined ? hosts[0] : hosts.reduce((a, b) => (Math.abs(first(b.x) - first(p.x)) < Math.abs(first(a.x) - first(p.x)) ? b : a));
      if (p.x === undefined) p.x = first(host.x) + (p.dx ?? 0);
      p.y = Math.round(first(host.y) - TOPS[kind] * sc(host));
      if (host.front && p.front === undefined) p.front = true;
      delete p.on;
      delete p.dx;
    }

    // 2. машины: едут влево — разворачиваются сами; flip против хода — ошибка
    for (const p of props) {
      if (!VEHICLES.has(p.kind)) continue;
      // старая запись «drive: 80, flip: true» значила «едет влево» — теперь это drive: -80
      if (p.flip === true && !Array.isArray(p.x) && Number(p.params?.drive ?? 0) > 0) p.params.drive = -p.params.drive;
      const mv = Array.isArray(p.x) ? p.x[1] - p.x[0] : Number(p.params?.drive ?? 0);
      if (mv && p.flip !== undefined && p.flip !== mv < 0) {
        notes.push(`${N}: «${p.kind}» ехал задом наперёд (flip против движения) — развернул`);
        p.flip = mv < 0;
      }
    }

    // 3. вещи на поверхности: чуть мимо — ставим ровно на столешницу, сильно мимо — предупреждаем
    for (const p of props) {
      if (!ITEMS.has(p.kind) || Array.isArray(p.y) || Array.isArray(p.x)) continue;
      const host = props.find((h) => TOPS[h.kind] !== undefined && !SEATS.has(h.kind) && Math.abs(first(h.x) - p.x) <= HALF[h.kind](h) * sc(h));
      if (!host) continue;
      const top = first(host.y) - TOPS[host.kind] * sc(host);
      const floor = first(host.y);
      if (Math.abs(p.y - top) <= 2 || Math.abs(p.y - floor) <= 12) continue;
      if (Math.abs(p.y - top) <= 70) {
        notes.push(`${N}: «${p.kind}» висел над «${host.kind}» или был в нём (y ${p.y}) — поставил на верх (y ${Math.round(top)})`);
        p.y = Math.round(top);
        if (host.front && p.front === undefined) p.front = true;
      } else warns.push(`${N}: «${p.kind}» на y ${p.y}, а верх «${host.kind}» на y ${Math.round(top)} — предмет висит в воздухе. Пиши "on": "${host.kind}"`);
    }

    // 4. люди
    const others = (a) => actors.filter((b) => b !== a);
    for (const a of actors) {
      const x0 = first(a.x ?? 960);
      const move = Array.isArray(a.x) ? a.x[1] - a.x[0] : 0;
      const legs = a.legs ?? "stand";
      const going = legs === "walk" || legs === "run";
      // идёт — смотрит туда, куда идёт (иначе «лунная походка»)
      if (Math.abs(move) > 30) {
        const want = sideWord(move);
        if (a.facing === undefined) a.facing = want;
        else if (going && a.facing !== want) {
          notes.push(`${N}: «${a.id}» шёл ${a.facing === "front" ? "лицом к нам боком вперёд" : "спиной вперёд"} — повернул по ходу (${want})`);
          a.facing = want;
        }
      }
      // toon: стоит без facing рядом с другими — повернуть к ближайшему (как в разговоре у конкурента)
      if (toon && a.facing === undefined && others(a).length) {
        const near = others(a).reduce((p, b) => (Math.abs(first(b.x ?? 960) - x0) < Math.abs(first(p.x ?? 960) - x0) ? b : p));
        const dx = first(near.x ?? 960) - x0;
        if (Math.abs(dx) > 40) a.facing = sideWord(dx);
      }
      const d = dirOf(a.facing);
      const seated = legs === "sit" || (a.keys ?? []).some((k) => k.legs === "sit");
      const armsAll = [a.arms, ...(a.keys ?? []).map((k) => k.arms)].filter(Boolean);

      // жест к цели: в анфас — уходит вбок; в профиль цель должна быть впереди
      if (armsAll.some((x) => AIMED.has(x))) {
        const targets = [...others(a).map((b) => first(b.x ?? 960)), ...props.filter((p) => !SEATS.has(p.kind) && p.kind !== "t-crowd").map((p) => first(p.x))];
        if (!d && !(a.keys ?? []).some((k) => k.facing && k.facing !== "front"))
          warns.push(`${N}: «${a.id}» тянется/показывает, стоя лицом к нам — рука уйдёт в сторону экрана. Поверни его к предмету: facing "left"/"right"`);
        else if (d && targets.length) {
          const ahead = targets.some((x) => (x - x0) * d > 20 && Math.abs(x - x0) < 700);
          const behind = targets.some((x) => (x - x0) * d < -20 && Math.abs(x - x0) < 700);
          if (!ahead && behind) warns.push(`${N}: «${a.id}» тянется/показывает вперёд (${a.facing}), а то, к чему тянется, у него за спиной — поверни его`);
        }
      }

      // стоит спиной ко всем собеседникам
      if (d && !move && others(a).length && !(a.keys ?? []).some((k) => k.facing)) {
        const xs = others(a).map((b) => first(b.x ?? 960) - x0).filter((dx) => Math.abs(dx) > 40);
        if (xs.length && xs.every((dx) => dx * d < 0)) warns.push(`${N}: «${a.id}» смотрит ${a.facing === "left" ? "влево" : "вправо"}, а все остальные у него за спиной — поверни к собеседнику, если это не уход`);
      }

      if (!toon) continue;
      // сидит — под ним должно быть сиденье
      if (seated) {
        const seat = props.find((p) => SEATS.has(p.kind) && Math.abs(first(p.x) - x0) <= HALF[p.kind](p) * sc(p) + 20);
        if (!seat) warns.push(`${N}: «${a.id}» сидит, а стула/табурета/дивана под ним нет (поставь t-stool или t-chair в x ${x0}, без front)`);
        // боком за столом, который стоит перед людьми: человек окажется внутри стола
        for (const t of props.filter((p) => TABLES.has(p.kind) && p.front)) {
          if (d && Math.abs(first(t.x) - x0) < HALF[t.kind](t) * sc(t) - 20)
            warns.push(`${N}: «${a.id}» сидит боком внутри «${t.kind}» (стол перед ним). Как у конкурента: стол позади людей (без front) или человек у торца стола (x дальше ${Math.round(HALF[t.kind](t) * sc(t))} от центра стола)`);
        }
      }
    }

    // два человека в одной точке
    for (let m = 0; m < actors.length; m++)
      for (let n = m + 1; n < actors.length; n++) {
        const A = actors[m];
        const B = actors[n];
        if (Array.isArray(A.x) || Array.isArray(B.x)) continue;
        const gap = Math.abs((A.x ?? 960) - (B.x ?? 960));
        if (gap < 110 * Math.min(sc(A), sc(B))) warns.push(`${N}: «${A.id}» и «${B.id}» стоят друг в друге (между ними ${gap} px) — раздвинь хотя бы на ${Math.round(140 * Math.min(sc(A), sc(B)))}`);
      }
  });
  return notes;
}
