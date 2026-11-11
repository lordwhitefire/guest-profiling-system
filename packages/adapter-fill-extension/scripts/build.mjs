// =============================================================================
// Build script — esbuild bundles the extension's TypeScript to MV3-compatible JS
// =============================================================================
// Produces 4 bundles in dist/:
//   - background.js  (service worker, type: module per manifest)
//   - content.js     (content script, runs in page context)
//   - popup.js       (popup script, runs in popup.html context)
//   - popup.html + popup.css are copied as-is
//
// Also copies rules/rules.json into dist/rules/ so the content script's
// dynamic import works at runtime.
//
// Run: pnpm --filter @gps/adapter-fill-extension build

import { build, context } from "esbuild";
import { copyFile, mkdir, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const DIST = join(ROOT, "dist");
const SRC = join(ROOT, "src");

// Production build (no watch)
async function buildProd() {
  // Clean dist
  if (existsSync(DIST)) await rm(DIST, { recursive: true, force: true });
  await mkdir(DIST, { recursive: true });

  // Build the three JS bundles in parallel
  await Promise.all([
    build({
      entryPoints: [join(SRC, "background/background.ts")],
      bundle: true,
      outfile: join(DIST, "background.js"),
      target: "chrome120",
      format: "esm",
      platform: "browser",
      minify: true,
      sourcemap: false,
      logLevel: "info",
      define: {
        "process.env.NODE_ENV": '"production"',
      },
    }),
    build({
      entryPoints: [join(SRC, "content/content.ts")],
      bundle: true,
      outfile: join(DIST, "content.js"),
      target: "chrome120",
      // Content scripts MUST be IIFE — MV3 doesn't allow modules for them
      format: "iife",
      platform: "browser",
      minify: true,
      sourcemap: false,
      logLevel: "info",
      define: {
        "process.env.NODE_ENV": '"production"',
      },
    }),
    build({
      entryPoints: [join(SRC, "popup/popup.ts")],
      bundle: true,
      outfile: join(DIST, "popup.js"),
      target: "chrome120",
      format: "iife",
      platform: "browser",
      minify: true,
      sourcemap: false,
      logLevel: "info",
      define: {
        "process.env.NODE_ENV": '"production"',
      },
    }),
  ]);

  // Copy static assets
  await copyFile(join(SRC, "popup/popup.html"), join(DIST, "popup.html"));
  await copyFile(join(SRC, "popup/popup.css"), join(DIST, "popup.css"));
  await copyFile(join(ROOT, "manifest.json"), join(DIST, "manifest.json"));

  // Copy rules.json
  await mkdir(join(DIST, "rules"), { recursive: true });
  await copyFile(join(ROOT, "rules/rules.json"), join(DIST, "rules/rules.json"));

  console.log("\n[build] Done. Output in dist/:");
  console.log("  background.js  (service worker)");
  console.log("  content.js     (content script, IIFE)");
  console.log("  popup.js       (popup script, IIFE)");
  console.log("  popup.html + popup.css");
  console.log("  manifest.json");
  console.log("  rules/rules.json");
  console.log("\nLoad as unpacked extension: chrome://extensions → Load unpacked → select dist/");
}

// Dev build with watch
async function buildDev() {
  await buildProd();
  console.log("\n[dev] Watching for changes...");

  for (const entry of ["background/background.ts", "content/content.ts", "popup/popup.ts"]) {
    const ctx = await context({
      entryPoints: [join(SRC, entry)],
      bundle: true,
      outfile: join(DIST, entry.replace("background/background", "background").replace("content/content", "content").replace("popup/popup", "popup") + ".js"),
      target: "chrome120",
      format: entry.startsWith("content") || entry.startsWith("popup") ? "iife" : "esm",
      platform: "browser",
      minify: false,
      sourcemap: true,
      logLevel: "info",
    });
    await ctx.watch();
  }
}

const watch = process.argv.includes("--watch");
if (watch) {
  buildDev().catch((err) => {
    console.error("[build] Failed:", err);
    process.exit(1);
  });
} else {
  buildProd().catch((err) => {
    console.error("[build] Failed:", err);
    process.exit(1);
  });
}
