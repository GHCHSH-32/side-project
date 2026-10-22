import { describe, expect, it } from "vitest";

import { FOODS, type Allergen } from "@/lib/foods";
import { emptyNutrients } from "@/lib/nutrition";

import { recommendDinner, recommendSnacks } from "./index";

const ctx = (allergies: Allergen[] = [], eatenIds: string[] = []) => ({
  foods: FOODS,
  intake: emptyNutrients(),
  group: "1-2" as const,
  allergies,
  eatenIds,
});

describe("recommendDinner", () => {
  it("주식을 포함한 2~3개 메뉴를 조리 20분 이내로 추천한다", () => {
    const set = recommendDinner(ctx());
    expect(set).not.toBeNull();
    const foods = set!.picks.map((pick) => pick.food);
    expect(foods.length).toBeGreaterThanOrEqual(2);
    expect(foods.length).toBeLessThanOrEqual(3);
    expect(foods.some((food) => food.role === "staple")).toBe(true);
    expect(foods.every((food) => food.minutes <= 20)).toBe(true);
    expect(set!.picks.every((pick) => pick.reasons.length > 0)).toBe(true);
  });

  it("알레르기 성분이 든 음식은 추천하지 않는다", () => {
    const allergies: Allergen[] = ["계란", "대두", "쇠고기", "우유"];
    for (let i = 0, shown: string[] = []; i < 5; i++) {
      const set = recommendDinner(ctx(allergies), shown);
      if (!set) break;
      shown = [...shown, set.signature];
      for (const { food } of set.picks) {
        expect(food.allergens.some((a) => allergies.includes(a))).toBe(false);
      }
    }
  });

  it("오늘 이미 기록한 음식은 제외한다", () => {
    const eaten = recommendDinner(ctx())!.picks.map((pick) => pick.food.id);
    const next = recommendDinner(ctx([], eaten))!;
    expect(next.picks.some((pick) => eaten.includes(pick.food.id))).toBe(false);
  });

  it("이미 보여준 세트와 다른 세트를 준다", () => {
    const first = recommendDinner(ctx())!;
    const second = recommendDinner(ctx(), [first.signature])!;
    expect(second.signature).not.toBe(first.signature);
  });
});

describe("recommendSnacks", () => {
  it("간식을 1~2개 추천한다", () => {
    const set = recommendSnacks(ctx())!;
    expect(set.picks.length).toBeGreaterThanOrEqual(1);
    expect(set.picks.length).toBeLessThanOrEqual(2);
    expect(set.picks.every((pick) => pick.food.role === "snack")).toBe(true);
  });
});
