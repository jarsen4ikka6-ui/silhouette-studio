// Формат раскадровки. Claude пишет только JSON по этим типам, движок рисует всё сам.

export type Mood = "neutral" | "tired" | "sad" | "worried" | "happy" | "angry" | "surprised" | "smug" | "sleep";
export type Arms = "rest" | "phone" | "mug" | "reach" | "cheer" | "walk" | "hips" | "think" | "pocket" | "ear" | "write" | "chalk" | "point" | "shrug" | "wave" | "hold" | "fold";
export type Legs = "stand" | "walk" | "sit" | "run";

export type Look = {
  top?: "jacket" | "coat" | "dress" | "robe" | "hoodie" | "tee" | "raincoat" | "shirt" | "none"; // по умолчанию куртка; shirt — рубашка с воротником
  color?: string; // цвет одежды — главная примета героя
  skin?: string; // кожа: light | fair | tan | olive | brown | dark или "#rrggbb"; без неё выбирается сама
  pants?: string; // цвет штанов (по умолчанию тёмно-синие; у платья и юбки — ноги цвета кожи); "skin" — голые ноги
  shoes?: string;
  trim?: string; // цвет пояса и каймы у накидки (robe)
  hair?: "short" | "spiky" | "none" | "ponytail" | "bun" | "long" | "curls" | "headband" | "scarf" | "bowl"; // short по умолчанию, spiky — торчащие (только toon), none — лысый, curls — кудри (у пожилых седые), scarf — платок, bowl — «шапочка»/цезарь с прямой чёлкой (только toon)
  hairColor?: string; // цвет волос (у headband/scarf без hatColor — цвет повязки или платка)
  glasses?: boolean | "round"; // round — круглые в тонкой чёрной оправе, с дужками (только toon)
  hat?: "none" | "cap" | "beanie" | "crown";
  hatColor?: string; // цвет шапки; у headband/scarf — цвет ткани (тогда hairColor — цвет волос)
  skirt?: boolean; // длинная юбка вместо штанов
  // --- стиль toon ---
  under?: string; // цвет кофты с капюшоном под курткой (у героя — серое худи)
  apron?: string; // цвет фартука (продавщица, повар)
  beard?: "mustache" | "beard"; // усы или борода
  tee?: string; // цвет футболки, которая видна в вырезе худи
  strings?: string; // цвет шнурков капюшона (по умолчанию белые)
  cuffs?: boolean; // штаны-трико с резинкой внизу (оверсайз)
  extra?: string; // свои детали персонажа из src/custom/characters.tsx (уникальная причёска, значок, шарф…)
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
  rim?: string; // цвет тёплой кромки света (по умолчанию оранжевая, "none" — без неё)
  rimSide?: "left" | "right"; // с какой стороны свет (по умолчанию слева)
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
  mouth?: number; // toon: сколько секунд от at двигается рот (по умолчанию — пока висит реплика)
  bubble?: false; // toon: рот двигается под голос, но пузыря нет (крупный план, реплика уже понятна)
};

export type Overlay =
  | { kind: "clock"; time: string; ampm?: string; at?: number; dur?: number }
  | { kind: "counter"; from: number; to: number; label?: string; suffix?: string; at?: number; dur?: number; time?: number; format?: "int" | "mmss"; x?: number; y?: number }
  | { kind: "bars"; items: { label: string; value: number; color?: string }[]; at?: number; dur?: number; x?: number; y?: number }
  | { kind: "caption"; text: string; at?: number; dur?: number }
  | { kind: "term"; title: string; text: string; at?: number; dur?: number }
  | { kind: "meter"; label: string; from: number; to: number; at?: number; dur?: number; color?: string; x?: number; y?: number }
  | { kind: "tip"; title: string; text: string; at?: number; dur?: number }
  // --- стиль Awaken ---
  | { kind: "pill"; text: string; at?: number; dur?: number; y?: number } // тёмно-синяя плашка внизу
  | { kind: "source"; text: string; at?: number; dur?: number } // мелкий источник слева внизу
  | { kind: "calendar"; text: string | { at: number; text: string }[]; at?: number; dur?: number } // табличка-календарь справа вверху
  | { kind: "stat"; label: string; from: number; to: number; at?: number; dur?: number; time?: number; suffix?: string; prefix?: string; x?: number; y?: number } // плашка со счётчиком
  | { kind: "chalk"; text: string; x: number; y: number; at?: number; dur?: number; size?: number; color?: string; speed?: number } // мел пишется по буквам (координаты сцены)
  | { kind: "chalkfigs"; count: number; x: number; y: number; at?: number; dur?: number; size?: number; gap?: number; every?: number; color?: string; cross?: number[] } // человечки мелом
  | { kind: "blocks"; word: string; top?: string; bottom?: string; aside?: string; at?: number; dur?: number } // слово из кубиков
  | { kind: "label"; text: string; x: number; y: number; tx: number; ty: number; at?: number; dur?: number; color?: string } // подпись со стрелкой (экран)
  | { kind: "panel"; title: string; mark?: "check" | "cross"; text?: string; x: number; y: number; w?: number; h?: number; at?: number; dur?: number; color?: string } // стеклянная панель
  | { kind: "question"; text: string; at?: number; dur?: number } // крупный курсив-вопрос к зрителю
  | { kind: "heading"; text: string; sub?: string; at?: number; dur?: number; y?: number } // заголовок главы
  // --- стиль toon ---
  | { kind: "plate"; text: string; at?: number; dur?: number; y?: number; tilt?: number } // жёлтая плашка внизу: «АКЦИЯ»
  | { kind: "shout"; text: string; at?: number; dur?: number; y?: number } // крупные слова по центру, *золотые*
  | { kind: "day"; text: string; sub?: string; at?: number; dur?: number } // жёлтая косая лента на весь экран: «ДЕНЬ 1»
  | { kind: "bignum"; text: string; label?: string; from?: number; time?: number; at?: number; dur?: number; y?: number } // огромное золотое число, накручивается
  | { kind: "title"; text: string; sub?: string; at?: number; dur?: number }; // название серии с лучами, *золотые* слова

