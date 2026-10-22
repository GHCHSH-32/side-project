import { expect, test } from "@playwright/test";

test("첫 방문에서 아이 정보를 입력하면 기록하고 추천받는 흐름이 돈다", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page).toHaveTitle("오늘의 유아식");

  const now = new Date();
  const birth = `${now.getFullYear() - 2}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  await page.getByLabel("아이 생년월").fill(birth);
  await page.getByRole("button", { name: "시작하기" }).click();

  await expect(
    page.getByRole("heading", { level: 1, name: "오늘의 유아식" }),
  ).toBeVisible();
  await expect(page.getByText("오늘 기록이 아직 없어요")).toBeVisible();

  await page.getByRole("button", { name: "음식 기록하기" }).click();
  await page.getByRole("button", { name: /^계란찜/ }).click();
  await page.keyboard.press("Escape");

  await expect(page.getByText("계란찜", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("오늘 저녁 추천")).toBeVisible();
});
