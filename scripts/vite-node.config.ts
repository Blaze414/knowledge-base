import { defineConfig } from "vite";

/** Minimal runner config for content scripts; intentionally excludes app plugins. */
export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
});
