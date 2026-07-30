import type {
  APIQueryValue,
  APIRegistry,
  APIRequestOptions,
  APIService,
} from "../capabilities/api.ts";
import type { TokenProvider } from "../runtime.ts";
import { RuntimeError } from "../runtime_error.ts";
import type { APIBindingDescriptor } from "./config.ts";

function resolvePath(baseUrl: string, path: string): URL {
  if (
    !path || /^[A-Za-z][A-Za-z0-9+.-]*:/.test(path) || path.startsWith("//")
  ) {
    throw new RuntimeError(`API paths must be relative: "${path}"`);
  }
  const [pathAndQuery, fragment] = path.split("#", 2);
  if (fragment !== undefined) {
    throw new RuntimeError("API paths cannot contain fragments");
  }
  const pathname = pathAndQuery.split("?", 1)[0];
  let traverses = pathname.includes("\\");
  try {
    traverses ||= pathname.split("/").some((segment) =>
      decodeURIComponent(segment) === ".."
    );
  } catch (cause) {
    throw new RuntimeError("API path contains invalid encoding", cause);
  }
  if (traverses) {
    throw new RuntimeError("API paths cannot traverse parent segments");
  }
  return new URL(`${baseUrl.replace(/\/$/, "")}/${path.replace(/^\/+/, "")}`);
}

function addQuery(
  url: URL,
  query?: Record<string, APIQueryValue | readonly APIQueryValue[]>,
): void {
  if (!query) return;
  for (const [name, rawValue] of Object.entries(query)) {
    const values = Array.isArray(rawValue) ? rawValue : [rawValue];
    for (const value of values) url.searchParams.append(name, String(value));
  }
}

function jsonInit(
  method: string,
  body: unknown,
  options?: APIRequestOptions,
): RequestInit {
  const serialized = JSON.stringify(body);
  if (serialized === undefined) {
    throw new RuntimeError("API request body must be JSON serializable");
  }
  const headers = new Headers(options?.headers);
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  return { method, body: serialized, headers, signal: options?.signal };
}

function createService(
  descriptor: APIBindingDescriptor,
  tokens: TokenProvider,
  appId: string,
): APIService {
  const execute = async (
    url: URL,
    init: RequestInit = {},
  ): Promise<Response> => {
    const requestHeaders = new Headers(init.headers);
    if (requestHeaders.has("Authorization")) {
      throw new RuntimeError(
        "Authorization is controlled by the configured API binding",
      );
    }
    const headers = new Headers(descriptor.defaultHeaders);
    requestHeaders.forEach((value, name) => headers.set(name, value));
    headers.set("X-Crimson-App-Id", appId);
    if (descriptor.auth.kind === "bearer") {
      const token = await tokens.getToken(descriptor.auth.scope);
      headers.set("Authorization", `Bearer ${token.value}`);
      let response = await fetch(url, { ...init, headers });
      if (response.status === 401) {
        const refreshed = await tokens.getToken(descriptor.auth.scope, {
          forceRefresh: true,
        });
        headers.set("Authorization", `Bearer ${refreshed.value}`);
        response = await fetch(url, { ...init, headers });
      }
      return response;
    }
    return await fetch(url, { ...init, headers });
  };

  const send = (path: string, init: RequestInit = {}): Promise<Response> =>
    execute(resolvePath(descriptor.baseUrl, path), init);
  const withOptions = (
    method: string,
    path: string,
    options?: APIRequestOptions,
  ): Promise<Response> => {
    const url = resolvePath(descriptor.baseUrl, path);
    addQuery(url, options?.query);
    return execute(url, {
      method,
      headers: options?.headers,
      signal: options?.signal,
    });
  };
  const withBody = (
    method: string,
    path: string,
    body: unknown,
    options?: APIRequestOptions,
  ): Promise<Response> => {
    const url = resolvePath(descriptor.baseUrl, path);
    addQuery(url, options?.query);
    return execute(url, jsonInit(method, body, options));
  };

  const service: APIService = {
    fetch: send,
    get: (path, options) => withOptions("GET", path, options),
    post: (path, body, options) => withBody("POST", path, body, options),
    put: (path, body, options) => withBody("PUT", path, body, options),
    patch: (path, body, options) => withBody("PATCH", path, body, options),
    delete: (path, options) => withOptions("DELETE", path, options),
  };
  return Object.freeze(service);
}

export function createAPIRegistry(
  descriptors: Readonly<Record<string, APIBindingDescriptor>>,
  tokens: TokenProvider,
  appId: string,
): APIRegistry {
  const services = new Map(
    Object.entries(descriptors).map((
      [name, descriptor],
    ) => [name, createService(descriptor, tokens, appId)]),
  );
  return Object.freeze({
    service(name: string): APIService {
      const service = services.get(name);
      if (!service) {
        throw new RuntimeError(`API binding not granted: "${name}"`);
      }
      return service;
    },
  });
}
