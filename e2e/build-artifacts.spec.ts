import { test, expect } from "@playwright/test";
import { existsSync } from "node:fs";
import path from "node:path";

test("chrome extension bundle is built", async () => {
  expect(existsSync(path.join(process.cwd(), "apps/chrome-extension/dist/popup.html"))).toBe(true);
  expect(existsSync(path.join(process.cwd(), "apps/chrome-extension/dist/src/content.js"))).toBe(true);
});

test("vscode extension bundle is built", async () => {
  expect(existsSync(path.join(process.cwd(), "apps/vscode-extension/dist/extension.js"))).toBe(true);
});
