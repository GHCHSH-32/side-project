import { describe, expect, it } from "vitest";

import { findFood } from "@/lib/foods";

import { ageGroupOf, nutritionStatus, sumIntake } from "./index";

const food = (id: string) => {
  const found = findFood(id);
  if (!found) throw new Error(`음식을 찾을 수 없다: ${id}`);
  return found;
};

describe("ageGroupOf", () => {
  const today = new Date(2026, 9, 22);

  it("만 1~2세와 3~5세 구간을 나눈다", () => {
    expect(ageGroupOf("2024-10", today)).toBe("1-2");
    expect(ageGroupOf("2022-10", today)).toBe("3-5");
  });

  it("만 1세 미만과 만 6세 이상은 대상이 아니다", () => {
    expect(ageGroupOf("2026-01", today)).toBeNull();
    expect(ageGroupOf("2020-01", today)).toBeNull();
  });
});

describe("sumIntake", () => {
  it("먹은 비율만큼 영양을 합산하고 0%는 반영하지 않는다", () => {
    const egg = food("steamed-egg");
    const full = sumIntake([{ food: egg, pct: 100 }]);
    const half = sumIntake([{ food: egg, pct: 50 }]);
    const none = sumIntake([{ food: egg, pct: 0 }]);

    expect(half.protein).toBeCloseTo(full.protein / 2);
    expect(none.protein).toBe(0);
  });
});

describe("nutritionStatus", () => {
  it("기록이 없으면 채울 영양소가 모두 부족하다", () => {
    const status = nutritionStatus(sumIntake([]), "1-2");
    expect(status.fill.every((item) => item.level === "lack")).toBe(true);
    expect(status.limits.every((item) => item.level === "ok")).toBe(true);
  });
});
