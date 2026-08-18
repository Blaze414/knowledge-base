import { defineConfig, devices } from "@playwright/test";

/**
 * Visual regression config.
 * Snapshots are stored alongside specs under tests/visual/__screenshots__.
 * Run: `bun run test:visual` (update with `--update-snapshots`).
 */
export default defineConfig({
  testDir: "./tests/visual",
  snapshotDir: "./tests/visual/__screenshots__",
  /**
   * Deterministic snapshot paths so baselines are shareable across
   * machines and CI. Files land at:
   *   tests/visual/__screenshots__/<spec>/<project>-<platform>/<name>.png
   * Platform is embedded so a macOS-generated baseline never masquerades
   * as the Linux CI baseline (font hinting/AA differ per OS).
   */
  snapshotPathTemplate: "{snapshotDir}/{testFilePath}/{projectName}-{platform}/{arg}{ext}",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"]],
  expect: {
    toHaveScreenshot: {
      // Tolerate sub-pixel AA + font rendering jitter without masking real regressions.
      maxDiffPixelRatio: 0.01,
      threshold: 0.2,
      animations: "disabled",
    },
  },
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:8080",
    viewport: { width: 1280, height: 900 },
    deviceScaleFactor: 1,
    colorScheme: "light",
  },
  projects: [
    {
      name: "chromium-light",
      use: { ...devices["Desktop Chrome"], colorScheme: "light" },
    },
    {
      name: "chromium-dark",
      use: { ...devices["Desktop Chrome"], colorScheme: "dark" },
    },
  ],
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: "bun run dev",
        url: "http://localhost:8080",
        reuseExistingServer: true,
        timeout: 120_000,
      },
});
