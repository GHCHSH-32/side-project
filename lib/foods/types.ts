export type Allergen =
  | "계란"
  | "우유"
  | "메밀"
  | "땅콩"
  | "대두"
  | "밀"
  | "고등어"
  | "게"
  | "새우"
  | "돼지고기"
  | "복숭아"
  | "토마토"
  | "아황산류"
  | "호두"
  | "닭고기"
  | "쇠고기"
  | "오징어"
  | "조개류"
  | "잣";

export type NutrientKey =
  | "protein"
  | "iron"
  | "calcium"
  | "fiber"
  | "potassium"
  | "vitaminA"
  | "vitaminC"
  | "vitaminD"
  | "sodium"
  | "sugar";

export type Nutrients = Record<NutrientKey, number>;

export type FoodRole = "staple" | "protein" | "veg" | "soup" | "snack";

export type Ingredient = { name: string; amount: string };

export type Food = {
  id: string;
  name: string;
  role: FoodRole;
  /** 조리 소요시간(분). 단계별 시간의 합이며 목록의 모든 메뉴는 20분 이내다. */
  minutes: number;
  /** 영양 값의 기준이 되는 2세 기준 1회분 분량 */
  serving: string;
  allergens: readonly Allergen[];
  /** 1회분 재료와 분량 */
  ingredients: readonly Ingredient[];
  steps: readonly string[];
  /** 1회분 영양 값 */
  nutrients: Nutrients;
};
