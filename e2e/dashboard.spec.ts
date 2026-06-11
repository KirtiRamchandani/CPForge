import { test, expect } from "@playwright/test";

test("dashboard home renders brand and stats", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("CP Forge", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Home" })).toBeVisible();
  await expect(page.getByText("DSA Mastery")).toBeVisible();
});

test("sheet search filters problems", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Sheets" }).click();
  await page.getByPlaceholder("Search title").fill("two sum");
  await expect(page.getByRole("link").filter({ hasText: /two sum/i }).first()).toBeVisible();
});

test("export button triggers download", async ({ page }) => {
  await page.goto("/");
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export JSON" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("dashboard-data.json");
});
