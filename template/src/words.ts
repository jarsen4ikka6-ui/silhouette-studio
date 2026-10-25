// Надписи на вывесках и предметах на языке ролика (language в доске). Нет языка в списке — английский.
import { useFilm } from "./film";

const W = {
  promo: { ru: "АКЦИЯ", uk: "АКЦІЯ", pl: "PROMOCJA", en: "SALE", de: "AKTION", es: "OFERTA", fr: "PROMO" },
  bread: { ru: "ХЛЕБ", uk: "ХЛІБ", pl: "CHLEB", en: "BREAD", de: "BROT", es: "PAN", fr: "PAIN" },
  shop24: { ru: "ПРОДУКТЫ 24", uk: "ПРОДУКТИ 24", pl: "SPOŻYWCZY 24", en: "GROCERY 24", de: "LEBENSMITTEL 24", es: "SÚPER 24", fr: "ÉPICERIE 24" },
  shop: { ru: "ПРОДУКТЫ", uk: "ПРОДУКТИ", pl: "SPOŻYWCZY", en: "GROCERY", de: "MARKT", es: "SÚPER", fr: "ÉPICERIE" },
  kebab: { ru: "ШАУРМА", uk: "ШАУРМА", pl: "KEBAB", en: "KEBAB", de: "DÖNER", es: "KEBAB", fr: "KEBAB" },
  pharmacy: { ru: "АПТЕКА", uk: "АПТЕКА", pl: "APTEKA", en: "PHARMACY", de: "APOTHEKE", es: "FARMACIA", fr: "PHARMACIE" },
  urgent: { ru: "СРОЧНО", uk: "ТЕРМІНОВО", pl: "PILNE", en: "BREAKING", de: "EILMELDUNG", es: "ÚLTIMA HORA", fr: "URGENT" },
  news: { ru: "НОВОСТИ", uk: "НОВИНИ", pl: "WIADOMOŚCI", en: "NEWS", de: "NACHRICHTEN", es: "NOTICIAS", fr: "INFO" },
  yourCard: { ru: "ТВОЯ КАРТА", uk: "ТВОЯ КАРТКА", pl: "TWOJA KARTA", en: "YOUR CARD", de: "DEINE KARTE", es: "TU TARJETA", fr: "TA CARTE" },
  paid: { ru: "ОПЛАЧЕНО", uk: "ОПЛАЧЕНО", pl: "ZAPŁACONO", en: "PAID", de: "BEZAHLT", es: "PAGADO", fr: "PAYÉ" },
  sum: { ru: "СУММА", uk: "СУМА", pl: "KWOTA", en: "AMOUNT", de: "BETRAG", es: "IMPORTE", fr: "MONTANT" },
  taxi: { ru: "ТАКСИ", uk: "ТАКСІ", pl: "TAXI", en: "TAXI", de: "TAXI", es: "TAXI", fr: "TAXI" },
  chat: { ru: "ЧАТ", uk: "ЧАТ", pl: "CZAT", en: "CHAT", de: "CHAT", es: "CHAT", fr: "CHAT" },
};
export type WordKey = keyof typeof W;

export const useWord = () => {
  const lang = useFilm().lang ?? "ru";
  return (k: WordKey) => (W[k] as Record<string, string>)[lang] ?? W[k].en;
};
