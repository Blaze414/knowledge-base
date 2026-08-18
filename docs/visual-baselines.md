# Visual Baseline Strategy

Playwright screenshots are only trustworthy if every environment renders
them identically. This project standardizes on the following rules.

## 1. Where baselines live

Snapshots are committed under:

```
tests/visual/__screenshots__/<spec-path>/<project>-<platform>/<name>.png
```

The path is enforced by `snapshotPathTemplate` in `playwright.config.ts`.
Embedding `{platform}` (linux/darwin/win32) prevents a macOS baseline from
silently overriding the Linux CI baseline — different OSes hint fonts and
anti-alias edges differently.

The canonical baselines are the **linux** ones produced in the pinned
Playwright container (see below). Other platforms are optional and only
present if a contributor commits them.

## 2. How to generate / refresh baselines

Never run `--update-snapshots` on your host machine and commit the result:
host fonts, GPU, and DPI drift the pixels.

Instead run:

```bash
scripts/update-visual-baselines.sh                     # refresh everything
scripts/update-visual-baselines.sh tests/visual/pages.spec.ts   # scoped
```

The script launches `mcr.microsoft.com/playwright:v1.61.1-jammy` — the same
image CI uses — mounts the repo, installs deps, and regenerates PNGs. Pin
the image tag to the exact `@playwright/test` version in `package.json`;
bump both together.

## 3. How to review a baseline change

1. Run `bun run test:visual` locally in the container (or let CI run it).
2. On failure Playwright writes `*-actual.png` and `*-diff.png` under
   `test-results/`. Attach those to the PR — never overwrite baselines to
   silence a diff.
3. If the diff is intentional, run the update script, then commit only the
   affected `<project>-linux` PNGs. Reviewers can diff PNGs directly in
   GitHub.

## 4. Storage / versioning

- Baselines are checked into Git alongside the code that produced them so
  history is single-sourced and bisectable.
- `.gitattributes` marks the PNGs as binary and opts them into Git LFS.
  Enable LFS on the remote (`git lfs install && git lfs track` is already
  configured via `.gitattributes`) once the `__screenshots__` tree grows
  beyond a few MB. Repos without LFS still work — the filter is a no-op.
- Tag the repo (or attach a workflow artifact) whenever the design tokens
  change so previous baselines remain reproducible: `git tag
visual-baselines/<yyyy-mm-dd>` after a token migration.

## 5. Environment invariants

The container run bakes in the assumptions the specs rely on:

| Invariant     | Value                                 |
| ------------- | ------------------------------------- |
| OS            | Ubuntu 22.04 (jammy)                  |
| Browser       | Playwright-bundled Chromium (pinned)  |
| Viewport      | 1280 × 900, DPR 1                     |
| Color schemes | `chromium-light`, `chromium-dark`     |
| Fonts         | Whatever the app loads via `<link>`   |
| Animations    | Disabled by `tests/visual/helpers.ts` |

If any of these change (new viewport, new font, Playwright bump), refresh
all baselines in the same commit as the change.
