import type { Food, NutrientKey, Nutrients } from "@/lib/foods";

export type AgeGroup = "1-2" | "3-5";

/** 채워야 할 영양소 중 막대로 보여주는 것. 비타민 D는 안내만 한다. */
export const FILL_KEYS = [
  "protein",
  "iron",
  "calcium",
  "fiber",
  "potassium",
  "vitaminA",
  "vitaminC",
] as const satisfies readonly NutrientKey[];
export type FillKey = (typeof FILL_KEYS)[number];

export const LIMIT_KEYS = ["sodium", "sugar"] as const satisfies readonly NutrientKey[];
export type LimitKey = (typeof LIMIT_KEYS)[number];

export const NUTRIENT_LABELS: Record<NutrientKey, string> = {
  protein: "단백질",
  iron: "철분",
  calcium: "칼슘",
  fiber: "식이섬유",
  potassium: "칼륨",
  vitaminA: "비타민 A",
  vitaminC: "비타민 C",
  vitaminD: "비타민 D",
  sodium: "나트륨",
  sugar: "당류",
};

export const NUTRIENT_UNITS: Record<NutrientKey, string> = {
  protein: "g",
  iron: "mg",
  calcium: "mg",
  fiber: "g",
  potassium: "mg",
  vitaminA: "µg",
  vitaminC: "mg",
  vitaminD: "µg",
  sodium: "mg",
  sugar: "g",
};

// 임시값: 한국인 영양소 섭취기준(2020)의 1~2세·3~5세 값을 기억에 의존해 옮겼다.
// 2025 기준 원문으로 확인하기 전까지 확정값이 아니다.
const TARGETS: Record<
  AgeGroup,
  { fill: Record<FillKey, number>; limit: Record<LimitKey, number> }
> = {
  "1-2": {
    fill: {
      protein: 20,
      iron: 6,
      calcium: 500,
      fiber: 15,
      potassium: 2000,
      vitaminA: 250,
      vitaminC: 40,
    },
    limit: { sodium: 1200, sugar: 25 },
  },
  "3-5": {
    fill: {
      protein: 25,
      iron: 7,
      calcium: 600,
      fiber: 20,
      potassium: 2300,
      vitaminA: 300,
      vitaminC: 55,
    },
    limit: { sodium: 1600, sugar: 30 },
  },
};

export function targetsFor(group: AgeGroup) {
  return TARGETS[group];
}

/** 생년월(YYYY-MM)부터 오늘까지 지난 개월 수. 형식이 틀리면 null. */
export function ageInMonths(birth: string, today: Date) {
  const match = birth.match(/^(\d{4})-(\d{1,2})$/);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (month < 1 || month > 12) return null;
  return (today.getFullYear() - year) * 12 + (today.getMonth() + 1 - month);
}

/** 생년월(YYYY-MM)로 만 나이 구간을 구한다. 대상 밖이면 null. */
export function ageGroupOf(birth: string, today: Date): AgeGroup | null {
  const months = ageInMonths(birth, today);
  if (months === null) return null;
  if (months >= 12 && months < 36) return "1-2";
  if (months >= 36 && months < 72) return "3-5";
  return null;
}

/** 개월 수를 "생후 9개월", "만 6세 2개월"처럼 읽기 쉽게 바꾼다. */
export function describeAge(months: number) {
  if (months < 0) return "아직 태어나지 않은 날짜";
  if (months < 12) return `생후 ${months}개월`;
  const years = Math.floor(months / 12);
  const rest = months % 12;
  return rest === 0 ? `만 ${years}세` : `만 ${years}세 ${rest}개월`;
}

export type IntakeEntry = { food: Food; pct: number };

export function emptyNutrients(): Nutrients {
  return {
    protein: 0,
    iron: 0,
    calcium: 0,
    fiber: 0,
    potassium: 0,
    vitaminA: 0,
    vitaminC: 0,
    vitaminD: 0,
    sodium: 0,
    sugar: 0,
  };
}

/** 먹은 비율(0~100%)만큼 영양을 합산한다. 0%는 반영하지 않는다. */
export function sumIntake(entries: readonly IntakeEntry[]): Nutrients {
  const total = emptyNutrients();
  for (const { food, pct } of entries) {
    if (pct <= 0) continue;
    for (const key of Object.keys(total) as NutrientKey[]) {
      total[key] += (food.nutrients[key] * pct) / 100;
    }
  }
  return total;
}

export type FillLevel = "enough" | "little" | "lack";
export type LimitLevel = "ok" | "over";

export const FILL_LEVEL_LABELS: Record<FillLevel, string> = {
  enough: "충분",
  little: "조금 부족",
  lack: "부족",
};

export const LIMIT_LEVEL_LABELS: Record<LimitLevel, string> = {
  ok: "적당",
  over: "넘어요",
};

export function fillLevelOf(ratio: number): FillLevel {
  if (ratio >= 0.8) return "enough";
  if (ratio >= 0.5) return "little";
  return "lack";
}

export function nutritionStatus(intake: Nutrients, group: AgeGroup) {
  const targets = targetsFor(group);
  const fill = FILL_KEYS.map((key) => {
    const ratio = intake[key] / targets.fill[key];
    return { key, ratio, level: fillLevelOf(ratio) };
  });
  const limits = LIMIT_KEYS.map((key) => {
    const ratio = intake[key] / targets.limit[key];
    return { key, ratio, level: (ratio > 1 ? "over" : "ok") as LimitLevel };
  });
  return { fill, limits };
}
