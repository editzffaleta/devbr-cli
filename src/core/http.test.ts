import { afterEach, describe, expect, it, vi } from 'vitest';
import { NetworkError, NotFoundError } from './errors.js';
import { fetchJson, setCacheEnabled } from './http.js';

// desliga o cache nestes testes para isolar o comportamento do fetch
setCacheEnabled(false);

afterEach(() => {
  vi.restoreAllMocks();
});

function mockFetch(response: Partial<Response> & { json?: () => Promise<unknown> }): void {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({}),
      ...response,
    }),
  );
}

describe('fetchJson', () => {
  it('retorna o JSON tipado em caso de sucesso', async () => {
    mockFetch({ json: async () => [{ nome: 'ok' }] });
    const data = await fetchJson<Array<{ nome: string }>>('https://api.exemplo/teste');
    expect(data).toEqual([{ nome: 'ok' }]);
  });

  it('envia um User-Agent do CLI', async () => {
    const spy = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({}) });
    vi.stubGlobal('fetch', spy);
    await fetchJson('https://api.exemplo/teste');
    const headers = spy.mock.calls[0]?.[1]?.headers as Record<string, string>;
    expect(headers['User-Agent']).toContain('devbr-cli');
  });

  it('lança NotFoundError em 404', async () => {
    mockFetch({ ok: false, status: 404 });
    await expect(fetchJson('https://api.exemplo/x')).rejects.toBeInstanceOf(NotFoundError);
  });

  it('lança NetworkError em status >= 400', async () => {
    mockFetch({ ok: false, status: 500 });
    await expect(fetchJson('https://api.exemplo/x')).rejects.toBeInstanceOf(NetworkError);
  });

  it('lança NetworkError em timeout (AbortError)', async () => {
    const abort = Object.assign(new Error('aborted'), { name: 'AbortError' });
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(abort));
    await expect(fetchJson('https://api.exemplo/x')).rejects.toBeInstanceOf(NetworkError);
  });

  it('lança NetworkError em falha de rede genérica', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('ECONNREFUSED')));
    await expect(fetchJson('https://api.exemplo/x')).rejects.toBeInstanceOf(NetworkError);
  });
});
