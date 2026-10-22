"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ALLERGENS, type Allergen } from "@/lib/foods";
import { ageGroupOf, ageInMonths, describeAge } from "@/lib/nutrition";
import type { Profile } from "@/lib/meal-log";

type Props = {
  initial?: Profile | null;
  submitLabel: string;
  onSubmit: (profile: Profile) => void;
};

const SELECT_CLASS =
  "h-9 w-full min-w-0 rounded-3xl border border-transparent bg-input/50 px-3 py-1 text-base outline-none transition-[color,box-shadow,background-color] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 md:text-sm";

/** 연도와 월을 따로 골라서 브라우저마다 입력칸이 달라지는 문제를 피한다. */
function splitBirth(birth: string | undefined) {
  const match = birth?.match(/^(\d{4})-(\d{1,2})$/);
  return match ? { year: match[1], month: String(Number(match[2])) } : { year: "", month: "" };
}

export function ProfileForm({ initial, submitLabel, onSubmit }: Props) {
  const [name, setName] = useState(initial?.name ?? "");
  const [year, setYear] = useState(splitBirth(initial?.birth).year);
  const [month, setMonth] = useState(splitBirth(initial?.birth).month);
  const [allergies, setAllergies] = useState<Allergen[]>(
    initial?.allergies ?? [],
  );

  const today = new Date();
  const thisYear = today.getFullYear();
  const years = Array.from({ length: 9 }, (_, index) => thisYear - index);
  const birth = year && month ? `${year}-${month.padStart(2, "0")}` : "";
  const months = birth ? ageInMonths(birth, today) : null;
  const outOfRange = birth !== "" && ageGroupOf(birth, today) === null;

  const toggle = (allergen: Allergen, checked: boolean) =>
    setAllergies((current) =>
      checked
        ? [...current, allergen]
        : current.filter((item) => item !== allergen),
    );

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (birth) onSubmit({ name: name.trim() || undefined, birth, allergies });
      }}
    >
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="name">아기 이름 (선택)</FieldLabel>
          <Input
            id="name"
            maxLength={10}
            placeholder="예: 하준"
            autoComplete="off"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <FieldDescription>
            {`입력하면 화면 제목이 "${name.trim() || "하준"}의 오늘의 유아식"처럼 바뀌어요.`}
          </FieldDescription>
        </Field>
        <FieldSet>
          <FieldLegend variant="label">아이 생년월</FieldLegend>
          <div className="grid grid-cols-2 gap-3">
            <select
              aria-label="태어난 해"
              required
              className={SELECT_CLASS}
              value={year}
              onChange={(event) => setYear(event.target.value)}
            >
              <option value="">연도</option>
              {years.map((value) => (
                <option key={value} value={value}>
                  {value}년
                </option>
              ))}
            </select>
            <select
              aria-label="태어난 달"
              required
              className={SELECT_CLASS}
              value={month}
              onChange={(event) => setMonth(event.target.value)}
            >
              <option value="">월</option>
              {Array.from({ length: 12 }, (_, index) => index + 1).map((value) => (
                <option key={value} value={value}>
                  {value}월
                </option>
              ))}
            </select>
          </div>
          {outOfRange && months !== null ? (
            <p role="status" className="text-sm text-destructive">
              {`${describeAge(months)}이라서 이 앱의 대상이 아니에요. 생후 12개월부터 만 5세까지(만 1~5세) 아이를 위한 앱이에요. 이대로 저장하면 영양 목표와 추천을 볼 수 없어요.`}
            </p>
          ) : (
            <FieldDescription>
              월령에 맞는 영양 목표를 정하는 데만 사용해요.
            </FieldDescription>
          )}
        </FieldSet>
        <FieldSet>
          <FieldLegend variant="label">알레르기</FieldLegend>
          <FieldDescription>
            해당하는 성분이 든 음식은 추천에서 빠져요. 없으면 선택하지 않아도
            돼요.
          </FieldDescription>
          <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
            {ALLERGENS.map((allergen) => (
              <Field key={allergen} orientation="horizontal">
                <Checkbox
                  id={`allergy-${allergen}`}
                  checked={allergies.includes(allergen)}
                  onCheckedChange={(checked) => toggle(allergen, checked)}
                />
                <FieldLabel htmlFor={`allergy-${allergen}`} className="font-normal">
                  {allergen}
                </FieldLabel>
              </Field>
            ))}
          </div>
        </FieldSet>
        <Button type="submit" disabled={!birth}>
          {submitLabel}
        </Button>
      </FieldGroup>
    </form>
  );
}
