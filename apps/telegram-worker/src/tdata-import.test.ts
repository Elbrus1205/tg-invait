import { describe, expect, it } from "vitest";
import { createTDataImporter, type TDataConverter } from "./tdata-import.js";

describe("TData import boundary", () => {
  it("rejects path traversal and malformed archives before extraction", async () => {
    const importer = createTDataImporter({ converter: undefined });
    await expect(importer.inspect(Buffer.from("not-a-zip"), "account.zip")).rejects.toMatchObject({ code: "invalid_archive" });
  });

  it("validates TData structure and keeps conversion behind an explicit seam", async () => {
    const converter: TDataConverter = {
      convert: async (input) => ({ session: `session-for-${input.accountHint}`, profile: { telegramId: 123n, username: "owned" } })
    };
    const importer = createTDataImporter({ converter });
    const archive = importer.createTestArchive(["tdata/key_datas", "tdata/map0"]).archive;
    const result = await importer.import(archive, "owned.zip", { accountHint: "owned" });
    expect(result.profile).toEqual({ telegramId: "123", username: "owned" });
    expect(result).not.toHaveProperty("session");
  });

  it("reports unsupported conversion without exposing archive contents", async () => {
    const importer = createTDataImporter({ converter: undefined });
    const archive = importer.createTestArchive(["tdata/key_datas", "tdata/map0"]).archive;
    await expect(importer.import(archive, "private.zip", { accountHint: "private" })).rejects.toMatchObject({ code: "unsupported_tdata_format" });
  });
});
