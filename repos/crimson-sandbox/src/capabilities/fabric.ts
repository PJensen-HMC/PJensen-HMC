export interface FabricQueryOptions {
  filter?: Record<string, unknown>;
  orderBy?: string;
  order?: "asc" | "desc";
  limit?: number;
}

export interface FabricQueryResult<T> {
  rows: T[];
  total: number;
  hasMore: boolean;
}

export interface Fabric {
  query<T = unknown>(
    dataset: string,
    options?: FabricQueryOptions,
  ): Promise<FabricQueryResult<T>>;
}
