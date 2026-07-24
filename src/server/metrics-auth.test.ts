import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { authorizeMetricsRequest } from "./metrics-auth";

describe("authorizeMetricsRequest", () => {
  const prev = process.env.METRICS_BEARER_TOKEN;

  beforeEach(() => {
    delete process.env.METRICS_BEARER_TOKEN;
  });

  afterEach(() => {
    if (prev === undefined) delete process.env.METRICS_BEARER_TOKEN;
    else process.env.METRICS_BEARER_TOKEN = prev;
  });

  it("fails closed with 503 when token is unset", () => {
    const res = authorizeMetricsRequest(new Request("http://localhost/api/metrics"));
    expect(res).not.toBeNull();
    expect(res!.status).toBe(503);
  });

  it("rejects missing bearer with 401", () => {
    process.env.METRICS_BEARER_TOKEN = "secret-token-value";
    const res = authorizeMetricsRequest(new Request("http://localhost/api/metrics"));
    expect(res!.status).toBe(401);
  });

  it("rejects wrong bearer with 401", () => {
    process.env.METRICS_BEARER_TOKEN = "secret-token-value";
    const res = authorizeMetricsRequest(
      new Request("http://localhost/api/metrics", {
        headers: { Authorization: "Bearer wrong" },
      }),
    );
    expect(res!.status).toBe(401);
  });

  it("allows matching bearer", () => {
    process.env.METRICS_BEARER_TOKEN = "secret-token-value";
    const res = authorizeMetricsRequest(
      new Request("http://localhost/api/metrics", {
        headers: { Authorization: "Bearer secret-token-value" },
      }),
    );
    expect(res).toBeNull();
  });
});
