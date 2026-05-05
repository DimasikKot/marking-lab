// export const BIO_TAGS = [
//   { value: "O", label: "O" },
//   { value: "B-per", label: "B-PER" },
//   { value: "I-per", label: "I-PER" },
//   { value: "B-org", label: "B-ORG" },
//   { value: "I-org", label: "I-ORG" },
//   { value: "B-geo", label: "B-GEO" },
//   { value: "I-geo", label: "I-GEO" },
//   { value: "B-gpe", label: "B-GPE" },
//   { value: "I-gpe", label: "I-GPE" },
//   { value: "B-tim", label: "B-TIM" },
//   { value: "I-tim", label: "I-TIM" },
//   { value: "B-art", label: "B-ART" },
//   { value: "I-art", label: "I-ART" },
//   { value: "B-eve", label: "B-EVE" },
//   { value: "I-eve", label: "I-EVE" },
//   { value: "B-nat", label: "B-NAT" },
//   { value: "I-nat", label: "I-NAT" },
// ] as const;

export const BIO_TAGS = [
  { value: "O", label: "Не сущность" },
  { value: "B-per", label: "Человек" },
  { value: "B-org", label: "Организация" },
  { value: "B-geo", label: "Географическое место" },
  { value: "B-gpe", label: "Страна/город (полит.)" },
  { value: "B-tim", label: "Дата/время" },
  { value: "B-art", label: "Артефакт" },
  { value: "B-eve", label: "Событие" },
  { value: "B-nat", label: "Природное явление" },
  { value: "I-per", label: "Продолжение человека" },
  { value: "I-org", label: "Продолжение организации" },
  { value: "I-geo", label: "Продолжение места" },
  { value: "I-gpe", label: "Продолжение города" },
  { value: "I-tim", label: "Продолжение времени" },
  { value: "I-art", label: "Продолжение артефакта" },
  { value: "I-eve", label: "Продолжение события" },
  { value: "I-nat", label: "Продолжение природы" },
] as const;

export const TAG_COLORS: Record<string, string> = {
  O: "bg-gray-100 border-gray-300 text-gray-500",

  "B-per": "bg-pink-50 border-pink-300 text-pink-700",
  "I-per": "bg-pink-50 border-pink-300 text-pink-700",

  "B-org": "bg-purple-50 border-purple-300 text-purple-700",
  "I-org": "bg-purple-50 border-purple-300 text-purple-700",

  "B-geo": "bg-green-50 border-green-300 text-green-700",
  "I-geo": "bg-green-50 border-green-300 text-green-700",

  "B-gpe": "bg-emerald-50 border-emerald-300 text-emerald-700",
  "I-gpe": "bg-emerald-50 border-emerald-300 text-emerald-700",

  "B-tim": "bg-blue-50 border-blue-300 text-blue-700",
  "I-tim": "bg-blue-50 border-blue-300 text-blue-700",

  "B-art": "bg-yellow-50 border-yellow-300 text-yellow-700",
  "I-art": "bg-yellow-50 border-yellow-300 text-yellow-700",

  "B-eve": "bg-orange-50 border-orange-300 text-orange-700",
  "I-eve": "bg-orange-50 border-orange-300 text-orange-700",

  "B-nat": "bg-teal-50 border-teal-300 text-teal-700",
  "I-nat": "bg-teal-50 border-teal-300 text-teal-700",
};

export const TAG_BG_COLORS: Record<string, string> = {
  O: "",

  "B-per": "bg-pink-300",
  "I-per": "bg-pink-200",

  "B-org": "bg-purple-300",
  "I-org": "bg-purple-200",

  "B-geo": "bg-green-300",
  "I-geo": "bg-green-200",

  "B-gpe": "bg-emerald-400",
  "I-gpe": "bg-emerald-300",

  "B-tim": "bg-blue-300",
  "I-tim": "bg-blue-200",

  "B-art": "bg-yellow-300",
  "I-art": "bg-yellow-200",

  "B-eve": "bg-orange-300",
  "I-eve": "bg-orange-200",

  "B-nat": "bg-teal-300",
  "I-nat": "bg-teal-200",
};

export type BioTag = (typeof BIO_TAGS)[number]["value"];
