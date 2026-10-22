import { FOODS } from "./data";
import type { Food, Nutrients } from "./types";

/** 사용자가 직접 입력하거나 검색해서 만든 음식. 기록과 영양 계산에만 쓰고 추천 후보는 아니다. */
export function createCustomFood(input: {
  name: string;
  serving: string;
  nutrients: Nutrients;
}): Food {
  return {
    id: `custom:${crypto.randomUUID()}`,
    name: input.name,
    role: "snack",
    minutes: 0,
    serving: input.serving,
    allergens: [],
    ingredients: [],
    steps: [],
    nutrients: input.nutrients,
  };
}

/** 준비된 음식 목록과 사용자가 만든 음식에서 id로 음식을 찾는다. */
export function findAnyFood(id: string, customFoods: readonly Food[]) {
  return FOODS.find((food) => food.id === id) ?? customFoods.find((food) => food.id === id);
}
