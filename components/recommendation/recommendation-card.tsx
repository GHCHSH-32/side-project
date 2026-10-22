"use client";

import { useState } from "react";
import {
  ArrowLeftIcon,
  ArrowsClockwiseIcon,
  CaretRightIcon,
  ClockIcon,
} from "@phosphor-icons/react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { FoodImage } from "@/components/recommendation/food-image";
import { photoCredit, type Food } from "@/lib/foods";
import type { RecommendationSet } from "@/lib/recommend";

type Props = {
  title: string;
  description: string;
  /** 이미 보여준 조합을 제외한 다음 추천을 계산한다. 없으면 null. */
  recommend: (shown: readonly string[]) => RecommendationSet | null;
};

function FoodDetailDialog({ food }: { food: Food }) {
  const credit = photoCredit(food.id);

  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button
            variant="link"
            className="h-auto p-0 font-heading text-lg font-semibold"
          />
        }
      >
        {food.name}
        <CaretRightIcon data-icon="inline-end" />
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{food.name}</DialogTitle>
          <DialogDescription>
            조리 {food.minutes}분 · 1회분 {food.serving}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-5 text-sm">
          <figure className="flex flex-col gap-1.5">
            <FoodImage food={food} className="aspect-video w-full rounded-2xl" />
            {credit && (
              <figcaption className="text-xs text-muted-foreground">
                사진: {credit.artist} ·{" "}
                <a
                  href={credit.licenseUrl || credit.page}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2"
                >
                  {credit.license}
                </a>{" "}
                ·{" "}
                <a
                  href={credit.page}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2"
                >
                  Wikimedia Commons
                </a>
              </figcaption>
            )}
          </figure>
          <section className="flex flex-col gap-2">
            <h4 className="font-medium">재료</h4>
            <ul className="flex flex-col gap-1">
              {food.ingredients.map(({ name, amount }) => (
                <li key={name} className="flex justify-between gap-4">
                  <span>{name}</span>
                  <span className="tabular-nums text-muted-foreground">{amount}</span>
                </li>
              ))}
            </ul>
          </section>
          <section className="flex flex-col gap-2">
            <h4 className="font-medium">조리법</h4>
            <ol className="flex list-decimal flex-col gap-1.5 pl-5">
              {food.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </section>
          {food.allergens.length > 0 && (
            <p className="text-muted-foreground">
              알레르기 성분: {food.allergens.join(", ")}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function RecommendationCard({ title, description, recommend }: Props) {
  const [shown, setShown] = useState<string[]>([]);

  const current = recommend(shown);
  const hasMore = current ? recommend([...shown, current.signature]) !== null : false;

  return (
    <Card className="overflow-clip">
      <CardHeader className="sticky top-0 z-10 bg-card py-3">
        <CardTitle className="flex flex-wrap items-baseline gap-x-2">
          {title}
          {current && (
            <span className="text-sm font-normal text-muted-foreground">
              {shown.length + 1}번째 조합{!hasMore && " · 마지막"}
            </span>
          )}
        </CardTitle>
        {current && (
          <CardAction className="row-span-1 -mt-1 flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={shown.length === 0}
              onClick={() => setShown(shown.slice(0, -1))}
            >
              <ArrowLeftIcon data-icon="inline-start" />
              이전 조합
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!hasMore}
              onClick={() => setShown([...shown, current.signature])}
            >
              <ArrowsClockwiseIcon data-icon="inline-start" />
              다른 조합 보기
            </Button>
          </CardAction>
        )}
        <CardDescription className="col-span-2">{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        {current ? (
          current.picks.map(({ food, reasons }, index) => (
            <div key={food.id} className="flex flex-col gap-3">
              {index > 0 && <Separator />}
              <div className="flex gap-3">
                <FoodImage food={food} className="size-20 rounded-2xl" />
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <FoodDetailDialog food={food} />
                    <Badge variant="secondary">
                      <ClockIcon data-icon="inline-start" />
                      {food.minutes}분
                    </Badge>
                  </div>
                  <ul className="flex flex-col gap-1 text-sm">
                    {reasons.map((reason) => (
                      <li key={reason}>{reason}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">
            조건에 맞는 메뉴가 없어요. 알레르기 설정이나 오늘 기록한 음식을
            확인해 보세요.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
