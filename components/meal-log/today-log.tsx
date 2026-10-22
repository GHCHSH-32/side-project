"use client";

import { TrashIcon } from "@phosphor-icons/react";

import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Slider } from "@/components/ui/slider";
import { findAnyFood, type Food } from "@/lib/foods";
import { MEAL_TYPES, type LogEntry } from "@/lib/meal-log";

type Props = {
  entries: readonly LogEntry[];
  customFoods: readonly Food[];
  onChangePct: (id: string, pct: number) => void;
  onRemove: (id: string) => void;
};

export function TodayLog({ entries, customFoods, onChangePct, onRemove }: Props) {
  if (entries.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyTitle>오늘 기록이 아직 없어요</EmptyTitle>
          <EmptyDescription>
            아이가 먹은 음식을 기록하면 부족한 영양소를 알려드려요.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {MEAL_TYPES.map(({ value, label }) => {
        const meals = entries.filter((entry) => entry.meal === value);
        if (meals.length === 0) return null;
        return (
          <section key={value} className="flex flex-col gap-3">
            <h3 className="text-sm font-medium text-muted-foreground">{label}</h3>
            <ul className="flex flex-col gap-4">
              {meals.map((entry) => {
                const food = findAnyFood(entry.foodId, customFoods);
                if (!food) return null;
                return (
                  <li key={entry.id} className="flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">{food.name}</span>
                      <div className="flex items-center gap-1">
                        <span
                          className="w-12 text-right text-sm tabular-nums text-muted-foreground"
                          aria-live="polite"
                        >
                          {entry.pct}%
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`${food.name} 기록 삭제`}
                          onClick={() => onRemove(entry.id)}
                        >
                          <TrashIcon />
                        </Button>
                      </div>
                    </div>
                    <Slider
                      aria-label={`${food.name} 먹은 양`}
                      min={0}
                      max={100}
                      step={10}
                      value={entry.pct}
                      onValueChange={(next) =>
                        onChangePct(entry.id, Array.isArray(next) ? next[0] : next)
                      }
                    />
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
