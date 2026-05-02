export const BIO_TAGS = [
  { value: "O", label: "O" },
  { value: "B-per", label: "B-PER" },
  { value: "I-per", label: "I-PER" },
  { value: "B-org", label: "B-ORG" },
  { value: "I-org", label: "I-ORG" },
  { value: "B-geo", label: "B-GEO" },
  { value: "I-geo", label: "I-GEO" },
  { value: "B-gpe", label: "B-GPE" },
  { value: "I-gpe", label: "I-GPE" },
  { value: "B-tim", label: "B-TIM" },
  { value: "I-tim", label: "I-TIM" },
  { value: "B-art", label: "B-ART" },
  { value: "I-art", label: "I-ART" },
  { value: "B-eve", label: "B-EVE" },
  { value: "I-eve", label: "I-EVE" },
  { value: "B-nat", label: "B-NAT" },
  { value: "I-nat", label: "I-NAT" },
] as const;

export type BioTag = typeof BIO_TAGS[number]["value"];

// export const BIO_TAGS = [
//   { value: "O", label: "O - Не сущность" },
//   { value: "B-per", label: "B-PER - Человек" },
//   { value: "I-per", label: "I-PER - Продолжение человека" },
//   { value: "B-org", label: "B-ORG - Организация" },
//   { value: "I-org", label: "I-ORG - Продолжение организации" },
//   { value: "B-geo", label: "B-GEO - Географическое место" },
//   { value: "I-geo", label: "I-GEO - Продолжение geo" },
//   { value: "B-gpe", label: "B-GPE - Страна/город (полит.)" },
//   { value: "I-gpe", label: "I-GPE - Продолжение gpe" },
//   { value: "B-tim", label: "B-TIM - Дата/время" },
//   { value: "I-tim", label: "I-TIM - Продолжение времени" },
//   { value: "B-art", label: "B-ART - Артефакт" },
//   { value: "I-art", label: "I-ART - Продолжение артефакта" },
//   { value: "B-eve", label: "B-EVE - Событие" },
//   { value: "I-eve", label: "I-EVE - Продолжение события" },
//   { value: "B-nat", label: "B-NAT - Природное явление" },
//   { value: "I-nat", label: "I-NAT - Продолжение natural" },
// ] as const;

// export type BioTag = typeof BIO_TAGS[number]["value"];