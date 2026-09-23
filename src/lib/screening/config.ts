export type SexOption = "male" | "female" | "unspecified";

export type ThinningPattern =
  | "receding_crown"
  | "diffuse"
  | "sudden"
  | "patchy";

export type DurationBand =
  | "under_1"
  | "1_to_3"
  | "3_to_7"
  | "over_7";

export type FamilyHistory =
  | "both_sides"
  | "one_side"
  | "unsure"
  | "none";

export type PriorCare =
  | "none"
  | "cosmetics"
  | "prp"
  | "medication";

export type HealthContext =
  | "excellent"
  | "good"
  | "stress"
  | "chronic";

export type Expectation =
  | "density"
  | "stop_thinning"
  | "quality"
  | "scalp";

export type ScreeningAnswers = {
  age?: string;
  sex?: SexOption;
  thinning?: ThinningPattern;
  duration?: DurationBand;
  family?: FamilyHistory;
  priorCare?: PriorCare;
  health?: HealthContext;
  expectation?: Expectation;
};

export type ScreeningStep =
  | "intro"
  | "q1"
  | "q2"
  | "q3"
  | "q4"
  | "q5"
  | "q6"
  | "q7"
  | "email"
  | "result"
  | "register";

export const QUESTION_STEPS = [
  "q1",
  "q2",
  "q3",
  "q4",
  "q5",
  "q6",
  "q7",
] as const;

export type QuestionStep = (typeof QUESTION_STEPS)[number];

export const QUESTION_META: Record<
  QuestionStep,
  { title: string; sectionLabel: string; lead?: string }
> = {
  q1: {
    title: "Začněme základními informacemi.",
    sectionLabel: "Základní informace",
    lead: "Údaje slouží k orientaci v profilu. Nejde o přesné zdravotní vyhodnocení.",
  },
  q2: {
    title: "Jak byste popsal/a změny svých vlasů?",
    sectionLabel: "Charakter řídnutí",
    lead: "Vyberte možnost, která nejlépe vystihne váš případ.",
  },
  q3: {
    title: "Jak dlouho změny pozorujete?",
    sectionLabel: "Délka obtíží",
    lead: "Délka a dynamika výpadu ovlivňují výběr procedury.",
  },
  q4: {
    title: "Řeší podobné změny vlasů i někdo ve vaší rodině?",
    sectionLabel: "Výskyt v rodině",
    lead: "Genetická predispozice je klíčovým faktorem.",
  },
  q5: {
    title: "Co jste už pro své vlasy vyzkoušel/a?",
    sectionLabel: "Dosavadní péče",
    lead: "Předchozí procedury a produkty upřesní váš profil.",
  },
  q6: {
    title: "Je něco, co bychom měli zohlednit?",
    sectionLabel: "Zdravotní kontext",
    lead: "Zdravotní kontext ovlivňuje efektivitu estetické procedury.",
  },
  q7: {
    title: "Co byste chtěl/a především změnit?",
    sectionLabel: "Očekávání",
    lead: "Pomůže nám přiřadit vás ke správnému specialistovi.",
  },
};

export type ChoiceBadgeTone = "ideal" | "suitable" | "review" | "specialty";

export type ChoiceOption<T extends string> = {
  id: T;
  label: string;
  description?: string;
  score?: number;
  badge?: { label: string; tone: ChoiceBadgeTone };
};

export const SEX_OPTIONS: ChoiceOption<SexOption>[] = [
  { id: "male", label: "Muž" },
  { id: "female", label: "Žena" },
  { id: "unspecified", label: "Nechci uvádět" },
];

