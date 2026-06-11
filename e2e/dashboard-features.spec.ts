import { test, expect } from "@playwright/test";

test("progress tab shows pattern mastery", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Progress" }).click();
  await expect(page.getByText("Pattern mastery")).toBeVisible();
});

test("companies tab shows readiness radar", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Companies" }).click();
  await expect(page.getByText(/readiness radar/i)).toBeVisible();
});
