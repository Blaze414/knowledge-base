import { mkdir, readdir, rm, stat, writeFile } from "node:fs/promises";
import { basename, dirname, extname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const projectRoot = fileURLToPath(new URL("..", import.meta.url));
const sourceDir = join(projectRoot, "src", "assets", "media", "articles");
// Images that ship beside a drop-in Markdown article.
const importDir = join(projectRoot, "src", "content", "import");
const outputDir = join(projectRoot, "src", "assets", "media", "optimized");
const supportedExtensions = new Set([".jpg", ".jpeg", ".png"]);
const readingWidth = 768;

async function collectSourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true }).catch(() => []);
  const files = [];

  for (const entry of entries) {
    const entryPath = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectSourceFiles(entryPath)));
    } else if (supportedExtensions.has(extname(entry.name).toLowerCase())) {
      files.push(entryPath);
    }
  }

  return files;
}

await rm(outputDir, { recursive: true, force: true });
await mkdir(outputDir, { recursive: true });

const sourceFiles = [
  ...(await collectSourceFiles(sourceDir)).map((path) => ({ path, base: sourceDir })),
  ...(await collectSourceFiles(importDir)).map((path) => ({ path, base: importDir })),
].sort((left, right) => left.path.localeCompare(right.path));

let sourceBytes = 0;
let outputBytes = 0;
/** id -> intrinsic size of the full-width variant, consumed by src/content/images.ts. */
const manifest = {};

for (const { path: inputPath, base } of sourceFiles) {
  const relativePath = relative(base, inputPath);
  const extension = extname(relativePath).toLowerCase();
  const name = basename(relativePath, extension);
  const outputSubdirectory = join(outputDir, dirname(relativePath));
  const image = sharp(inputPath, { failOn: "warning" }).rotate();
  const metadata = await image.metadata();
  const webpOptions =
    extension === ".png"
      ? { quality: 95, alphaQuality: 100, effort: 6, smartSubsample: true }
      : { quality: 82, alphaQuality: 90, effort: 6, smartSubsample: true };
  const sourceSize = (await stat(inputPath)).size;
  sourceBytes += sourceSize;

  const variants = [
    { suffix: "", width: metadata.width },
    ...(metadata.width && metadata.width > readingWidth
      ? [{ suffix: `-${readingWidth}`, width: readingWidth }]
      : []),
  ];

  manifest[name] = { width: metadata.width, height: metadata.height };

  await mkdir(outputSubdirectory, { recursive: true });
  for (const variant of variants) {
    const outputPath = join(outputSubdirectory, `${name}${variant.suffix}.webp`);
    await sharp(inputPath, { failOn: "warning" })
      .rotate()
      .resize({ width: variant.width, withoutEnlargement: true })
      .webp(webpOptions)
      .toFile(outputPath);
    outputBytes += (await stat(outputPath)).size;
  }
}

// The registry auto-discovers optimised files, but a bundler glob cannot read
// pixel dimensions. Emit them here so images reserve layout space and avoid CLS.
await writeFile(
  join(outputDir, "manifest.json"),
  `${JSON.stringify(Object.fromEntries(Object.entries(manifest).sort()), null, 2)}\n`,
);

const formatBytes = (bytes) => `${(bytes / 1024 / 1024).toFixed(2)} MB`;
const saving = sourceBytes ? Math.round((1 - outputBytes / sourceBytes) * 100) : 0;

console.log(
  `Optimized ${sourceFiles.length} images: ${formatBytes(sourceBytes)} source -> ${formatBytes(outputBytes)} generated (${saving}% smaller across all variants).`,
);
console.log(
  `Wrote ${relative(projectRoot, join(outputDir, "manifest.json"))} — ${Object.keys(manifest).length} entries.`,
);