export const THINNING_OPTIONS: ChoiceOption<ThinningPattern>[] = [
  {
    id: "receding_crown",
    label: "Ustupující linie / řídnutí na temeni",
    description: "Vzorový výpad - čelní linie ustupuje nebo temeno řídne",
    score: 2,
    badge: { label: "Ideální profil", tone: "ideal" },
  },
  {
    id: "diffuse",
    label: "Celoplošné rovnoměrné řídnutí",
    description: "Vlasy jsou celkově tenčí, výpad rovnoměrný",
    score: 2,
    badge: { label: "Vhodný profil", tone: "suitable" },
  },
  {
    id: "sudden",
    label: "Náhlý hojný výpad",
    description: "Výpad začal náhle, vychytatelné shluky vlasů",
    score: 3,
    badge: { label: "Prověřit faktory", tone: "review" },
  },
  {
    id: "patchy",
    label: "Ložiskové lysé plochy",
    description: "Ostře ohraničené lysé plochy - podezření na areata",
    score: 3,
    badge: { label: "Specializace", tone: "specialty" },
  },
];

export const DURATION_OPTIONS: ChoiceOption<DurationBand>[] = [
  {
    id: "under_1",
    label: "Méně než rok",
    description: "Čerstvý výpad - rychlá proaktivní reakce",
    score: 1,
    badge: { label: "Výborný timing", tone: "ideal" },
  },
  {
    id: "1_to_3",
    label: "1-3 roky",
    description: "Postupný rozvoj, střední stadium",
    score: 2,
    badge: { label: "Vhodný timing", tone: "suitable" },
  },
  {
    id: "3_to_7",
    label: "Více než 3 až 7 let",
    description: "Delší trvání, pokročilejší stadium",
    score: 3,
    badge: { label: "Proveditelné", tone: "review" },
  },
  {
    id: "over_7",
    label: "Více než 7 let",
    description: "Dlouhodobý stav, stabilizovaný výpad",
    score: 3,
    badge: { label: "Konzultace doporučena", tone: "specialty" },
  },
];

export const FAMILY_OPTIONS: ChoiceOption<FamilyHistory>[] = [
  {
    id: "both_sides",
    label: "Ano, na obou stranách rodiny",
    description:
      "Silná genetická složka, androgenetický vzorec velmi pravděpodobný",
    score: 3,
    badge: { label: "Silná indikace", tone: "ideal" },
  },
  {
    id: "one_side",
    label: "Ano, na jedné straně rodiny",
    description: "Genetická predispozice přítomna, středně silná složka",
    score: 2,
    badge: { label: "Dobrá indikace", tone: "suitable" },
  },
  {
    id: "unsure",
    label: "Nejsem si jistý/á",
    description: "Neurčitá rodinná anamnéza",
    score: 1,
    badge: { label: "Neutrální", tone: "review" },
  },
  {
    id: "none",
    label: "Ne / není mi to známo",
    description: "Nulová genetická složka - jiné příčiny výpadu",
    score: 0,
    badge: { label: "Prověřit příčiny", tone: "specialty" },
  },
];

export const PRIOR_CARE_OPTIONS: ChoiceOption<PriorCare>[] = [
  {
    id: "none",
    label: "Zatím nic",
    description: "Zatím bez procedur a aktivní péče",
    score: 0,
    badge: { label: "Čistý profil", tone: "ideal" },
  },
  {
    id: "cosmetics",
    label: "Kosmetické přípravky",
    description: "Šampony, séra, doplňky stravy",
    score: 1,
    badge: { label: "Vhodný profil", tone: "suitable" },
  },
  {
    id: "prp",
    label: "PRP / mezoterapie",
    description: "Injekční estetické procedury",
    score: 2,
    badge: { label: "Dobré srovnání", tone: "review" },
  },
  {
    id: "medication",
    label: "Léčivé přípravky",
    description: "Finasterid, minoxidil nebo jiné",
    score: 2,
    badge: { label: "Uvést při konzultaci", tone: "specialty" },
  },
];

