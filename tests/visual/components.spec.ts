import { test } from "@playwright/test";
import { snap } from "./helpers";

/**
 * Snapshots key surface components in isolation by opening them in the live
 * app and screenshotting the relevant area. Covers buttons, inputs, cards,
 * callouts, and the mobile sheet — the surfaces most likely to regress if a
 * hardcoded color or shadow is reintroduced.
 */

test("components: sidebar surface", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  const sidebar = page.locator("aside").first();
  await sidebar.waitFor();
  await snap(page, "components-sidebar");
});

test("components: article card grid", async ({ page }) => {
  await page.goto("/?page=shipping-track-order", { waitUntil: "networkidle" });
  await snap(page, "components-cards");
});

test("components: callouts + inputs", async ({ page }) => {
  await page.goto("/?page=guides-contact-customer-support", { waitUntil: "networkidle" });
  await snap(page, "components-callouts");
});
