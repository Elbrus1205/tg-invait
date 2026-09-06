import { describe, expect, it } from "vitest";
import { parseEnvironment } from "./env.js";

describe("parseEnvironment", () => {
  it("applies safe development defaults without inventing secrets", () => {
    const environment = parseEnvironment({});

    expect(environment.NODE_ENV).toBe("development");
    expect(environment.BACKEND_PORT).toBe(4_000);
    expect(environment.JWT_SECRET).toBeUndefined();
  });
});
