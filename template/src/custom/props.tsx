// СВОИ ПРЕДМЕТЫ этой студии. Сюда Claude дописывает новый реквизит под сценарии.
// Обновление плагина этот файл НЕ трогает.
// Предмет рисуется вокруг точки (0, 0) = место, где он стоит на полу (или его центр, если висит в воздухе).
// Получает t (секунды от начала сцены) и params из доски.
import React from "react";

type PP = { t: number; params: Record<string, number | string | boolean> };

// Пример (можно удалить): цветочный горшок. В доске: { "kind": "example-pot", "x": 700, "y": 900 }
const ExamplePot: React.FC<PP> = () => (
  <g>
    <path d="M -40 0 L -50 -70 L 50 -70 L 40 0 Z" fill="#a0573a" />
    <path d="M 0 -70 C -30 -120 -10 -160 0 -170 C 10 -160 30 -120 0 -70 Z" fill="#4f7a4a" />
  </g>
);

export const CUSTOM_PROPS: Record<string, React.FC<PP>> = {
  "example-pot": ExamplePot,
};
