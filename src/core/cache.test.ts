import { mkdtempSync } from 'node:fs';
import { readdir, writeFile } from 'node:fs/promises';
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

  it('retorna undefined após o TTL expirar e apaga a entrada (M4)', async () => {
    await cache.set('chave-b', { valor: 1 }, -1);
    expect(await cache.get('chave-b')).toBeUndefined();
    // a entrada expirada deve ter sido podada do disco
    const arquivos = await readdir(cache.cacheDir());
    expect(arquivos.length).toBe(1); // só a chave-a válida permanece
  });

  it('retorna undefined para chave inexistente', async () => {
    expect(await cache.get('nao-existe')).toBeUndefined();
  });

  it('retorna undefined para arquivo corrompido (B8)', async () => {
    await cache.clear();
    await cache.set('chave-lixo', { valor: 1 }, 60_000);
    // com o cache zerado, o único .json é o da chave-lixo — sobrescreve com lixo
    const arquivos = (await readdir(cache.cacheDir())).filter((f) => f.endsWith('.json'));
    expect(arquivos.length).toBe(1);
    await writeFile(join(cache.cacheDir(), arquivos[0]!), '<<< não é json >>>');
    expect(await cache.get('chave-lixo')).toBeUndefined();
  });

  it('stats e clear refletem o conteúdo (M4)', async () => {
    await cache.set('chave-c', { valor: 1 }, 60_000);
    const antes = await cache.stats();
    expect(antes.files).toBeGreaterThan(0);
    expect(antes.dir).toContain('devbr-cli');

    const removidos = await cache.clear();
    expect(removidos).toBe(antes.files);
    expect((await cache.stats()).files).toBe(0);
  });
});
