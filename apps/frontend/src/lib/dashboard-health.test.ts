import { describe, expect, it } from "vitest";

import { getHealthSummary } from "./dashboard-health";

describe("getHealthSummary", () => {
  it("returns a full score when every service is operational", () => {
    expect(getHealthSummary(["operational", "operational"])).toEqual({
      healthy: 2,
      total: 2,
      percentage: 100,
    });
  });

  it("counts only operational services", () => {
    expect(getHealthSummary(["operational", "degraded", "offline"])).toEqual({
      healthy: 1,
      total: 3,
      percentage: 33,
    });
  });

  it("handles an empty service list", () => {
    expect(getHealthSummary([])).toEqual({
      healthy: 0,
      total: 0,
      percentage: 0,
    });
  });
});
