"use client";

import { useState } from "react";
import { PencilSimpleIcon } from "@phosphor-icons/react";

import { FoodPicker } from "@/components/meal-log/food-picker";
import { TodayLog } from "@/components/meal-log/today-log";
import { StatusPanel } from "@/components/nutrition/status-panel";
import { ProfileForm } from "@/components/profile/profile-form";
import { RecommendationCard } from "@/components/recommendation/recommendation-card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { Skeleton } from "@/components/ui/skeleton";
import { FOODS, findAnyFood } from "@/lib/foods";
import {
  dateKey,
  mealLogActions,
  useMealLog,
  type AppState,
  type Profile,
} from "@/lib/meal-log";
import { ageGroupOf, nutritionStatus, sumIntake } from "@/lib/nutrition";
import { recommendDinner, recommendSnacks } from "@/lib/recommend";

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-8 md:px-6">
      {children}
    </main>
  );
}

function LoadingState() {
  return (
    <Shell>
      <Skeleton className="h-9 w-2/3" />
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-60 w-full" />
    </Shell>
  );
}

function Disclaimer() {
  return (
    <Alert>
      <AlertTitle>알려드려요</AlertTitle>
      <AlertDescription>
        이 앱은 의료 조언이나 진단이 아니에요. 영양 값은 데모용 근사치이고, 목표값은
        한국인 영양소 섭취기준을 바탕으로 한 임시값이에요. 재료 분량과 조리 시간도
        2세 기준의 참고용이니, 아이 상태에 맞게 조절해 주세요.
      </AlertDescription>
    </Alert>
  );
}

function ProfileDialog({ profile }: { profile: Profile }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" />}>
        <PencilSimpleIcon data-icon="inline-start" />
        아이 정보 수정
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>아이 정보 수정</DialogTitle>
          <DialogDescription>
            수정하면 영양 목표와 추천에 바로 반영돼요.
          </DialogDescription>
        </DialogHeader>
        <ProfileForm
          initial={profile}
          submitLabel="저장"
          onSubmit={(next) => {
            mealLogActions.saveProfile(next);
            setOpen(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

function SetupState() {
  return (
    <Shell>
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">아이 정보를 알려주세요</CardTitle>
          <CardDescription>
            오늘 먹인 음식을 기록하면 저녁과 간식 메뉴를 추천해 드려요.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm submitLabel="시작하기" onSubmit={mealLogActions.saveProfile} />
        </CardContent>
      </Card>
      <Disclaimer />
    </Shell>
  );
}

function Dashboard({ state, profile }: { state: AppState; profile: Profile }) {
  const today = new Date();
  const date = dateKey(today);
  const entries = state.log[date] ?? [];
  const group = ageGroupOf(profile.birth, today);

  const header = (
    <header className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-semibold">
          {profile.name ? `${profile.name}의 ` : ""}오늘의 유아식
        </h1>
        <p className="text-sm text-muted-foreground">
          {today.getFullYear()}년 {today.getMonth() + 1}월 {today.getDate()}일 · 아이 생년월 {profile.birth}
        </p>
      </div>
      <ProfileDialog profile={profile} />
    </header>
  );

  if (!group) {
    return (
      <Shell>
        {header}
        <Alert>
          <AlertTitle>이 앱은 만 1~5세 아이를 위한 거예요</AlertTitle>
          <AlertDescription>
            입력한 생년월은 대상 월령이 아니라서 영양 목표와 추천을 보여드릴 수
            없어요. 아이 정보를 확인해 주세요.
          </AlertDescription>
        </Alert>
        <Disclaimer />
      </Shell>
    );
  }

  const intake = sumIntake(
    entries.flatMap((entry) => {
      const food = findAnyFood(entry.foodId, state.customFoods);
      return food ? [{ food, pct: entry.pct }] : [];
    }),
  );
  const status = nutritionStatus(intake, group);
  const ctx = {
    foods: FOODS,
    intake,
    group,
    allergies: profile.allergies,
    eatenIds: entries.map((entry) => entry.foodId),
  };
  // 기록이나 알레르기가 바뀌면 "다른 조합" 이력을 처음부터 다시 쌓는다.
  const resetKey = JSON.stringify([
    entries.map((entry) => [entry.foodId, entry.pct]),
    profile.allergies,
    group,
  ]);

  return (
    <Shell>
      {header}
      <Card>
        <CardHeader>
          <CardTitle>오늘 먹인 음식</CardTitle>
          <CardAction>
            <FoodPicker
              favorites={state.favorites}
              entries={entries}
              customFoods={state.customFoods}
              onAddCustomFood={mealLogActions.addCustomFood}
              onAdd={(meal, foodId) => mealLogActions.addEntry(date, meal, foodId)}
              onToggleFavorite={mealLogActions.toggleFavorite}
            />
          </CardAction>
        </CardHeader>
        <CardContent>
          <TodayLog
            entries={entries}
            customFoods={state.customFoods}
            onChangePct={(id, pct) => mealLogActions.setPct(date, id, pct)}
            onRemove={(id) => mealLogActions.removeEntry(date, id)}
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>오늘의 영양 상태</CardTitle>
          <CardDescription>
            하루 목표와 비교한 대략적인 상태예요. 저녁 전에는 부족하게 보일 수
            있고, 저녁과 간식으로 채울 수 있어요.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <StatusPanel status={status} />
        </CardContent>
      </Card>
      <RecommendationCard
        key={`dinner-${resetKey}`}
        title="오늘 저녁 추천"
        description="부족한 영양소를 채우면서 20분 안에 만들 수 있는 메뉴예요."
        recommend={(shown) => recommendDinner(ctx, shown)}
      />
      <RecommendationCard
        key={`snack-${resetKey}`}
        title="간식 추천"
        description="저녁 전후에 더해 주면 좋은 간식이에요."
        recommend={(shown) => recommendSnacks(ctx, shown)}
      />
      <Disclaimer />
    </Shell>
  );
}

export function MealApp() {
  const state = useMealLog();

  if (!state) return <LoadingState />;
  if (!state.profile) return <SetupState />;
  return <Dashboard state={state} profile={state.profile} />;
}
