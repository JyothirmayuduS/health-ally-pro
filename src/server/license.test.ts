import { describe, expect, it } from "vitest";
import { getServerLicense, serverHasModule } from "@/server/license";

describe("server license", () => {
  it("treats short keys as evaluation", () => {
    const prevKey = process.env.MEDORA_LICENSE_KEY;
    const prevPlan = process.env.MEDORA_PLAN;
    delete process.env.MEDORA_LICENSE_KEY;
    delete process.env.VITE_MEDORA_LICENSE_KEY;
    delete process.env.MEDORA_PLAN;
    delete process.env.VITE_MEDORA_PLAN;

    expect(getServerLicense()).toEqual({ licensed: false, plan: "evaluation" });
    expect(serverHasModule("specialty_desk")).toBe(true);
    expect(serverHasModule("anatomy_3d")).toBe(false);

    process.env.MEDORA_LICENSE_KEY = prevKey;
    process.env.MEDORA_PLAN = prevPlan;
  });

  it("unlocks professional modules with a long key", () => {
    process.env.MEDORA_LICENSE_KEY = "abcdefghijklmnop";
    process.env.MEDORA_PLAN = "professional";
    expect(getServerLicense().licensed).toBe(true);
    expect(serverHasModule("hospital_units")).toBe(true);
    expect(serverHasModule("multi_branch")).toBe(false);
    delete process.env.MEDORA_LICENSE_KEY;
    delete process.env.MEDORA_PLAN;
  });
});
