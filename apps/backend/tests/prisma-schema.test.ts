import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const schemaPath = resolve(process.cwd(), "prisma/schema.prisma");
const initialMigrationPath = resolve(
  process.cwd(),
  "prisma/migrations/20260902200000_init/migration.sql"
);

describe("Prisma schema", () => {
  it("defines the PostgreSQL persistence foundation with UUID identities", async () => {
    const schema = await readFile(schemaPath, "utf8");

    expect(schema).toContain('provider = "postgresql"');
    expect(schema).toContain('id        String   @id @default(uuid())');
    expect(schema).toContain("model User {");
    expect(schema).toContain("model TelegramAccount {");
    expect(schema).toContain("model Proxy {");
    expect(schema).toContain("model Worker {");
    expect(schema).toContain("model SystemSetting {");
  });

  it("includes an initial PostgreSQL migration", async () => {
    const migration = await readFile(initialMigrationPath, "utf8");

    expect(migration).toContain('CREATE TABLE "User"');
    expect(migration).toContain('CREATE TABLE "TelegramAccount"');
    expect(migration).toContain('CREATE INDEX "AccountInvitationSettings_floodWaitUntil_idx"');
  });
});
