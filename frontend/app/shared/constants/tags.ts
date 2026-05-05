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
  { value: "O", value_next: "", label: "Не сущность" },
  { value: "B-per", value_next: "I-per", label: "Человек" },
  { value: "B-org", value_next: "I-org", label: "Организация" },
  { value: "B-geo", value_next: "I-geo", label: "Географическое место" },
  { value: "B-gpe", value_next: "I-gpe", label: "Страна/город (полит.)" },
  { value: "B-tim", value_next: "I-tim", label: "Дата/время" },
  { value: "B-art", value_next: "I-art", label: "Артефакт" },
  { value: "B-eve", value_next: "I-eve", label: "Событие" },
  { value: "B-nat", value_next: "I-nat", label: "Природное явление" },
] as const;

export const TAG_COLORS: Record<string, string> = {
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
export type NextBioTag = (typeof BIO_TAGS)[number]["value_next"];
