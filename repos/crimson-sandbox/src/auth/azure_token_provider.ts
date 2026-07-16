import type { AccessToken, TokenProvider, TokenScope } from "../runtime.ts";
import { RuntimeError } from "../runtime.ts";

export type ScopeResourceMap = Record<TokenScope, string>;

const REFRESH_BUFFER_MS = 60_000;

export class AzureTokenProvider implements TokenProvider {
  readonly #tenantId: string;
  readonly #clientId: string;
  readonly #clientSecret: string;
  readonly #scopeMap: ScopeResourceMap;
  readonly #cache = new Map<TokenScope, AccessToken>();

  constructor(
    tenantId: string,
    clientId: string,
    clientSecret: string,
    scopeMap: ScopeResourceMap,
  ) {
    this.#tenantId = tenantId;
    this.#clientId = clientId;
    this.#clientSecret = clientSecret;
    this.#scopeMap = scopeMap;
  }

  static fromEnv(scopeMap: ScopeResourceMap): AzureTokenProvider {
    const tenantId = Deno.env.get("AZURE_TENANT_ID");
    const clientId = Deno.env.get("AZURE_CLIENT_ID");
    const clientSecret = Deno.env.get("AZURE_CLIENT_SECRET");
    if (!tenantId || !clientId || !clientSecret) {
      throw new RuntimeError(
        "AZURE_TENANT_ID, AZURE_CLIENT_ID, and AZURE_CLIENT_SECRET must be set",
      );
    }
    return new AzureTokenProvider(tenantId, clientId, clientSecret, scopeMap);
  }

  async getToken(
    scope: TokenScope,
    opts?: { forceRefresh?: boolean },
  ): Promise<AccessToken> {
    const cached = this.#cache.get(scope);
    if (
      !opts?.forceRefresh && cached &&
      cached.expiresAt > Date.now() + REFRESH_BUFFER_MS
    ) {
      return cached;
    }
    const token = await this.#acquire(scope);
    this.#cache.set(scope, token);
    return token;
  }

  async #acquire(scope: TokenScope): Promise<AccessToken> {
    const resource = this.#scopeMap[scope];
    const body = new URLSearchParams({
      grant_type: "client_credentials",
      client_id: this.#clientId,
      client_secret: this.#clientSecret,
      scope: `${resource}/.default`,
    });

    const res = await fetch(
      `https://login.microsoftonline.com/${this.#tenantId}/oauth2/v2.0/token`,
      {
        method: "POST",
        body,
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      },
    );

    if (!res.ok) {
      const text = await res.text();
      throw new RuntimeError(
        `Token acquisition failed for scope "${scope}": HTTP ${res.status} — ${text}`,
      );
    }

    const data = await res.json() as {
      access_token: string;
      expires_in: number;
    };
    return {
      value: data.access_token,
      expiresAt: Date.now() + data.expires_in * 1_000,
    };
  }
}
