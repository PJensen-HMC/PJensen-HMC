export interface APICallOptions {
  params?: Record<string, string>;
  body?: unknown;
  method?: string;
}

export interface APICallResult<T> {
  status: number;
  data: T;
}

export interface APIBinding {
  call<T = unknown>(
    path: string,
    options?: APICallOptions,
  ): Promise<APICallResult<T>>;
}
