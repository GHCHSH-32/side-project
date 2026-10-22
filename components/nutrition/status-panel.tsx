import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  FILL_LEVEL_LABELS,
  LIMIT_LEVEL_LABELS,
  NUTRIENT_LABELS,
  type FillLevel,
  type nutritionStatus,
} from "@/lib/nutrition";

type Status = ReturnType<typeof nutritionStatus>;

const FILL_BADGE: Record<FillLevel, "default" | "secondary" | "outline"> = {
  enough: "default",
  little: "secondary",
  lack: "outline",
};

export function StatusPanel({ status }: { status: Status }) {
  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-4">
        <h3 className="text-sm font-medium text-muted-foreground">
          채워야 할 영양소
        </h3>
        <ul className="grid gap-4 sm:grid-cols-2">
          {status.fill.map(({ key, ratio, level }) => (
            <li key={key} className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium">{NUTRIENT_LABELS[key]}</span>
                <Badge variant={FILL_BADGE[level]}>{FILL_LEVEL_LABELS[level]}</Badge>
              </div>
              <Progress
                aria-label={`${NUTRIENT_LABELS[key]} 섭취 상태`}
                value={Math.min(ratio, 1) * 100}
              />
            </li>
          ))}
        </ul>
        <p className="text-sm text-muted-foreground">
          비타민 D는 음식만으로는 부족할 수 있어요. 필요하면 소아과에서 상담해
          보세요.
        </p>
      </section>
      <section className="flex flex-col gap-4">
        <h3 className="text-sm font-medium text-muted-foreground">
          넘지 않는 게 좋은 영양소
        </h3>
        <ul className="grid gap-4 sm:grid-cols-2">
          {status.limits.map(({ key, ratio, level }) => (
            <li key={key} className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium">{NUTRIENT_LABELS[key]}</span>
                <Badge variant={level === "over" ? "destructive" : "secondary"}>
                  {LIMIT_LEVEL_LABELS[level]}
                </Badge>
              </div>
              <Progress
                aria-label={`${NUTRIENT_LABELS[key]} 섭취 상태`}
                value={Math.min(ratio, 1) * 100}
              />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
