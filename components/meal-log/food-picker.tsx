"use client";

import { useState } from "react";
import { CheckCircleIcon, PlusIcon, StarIcon } from "@phosphor-icons/react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { CustomFoodForm } from "@/components/meal-log/custom-food-form";
import { FOODS, type Food } from "@/lib/foods";
import { MEAL_TYPES, type LogEntry, type MealType } from "@/lib/meal-log";

type Props = {
  favorites: readonly string[];
  /** 오늘 기록된 음식. 이미 기록된 음식은 선택된 것으로 보여준다. */
  entries: readonly LogEntry[];
  /** 사용자가 직접 입력하거나 검색해서 만든 음식 */
  customFoods: readonly Food[];
  onAddCustomFood: (food: Food) => void;
  onAdd: (meal: MealType, foodId: string) => void;
  onToggleFavorite: (foodId: string) => void;
};

export function FoodPicker({
  favorites,
  entries,
  customFoods,
  onAddCustomFood,
  onAdd,
  onToggleFavorite,
}: Props) {
  const [meal, setMeal] = useState<MealType>("dinner");
  const [tab, setTab] = useState<"all" | "favorites">("all");
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<"list" | "add">("list");

  const mealLabel = MEAL_TYPES.find((item) => item.value === meal)?.label;
  const selectedIds = entries
    .filter((entry) => entry.meal === meal)
    .map((entry) => entry.foodId);
  // 지금 고른 끼니가 아닌 다른 끼니에 기록된 음식은 어느 끼니인지 알려 준다.
  const otherMeals = (foodId: string) =>
    MEAL_TYPES.filter(
      (item) =>
        item.value !== meal &&
        entries.some((entry) => entry.meal === item.value && entry.foodId === foodId),
    ).map((item) => item.label);

  const foods = [...customFoods, ...FOODS].filter(
    (food) =>
      (tab === "all" || favorites.includes(food.id)) &&
      food.name.includes(query.trim()),
  );

  return (
    <Dialog>
      <DialogTrigger render={<Button />}>
        <PlusIcon data-icon="inline-start" />
        음식 기록하기
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {mode === "add" ? "목록에 없는 음식 추가" : "먹인 음식 기록하기"}
          </DialogTitle>
          <DialogDescription>
            {mode === "add"
              ? `이름으로 찾거나 직접 입력해서 ${mealLabel}에 기록해요.`
              : "끼니를 고른 뒤 음식을 누르면 100%로 기록돼요. 먹은 양은 기록 목록에서 바꿀 수 있어요."}
          </DialogDescription>
        </DialogHeader>
        {mode === "add" ? (
          <CustomFoodForm
            initialQuery={query.trim()}
            onCancel={() => setMode("list")}
            onSave={(food) => {
              onAddCustomFood(food);
              onAdd(meal, food.id);
              setMode("list");
            }}
          />
        ) : (
        <div className="flex flex-col gap-4">
          <ToggleGroup
            variant="outline"
            value={[meal]}
            onValueChange={(value) => {
              if (value[0]) setMeal(value[0] as MealType);
            }}
          >
            {MEAL_TYPES.map(({ value, label }) => (
              <ToggleGroupItem key={value} value={value}>
                {label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          <Input
            placeholder="음식 이름 검색"
            aria-label="음식 이름 검색"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <Tabs
            value={tab}
            onValueChange={(value) => setTab(value as "all" | "favorites")}
          >
            <TabsList>
              <TabsTrigger value="all">전체</TabsTrigger>
              <TabsTrigger value="favorites">
                즐겨찾기 {favorites.length}
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <Button variant="secondary" onClick={() => setMode("add")}>
            <PlusIcon data-icon="inline-start" />
            목록에 없는 음식 추가
          </Button>
          {foods.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyTitle>
                  {tab === "favorites" ? "즐겨찾기가 비어 있어요" : "찾는 음식이 없어요"}
                </EmptyTitle>
                <EmptyDescription>
                  {tab === "favorites"
                    ? "전체 탭에서 별 버튼을 눌러 자주 먹는 음식을 추가해 보세요."
                    : "위의 '목록에 없는 음식 추가'로 검색하거나 직접 입력할 수 있어요."}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <ul className="flex flex-col gap-2">
              {foods.map((food) => {
                const favorite = favorites.includes(food.id);
                const selected = selectedIds.includes(food.id);
                const others = otherMeals(food.id);
                return (
                  <li key={food.id} className="flex items-center gap-2">
                    <Button
                      variant={selected ? "secondary" : "outline"}
                      className="h-auto flex-1 justify-between py-2 text-left"
                      aria-pressed={selected}
                      aria-label={
                        selected ? `${food.name}, ${mealLabel}에 기록됨` : food.name
                      }
                      onClick={() => {
                        // 같은 끼니에 같은 음식을 다시 기록하지 않는다.
                        if (!selected) onAdd(meal, food.id);
                      }}
                    >
                      <span className="flex flex-col items-start gap-0.5">
                        <span className="flex items-center gap-1.5">
                          {selected && (
                            <CheckCircleIcon weight="fill" aria-hidden className="text-primary" />
                          )}
                          {food.name}
                        </span>
                        {others.length > 0 && (
                          <span className="text-xs font-normal text-muted-foreground">
                            {others.join(", ")}에도 기록됨
                          </span>
                        )}
                      </span>
                      {selected ? (
                        <Badge>{mealLabel}에 기록됨</Badge>
                      ) : (
                        food.id.startsWith("custom:") && (
                          <Badge variant="secondary">내가 추가</Badge>
                        )
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={
                        favorite
                          ? `${food.name} 즐겨찾기 해제`
                          : `${food.name} 즐겨찾기 추가`
                      }
                      aria-pressed={favorite}
                      onClick={() => onToggleFavorite(food.id)}
                    >
                      <StarIcon weight={favorite ? "fill" : "regular"} />
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
          <p className="text-sm text-muted-foreground">
            오늘 {entries.length}개 기록됨 · {mealLabel} {selectedIds.length}개
          </p>
        </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
