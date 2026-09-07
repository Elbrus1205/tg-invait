import type { WorkerCommandEnvelope } from "@invait/contracts";
import type { WorkerCommandHandler } from "../types/index.js";
import { createTDataImporter, TDataImportError, type TDataConverter } from "../tdata-import.js";

export function createTDataImportHandler(options: { readonly converter?: TDataConverter }): WorkerCommandHandler {
  const importer = createTDataImporter({ converter: options.converter });
  return async (command: WorkerCommandEnvelope) => {
    const payload = command.payload;
    if (typeof payload !== "object" || payload === null) throw new TDataImportError("invalid_tdata_structure");
    const value = payload as { readonly encryptedArchive?: unknown; readonly filename?: unknown };
    if (typeof value.encryptedArchive !== "string" || typeof value.filename !== "string") throw new TDataImportError("invalid_tdata_structure");
    if (!options.converter) throw new TDataImportError("unsupported_tdata_format");
    const result = await importer.import(Buffer.from(value.encryptedArchive, "base64"), value.filename);
    return { profile: result.profile, filename: result.filename };
  };
}
