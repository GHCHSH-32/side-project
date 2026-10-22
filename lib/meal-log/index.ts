import { useSyncExternalStore } from "react";

import type { Allergen, Food } from "@/lib/foods";

export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

export const MEAL_TYPES: readonly { value: MealType; label: string }[] = [
  { value: "breakfast", label: "아침" },
  { value: "lunch", label: "점심" },
  { value: "dinner", label: "저녁" },
  { value: "snack", label: "간식" },
];

export type Profile = {
  /** 제목에 보여줄 아기 이름. 비워 둘 수 있다. */
  name?: string;
  birth: string;
  allergies: Allergen[];
};
export type LogEntry = {
  id: string;
  meal: MealType;
  foodId: string;
  /** 먹은 비율. 0~100을 10 단위로 기록한다. */
  pct: number;
};

export type AppState = {
  profile: Profile | null;
  log: Record<string, LogEntry[]>;
  favorites: string[];
  /** 사용자가 직접 입력하거나 검색해서 만든 음식 */
  customFoods: Food[];
};

const STORAGE_KEY = "toddler-meal-demo:v1";
const EMPTY: AppState = { profile: null, log: {}, favorites: [], customFoods: [] };

let memory: AppState | null = null;
const listeners = new Set<() => void>();

function load(): AppState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...EMPTY, ...JSON.parse(raw) };
  } catch {
    // 저장소를 쓸 수 없으면 메모리 상태로만 동작한다.
  }
  return EMPTY;
}

function getSnapshot() {
  memory ??= load();
  return memory;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function update(change: (state: AppState) => AppState) {
  memory = change(getSnapshot());
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(memory));
  } catch {
    // 저장 실패는 무시하고 현재 세션의 상태만 유지한다.
  }
  listeners.forEach((listener) => listener());
}

/** 브라우저의 로컬 날짜(YYYY-MM-DD). 자정에 새 하루가 시작된다. */
export function dateKey(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export const mealLogActions = {
  saveProfile(profile: Profile) {
    update((state) => ({ ...state, profile }));
  },
  addEntry(date: string, meal: MealType, foodId: string) {
    // 같은 끼니에 같은 음식은 한 번만 기록한다.
    if (
      (getSnapshot().log[date] ?? []).some(
        (entry) => entry.meal === meal && entry.foodId === foodId,
      )
    ) {
      return;
    }
    const entry: LogEntry = {
      id: crypto.randomUUID(),
      meal,
      foodId,
      pct: 100,
    };
    update((state) => ({
      ...state,
      log: { ...state.log, [date]: [...(state.log[date] ?? []), entry] },
    }));
  },
  setPct(date: string, id: string, pct: number) {
    update((state) => ({
      ...state,
      log: {
        ...state.log,
        [date]: (state.log[date] ?? []).map((entry) =>
          entry.id === id ? { ...entry, pct } : entry,
        ),
      },
    }));
  },
  removeEntry(date: string, id: string) {
    update((state) => ({
      ...state,
      log: {
        ...state.log,
        [date]: (state.log[date] ?? []).filter((entry) => entry.id !== id),
      },
    }));
  },
  addCustomFood(food: Food) {
    update((state) => ({ ...state, customFoods: [...state.customFoods, food] }));
  },
  toggleFavorite(foodId: string) {
    update((state) => ({
      ...state,
      favorites: state.favorites.includes(foodId)
        ? state.favorites.filter((id) => id !== foodId)
        : [...state.favorites, foodId],
    }));
  },
};

/** 저장소를 읽기 전(서버 렌더링과 첫 렌더)에는 null을 돌려준다. */
export function useMealLog() {
  return useSyncExternalStore(subscribe, getSnapshot, () => null);
}
