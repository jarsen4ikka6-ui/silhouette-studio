import { loadFont as loadHand } from "@remotion/google-fonts/Pangolin";
import { loadFont as loadSerif } from "@remotion/google-fonts/CormorantGaramond";
import { loadFont as loadSans } from "@remotion/google-fonts/Montserrat";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadChalk } from "@remotion/google-fonts/Caveat";
import { loadFont as loadRubik } from "@remotion/google-fonts/Rubik";

const subsets: ("latin" | "cyrillic")[] = ["latin", "cyrillic"];

// Реплики и мысли — округлый «рукописный» шрифт
export const HAND = loadHand("normal", { weights: ["400"], subsets }).fontFamily;
// Цитаты и финальные карточки — засечный шрифт (курсив и капс)
export const SERIF = loadSerif("italic", { weights: ["500"], subsets }).fontFamily;
loadSerif("normal", { weights: ["500", "600"], subsets });
// Часы, уведомления, термины — простой шрифт без засечек
export const SANS = loadSans("normal", { weights: ["400", "600", "700"], subsets }).fontFamily;
// Стиль Awaken: плашки, календарь, счётчики — плотный гротеск; мел и приписки — рукописный
export const INTER = loadInter("normal", { weights: ["500", "700", "800"], subsets }).fontFamily;
loadInter("italic", { weights: ["700", "800"], subsets });
export const CHALK = loadChalk("normal", { weights: ["500", "700"], subsets }).fontFamily;
// Стиль toon: пузыри реплик, плашки, счётчики — округлый плотный гротеск с кириллицей
export const RUBIK = loadRubik("normal", { weights: ["500", "600", "700", "800", "900"], subsets }).fontFamily;
