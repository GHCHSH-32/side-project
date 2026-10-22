import { FOODS } from "./data";

export { ALLERGENS, FOODS } from "./data";
export { createCustomFood, findAnyFood } from "./custom";
export { photoCredit } from "./photo-credits";
export type {
  Allergen,
  Food,
  FoodRole,
  Ingredient,
  NutrientKey,
  Nutrients,
} from "./types";

export function findFood(id: string) {
  return FOODS.find((food) => food.id === id);
}
