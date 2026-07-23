import { describe, expect, it } from "vitest";
import { auditRowsToCsv } from "@/server/phi-audit";
import { getSeatLimits } from "@/lib/license";

describe("10/10 packaging helpers", () => {
  it("csv helper returns header row", () => {
    expect(auditRowsToCsv([]).startsWith("created_at")).toBe(true);
  });

  it("seat limits expose plan caps", () => {
    const seats = getSeatLimits();
    expect(seats.staff).toBeGreaterThan(0);
    expect(seats.doctors).toBeGreaterThan(0);
  });
});
