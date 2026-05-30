export interface AIOptions {
  system?: string;
  prompt: string;
  maxTokens?: number;
}

export interface AIResult {
  response: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface AIBinding {
  run(model: string, options: AIOptions): Promise<AIResult>;
}
