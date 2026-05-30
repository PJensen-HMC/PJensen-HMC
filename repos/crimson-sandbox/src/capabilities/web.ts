export interface WebHit {
  title: string;
  url: string;
  snippet: string;
}

export interface WebSearchResult {
  query: string;
  hits: WebHit[];
  estimatedTotal: number;
}

export interface WebSearchOptions {
  limit?: number;
}

export interface WebBinding {
  search(query: string, options?: WebSearchOptions): Promise<WebSearchResult>;
}
