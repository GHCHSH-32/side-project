import type { Allergen, Food, FoodRole, Nutrients } from "@/lib/foods";
import {
  FILL_KEYS,
  NUTRIENT_LABELS,
  fillLevelOf,
  targetsFor,
  type AgeGroup,
  type FillKey,
} from "@/lib/nutrition";

export type RecommendedFood = { food: Food; reasons: string[] };
export type RecommendationSet = {
  picks: RecommendedFood[];
  signature: string;
};

type Context = {
  foods: readonly Food[];
  intake: Nutrients;
  group: AgeGroup;
  allergies: readonly Allergen[];
  eatenIds: readonly string[];
};

// 저녁과 간식이 하루 목표에서 채우려는 몫
const DINNER_SHARE = 0.35;
const SNACK_SHARE = 0.15;
const MIN_SECOND_SNACK_SCORE = 0.05;

function candidates(ctx: Context, roles: readonly FoodRole[]) {
  return ctx.foods.filter(
    (food) =>
      roles.includes(food.role) &&
      !ctx.eatenIds.includes(food.id) &&
      !food.allergens.some((allergen) => ctx.allergies.includes(allergen)),
  );
}

type Goal = Record<FillKey, number>;

/** 이 끼니가 채워야 할 영양소별 양과, 부족한 정도에 따른 가중치 */
function goalFor(ctx: Context, share: number) {
  const { fill } = targetsFor(ctx.group);
  const goal = {} as Goal;
  const weight = {} as Goal;
  for (const key of FILL_KEYS) {
    const remaining = Math.max(fill[key] - ctx.intake[key], 0);
    goal[key] = Math.min(remaining, fill[key] * share);
    weight[key] = remaining / fill[key];
  }
  return { goal, weight };
}

function scoreOf(
  food: Food,
  ctx: Context,
  left: Goal,
  weight: Goal,
  usedSodium: number,
  usedSugar: number,
) {
  const { limit } = targetsFor(ctx.group);
  let score = 0;
  for (const key of FILL_KEYS) {
    if (left[key] <= 0) continue;
    score += weight[key] * Math.min(food.nutrients[key] / left[key], 1);
  }
  const sodium = ctx.intake.sodium + usedSodium + food.nutrients.sodium;
  const sugar = ctx.intake.sugar + usedSugar + food.nutrients.sugar;
  score -= 0.3 * (food.nutrients.sodium / limit.sodium);
  score -= 0.3 * (food.nutrients.sugar / limit.sugar);
  if (sodium > limit.sodium) score -= 1;
  if (sugar > limit.sugar) score -= 1;
  return score;
}

function reasonsFor(food: Food, ctx: Context, left: Goal) {
  const { fill } = targetsFor(ctx.group);
  const gains = FILL_KEYS.map((key) => {
    const ratio = ctx.intake[key] / fill[key];
    const share = food.nutrients[key] / fill[key];
    return { key, ratio, share, useful: left[key] > 0 && share >= 0.05 };
  })
    .filter((gain) => gain.useful && fillLevelOf(gain.ratio) !== "enough")
    .sort((a, b) => b.share * (1 - b.ratio) - a.share * (1 - a.ratio))
    .slice(0, 2);

  if (gains.length === 0) {
    return ["오늘 영양이 대체로 충분해서, 균형을 유지하기 좋은 메뉴예요."];
  }
  return gains.map(({ key, ratio, share }) => {
    const state = fillLevelOf(ratio) === "lack" ? "부족해요" : "조금 부족해요";
    const amount =
      share >= 0.5 ? "크게 채워줘요" : share >= 0.2 ? "넉넉히 채워줘요" : "보태줘요";
    return `오늘 ${subject(NUTRIENT_LABELS[key])} ${state} · 이 메뉴가 ${amount}.`;
  });
}

/** 주격 조사(이/가)를 붙인다. 영문자는 L, M, N, R만 받침이 있는 것으로 본다. */
function subject(word: string) {
  const last = word.charCodeAt(word.length - 1);
  const hangul = last >= 0xac00 && last <= 0xd7a3;
  const batchim = hangul
    ? (last - 0xac00) % 28 !== 0
    : "LMNRlmnr".includes(word[word.length - 1]);
  return `${word}${batchim ? "이" : "가"}`;
}

