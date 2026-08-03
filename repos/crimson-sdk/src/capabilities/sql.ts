export type SQLParameterValue =
  | string
  | number
  | bigint
  | boolean
  | Date
  | Uint8Array
  | null;

export type SQLParameters = Readonly<Record<string, SQLParameterValue>>;

export interface SQLDatabase {
  query<T extends Record<string, unknown> = Record<string, unknown>>(
    statement: string,
    parameters?: SQLParameters,
  ): Promise<T[]>;
}

export interface SQLRegistry {
  database(name: string): SQLDatabase;
  close(): Promise<void>;
}
