export type APIQueryValue = string | number | boolean;

export interface APIRequestOptions {
  query?: Record<string, APIQueryValue | readonly APIQueryValue[]>;
  headers?: HeadersInit;
  signal?: AbortSignal;
}

export interface APIService {
  fetch(path: string, init?: RequestInit): Promise<Response>;
  get(path: string, options?: APIRequestOptions): Promise<Response>;
  post(
    path: string,
    body: unknown,
    options?: APIRequestOptions,
  ): Promise<Response>;
  put(
    path: string,
    body: unknown,
    options?: APIRequestOptions,
  ): Promise<Response>;
  patch(
    path: string,
    body: unknown,
    options?: APIRequestOptions,
  ): Promise<Response>;
  delete(path: string, options?: APIRequestOptions): Promise<Response>;
}

export interface APIRegistry {
  service(name: string): APIService;
}
