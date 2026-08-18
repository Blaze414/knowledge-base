import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import type { Plugin } from "vite";

const PROJECT_ROOT = fileURLToPath(new URL("..", import.meta.url));
const VALIDATOR = join(PROJECT_ROOT, "scripts", "validate-content.ts");
const RUNNER_CONFIG = join(PROJECT_ROOT, "scripts", "vite-node.config.ts");
const VITE_NODE_CLI = join(PROJECT_ROOT, "node_modules", "vite-node", "dist", "cli.mjs");

/**
 * Vite plugin that runs the knowledge-base link integrity validator on
 * every dev server start and production build. Fails the build (and
 * prints a clear error in dev) when sidebar/article/doc links break.
 */
export function kbLinkIntegrityPlugin(): Plugin {
  let ran = false;
  const run = (mode: "dev" | "build") => {
    if (ran) return;
    ran = true;
    const result = spawnSync(
      process.execPath,
      [VITE_NODE_CLI, "--config", RUNNER_CONFIG, VALIDATOR],
      {
        cwd: PROJECT_ROOT,
        stdio: "inherit",
      },
    );
    if (result.status !== 0) {
      const msg = "Knowledge base link integrity check failed — see errors above.";
      if (mode === "build") throw new Error(msg);
      console.error(`\n\u2717 ${msg}\n`);
    }
  };
  return {
    name: "kb-link-integrity",
    apply: () => true,
    buildStart() {
      run("build");
    },
    configureServer() {
      run("dev");
    },
  };
}
