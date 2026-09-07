"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";

import { createApiClient } from "@/services/api-client";

const maxArchiveBytes = 25 * 1024 * 1024;

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, Math.min(offset + chunkSize, bytes.length)));
  }
  return btoa(binary);
}

export default function TDataImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string>();
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".zip")) { setStatus("Нужен ZIP-архив TData."); return; }
    if (file.size === 0 || file.size > maxArchiveBytes) { setStatus("Размер архива должен быть от 1 байта до 25 MiB."); return; }
    setBusy(true); setStatus(undefined);
    try {
      const archiveBase64 = toBase64(new Uint8Array(await file.arrayBuffer()));
      const result = await createApiClient().post<{ readonly jobId: string; readonly status: string }>("/api/accounts/import-tdata", { filename: file.name, archiveBase64 });
      setStatus(`Импорт поставлен в очередь: ${result.jobId}`);
      setFile(null);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Не удалось отправить архив.");
    } finally { setBusy(false); }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <p className="eyebrow">Telegram accounts / TData</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Импорт собственного TData</h1>
        <p className="mt-3 text-sm leading-6 text-slate-400">Архив отправляется в backend по HTTPS и шифруется перед очередью. Worker принимает только валидный экспорт Telegram Desktop TData с подключённым production-конвертером.</p>
      </div>
      <form onSubmit={submit} className="surface-card space-y-5 p-6">
        <label className="block text-sm text-slate-300">
          ZIP-архив
          <input type="file" accept=".zip,application/zip" onChange={(event) => setFile(event.target.files?.[0] ?? null)} className="mt-2 block w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-slate-300 file:mr-3 file:rounded file:border-0 file:bg-emerald-300 file:px-3 file:py-2 file:font-semibold file:text-slate-950" />
        </label>
        <p className="text-xs text-slate-500">Лимит: 25 MiB. После отправки проверьте статус worker и список аккаунтов. Если конвертер TData не настроен, задача завершится с понятной ошибкой — аккаунт не будет создан из неподдерживаемого архива.</p>
        <button type="submit" disabled={!file || busy} className="min-h-11 rounded-lg bg-emerald-300 px-4 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-50">{busy ? "Отправка…" : "Поставить в очередь"}</button>
        {status ? <p role="status" className="text-sm text-slate-300">{status}</p> : null}
      </form>
      <Link href="/accounts" className="text-sm text-emerald-300 hover:text-emerald-200">← К аккаунтам</Link>
    </div>
  );
}
