import * as cache from './cache.js';
import { NetworkError, NotFoundError } from './errors.js';

/**
 * Cliente HTTP único do CLI, sobre o `fetch` nativo do Node (18+). Centraliza
 * timeout, User-Agent, cache com TTL e o mapeamento de falhas para erros tipados.
 */

const USER_AGENT = 'devbr-cli (+https://github.com/editzffaleta/devbr-cli)';
const DEFAULT_TIMEOUT_MS = 10_000;

let cacheEnabled = true;

/** Liga/desliga o cache globalmente (a flag `--no-cache` o desliga). */
export function setCacheEnabled(enabled: boolean): void {
  cacheEnabled = enabled;
}

export interface FetchOptions {
  /** Timeout da requisição em ms (padrão: 10s). */
  timeoutMs?: number;
  /** Se informado (e o cache estiver ligado), cacheia a resposta por esse TTL. */
  cacheTtlMs?: number;
}

/**
 * Busca JSON de `url`. Retorna o corpo tipado como `T`. Lança `NotFoundError`
 * em 404, `NetworkError` em timeout/falha de rede ou status >= 400.
 */
export async function fetchJson<T>(url: string, opts: FetchOptions = {}): Promise<T> {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, cacheTtlMs } = opts;

  if (cacheEnabled && cacheTtlMs) {
    const cached = await cache.get<T>(url);
    if (cached !== undefined) return cached;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
      signal: controller.signal,
    });
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new NetworkError(`Tempo esgotado ao consultar a API (limite de ${timeoutMs}ms).`);
    }
    throw new NetworkError('Falha de rede ao consultar a API. Verifique sua conexão.');
  } finally {
    clearTimeout(timer);
  }

  if (response.status === 404) {
    throw new NotFoundError('Recurso não encontrado na API.');
  }
  if (!response.ok) {
    throw new NetworkError(`A API respondeu com erro (HTTP ${response.status}).`);
  }

  const data = (await response.json()) as T;

  if (cacheEnabled && cacheTtlMs) {
    await cache.set(url, data, cacheTtlMs);
  }

  return data;
}
