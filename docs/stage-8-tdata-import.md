# Stage 8 — TData Import

The worker now exposes a safe TData archive boundary through `createTDataImporter`.

- ZIP input is limited to 25 MiB compressed, 100 MiB expanded, and 2,000 entries.
- Filenames and archive paths are validated; absolute paths and `..` traversal are rejected.
- Telegram Desktop structure requires `key_datas` and at least one `mapN` entry.
- Conversion is an explicit `TDataConverter` seam. If no compatible converter is configured, the operation returns `unsupported_tdata_format` and does not claim success.
- Import results expose only a redacted profile. Session material remains inside the server-side converter boundary.
- The module never logs archive contents or creates public upload paths.

The API entry point is `POST /api/accounts/import-tdata`; it accepts a bounded base64 ZIP payload and queues `IMPORT_TDATA` with encrypted archive bytes. The frontend route `/accounts/import-tdata` performs the same size/type checks before sending and does not persist the raw archive in browser storage. Raw TData must never be placed in logs, frontend responses, or an unencrypted queue payload.
