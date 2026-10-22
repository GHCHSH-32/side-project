import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { createCustomFood, findAnyFood } from "@/lib/foods";

import { mealLogActions, useMealLog } from "./index";

const DATE = "2026-10-22";

describe("addEntry", () => {
  beforeEach(() => {
    // 이전 테스트에서 남은 기록을 비운다.
    const { result } = renderHook(() => useMealLog());
    for (const entry of result.current?.log[DATE] ?? []) {
      act(() => mealLogActions.removeEntry(DATE, entry.id));
    }
  });

  it("같은 끼니에 같은 음식을 다시 기록하지 않는다", () => {
    const { result } = renderHook(() => useMealLog());

    act(() => mealLogActions.addEntry(DATE, "dinner", "steamed-egg"));
    act(() => mealLogActions.addEntry(DATE, "dinner", "steamed-egg"));

    expect(result.current?.log[DATE]).toHaveLength(1);
  });

  it("다른 끼니에는 같은 음식을 기록할 수 있다", () => {
    const { result } = renderHook(() => useMealLog());

    act(() => mealLogActions.addEntry(DATE, "breakfast", "milk"));
    act(() => mealLogActions.addEntry(DATE, "snack", "milk"));

    expect(result.current?.log[DATE]).toHaveLength(2);
  });
});

describe("customFoods", () => {
  it("직접 만든 음식을 저장하고 id로 다시 찾을 수 있다", () => {
    const { result } = renderHook(() => useMealLog());
    const food = createCustomFood({
      name: "우리집 계란말이",
      serving: "50g",
      nutrients: {
        protein: 6, iron: 0.9, calcium: 0, fiber: 0, potassium: 0,
        vitaminA: 0, vitaminC: 0, vitaminD: 0, sodium: 0, sugar: 0,
      },
    });

    act(() => mealLogActions.addCustomFood(food));

    const saved = result.current?.customFoods ?? [];
    expect(findAnyFood(food.id, saved)?.name).toBe("우리집 계란말이");
    expect(findAnyFood("steamed-egg", saved)?.name).toBe("계란찜");
  });
});
