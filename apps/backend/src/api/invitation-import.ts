import * as XLSX from "xlsx";

export interface InvitationImportRow { readonly username: string; readonly telegramId?: string; readonly accessHash?: string; readonly firstName?: string; readonly lastName?: string; readonly note?: string; readonly tag?: string; readonly source?: string; }
export interface InvitationImportIssue { readonly row: number; readonly reason: "missing_username" | "invalid_username" | "duplicate"; }
export interface InvitationImportResult { readonly rows: readonly InvitationImportRow[]; readonly issues: readonly InvitationImportIssue[]; readonly totalRows: number; readonly validRows: number; readonly invalidRows: number; readonly duplicateRows: number; }

function clean(value: unknown): string | undefined { if (typeof value !== "string" && typeof value !== "number") return undefined; const normalized = String(value).trim(); return normalized === "" ? undefined : normalized; }
function header(value: unknown): string { return (clean(value) ?? "").toLowerCase().replace(/\s+/g, "_"); }
function username(value: unknown): string | undefined { const valueText = clean(value)?.replace(/^@+/, "").toLowerCase(); return valueText && /^[a-z0-9_]{5,32}$/.test(valueText) ? valueText : undefined; }

export function parseInvitationImport(filename: string, data: Uint8Array): InvitationImportResult {
  if (!/\.(csv|xlsx?|xls)$/i.test(filename)) throw new Error("unsupported_import_format");
  if (data.byteLength === 0 || data.byteLength > 25 * 1024 * 1024) throw new Error("import_too_large");
  const workbook = XLSX.read(data, { type: "array", raw: false, dense: true });
  const first = workbook.Sheets[workbook.SheetNames[0] ?? ""];
  if (!first) throw new Error("import_empty");
  const matrix = XLSX.utils.sheet_to_json<unknown[]>(first, { header: 1, defval: "", raw: false });
  const headers = (matrix.shift() ?? []).map(header);
  const usernameIndex = headers.indexOf("username");
  if (usernameIndex < 0) throw new Error("username_column_required");
  const rows: InvitationImportRow[] = [];
  const issues: InvitationImportIssue[] = [];
  const seen = new Set<string>();
  matrix.forEach((cells, index) => {
    const rowNumber = index + 2;
    if (!cells.some((cell) => clean(cell))) return;
    const normalizedUsername = username(cells[usernameIndex]);
    if (!clean(cells[usernameIndex])) { issues.push({ row: rowNumber, reason: "missing_username" }); return; }
    if (!normalizedUsername) { issues.push({ row: rowNumber, reason: "invalid_username" }); return; }
    if (seen.has(normalizedUsername)) { issues.push({ row: rowNumber, reason: "duplicate" }); return; }
    seen.add(normalizedUsername);
    const value = (name: string): string | undefined => { const indexOf = headers.indexOf(name); return indexOf < 0 ? undefined : clean(cells[indexOf]); };
    rows.push({ username: normalizedUsername, ...(value("telegram_id") ? { telegramId: value("telegram_id")! } : {}), ...(value("access_hash") ? { accessHash: value("access_hash")! } : {}), ...(value("first_name") ? { firstName: value("first_name")! } : {}), ...(value("last_name") ? { lastName: value("last_name")! } : {}), ...(value("note") ? { note: value("note")! } : {}), ...(value("tag") ? { tag: value("tag")! } : {}), ...(value("source") ? { source: value("source")! } : {}) });
  });
  return { rows, issues, totalRows: matrix.filter((cells) => cells.some((cell) => clean(cell))).length, validRows: rows.length, invalidRows: issues.filter((issue) => issue.reason !== "duplicate").length, duplicateRows: issues.filter((issue) => issue.reason === "duplicate").length };
}
