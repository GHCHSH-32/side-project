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
import type { Profile } from "@/lib/meal-log";

type Props = {
  initial?: Profile | null;
  submitLabel: string;
  onSubmit: (profile: Profile) => void;
};

export function ProfileForm({ initial, submitLabel, onSubmit }: Props) {
  const [name, setName] = useState(initial?.name ?? "");
  const [birth, setBirth] = useState(initial?.birth ?? "");
  const [allergies, setAllergies] = useState<Allergen[]>(
    initial?.allergies ?? [],
  );

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
        <Field>
          <FieldLabel htmlFor="birth">아이 생년월</FieldLabel>
          <Input
            id="birth"
            type="month"
            required
            value={birth}
            onChange={(event) => setBirth(event.target.value)}
          />
          <FieldDescription>
            월령에 맞는 영양 목표를 정하는 데만 사용해요.
          </FieldDescription>
        </Field>
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