export const HEALTH_OPTIONS: ChoiceOption<HealthContext>[] = [
  {
    id: "excellent",
    label: "Výborný celkový stav",
    description: "Pravidelný pohyb, vyvážená strava, dostatek spánku",
    score: 0,
    badge: { label: "Optimální", tone: "ideal" },
  },
  {
    id: "good",
    label: "Dobrý stav",
    description: "Občasný stres, drobné nedostatky v životosprávě",
    score: 1,
    badge: { label: "Vhodný", tone: "suitable" },
  },
  {
    id: "stress",
    label: "Vysoký stres a nepravidelný rytmus",
    description: "Pracovní přetížení, nedostatek spánku",
    score: 2,
    badge: { label: "Rizikový faktor", tone: "specialty" },
  },
  {
    id: "chronic",
    label: "Chronické onemocnění nebo užívané léky",
    description: "Probíhající léčba, chronický stav",
    score: 3,
    badge: { label: "Uvést při konzultaci", tone: "specialty" },
  },
];

export const EXPECTATION_OPTIONS: ChoiceOption<Expectation>[] = [
  {
    id: "density",
    label: "Zvýšení hustoty a objemu vlasů",
    description: "Viditelně hustší vlasy na temeni nebo čelní linii",
    score: 0,
    badge: { label: "Primární indikace", tone: "ideal" },
  },
  {
    id: "stop_thinning",
    label: "Zpomalení a stabilizace výpadu",
    description: "Udržet současný stav, předejít dalšímu řídnutí",
    score: 0,
    badge: { label: "Preventivní přístup", tone: "suitable" },
  },
  {
    id: "quality",
    label: "Kvalita a síla stávajících vlasů",
    description: "Vlasy jsou tenčí, lámavé, bez vitality",
    score: 0,
    badge: { label: "Výživová procedura", tone: "ideal" },
  },
  {
    id: "scalp",
    label: "Celková kondice pokožky hlavy",
    description: "Suchá pokožka, šupení, citlivost",
    score: 0,
    badge: { label: "Kombinovaný přístup", tone: "review" },
  },
];

export type ResultFactorTone = "high" | "mid" | "low";

export type ResultFactor = {
  id: string;
  label: string;
  value: number;
  max: number;
  tone: ResultFactorTone;
};

export type ResultCategory = {
  id: "mild" | "moderate" | "strong";
  title: string;
  summary: string;
  profileLabel: string;
  badge: string;
  note: string;
  interpretation: string;
};

function pickScore<T extends string>(
  value: T | undefined,
  options: ChoiceOption<T>[]
) {
  return options.find((o) => o.id === value)?.score ?? 0;
}

function maxOptionScore<T extends string>(options: ChoiceOption<T>[]) {
  return Math.max(...options.map((o) => o.score ?? 0), 1);
}

function factorTone(ratio: number): ResultFactorTone {
  if (ratio >= 0.7) return "high";
  if (ratio >= 0.4) return "mid";
  return "low";
}

function scaledFactor(
  id: string,
  label: string,
  score: number,
  scoreMax: number,
  displayMax: number
): ResultFactor {
  const value = Math.round((score / scoreMax) * displayMax);
  const tone = factorTone(displayMax === 0 ? 0 : value / displayMax);
  return { id, label, value, max: displayMax, tone };
}

const EXPECTATION_DISPLAY: Record<Expectation, number> = {
  density: 6,
  stop_thinning: 5,
  quality: 5,
  scalp: 4,
};

export function getResultFactors(answers: ScreeningAnswers): ResultFactor[] {
  const expectationValue = answers.expectation
    ? EXPECTATION_DISPLAY[answers.expectation]
    : 0;

  return [
    scaledFactor(
      "thinning",
      "Vzorec výpadu",
      pickScore(answers.thinning, THINNING_OPTIONS),
      maxOptionScore(THINNING_OPTIONS),
      24
    ),
    scaledFactor(
      "duration",
      "Délka trvání",
      pickScore(answers.duration, DURATION_OPTIONS),
      maxOptionScore(DURATION_OPTIONS),
      22
    ),
    scaledFactor(
      "family",
      "Genetická složka",
      pickScore(answers.family, FAMILY_OPTIONS),
      maxOptionScore(FAMILY_OPTIONS),
      20
    ),
    scaledFactor(
      "priorCare",
      "Profil péče",
      pickScore(answers.priorCare, PRIOR_CARE_OPTIONS),
      maxOptionScore(PRIOR_CARE_OPTIONS),
      14
    ),
    scaledFactor(
      "health",
      "Zdravotní stav",
      pickScore(answers.health, HEALTH_OPTIONS),
      maxOptionScore(HEALTH_OPTIONS),
      14
    ),
    {
      id: "expectation",
      label: "Estetický cíl",
      value: expectationValue,
      max: 6,
      tone: factorTone(expectationValue / 6),
    },
  ];
}

