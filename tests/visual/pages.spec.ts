import { test } from "@playwright/test";
import { snap } from "./helpers";

/**
 * Snapshots key knowledge-base routes in light + dark mode (driven by the
 * Playwright project's colorScheme). If a literal color or shadow sneaks back
 * in, only one theme will shift and the diff catches it.
 */
const ROUTES: Array<{ name: string; path: string }> = [
  { name: "home", path: "/" },
  { name: "product-sizing", path: "/?page=shopping-apparel-size" },
  { name: "shipping-tracking", path: "/?page=shipping-track-order" },
  { name: "customer-support", path: "/?page=guides-contact-customer-support" },
];

for (const route of ROUTES) {
  test(`page: ${route.name}`, async ({ page }) => {
    await page.goto(route.path, { waitUntil: "networkidle" });
    await snap(page, route.name);
  });
}
