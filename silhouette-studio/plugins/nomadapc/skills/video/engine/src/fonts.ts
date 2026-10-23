import { loadFont as loadHand } from "@remotion/google-fonts/Pangolin";
import { loadFont as loadSerif } from "@remotion/google-fonts/CormorantGaramond";
import { loadFont as loadSans } from "@remotion/google-fonts/Montserrat";

const subsets: ("latin" | "cyrillic")[] = ["latin", "cyrillic"];

// Реплики и мысли — округлый «рукописный» шрифт
export const HAND = loadHand("normal", { weights: ["400"], subsets }).fontFamily;
// Цитаты и финальные карточки — засечный шрифт (курсив и капс)
export const SERIF = loadSerif("italic", { weights: ["500"], subsets }).fontFamily;
loadSerif("normal", { weights: ["500", "600"], subsets });
// Часы, уведомления, термины — простой шрифт без засечек
export const SANS = loadSans("normal", { weights: ["400", "600", "700"], subsets }).fontFamily;
