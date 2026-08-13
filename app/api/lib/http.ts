interface RequestConfig extends RequestInit {
  baseUrl?: string;
  params?: Record<string, string | number | boolean | null | undefined>;
  timeout?: number;
}

function getApiBaseUrl(): string {
  const configured =
    typeof import.meta !== "undefined" &&
    import.meta.env?.VITE_API_URL
      ? String(import.meta.env.VITE_API_URL)
      : "";

  // Jeżeli VITE_API_URL jest ustawione, używamy Railway.
  if (configured.trim()) {
    return configured.trim().replace(/\/+$/, "");
  }

  // Fallback dla lokalnego developmentu.
  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  return "";
}

function buildUrl(
  baseUrl: string,
  endpoint: string,
  params?: RequestConfig["params"],
): string {
  const cleanBase = baseUrl.replace(/\/+$/, "");
  const cleanEndpoint = endpoint.startsWith("/")
    ? endpoint
    : `/${endpoint}`;

  const url = new URL(`${cleanBase}${cleanEndpoint}`);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    });
  }

  return url.toString();
}

export class HttpClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;

  constructor(
    baseURL?: string,
    opts?: {
      headers?: Record<string, string>;
    },
  ) {
    this.baseUrl = (
      baseURL?.trim() ||
      getApiBaseUrl()
    ).replace(/\/+$/, "");

    this.defaultHeaders = {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...opts?.headers,
    };
  }

  async request<T>(
    endpoint: string,
    config: RequestConfig = {},
  ): Promise<T> {
    const {
      method = "GET",
      params,
      body,
      headers,
      timeout = 30000,
      baseUrl,
      ...rest
    } = config;

    const apiBase = (baseUrl || this.baseUrl).replace(/\/+$/, "");

    if (!apiBase) {
      throw new Error(
        "API URL is not configured. Set VITE_API_URL in Netlify.",
      );
    }

    const url = buildUrl(apiBase, endpoint, params);

    const controller = new AbortController();

    const timeoutId = window.setTimeout(() => {
      controller.abort();
    }, timeout);

    try {
      const response = await fetch(url, {
        ...rest,
        method,
        headers: {
          ...this.defaultHeaders,
          ...headers,
        },

        // Ważne dla sesji/cookies z backendu Railway.
        credentials: "include",

        body:
          body !== undefined && body !== null
            ? typeof body === "string"
              ? body
              : JSON.stringify(body)
            : undefined,

        signal: controller.signal,
      });

      window.clearTimeout(timeoutId);

      if (!response.ok) {
        let message = `HTTP Error: ${response.status}`;

        try {
          const errorData = await response.json();

          if (
            errorData &&
            typeof errorData === "object" &&
            typeof errorData.message === "string"
          ) {
            message = errorData.message;
          } else if (
            errorData &&
            typeof errorData === "object" &&
            typeof errorData.error === "string"
          ) {
            message = errorData.error;
          }
        } catch {
          // Odpowiedź nie była JSON-em.
        }

        throw new Error(message);
      }

      // 204 No Content
      if (response.status === 204) {
        return undefined as T;
      }

      const contentType =
        response.headers.get("content-type") || "";

      if (contentType.includes("application/json")) {
        return (await response.json()) as T;
      }

      const text = await response.text();

      return text as T;
    } catch (error: unknown) {
      window.clearTimeout(timeoutId);

      if (
        error instanceof DOMException &&
        error.name === "AbortError"
      ) {
        throw new Error("Request timeout");
      }

      if (error instanceof Error) {
        throw error;
      }

      throw new Error("Unknown HTTP request error");
    }
  }

  get<T>(
    endpoint: string,
    params?: RequestConfig["params"],
    config?: RequestConfig,
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: "GET",
      params,
    });
  }

  post<T>(
    endpoint: string,
    body?: unknown,
    config?: RequestConfig,
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: "POST",
      body,
    });
  }

  put<T>(
    endpoint: string,
    body?: unknown,
    config?: RequestConfig,
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: "PUT",
      body,
    });
  }

  patch<T>(
    endpoint: string,
    body?: unknown,
    config?: RequestConfig,
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: "PATCH",
      body,
    });
  }

  delete<T>(
    endpoint: string,
    config?: RequestConfig,
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: "DELETE",
    });
  }
}

// Główny klient API aplikacji.
export const http = new HttpClient();
