import type { AccessToken, TokenProvider, TokenScope } from "../runtime.ts";
import { RuntimeError } from "../runtime.ts";

export type StaticTokenMap = Partial<Record<TokenScope, string>>;

export class StaticTokenProvider implements TokenProvider {
  readonly #tokens: StaticTokenMap;
  readonly #ttlMs: number;

  constructor(tokens: StaticTokenMap, ttlMs = 8 * 60 * 60 * 1_000) {
    this.#tokens = tokens;
    this.#ttlMs = ttlMs;
  }

  getToken(scope: TokenScope): Promise<AccessToken> {
    const value = this.#tokens[scope];
    if (!value) {
      return Promise.reject(
        new RuntimeError(
          `StaticTokenProvider: no token configured for scope "${scope}"`,
        ),
      );
    }
    return Promise.resolve({ value, expiresAt: Date.now() + this.#ttlMs });
  }
}
