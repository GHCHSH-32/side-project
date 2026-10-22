import { describe, expect, it } from "vitest";

import {
  fromRecord,
  parseAmount,
  parseServing,
  rankResults,
  scaleNutrients,
  searchRecords,
  toGrams,
  toRecord,
  toSearchResult,
  type ApiItem,
} from "./index";

// 식품영양성분DB 응답의 형식(빈 값, 천 단위 쉼표 등)을 확인하기 위한 예시 값이다.
// 실제 식품의 영양 값과는 다르다.
const SPINACH: ApiItem = {
  FOOD_CD: "D000-0001",
  FOOD_NM_KR: "시금치나물",
  FOOD_CAT1_NM: "나물·무침류",
  DB_CLASS_NM: "품목대표",
  SERVING_SIZE: "100g",
  AMT_NUM3: "3.74",
  AMT_NUM7: "0.10",
  AMT_NUM8: "2.00",
  AMT_NUM9: "86.00",
  AMT_NUM10: "1.28",
  AMT_NUM12: "627.000",
  AMT_NUM13: "136.000",
  AMT_NUM14: "154.000",
  AMT_NUM21: "",
  AMT_NUM22: "1,843.000",
};

describe("parseAmount", () => {
  it("천 단위 쉼표가 있는 값을 숫자로 바꾼다", () => {
    expect(parseAmount("1,843.000")).toBe(1843);
  });

  it("비어 있거나 숫자가 아니면 0이다", () => {
    expect(parseAmount("")).toBe(0);
    expect(parseAmount(null)).toBe(0);
    expect(parseAmount("-")).toBe(0);
  });
});

describe("parseServing", () => {
  it("g와 mL 기준량을 읽는다", () => {
    expect(parseServing("100g")).toEqual({ amount: 100, unit: "g" });
    expect(parseServing("200mL")).toEqual({ amount: 200, unit: "mL" });
  });

  it("알 수 없는 형식은 100g로 본다", () => {
    expect(parseServing("1인분")).toEqual({ amount: 100, unit: "g" });
  });
});

describe("toSearchResult", () => {
  it("번호로 된 항목을 앱의 영양소 이름으로 옮긴다", () => {
    const result = toSearchResult(SPINACH)!;

    expect(result.name).toBe("시금치나물");
    expect(result.nutrients.protein).toBe(3.74);
    expect(result.nutrients.calcium).toBe(86);
    expect(result.nutrients.potassium).toBe(627);
    expect(result.nutrients.vitaminC).toBe(0);
    expect(result.nutrients.vitaminD).toBe(1843);
  });

  it("이름이나 코드가 없으면 건너뛴다", () => {
    expect(toSearchResult({ FOOD_CD: "x" })).toBeNull();
    expect(toSearchResult({ FOOD_NM_KR: "x" })).toBeNull();
  });
});

describe("rankResults", () => {
  const make = (name: string, kind: string) =>
    toSearchResult({ ...SPINACH, FOOD_CD: name + kind, FOOD_NM_KR: name, DB_CLASS_NM: kind })!;

  it("검색어로 시작하는 일반 음식을 앞에 둔다", () => {
    const ranked = rankResults(
      [make("새우계란찜", "상용제품"), make("계란찜", "품목대표"), make("계란찜", "상용제품")],
      "계란찜",
    );
    expect(ranked[0].name).toBe("계란찜");
    expect(ranked[0].kind).toBe("품목대표");
  });

  it("이름과 기준량이 같은 결과는 한 번만 남긴다", () => {
    const ranked = rankResults([make("미역국", "품목대표"), make("미역국", "품목대표")], "미역국");
    expect(ranked).toHaveLength(1);
  });
});

describe("scaleNutrients", () => {
  it("기준량 대비 먹이는 분량의 비율로 환산한다", () => {
    const base = toSearchResult(SPINACH)!.nutrients;
    const scaled = scaleNutrients(base, 100, 50);

    expect(scaled.protein).toBe(1.87);
    expect(scaled.calcium).toBe(43);
  });
});

describe("미리 받아 둔 음식 데이터", () => {
  const record = (name: string, kind: string) =>
    toRecord(toSearchResult({ ...SPINACH, FOOD_CD: name + kind, FOOD_NM_KR: name, DB_CLASS_NM: kind })!);

  it("배열로 저장했다가 원래 결과로 되돌릴 수 있다", () => {
    const original = toSearchResult(SPINACH)!;
    expect(fromRecord(toRecord(original))).toEqual(original);
  });

  it("이름에 검색어가 든 음식만 찾고 일반 음식을 먼저 둔다", () => {
    const found = searchRecords(
      [
        record("전복닭죽", "품목대표"),
        record("닭죽_전복", "외식"),
        record("닭죽", "상용제품"),
        record("닭죽", "품목대표"),
        record("미역국", "품목대표"),
      ],
      "닭죽",
    );
    expect(found.map((item) => item.name)).toEqual(["닭죽", "닭죽_전복", "전복닭죽"]);
    expect(found[0].kind).toBe("품목대표");
  });

  it("검색어가 비어 있으면 아무것도 돌려주지 않는다", () => {
    expect(searchRecords([record("닭죽", "품목대표")], "  ")).toEqual([]);
  });

  it("계란과 달걀을 같은 말로 보고 찾는다", () => {
    const found = searchRecords([record("달걀찜_새우젓", "품목대표"), record("미역국", "품목대표")], "계란찜");
    expect(found.map((item) => item.name)).toEqual(["달걀찜_새우젓"]);
  });

  it("영양 값이 전부 0인 항목은 결과에서 뺀다", () => {
    const empty = toRecord({
      ...toSearchResult({ ...SPINACH, FOOD_CD: "zero", FOOD_NM_KR: "빈죽" })!,
      nutrients: { protein: 0, iron: 0, calcium: 0, fiber: 0, potassium: 0, vitaminA: 0, vitaminC: 0, vitaminD: 0, sodium: 0, sugar: 0 },
    });
    expect(searchRecords([empty, record("야채죽", "품목대표")], "죽").map((item) => item.name)).toEqual(["야채죽"]);
  });

  it("같은 음식이 g과 mL로 둘 다 있으면 g 기준 자료만 남기고 모두 g으로 보여준다", () => {
    const gram = toSearchResult({ ...SPINACH, FOOD_CD: "g", FOOD_NM_KR: "닭죽", SERVING_SIZE: "100g", AMT_NUM3: "4.00" })!;
    const milli = toSearchResult({ ...SPINACH, FOOD_CD: "ml", FOOD_NM_KR: "닭죽", SERVING_SIZE: "100mL", AMT_NUM3: "9.00" })!;

    const found = searchRecords([toRecord(milli), toRecord(gram)], "닭죽");

    expect(found).toHaveLength(1);
    expect(found[0].basisUnit).toBe("g");
    expect(found[0].nutrients.protein).toBe(4);
    expect(found[0].fromMl).toBeUndefined();
  });

  it("g 기준 자료가 없는 음식은 mL 값을 g으로 바꿔 보여준다", () => {
    const milli = toSearchResult({ ...SPINACH, FOOD_CD: "ml", FOOD_NM_KR: "곰탕", SERVING_SIZE: "100mL" })!;

    const [found] = searchRecords([toRecord(milli)], "곰탕");

    expect(found.basisUnit).toBe("g");
    expect(found.basisAmount).toBe(100);
    expect(found.fromMl).toBe(true);
  });
});

describe("toGrams", () => {
  it("이미 g이면 그대로 둔다", () => {
    const result = toSearchResult(SPINACH)!;
    expect(toGrams(result)).toBe(result);
  });
});
