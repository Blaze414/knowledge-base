import { type Page, expect } from "@playwright/test";

/**
 * Wait for fonts + images to settle, then freeze anything that animates so
 * snapshots are deterministic.
 */
export async function stabilize(page: Page) {
  await page.evaluate(async () => {
    if (document.fonts) await document.fonts.ready;
    const imgs = Array.from(document.images);
    await Promise.all(
      imgs
        .filter((img) => !img.complete)
        .map(
          (img) =>
            new Promise<void>((resolve) => {
              img.addEventListener("load", () => resolve(), { once: true });
              img.addEventListener("error", () => resolve(), { once: true });
            }),
        ),
    );
  });
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation: none !important;
        transition: none !important;
        caret-color: transparent !important;
      }
      html { scroll-behavior: auto !important; }
    `,
  });
  await page.waitForTimeout(150);
}

export async function snap(page: Page, name: string) {
  await stabilize(page);
  await expect(page).toHaveScreenshot(`${name}.png`, { fullPage: true });
}
