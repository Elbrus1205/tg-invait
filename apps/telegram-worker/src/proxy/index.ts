/** Proxy access is a port; concrete network clients are deferred to a later stage. */
export interface ProxyConnector {
  connect(): Promise<void>;
  close(): Promise<void>;
}
