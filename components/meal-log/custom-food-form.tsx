"use client";

import { useRef, useState } from "react";
import { ArrowLeftIcon, MagnifyingGlassIcon } from "@phosphor-icons/react";

import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  scaleNutrients,
  type FoodSearchResult,
} from "@/lib/food-search";
import { createCustomFood, type Food, type NutrientKey, type Nutrients } from "@/lib/foods";
import { NUTRIENT_LABELS, NUTRIENT_UNITS } from "@/lib/nutrition";

type Props = {
  initialQuery: string;
  onSave: (food: Food) => void;
  onCancel: () => void;
};

type Status =
  | { state: "idle" }
  | { state: "loading" }
  | { state: "done"; results: FoodSearchResult[] }
  | { state: "error"; message: string };

const NUTRIENT_ORDER: readonly NutrientKey[] = [
  "protein",
  "iron",
  "calcium",
  "fiber",
  "potassium",
  "vitaminA",
  "vitaminC",
  "vitaminD",
  "sodium",
  "sugar",
];

const EMPTY_NUTRIENTS = Object.fromEntries(
  NUTRIENT_ORDER.map((key) => [key, 0]),
) as Nutrients;

type Scope = "foods" | "products";

async function load(text: string, scope: Scope): Promise<Status> {
  try {
    const response = await fetch(
      `/api/food-search?q=${encodeURIComponent(text)}&scope=${scope}`,
    );
    const data = (await response.json()) as {
      results?: FoodSearchResult[];
      error?: string;
    };
    if (!response.ok || !data.results) {
      return {
        state: "error",
        message:
          data.error === "not-configured"
            ? "시판 제품 검색을 쓸 수 없는 상태예요."
            : "검색에 실패했어요. 잠시 뒤 다시 해 보세요.",
      };
    }
    return { state: "done", results: data.results };
  } catch {
    return { state: "error", message: "검색에 실패했어요. 잠시 뒤 다시 해 보세요." };
  }
}

function blankResult(): FoodSearchResult {
  return {
    code: "manual",
    name: "",
    category: "",
    kind: "직접 입력",
    basisAmount: 100,
    basisUnit: "g",
    nutrients: EMPTY_NUTRIENTS,
  };
}

