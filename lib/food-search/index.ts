import type { NutrientKey, Nutrients } from "@/lib/foods";

/** 식약처 식품영양성분DB 한 건의 영양 값은 기준량(보통 100g 또는 100mL) 당이다. */
export type FoodSearchResult = {
  code: string;
  name: string;
  category: string;
  /** 품목대표, 원재료성, 외식, 상용제품 같은 자료 구분 */
  kind: string;
  basisAmount: number;
  basisUnit: "g" | "mL";
  /** mL 기준 자료를 g으로 바꿔 보여주는 경우 true */
  fromMl?: boolean;
  nutrients: Nutrients;
};

export type ApiItem = Record<string, string | null | undefined>;

// 공공데이터포털 명세(식품영양성분DB정보)의 번호별 항목 중 앱이 쓰는 10개
const FIELDS = {
  protein: "AMT_NUM3",
  sugar: "AMT_NUM7",
  fiber: "AMT_NUM8",
  calcium: "AMT_NUM9",
  iron: "AMT_NUM10",
  potassium: "AMT_NUM12",
  sodium: "AMT_NUM13",
  vitaminA: "AMT_NUM14",
  vitaminC: "AMT_NUM21",
  vitaminD: "AMT_NUM22",
} as const satisfies Record<NutrientKey, string>;

/** "1,843.000"처럼 천 단위 쉼표가 있거나 비어 있는 값을 숫자로 바꾼다. */
export function parseAmount(raw: string | null | undefined) {
  if (!raw) return 0;
  const value = Number(raw.replace(/,/g, ""));
  return Number.isFinite(value) && value > 0 ? value : 0;
}

export function parseServing(raw: string | null | undefined) {
  const match = raw?.match(/^\s*([\d.,]+)\s*(g|ml)\s*$/i);
  if (!match) return { amount: 100, unit: "g" as const };
  const amount = Number(match[1].replace(/,/g, ""));
  return {
    amount: amount > 0 ? amount : 100,
    unit: match[2].toLowerCase() === "ml" ? ("mL" as const) : ("g" as const),
  };
}

export function toSearchResult(item: ApiItem): FoodSearchResult | null {
  const name = item.FOOD_NM_KR?.trim();
  const code = item.FOOD_CD?.trim();
  if (!name || !code) return null;

  const serving = parseServing(item.SERVING_SIZE);
  const nutrients = {} as Nutrients;
  for (const key of Object.keys(FIELDS) as NutrientKey[]) {
    nutrients[key] = parseAmount(item[FIELDS[key]]);
  }

  return {
    code,
    name,
    category: item.FOOD_CAT1_NM?.trim() ?? "",
    kind: item.DB_CLASS_NM?.trim() ?? "",
    basisAmount: serving.amount,
    basisUnit: serving.unit,
    nutrients,
  };
}

/**
 * 용량(mL) 기준 자료는 1mL = 1g으로 보고 g으로 통일한다.
 * 국이나 죽처럼 물과 밀도가 비슷한 음식을 가정한 근사다.
 */
export function toGrams(result: FoodSearchResult): FoodSearchResult {
  return result.basisUnit === "g" ? result : { ...result, basisUnit: "g", fromMl: true };
}

const KIND_ORDER = ["품목대표", "원재료성", "외식", "상용제품"];

/** 이름이 검색어로 시작하는 것, 일반 음식(품목대표·원재료성)을 먼저 두고 중복을 없앤다. */
export function rankResults(results: readonly FoodSearchResult[], query: string) {
  const score = (result: FoodSearchResult) => {
    const kind = KIND_ORDER.indexOf(result.kind);
    return (
      (result.name.startsWith(query) ? 0 : 10) + (kind === -1 ? KIND_ORDER.length : kind)
    );
  };
  const seen = new Set<string>();
  return [...results]
    .sort((a, b) => score(a) - score(b) || a.name.length - b.name.length)
    .filter((result) => {
      const key = `${result.name}|${result.basisAmount}${result.basisUnit}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

/** 기준량 당 영양 값을 먹이는 1회분 분량에 맞게 환산한다. */
export function scaleNutrients(
  nutrients: Nutrients,
  basisAmount: number,
  servingAmount: number,
): Nutrients {
  const ratio = basisAmount > 0 ? servingAmount / basisAmount : 0;
  const scaled = {} as Nutrients;
  for (const key of Object.keys(nutrients) as NutrientKey[]) {
    scaled[key] = Math.round(nutrients[key] * ratio * 100) / 100;
  }
  return scaled;
}

// 미리 받아 둔 음식 데이터(data/foods-db.json)는 용량을 줄이려고 배열로 저장한다.
// [코드, 이름, 분류, 자료 구분, 기준량, 단위, ...영양 값(DB_NUTRIENT_ORDER 순서)]
export const DB_NUTRIENT_ORDER = [
  "protein",
  "iron",
  "calcium",
  "fiber",
  "potassium",
  "vitaminA",
  "vitaminC",
  "vitaminD",
  "sodium",
  "sugar",
] as const satisfies readonly NutrientKey[];

export type DbRecord = [
  code: string,
  name: string,
  category: string,
  kind: string,
  basisAmount: number,
  basisUnit: string,
  ...nutrients: number[],
];

export function toRecord(result: FoodSearchResult): DbRecord {
  return [
    result.code,
    result.name,
    result.category,
    result.kind,
    result.basisAmount,
    result.basisUnit,
    ...DB_NUTRIENT_ORDER.map((key) => result.nutrients[key]),
  ];
}

export function fromRecord(record: DbRecord): FoodSearchResult {
  const [code, name, category, kind, basisAmount, basisUnit, ...values] = record;
  const nutrients = {} as Nutrients;
  DB_NUTRIENT_ORDER.forEach((key, index) => {
    nutrients[key] = values[index] ?? 0;
  });
  return {
    code,
    name,
    category,
    kind,
    basisAmount,
    basisUnit: basisUnit === "mL" ? "mL" : "g",
    nutrients,
  };
}

/** 같은 음식을 달리 부르는 말은 같이 찾는다. */
function queryVariants(text: string) {
  return [...new Set([text, text.replaceAll("계란", "달걀"), text.replaceAll("달걀", "계란")])];
}

/** 이름에 검색어가 들어 있는 음식을 찾아 순서대로 돌려준다. 영양 값이 전부 0인 항목은 뺀다. */
export function searchRecords(
  records: readonly DbRecord[],
  query: string,
  limit = 20,
) {
  const text = query.trim();
  if (!text) return [];
  const variants = queryVariants(text);
  // 같은 음식이 g과 mL로 둘 다 있으면 원래 g 기준 자료를 남기려고 g을 앞에 둔다.
  const matched = records
    .filter(
      (record) =>
        variants.some((variant) => record[1].includes(variant)) &&
        record.slice(6).some((value) => Number(value) > 0),
    )
    .sort((a, b) => Number(a[5] === "mL") - Number(b[5] === "mL"))
    .map(fromRecord)
    .map(toGrams);
  return rankResults(matched, text).slice(0, limit);
}
