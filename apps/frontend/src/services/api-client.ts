export class ApiClientNotConfiguredError extends Error {
  constructor() {
    super("Backend API is not configured yet.");
    this.name = "ApiClientNotConfiguredError";
  }
}

export interface ApiClientOptions {
  baseUrl?: string;
  fetcher?: typeof fetch;
}

export interface ApiClient {
  get<T>(path: string, init?: RequestInit): Promise<T>;
  post<T>(path: string, body: unknown, init?: RequestInit): Promise<T>;
  patch<T>(path: string, body: unknown, init?: RequestInit): Promise<T>;
  delete<T = void>(path: string, init?: RequestInit): Promise<T>;
}

/**
 * Typed seam for future backend calls. No endpoint is invoked by the Stage 1 UI.
 */
export function createApiClient(options: ApiClientOptions = {}): ApiClient {
  const baseUrl = options.baseUrl ?? process.env.NEXT_PUBLIC_API_URL;
  const fetcher = options.fetcher ?? fetch;

  return {
    async get<T>(path: string, init?: RequestInit) {
      if (!baseUrl) {
        throw new ApiClientNotConfiguredError();
      }

      const response = await fetcher(new URL(path, baseUrl), {
        ...init,
        headers: {
          Accept: "application/json",
          ...(typeof window === "undefined" || window.localStorage.getItem("invait.accessToken") === null ? {} : { Authorization: `Bearer ${window.localStorage.getItem("invait.accessToken")!}` }),
          ...init?.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      return (await response.json()) as T;
    },
    async post<T>(path: string, body: unknown, init?: RequestInit) {
      if (!baseUrl) {
        throw new ApiClientNotConfiguredError();
      }
      const token = typeof window === "undefined" ? undefined : window.localStorage.getItem("invait.accessToken");
      const response = await fetcher(new URL(path, baseUrl), {
        ...init,
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          ...(token === null || token === undefined ? {} : { Authorization: `Bearer ${token}` }),
          ...init?.headers,
        },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      return (await response.json()) as T;
    },
    async patch<T>(path: string, body: unknown, init?: RequestInit) {
      if (!baseUrl) throw new ApiClientNotConfiguredError();
      const token = typeof window === "undefined" ? undefined : window.localStorage.getItem("invait.accessToken");
      const response = await fetcher(new URL(path, baseUrl), { ...init, method: "PATCH", headers: { Accept: "application/json", "Content-Type": "application/json", ...(token ? { Authorization: "Bearer " + token } : {}), ...init?.headers }, body: JSON.stringify(body) });
      if (!response.ok) throw new Error("API request failed with status " + response.status);
      return (response.status === 204 ? undefined : await response.json()) as T;
    },
    async delete<T = void>(path: string, init?: RequestInit) {
      if (!baseUrl) throw new ApiClientNotConfiguredError();
      const token = typeof window === "undefined" ? undefined : window.localStorage.getItem("invait.accessToken");
      const response = await fetcher(new URL(path, baseUrl), { ...init, method: "DELETE", headers: { Accept: "application/json", ...(token ? { Authorization: "Bearer " + token } : {}), ...init?.headers } });
      if (!response.ok) throw new Error("API request failed with status " + response.status);
      return (response.status === 204 ? undefined : await response.json()) as T;
    },
  };
}
