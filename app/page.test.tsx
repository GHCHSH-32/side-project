import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";

import Home from "@/app/page";

test("처음 방문하면 아이 정보 입력 화면을 보여준다", () => {
  render(<Home />);

  expect(screen.getByLabelText("태어난 해")).toBeInTheDocument();
  expect(screen.getByLabelText("태어난 달")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "시작하기" })).toBeDisabled();
});
