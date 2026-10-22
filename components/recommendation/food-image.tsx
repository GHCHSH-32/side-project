"use client";

import { useState } from "react";
import Image from "next/image";
import {
  BowlFoodIcon,
  CookieIcon,
  CookingPotIcon,
  ForkKnifeIcon,
  LeafIcon,
} from "@phosphor-icons/react";

import { cn } from "@/lib/utils";
import type { Food, FoodRole } from "@/lib/foods";

const ROLE_ICONS: Record<FoodRole, typeof BowlFoodIcon> = {
  staple: BowlFoodIcon,
  protein: ForkKnifeIcon,
  veg: LeafIcon,
  soup: CookingPotIcon,
  snack: CookieIcon,
};

/**
 * 메뉴 사진. `public/foods/<음식 id>.jpg` 파일이 있으면 보여주고,
 * 없거나 불러오지 못하면 끼니 역할에 맞는 아이콘 자리표시를 보여준다.
 */
export function FoodImage({
  food,
  className,
}: {
  food: Food;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const Icon = ROLE_ICONS[food.role];

  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden bg-muted text-muted-foreground",
        className,
      )}
    >
      <Icon aria-hidden className="size-1/2" />
      {!failed && (
        <Image
          src={`/foods/${food.id}.jpg`}
          alt={food.name}
          fill
          sizes="(min-width: 640px) 32rem, 100vw"
          className="object-cover"
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
}
