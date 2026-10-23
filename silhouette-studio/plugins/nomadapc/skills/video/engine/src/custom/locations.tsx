// СВОИ ЛОКАЦИИ этой студии. Сюда Claude дописывает новые места под сценарии.
// Обновление плагина этот файл НЕ трогает (папка src/custom/ остаётся как есть).
// Правила стиля: плоский вектор, мягкие градиенты, без обводок, приглушённая палитра,
// тёплые источники света; холст 1920×1080, пол на y≈900 (там стоят ступни персонажей).
// Локация получает t (секунды от начала сцены) и params из доски ("params": { ... }).
import React, { useId } from "react";
import { clamp, rand } from "../util";

type P = { t: number; params: Record<string, number | string | boolean> };
const useUid = () => useId().replace(/[^a-zA-Z0-9]/g, "");

// Пример (можно удалить): пустая комната с окном. В доске: "location": "example-room", "params": { "wall": "#5b6475" }
const ExampleRoom: React.FC<P> = ({ t, params }) => {
  const u = useUid();
  const wall = typeof params.wall === "string" ? params.wall : "#5b6475";
  return (
    <svg viewBox="0 0 1920 1080" width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
      <defs>
        <linearGradient id={`w${u}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={wall} />
          <stop offset="1" stopColor="#2c3140" />
        </linearGradient>
      </defs>
      <rect width={1920} height={1080} fill={`url(#w${u})`} />
      <rect x={760} y={220} width={400} height={300} rx={8} fill="#1b2233" />
      {Array.from({ length: 30 }, (_, i) => (
        <circle key={i} cx={770 + rand(i) * 380} cy={230 + rand(i + 7) * 280} r={2} fill="#fff" opacity={0.3 + 0.5 * clamp(Math.sin(t * 2 + i) * 0.5 + 0.5)} />
      ))}
      <rect y={900} width={1920} height={180} fill="#232733" />
    </svg>
  );
};

export const CUSTOM_LOCATIONS: Record<string, React.FC<P>> = {
  "example-room": ExampleRoom,
};
