export const BIO_TAGS = [
  { value: "per", label: "Человек", color: "bg-pink-300" },
  { value: "org", label: "Организация", color: "bg-purple-300" },
  { value: "geo", label: "Географическое место", color: "bg-green-300" },
  { value: "gpe", label: "Страна/город (полит.)", color: "bg-emerald-400" },
  { value: "tim", label: "Дата/время", color: "bg-blue-300" },
  { value: "art", label: "Артефакт", color: "bg-yellow-300" },
  { value: "eve", label: "Событие", color: "bg-orange-300" },
  { value: "nat", label: "Природное явление", color: "bg-teal-300" },
] as const;

export type BioTag = (typeof BIO_TAGS)[number]["value"];