export function CustomFoodForm({ initialQuery, onSave, onCancel }: Props) {
  const [query, setQuery] = useState(initialQuery);
  const [status, setStatus] = useState<Status>({ state: "idle" });
  const [selected, setSelected] = useState<FoodSearchResult | null>(null);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("100");
  // 보호자가 직접 고친 영양 값. 고치지 않은 값은 분량에 맞춰 환산한 값을 쓴다.
  const [manual, setManual] = useState<Partial<Record<NutrientKey, string>>>({});
  const [products, setProducts] = useState<Status>({ state: "idle" });
  const latest = useRef({ foods: 0, products: 0 });
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // 일반 음식과 외식은 미리 받아 둔 데이터에서 찾아서 입력하는 동안 바로 결과가 나온다.
  function searchFoods(value: string) {
    const text = value.trim();
    const request = ++latest.current.foods;
    latest.current.products++;
    setProducts({ state: "idle" });
    if (!text) {
      setStatus({ state: "idle" });
      return;
    }
    void load(text, "foods").then((next) => {
      if (request === latest.current.foods) setStatus(next);
    });
  }

  // 시판 제품은 공공 API로 찾아서 몇 초 걸릴 수 있다.
  function searchProducts() {
    const text = query.trim();
    if (!text) return;
    const request = ++latest.current.products;
    setProducts({ state: "loading" });
    void load(text, "products").then((next) => {
      if (request === latest.current.products) setProducts(next);
    });
  }

  function changeQuery(value: string) {
    setQuery(value);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => searchFoods(value), 200);
  }

  function choose(result: FoodSearchResult, fallbackName = "") {
    setSelected(result);
    setName(result.name || fallbackName);
    setAmount(String(result.basisAmount));
    setManual({});
  }

  if (selected) {
    const servingAmount = Number(amount);
    const valid = name.trim().length > 0 && servingAmount > 0;
    const scaled = scaleNutrients(
      selected.nutrients,
      selected.basisAmount,
      servingAmount > 0 ? servingAmount : 0,
    );

    const save = () => {
      const nutrients = {} as Nutrients;
      for (const key of NUTRIENT_ORDER) {
        const value = Number(manual[key] ?? scaled[key]);
        nutrients[key] = Number.isFinite(value) && value > 0 ? value : 0;
      }
      onSave(
        createCustomFood({
          name: name.trim(),
          serving: `${servingAmount}${selected.basisUnit}`,
          nutrients,
        }),
      );
    };

    return (
      <form
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (valid) save();
        }}
      >
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="custom-name">음식 이름</FieldLabel>
            <Input
              id="custom-name"
              required
              maxLength={30}
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="custom-amount">
              먹이는 1회분 분량 ({selected.basisUnit})
            </FieldLabel>
            <Input
              id="custom-amount"
              type="number"
              inputMode="decimal"
              min={1}
              step="any"
              required
              value={amount}
              onChange={(event) => {
                setAmount(event.target.value);
                setManual({});
              }}
            />
          </Field>
        </FieldGroup>
        <section className="flex flex-col gap-2">
          <h4 className="text-sm font-medium">1회분 영양 값</h4>
          <p className="text-xs text-muted-foreground">
            {selected.code === "manual"
              ? "알고 있는 값만 넣어도 돼요. 비워 두면 0으로 계산해요."
              : `${selected.basisAmount}${selected.basisUnit} 기준 값을 분량에 맞게 계산했어요. 다르면 직접 고칠 수 있어요.${
                  selected.fromMl ? " 원래 mL로 잰 자료라서 1mL를 1g으로 보고 계산했어요." : ""
                }`}
          </p>
          <div className="grid grid-cols-2 gap-3">
            {NUTRIENT_ORDER.map((key) => (
              <Field key={key}>
                <FieldLabel htmlFor={`custom-${key}`} className="text-xs font-normal">
                  {NUTRIENT_LABELS[key]} ({NUTRIENT_UNITS[key]})
                </FieldLabel>
                <Input
                  id={`custom-${key}`}
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step="any"
                  value={manual[key] ?? String(scaled[key])}
                  onChange={(event) =>
                    setManual((current) => ({ ...current, [key]: event.target.value }))
                  }
                />
              </Field>
            ))}
          </div>
          {selected.code !== "manual" && (
            <p className="text-xs text-muted-foreground">
              영양 값 출처: 식품의약품안전처 식품영양성분DB(공공데이터포털)
            </p>
          )}
        </section>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => setSelected(null)}>
            <ArrowLeftIcon data-icon="inline-start" />
            다시 찾기
          </Button>
          <Button type="submit" className="flex-1" disabled={!valid}>
            기록하기
          </Button>
        </div>
      </form>
    );
  }

  const renderResults = (results: readonly FoodSearchResult[]) => (
    <ul className="flex flex-col gap-2">
      {results.map((result) => (
        <li key={result.code}>
          <Button
            variant="outline"
            className="h-auto w-full flex-col items-start gap-0.5 py-2 text-left"
            onClick={() => choose(result)}
          >
            <span>{result.name}</span>
            <span className="text-xs font-normal text-muted-foreground">
              {[result.category, result.kind, `${result.basisAmount}${result.basisUnit} 기준`]
                .filter(Boolean)
                .join(" · ")}
            </span>
          </Button>
        </li>
      ))}
    </ul>
  );

  return (
    <div className="flex flex-col gap-4">
      <form
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          clearTimeout(timer.current);
          searchFoods(query);
        }}
      >
        <Input
          autoFocus
          placeholder="찾을 음식 이름 (예: 미역국, 닭죽)"
          aria-label="찾을 음식 이름"
          maxLength={30}
          value={query}
          onChange={(event) => changeQuery(event.target.value)}
        />
        <Button type="submit" disabled={!query.trim()}>
          <MagnifyingGlassIcon data-icon="inline-start" />
          검색
        </Button>
      </form>

      <div aria-live="polite" className="flex flex-col gap-4">
        {status.state === "error" && (
          <p role="alert" className="text-sm text-destructive">
            {status.message}
          </p>
        )}
        {status.state === "done" && status.results.length === 0 && (
          <p className="text-sm text-muted-foreground">
            일반 음식과 외식에서는 찾지 못했어요. 시판 제품에서 찾아보거나 직접 입력해 보세요.
          </p>
        )}
        {status.state === "done" && status.results.length > 0 && renderResults(status.results)}

        {status.state === "done" && (
          <section className="flex flex-col gap-2">
            {products.state === "idle" && (
              <Button variant="outline" onClick={searchProducts}>
                시판 제품에서도 찾아보기
              </Button>
            )}
            {products.state === "loading" && (
              <p role="status" className="text-sm text-muted-foreground">
                시판 제품을 찾는 중이에요. 공공 데이터라 몇 초 걸릴 수 있어요.
              </p>
            )}
            {products.state === "error" && (
              <p role="alert" className="text-sm text-destructive">
                {products.message}
              </p>
            )}
            {products.state === "done" && (
              <>
                <h4 className="text-sm font-medium">시판 제품</h4>
                {products.results.length === 0 ? (
                  <p className="text-sm text-muted-foreground">시판 제품 결과가 없어요.</p>
                ) : (
                  renderResults(products.results)
                )}
              </>
            )}
          </section>
        )}
      </div>

      <div className="flex flex-col gap-2 border-t pt-4">
        <Button variant="secondary" onClick={() => choose(blankResult(), query.trim())}>
          찾는 음식이 없어요, 직접 입력할게요
        </Button>
        <Button variant="ghost" onClick={onCancel}>
          <ArrowLeftIcon data-icon="inline-start" />
          목록으로 돌아가기
        </Button>
      </div>
    </div>
  );
}
