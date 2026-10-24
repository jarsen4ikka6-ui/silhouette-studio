// СВОИ ДЕТАЛИ ПЕРСОНАЖЕЙ этой студии (стиль toon). Обновление плагина этот файл НЕ трогает.
// Когда человек присылает своего персонажа, Claude подбирает look (одежда, цвета, причёска, шапка),
// а всё, чего в look нет (особая причёска, значок, шарф, рюкзак, шрам), рисует здесь кодом.
// В look персонажа: "extra": "<ключ>". Части:
//   head — поверх головы, (0, 0) = центр головы, R — радиус головы;
//   body — поверх одежды, координаты тела (ступни в 0, shY — плечи, hipY — пояс, bottom — низ куртки).
// dir: 0 — анфас, -1 / 1 — смотрит влево / вправо.
import React from "react";
import type { ToonPartProps } from "../Toon";

export type CustomPart = { head?: React.FC<ToonPartProps>; body?: React.FC<ToonPartProps> };

// Пример (можно удалить): значок-звезда на груди. В look: "extra": "example-star"
const ExampleStar: React.FC<ToonPartProps> = ({ shY, dir }) => (
  <path transform={`translate(${-14 + dir * 6} ${shY + 34}) scale(0.5)`} d="M 0 -20 L 6 -6 L 20 -6 L 9 3 L 13 18 L 0 9 L -13 18 L -9 3 L -20 -6 L -6 -6 Z" fill="#f1c24b" stroke="#1c1a24" strokeWidth={4} />
);

export const CUSTOM_PARTS: Record<string, CustomPart> = {
  "example-star": { body: ExampleStar },
};
