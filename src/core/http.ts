import * as cache from './cache.js';
import { NetworkError, NotFoundError } from './errors.js';

/**
 * Cliente HTTP único do CLI, sobre o `fetch` nativo do Node (18+). Centraliza
 * timeout, User-Agent, cache com TTL e o mapeamento de falhas para erros tipados.
 */

const USER_AGENT = 'devbr-cli (+https://github.com/editzffaleta/devbr-cli)';
const DEFAULT_TIMEOUT_MS = 10_000;
// Status transitórios que valem uma única nova tentativa.
const RETRY_STATUSES = new Set([429, 503]);

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

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Imprime a causa original no stderr quando `DEBUG` inclui "devbr". */
function debugLog(err: unknown): void {
  if ((process.env.DEBUG ?? '').includes('devbr')) {
    const cause = err instanceof Error && err.cause !== undefined ? err.cause : err;
    process.stderr.write(`[devbr] ${String(cause)}\n`);
  }
}

/** Faz uma única requisição; falhas sem resposta (rede/timeout) viram NetworkError sem `status`. */
async function requestOnce(url: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
      signal: controller.signal,
    });
  } catch (err) {
    debugLog(err);
    if (err instanceof Error && err.name === 'AbortError') {
      throw new NetworkError(`Tempo esgotado ao consultar a API (limite de ${timeoutMs}ms).`, {
        cause: err,
      });
    }
    throw new NetworkError('Falha de rede ao consultar a API. Verifique sua conexão.', {
      cause: err,
    });
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Busca JSON de `url`. Retorna o corpo tipado como `T`. Lança `NotFoundError`
 * em 404 e `NetworkError` em timeout/falha de rede, status >= 400 ou corpo não-JSON.
 * Faz uma única nova tentativa em 429/503.
 */
export async function fetchJson<T>(url: string, opts: FetchOptions = {}): Promise<T> {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, cacheTtlMs } = opts;

  if (cacheEnabled && cacheTtlMs) {
    const cached = await cache.get<T>(url);
    if (cached !== undefined) return cached;
  }

  let response = await requestOnce(url, timeoutMs);
  if (RETRY_STATUSES.has(response.status)) {
    await sleep(500 + Math.floor(Math.random() * 500));
    response = await requestOnce(url, timeoutMs);
  }

  if (response.status === 404) {
    throw new NotFoundError('Recurso não encontrado na API.');
  }
  if (!response.ok) {
    throw new NetworkError(`A API respondeu com erro (HTTP ${response.status}).`, {
      status: response.status,
    });
  }

  let data: T;
  try {
    data = (await response.json()) as T;
  } catch (err) {
    debugLog(err);
    throw new NetworkError(
      'A API retornou uma resposta inválida (não-JSON). Tente novamente mais tarde.',
      { cause: err },
    );
  }

  if (cacheEnabled && cacheTtlMs) {
    await cache.set(url, data, cacheTtlMs);
  }

  return data;
}
