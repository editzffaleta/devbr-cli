import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import * as cache from './cache.js';

let originalCacheHome: string | undefined;

beforeAll(() => {
  originalCacheHome = process.env.XDG_CACHE_HOME;
  process.env.XDG_CACHE_HOME = mkdtempSync(join(tmpdir(), 'devbr-cache-'));
});

afterAll(() => {
  if (originalCacheHome === undefined) delete process.env.XDG_CACHE_HOME;
  else process.env.XDG_CACHE_HOME = originalCacheHome;
});

describe('cache em disco', () => {
  it('grava e lê um valor dentro do TTL', async () => {
    await cache.set('chave-a', { valor: 42 }, 60_000);
    expect(await cache.get('chave-a')).toEqual({ valor: 42 });
  });

  it('retorna undefined após o TTL expirar', async () => {
    await cache.set('chave-b', { valor: 1 }, -1);
    expect(await cache.get('chave-b')).toBeUndefined();
  });

  it('retorna undefined para chave inexistente', async () => {
    expect(await cache.get('nao-existe')).toBeUndefined();
  });
});