export type Card =
  | { kind: "quote"; text: string; author?: string }
  | { kind: "hook"; text: string }
  | { kind: "end"; title: string; text?: string };

// План камеры. Камера всегда чуть двигается (move), если не сказано "static".
export type Shot = "wide" | "full" | "medium" | "close" | "face" | "insert" | "pov" | "ots";
export type CameraMove = "push" | "pull" | "left" | "right" | "up" | "down" | "drift" | "static";
export type ShotSpec = {
  shot?: Shot;
  on?: string | [number, number]; // за кем следим (id героя) или точка сцены
  size?: number; // для insert/pov/wide: какую ширину сцены показать, px
  move?: CameraMove;
  amount?: number; // сила движения, по умолчанию 0.06
  handheld?: number; // «камера в руке» 0..1 (у pov по умолчанию 0.5)
  dof?: number; // размытие фона, px (по умолчанию зависит от плана)
  over?: string; // ots: через чьё плечо смотрим (id героя)
  overSide?: "left" | "right";
};
export type Camera = ShotSpec & {
  zoom?: number | [number, number]; // старый способ: зум и точка фокуса вручную
  focus?: [number, number] | [[number, number], [number, number]];
  cuts?: (ShotSpec & { at: number })[]; // склейки внутри сцены: с секунды at — другой план
};

// Размытый предмет на переднем плане (даёт объём)
export type Foreground = { kind: "post" | "plant" | "leaves" | "railing" | "lamp" | "curtain" | "glass"; x: number; blur?: number; color?: string; flip?: boolean };

// Плёночный вид: зерно, пыль в воздухе, тёплый засвет. look: false — выключить
export type LookFx = { grain?: number; dust?: number; leak?: string | false; leakSide?: "left" | "right"; tint?: string; bloom?: number };

export type Sfx = { name: string; at: number; volume?: number };

// Предмет в кадре (рисуется в координатах сцены, под камерой).
// front — поверх персонажей (например, стол перед сидящим)
export type Prop = { kind: string; x: number | [number, number]; y: number | [number, number]; scale?: number; at?: number; dur?: number; front?: boolean; flip?: boolean; params?: Record<string, number | string | boolean> };

export type Scene = {
  dur: number;
  note?: string;
  chapter?: string; // с этой сцены начинается глава (таймкоды для описания YouTube)
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
  fg?: Foreground[];
  look?: LookFx | false;
  fadeIn?: number;
  fadeOut?: number;
  ambience?: string; // фоновый звук на всю сцену: rain | rain-indoor | birds | room
  sfx?: Sfx[];
};

// Плашка сверху, которая держится через сцены до следующей на том же месте («ПОТРАЧЕНО: 3 400», «ДЕНЬ 1»).
// В доске at — фраза («@…»), в data — секунды от начала ролика. Пустой text — убрать плашку.
export type HudItem = { at: number; text: string; place?: "left" | "right" | "right2" };

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
  style?: "silhouette" | "toon"; // как рисовать людей: силуэты (по умолчанию) или toon — белые головы, как в мультсериале
  voiceEnv?: number[]; // громкость озвучки по кадрам (30 в секунду, 0..100) — по ней открывается рот у говорящего
  hud?: HudItem[];
  hero?: Look; // внешность главного героя (из looks.hero) — по ней красятся руки в кадрах от первого лица
  scenes: Scene[];
};
