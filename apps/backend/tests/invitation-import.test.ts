import { describe, expect, it } from "vitest";
import { parseInvitationImport } from "../src/api/invitation-import.js";

describe("invitation import parser", () => {
  it("normalizes usernames and reports invalid and duplicate rows", () => {
    const csv = "username,first_name\n@User_One,Alice\nuser_one,Duplicate\ninvalid!,Bad\n,Missing";
    const result = parseInvitationImport("users.csv", new TextEncoder().encode(csv));
    expect(result.rows).toEqual([{ username: "user_one", firstName: "Alice" }]);
    expect(result.totalRows).toBe(4);
    expect(result.invalidRows).toBe(2);
    expect(result.duplicateRows).toBe(1);
  });
  it("requires a username column and rejects unsupported formats", () => {
    expect(() => parseInvitationImport("users.csv", new TextEncoder().encode("name\nAlice"))).toThrow("username_column_required");
    expect(() => parseInvitationImport("users.json", new TextEncoder().encode("{}"))).toThrow("unsupported_import_format");
  });
});
