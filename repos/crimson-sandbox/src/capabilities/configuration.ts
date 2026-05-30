export interface UserIdentity {
  userId: string;
  displayName: string;
  email: string;
}

export interface AppPolicy {
  maxAITokensPerRequest: number;
  allowedFabricDatasets: string[];
}

export interface ConfigurationBinding {
  get(key: string): unknown;
  getIdentity(): UserIdentity;
  getPolicy(): AppPolicy;
}
