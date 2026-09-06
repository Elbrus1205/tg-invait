export interface RealtimeEvent { readonly type: string; readonly entity?: string; readonly entityId?: string; readonly payload?: unknown; readonly createdAt: string; }
export type RealtimeSubscriber = (event: RealtimeEvent) => void;
export class EventHub {
  private readonly subscribers = new Set<RealtimeSubscriber>();
  public subscribe(subscriber: RealtimeSubscriber): { close(): void } { this.subscribers.add(subscriber); return { close: () => this.subscribers.delete(subscriber) }; }
  public publish(event: RealtimeEvent): void { for (const subscriber of this.subscribers) { try { subscriber(event); } catch { /* isolate subscribers */ } } }
  public get size(): number { return this.subscribers.size; }
}
