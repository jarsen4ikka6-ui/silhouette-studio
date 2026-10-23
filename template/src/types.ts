// Формат раскадровки. Claude пишет только JSON по этим типам, движок рисует всё сам.

export type Mood = "neutral" | "tired" | "sad" | "happy" | "angry" | "surprised" | "sleep";
export type Arms = "rest" | "phone" | "mug" | "reach" | "cheer" | "walk" | "hips" | "think" | "pocket" | "ear" | "write" | "point" | "shrug";
export type Legs = "stand" | "walk" | "sit" | "run";

export type Look = {
  top?: "none" | "hoodie" | "tee" | "raincoat";
  color?: string; // цвет одежды
  pants?: string; // цвет штанов, по умолчанию чёрный
  hair?: "none" | "ponytail" | "bun" | "headband" | "scarf"; // scarf — платок
  hairColor?: string; // цвет повязки или платка
  glasses?: boolean;
  hat?: "none" | "cap"; // кепка (таксист, курьер)
  hatColor?: string;
  skirt?: boolean; // длинная юбка вместо штанов
};

// Ключевой кадр позы: с секунды `at` персонаж переходит в эту позу
export type PoseKey = { at: number; arms?: Arms; legs?: Legs; mood?: Mood; lookX?: number; lookY?: number; facing?: "front" | "left" | "right" };

export type Actor = {
  id: string;
  look?: Look;
  x: number | [number, number]; // одно число или [откуда, куда] за сцену
  y?: number | [number, number]; // уровень пола (ступни), по умолчанию 900
  scale?: number;
  facing?: "front" | "left" | "right";
  arms?: Arms;
  legs?: Legs;
  mood?: Mood;
  lookX?: number;
  lookY?: number;
  keys?: PoseKey[];
  rim?: string; // цвет контурной подсветки
  rimSide?: "left" | "right";
  glow?: string; // свечение вокруг силуэта (злость — "#ff4a2a")
  phoneLight?: boolean; // голубое свечение экрана на лице
};

export type TextKind = "say" | "think" | "offscreen" | "notif";
export type SceneText = {
  kind: TextKind;
  text: string;
  at?: number;
  dur?: number;
  actor?: string; // над чьей головой (для say/think/notif)
  x?: number; // экранные координаты, если без персонажа
  y?: number;
  side?: "left" | "right";
};

export type Overlay =
  | { kind: "clock"; time: string; ampm?: string; at?: number; dur?: number }
  | { kind: "counter"; from: number; to: number; label?: string; suffix?: string; at?: number; dur?: number; time?: number; format?: "int" | "mmss"; x?: number; y?: number }
  | { kind: "bars"; items: { label: string; value: number; color?: string }[]; at?: number; dur?: number; x?: number; y?: number }
  | { kind: "caption"; text: string; at?: number; dur?: number }
  | { kind: "term"; title: string; text: string; at?: number; dur?: number }
  | { kind: "meter"; label: string; from: number; to: number; at?: number; dur?: number; color?: string; x?: number; y?: number }
  | { kind: "tip"; title: string; text: string; at?: number; dur?: number };

export type Card =
  | { kind: "quote"; text: string; author?: string }
  | { kind: "hook"; text: string }
  | { kind: "end"; title: string; text?: string };

export type Camera = {
  zoom?: number | [number, number];
  focus?: [number, number] | [[number, number], [number, number]];
};

export type Sfx = { name: string; at: number; volume?: number };

// Предмет в кадре (рисуется в координатах сцены, под камерой).
// front — поверх персонажей (например, стол перед сидящим)
export type Prop = { kind: string; x: number | [number, number]; y: number | [number, number]; scale?: number; at?: number; dur?: number; front?: boolean; flip?: boolean; params?: Record<string, number | string | boolean> };

export type Scene = {
  dur: number;
  note?: string;
  location?: string; // bedroom | kitchen | street | meadow
  params?: Record<string, number | string | boolean>; // настройки локации (lamp, lampOffAt…)
  card?: Card; // если задано — вместо локации чёрная карточка
  actors?: Actor[];
  props?: Prop[];
  camera?: Camera;
  texts?: SceneText[];
  overlays?: Overlay[];
  rain?: boolean | number; // дождь поверх кадра (число — плотность)
  vignette?: number;
  fadeIn?: number;
  fadeOut?: number;
  ambience?: string; // фоновый звук на всю сцену: rain | rain-indoor | birds | room
  sfx?: Sfx[];
};

export type MusicPart = { mood: string; from: number; db?: number };

export type Project = {
  id: string;
  fps: number;
  width: number;
  height: number;
  mode: "story" | "explainer";
  language: string;
  music?: MusicPart[];
  musicFile?: string; // свой трек вместо сгенерированной музыки
  musicDb?: number;
  sfxDb?: number;
  voice?: string; // озвучка диктора из public/, например audio/voice.mp3
  voiceAt?: number; // с какой секунды ролика начинается озвучка
  voiceDb?: number;
  scenes: Scene[];
};
