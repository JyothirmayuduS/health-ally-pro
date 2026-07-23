import { describe, expect, it } from "vitest";
import { auditRowsToCsv, extractPhiRecordIds } from "@/server/phi-audit";

describe("extractPhiRecordIds", () => {
  it("extracts ids from array and single row", () => {
    expect(
      extractPhiRecordIds([
        { id: "a0000001-0001-4001-8001-000000000001" },
        { id: "not-uuid" },
        { id: "b0000001-0001-4001-8001-000000000002" },
      ]),
    ).toEqual([
      "a0000001-0001-4001-8001-000000000001",
      "b0000001-0001-4001-8001-000000000002",
    ]);
    expect(extractPhiRecordIds({ id: "c0000001-0001-4001-8001-000000000003" })).toEqual([
      "c0000001-0001-4001-8001-000000000003",
    ]);
    expect(extractPhiRecordIds(null)).toEqual([]);
  });
});

describe("auditRowsToCsv", () => {
  it("escapes commas and quotes", () => {
    const csv = auditRowsToCsv([
      {
        created_at: "2026-07-22T00:00:00Z",
        hospital_id: "h1",
        actor_email: 'a,"b"@x.com',
        actor_id: null,
        action: "read",
        resource: "specialty_chart_notes",
        entity_type: null,
        entity_id: null,
        outcome: "success",
        ip: "1.2.3.4",
        user_agent: "Vitest",
      },
    ]);
    expect(csv.split("\n")[0]).toContain("created_at");
    expect(csv).toContain('"a,""b""@x.com"');
    expect(csv).toContain("specialty_chart_notes");
  });
});
