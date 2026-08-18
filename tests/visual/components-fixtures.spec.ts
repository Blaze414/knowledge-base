import { test, expect } from "@playwright/test";
import { stabilize } from "./helpers";

/**
 * Snapshots each component group on the dedicated fixtures route so we can
 * catch theme regressions in buttons, inputs, tabs, dialogs, and toasts.
 */
test.beforeEach(async ({ page }) => {
  await page.goto("/visual-fixtures", { waitUntil: "networkidle" });
  await stabilize(page);
});

const GROUPS = ["buttons", "inputs", "cards", "tabs"] as const;

for (const group of GROUPS) {
  test(`component: ${group}`, async ({ page }) => {
    const el = page.locator(`[data-visual="${group}"]`);
    await el.waitFor();
    await expect(el).toHaveScreenshot(`component-${group}.png`);
  });
}

test("component: dialog open", async ({ page }) => {
  await page.getByRole("button", { name: "Open dialog" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.waitFor();
  await stabilize(page);
  await expect(page).toHaveScreenshot("component-dialog.png");
});

test("component: toast", async ({ page }) => {
  await page.getByRole("button", { name: "Show toast" }).click();
  const toast = page.locator("[data-sonner-toast]").first();
  await toast.waitFor();
  await stabilize(page);
  await expect(toast).toHaveScreenshot("component-toast.png");
});
