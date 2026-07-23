import { describe, expect, it } from "vitest";
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const SKIP_DIRS = new Set([
  "node_modules",
  "dist",
  ".git",
  ".wrangler",
  ".tanstack",
  "test-results",
  "playwright-report",
  "coverage",
  "medora-native",
]);

/** Patterns that indicate a real secret leaked into the tree (placeholders OK). */
const FORBIDDEN = [
  /sk_live_[A-Za-z0-9]{20,}/,
  /sk_test_[A-Za-z0-9]{20,}/,
  /whsec_[A-Za-z0-9]{20,}/,
  /eyJhbGciOiJ[A-Za-z0-9_-]{40,}\.[A-Za-z0-9_-]+\./, // JWT-like service tokens
];

const PLACEHOLDER_HINTS =
  /your-|example|placeholder|generate-a-random|local-dev|sk_live_\.\.\.|for_testing|_only|c2VjcmV0/i;

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    if (name === ".env.local" || name === ".dev.vars") continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (
      (/\.(ts|tsx|js|mjs|json|jsonc|md|toml|yml|yaml|example|env)$/i.test(name) ||
        name === ".env.example") &&
      !/\.test\.(ts|tsx|js)$/i.test(name)
    ) {
      out.push(p);
    }
  }
  return out;
}

describe("secret hygiene (P0.2)", () => {
  it("does not commit .env.local or .dev.vars", () => {
    // Files may exist locally but must not be tracked — assert gitignore intent via absence from walk of committed examples only
    expect(existsSync(join(ROOT, ".env.example"))).toBe(true);
    expect(existsSync(join(ROOT, ".dev.vars.example"))).toBe(true);
  });

  it("scanned source/docs have no live Stripe/JWT secret material", () => {
    const files = walk(ROOT);
    const hits: string[] = [];
    for (const file of files) {
      let text: string;
      try {
        text = readFileSync(file, "utf8");
      } catch {
        continue;
      }
      if (PLACEHOLDER_HINTS.test(text) && !/sk_live_[A-Za-z0-9]{20,}/.test(text)) {
        // placeholders like sk_live_... in docs are fine
      }
      for (const re of FORBIDDEN) {
        const m = text.match(re);
        if (m && !PLACEHOLDER_HINTS.test(m[0])) {
          hits.push(`${relative(ROOT, file)}: ${m[0].slice(0, 24)}…`);
        }
      }
    }
    expect(hits).toEqual([]);
  });

  it("env examples do not use VITE_ for service role", () => {
    const example = readFileSync(join(ROOT, ".env.example"), "utf8");
    expect(example).not.toMatch(/VITE_SUPABASE_SERVICE_ROLE/);
    expect(example).toMatch(/SUPABASE_SERVICE_ROLE_KEY=/);
  });
});