type Draft = {
  foods: Food[];
  total: number;
  left: Goal;
  sodium: number;
  sugar: number;
};

function extend(draft: Draft, food: Food, ctx: Context, weight: Goal): Draft {
  const left = { ...draft.left };
  for (const key of FILL_KEYS) {
    left[key] = Math.max(left[key] - food.nutrients[key], 0);
  }
  return {
    foods: [...draft.foods, food],
    total: draft.total + scoreOf(food, ctx, draft.left, weight, draft.sodium, draft.sugar),
    left,
    sodium: draft.sodium + food.nutrients.sodium,
    sugar: draft.sugar + food.nutrients.sugar,
  };
}

function best(
  pool: readonly Food[],
  draft: Draft,
  ctx: Context,
  weight: Goal,
  count = 1,
) {
  return pool
    .filter((food) => !draft.foods.includes(food))
    .map((food) => ({
      food,
      score: scoreOf(food, ctx, draft.left, weight, draft.sodium, draft.sugar),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, count);
}

function finish(draft: Draft, ctx: Context, initialLeft: Goal): RecommendationSet {
  const picks: RecommendedFood[] = [];
  let left = initialLeft;
  for (const food of draft.foods) {
    picks.push({ food, reasons: reasonsFor(food, ctx, left) });
    left = { ...left };
    for (const key of FILL_KEYS) {
      left[key] = Math.max(left[key] - food.nutrients[key], 0);
    }
  }
  return {
    picks,
    signature: draft.foods
      .map((food) => food.id)
      .sort()
      .join("|"),
  };
}

function rank(drafts: Draft[], ctx: Context, initialLeft: Goal, shown: readonly string[]) {
  const seen = new Set<string>(shown);
  const sets = drafts
    .sort((a, b) => b.total - a.total)
    .map((draft) => finish(draft, ctx, initialLeft))
    .filter((set) => {
      if (seen.has(set.signature)) return false;
      seen.add(set.signature);
      return true;
    });
  return sets;
}

const START: Pick<Draft, "foods" | "total" | "sodium" | "sugar"> = {
  foods: [],
  total: 0,
  sodium: 0,
  sugar: 0,
};

/**
 * 저녁 1세트: 주식 + 단백질 반찬 + (채소 반찬 또는 국).
 * `shown`에 있는 세트는 건너뛴다. 새 세트가 없으면 null.
 */
export function recommendDinner(
  ctx: Context,
  shown: readonly string[] = [],
): RecommendationSet | null {
  const { goal, weight } = goalFor(ctx, DINNER_SHARE);
  const root: Draft = { ...START, left: goal };
  const staples = candidates(ctx, ["staple"]);
  const proteins = candidates(ctx, ["protein"]);
  const sides = candidates(ctx, ["veg", "soup"]);

  const drafts: Draft[] = [];
  for (const staple of staples) {
    const withStaple = extend(root, staple, ctx, weight);
    for (const { food: protein } of best(proteins, withStaple, ctx, weight, 3)) {
      const withProtein = extend(withStaple, protein, ctx, weight);
      const [side] = best(sides, withProtein, ctx, weight);
      drafts.push(side ? extend(withProtein, side.food, ctx, weight) : withProtein);
    }
  }
  return rank(drafts, ctx, goal, shown)[0] ?? null;
}

/** 간식 1~2개. `shown`에 있는 조합은 건너뛴다. 새 조합이 없으면 null. */
export function recommendSnacks(
  ctx: Context,
  shown: readonly string[] = [],
): RecommendationSet | null {
  const { goal, weight } = goalFor(ctx, SNACK_SHARE);
  const root: Draft = { ...START, left: goal };
  const snacks = candidates(ctx, ["snack"]);

  const drafts: Draft[] = [];
  for (const snack of snacks) {
    const first = extend(root, snack, ctx, weight);
    const [second] = best(snacks, first, ctx, weight);
    drafts.push(
      second && second.score > MIN_SECOND_SNACK_SCORE
        ? extend(first, second.food, ctx, weight)
        : first,
    );
  }
  return rank(drafts, ctx, goal, shown)[0] ?? null;
}
