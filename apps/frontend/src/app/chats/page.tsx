"use client";

import { useState } from "react";

import { createApiClient } from "@/services/api-client";

interface ChatItem { readonly id: string; readonly telegramId: string; readonly type: string; readonly title: string | null; readonly username: string | null; readonly unreadCount: number; readonly pinned: boolean; readonly lastMessageAt: string | null; }
interface MessageItem { readonly id: string; readonly telegramId: string; readonly senderId: string | null; readonly body: string | null; readonly sentAt: string; readonly replyToId: string | null; }

export default function ChatsPage() {
  const [accountId, setAccountId] = useState("");
  const [items, setItems] = useState<readonly ChatItem[]>([]);
  const [status, setStatus] = useState<string>();
  const [selected, setSelected] = useState<ChatItem | null>(null);
  const [messages, setMessages] = useState<readonly MessageItem[]>([]);
  const [draft, setDraft] = useState("");

  async function refresh() {
    if (!accountId.trim()) return;
    try { const result = await createApiClient().get<{ readonly items: readonly ChatItem[] }>(`/api/chats?accountId=${encodeURIComponent(accountId.trim())}`); setItems(result.items); setStatus(`${result.items.length} диалогов`); }
    catch (error) { setStatus(error instanceof Error ? error.message : "Не удалось загрузить чаты."); }
  }

  async function sync() {
    if (!accountId.trim()) return;
    try { const result = await createApiClient().post<{ readonly jobId: string }>(`/api/chats/sync?accountId=${encodeURIComponent(accountId.trim())}`, {}); setStatus(`Синхронизация поставлена в очередь: ${result.jobId}`); }
    catch (error) { setStatus(error instanceof Error ? error.message : "Не удалось запустить синхронизацию."); }
  }
  async function openChat(chat: ChatItem) { setSelected(chat); try { const result = await createApiClient().get<{ readonly items: readonly MessageItem[] }>(`/api/messages?chatId=${encodeURIComponent(chat.id)}&limit=50`); setMessages(result.items); } catch (error) { setStatus(error instanceof Error ? error.message : "Не удалось загрузить сообщения."); } }
  async function send() { if (!selected || !draft.trim()) return; try { const result = await createApiClient().post<{ readonly jobId: string }>("/api/messages", { chatId: selected.id, text: draft.trim() }); setDraft(""); setStatus(`Сообщение поставлено в очередь: ${result.jobId}`); } catch (error) { setStatus(error instanceof Error ? error.message : "Не удалось отправить сообщение."); } }
  async function syncMessages() { if (!selected) return; try { const result = await createApiClient().post<{ readonly jobId: string }>(`/api/messages/sync?chatId=${encodeURIComponent(selected.id)}`, {}); setStatus(`Загрузка сообщений поставлена в очередь: ${result.jobId}`); } catch (error) { setStatus(error instanceof Error ? error.message : "Не удалось загрузить сообщения из Telegram."); } }

  return (
    <div className="space-y-6">
      <div><p className="eyebrow">Telegram / Chats</p><h1 className="mt-2 text-3xl font-semibold text-white">Диалоги аккаунта</h1><p className="mt-3 text-sm text-slate-400">Выберите собственный Telegram-аккаунт, затем загрузите доступные диалоги через worker.</p></div>
      <section className="surface-card space-y-4 p-6">
        <label className="block text-sm text-slate-300">ID аккаунта<input value={accountId} onChange={(event) => setAccountId(event.target.value)} placeholder="UUID TelegramAccount" className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-white" /></label>
        <div className="flex flex-wrap gap-3"><button type="button" onClick={() => void refresh()} className="min-h-11 rounded-lg border border-slate-700 px-4 text-sm text-slate-200">Обновить список</button><button type="button" onClick={() => void sync()} className="min-h-11 rounded-lg bg-emerald-300 px-4 text-sm font-semibold text-slate-950">Синхронизировать</button></div>
        {status ? <p role="status" className="text-sm text-slate-400">{status}</p> : null}
      </section>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <section aria-label="Список диалогов" className="surface-card divide-y divide-slate-800">{items.map((item) => <button type="button" key={item.id} onClick={() => void openChat(item)} className={`flex w-full items-center justify-between gap-4 p-4 text-left hover:bg-slate-900 ${selected?.id === item.id ? "bg-slate-900" : ""}`}><div><h2 className="font-medium text-slate-200">{item.title ?? item.username ?? item.telegramId}</h2><p className="text-xs text-slate-500">{item.type}{item.username ? ` · @${item.username}` : ""}</p></div><div className="text-right text-xs text-slate-500">{item.unreadCount > 0 ? `${item.unreadCount} непрочитанных` : "прочитано"}{item.pinned ? " · закреплён" : ""}</div></button>)}</section>
        <section aria-label="Открытый чат" className="surface-card flex min-h-96 flex-col p-5">{selected ? <><div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-3"><div><h2 className="font-semibold text-slate-100">{selected.title ?? selected.telegramId}</h2><p className="text-xs text-slate-500">{selected.type}</p></div><button type="button" onClick={() => void syncMessages()} className="rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-300">Загрузить из Telegram</button></div><div className="flex-1 space-y-3 overflow-auto py-4">{messages.map((message) => <article key={message.id} className="rounded-lg border border-slate-800 bg-slate-950/40 p-3"><p className="text-sm text-slate-200">{message.body ?? "[медиа]"}</p><time className="mt-1 block text-[11px] text-slate-600">{new Date(message.sentAt).toLocaleString()}</time></article>)}{messages.length === 0 ? <p className="text-sm text-slate-500">Сообщений в кеше пока нет.</p> : null}</div><form onSubmit={(event) => { event.preventDefault(); void send(); }} className="flex gap-2 border-t border-slate-800 pt-3"><input value={draft} onChange={(event) => setDraft(event.target.value)} maxLength={4096} placeholder="Введите сообщение" className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" /><button type="submit" disabled={!draft.trim()} className="rounded-lg bg-emerald-300 px-4 text-sm font-semibold text-slate-950 disabled:opacity-50">Отправить</button></form></> : <p className="m-auto text-sm text-slate-500">Выберите диалог слева.</p>}</section>
      </div>
    </div>
  );
}
