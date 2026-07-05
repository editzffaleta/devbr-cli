import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';

/**
 * Cache em disco com TTL. As respostas das APIs públicas mudam pouco (feriados,
 * CEP, FIPE, IBGE) ou de forma previsível (câmbio), então cacheá-las evita bater
 * repetidamente nos serviços. O cache é best-effort: qualquer falha de leitura/
 * escrita degrada silenciosamente para "sem cache".
 */

interface CacheEntry<T> {
  expiresAt: number;
  data: T;
}

function cacheDir(): string {
  const base = process.env.XDG_CACHE_HOME || join(homedir(), '.cache');
  return join(base, 'devbr-cli');
}

function fileFor(key: string): string {
  const hash = createHash('sha256').update(key).digest('hex');
  return join(cacheDir(), `${hash}.json`);
}

/** Retorna o valor cacheado se existir e não estiver expirado; senão, `undefined`. */
export async function get<T>(key: string): Promise<T | undefined> {
  try {
    const raw = await readFile(fileFor(key), 'utf8');
    const entry = JSON.parse(raw) as CacheEntry<T>;
    if (Date.now() > entry.expiresAt) return undefined;
    return entry.data;
  } catch {
    return undefined;
  }
}

/** Grava o valor com expiração em `ttlMs` a partir de agora. Falha em silêncio. */
export async function set<T>(key: string, data: T, ttlMs: number): Promise<void> {
  try {
    await mkdir(cacheDir(), { recursive: true });
    const entry: CacheEntry<T> = { expiresAt: Date.now() + ttlMs, data };
    await writeFile(fileFor(key), JSON.stringify(entry), 'utf8');
  } catch {
    // cache é best-effort — ignorar falha de escrita
  }
}
