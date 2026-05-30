export interface Universe {
  universeId: string;
  name: string;
}

export interface Constituent {
  symbol: string;
  name: string;
  assetClass: string;
  currency: string;
}

export interface ConstituentsResult {
  universeId: string;
  asOf: string;
  constituents: Constituent[];
}

export interface UniversesBinding {
  list(): Promise<{ universes: Universe[] }>;
  constituents(universeId: string): Promise<ConstituentsResult>;
}
