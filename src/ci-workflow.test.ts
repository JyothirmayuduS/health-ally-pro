import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

describe("CI workflow (P1.3)", () => {
  const path = join(process.cwd(), ".github/workflows/ci.yml");

  it("exists and runs vitest, smoke, and playwright on PRs", () => {
    expect(existsSync(path)).toBe(true);
    const yml = readFileSync(path, "utf8");
    expect(yml).toMatch(/pull_request/);
    expect(yml).toMatch(/npm test/);
    expect(yml).toMatch(/test:smoke/);
    expect(yml).toMatch(/test:e2e|playwright/i);
  });
});