export function scoreAnswers(answers: ScreeningAnswers): number {
  return (
    pickScore(answers.thinning, THINNING_OPTIONS) +
    pickScore(answers.duration, DURATION_OPTIONS) +
    pickScore(answers.family, FAMILY_OPTIONS) +
    pickScore(answers.priorCare, PRIOR_CARE_OPTIONS) +
    pickScore(answers.health, HEALTH_OPTIONS) +
    pickScore(answers.expectation, EXPECTATION_OPTIONS)
  );
}

export function evaluateResult(answers: ScreeningAnswers): ResultCategory {
  const score = scoreAnswers(answers);

  if (score <= 4) {
    return {
      id: "mild",
      title: "Výsledky dotazníkového screeningu",
      summary:
        "Mírnější profil: vhodné sledovat vývoj a zvážit konzultaci podle vašich cílů.",
      profileLabel: "Mírný",
      badge: "Základní indikace",
      note: "Nižší pásmo. Screening nenahrazuje vyšetření.",
      interpretation:
        "Odpovědi ukazují spíš mírnější obraz změn. Další kroky (laboratoř, trichoskopie, konzultace) jsou volitelné a pomáhají upřesnit další postup.",
    };
  }

  if (score <= 9) {
    return {
      id: "moderate",
      title: "Výsledky dotazníkového screeningu",
      summary:
        "Dobrý profil: doporučujeme doplnit laboratorní panel a trichoskopii pro lepší rozhodnutí.",
      profileLabel: "Dobrý",
      badge: "Vhodný profil",
      note: "Vhodné pásmo pro další upřesnění podkladů.",
      interpretation:
        "Dobrý základ. Laboratorní panel upřesní nutriční a hormonální kontext, trichoskopie vizuálně doplní stav pokožky a vlasů. Oba kroky pomáhají při volbě další péče.",
    };
  }

  return {
    id: "strong",
    title: "Výsledky dotazníkového screeningu",
    summary:
      "Zvýšená pozornost: doporučujeme osobní konzultaci a doplňující vyšetření.",
    profileLabel: "Zvýšená pozornost",
    badge: "Konzultace doporučena",
    note: "Další postup má smysl řešit s lékařem.",
    interpretation:
      "Odpovědi naznačují složitější obraz. Konzultace a případná vyšetření pomohou oddělit vhodné další kroky od těch, které zatím nejsou potřeba.",
  };
}

/** Max theoretical score from current option weights (expectations are 0). */
export const MAX_SCREENING_SCORE = 14;

export function scorePercent(answers: ScreeningAnswers): number {
  const raw = scoreAnswers(answers);
  return Math.round((raw / MAX_SCREENING_SCORE) * 100);
}

/** Screening je hotový, až jsou vyplněné všechny vstupní odpovědi. */
export function hasCompleteScreening(answers: ScreeningAnswers): boolean {
  return Boolean(
    answers.age?.trim() &&
      answers.sex &&
      answers.thinning &&
      answers.duration &&
      answers.family &&
      answers.priorCare &&
      answers.health &&
      answers.expectation
  );
}

export function questionIndexFromStep(step: ScreeningStep): number {
  const idx = QUESTION_STEPS.indexOf(step as QuestionStep);
  return idx;
}

export function isQuestionStep(step: ScreeningStep): step is QuestionStep {
  return QUESTION_STEPS.includes(step as QuestionStep);
}
