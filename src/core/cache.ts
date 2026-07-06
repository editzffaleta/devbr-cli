import { createHash, randomBytes } from 'node:crypto';
import { mkdir, readdir, readFile, rename, rm, stat, unlink, writeFile } from 'node:fs/promises';
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

/** Caminho do diretório de cache (respeita `XDG_CACHE_HOME`). */
export function cacheDir(): string {
  const base = process.env.XDG_CACHE_HOME || join(homedir(), '.cache');
  return join(base, 'devbr-cli');
}

function fileFor(key: string): string {
  const hash = createHash('sha256').update(key).digest('hex');
  return join(cacheDir(), `${hash}.json`);
}

/** Retorna o valor cacheado se existir e não estiver expirado; senão, `undefined`. */
export async function get<T>(key: string): Promise<T | undefined> {
  const file = fileFor(key);
  try {
    const raw = await readFile(file, 'utf8');
    const entry = JSON.parse(raw) as CacheEntry<T>;
    if (Date.now() > entry.expiresAt) {
      await unlink(file).catch(() => {}); // poda a entrada expirada (best-effort)
      return undefined;
    }
    return entry.data;
  } catch {
    return undefined;
  }
}

/** Grava o valor com expiração em `ttlMs` a partir de agora. Falha em silêncio. */
export async function set<T>(key: string, data: T, ttlMs: number): Promise<void> {
  const file = fileFor(key);
  const tmp = `${file}.${process.pid}-${randomBytes(6).toString('hex')}.tmp`;
  try {
    await mkdir(cacheDir(), { recursive: true, mode: 0o700 });
    const entry: CacheEntry<T> = { expiresAt: Date.now() + ttlMs, data };
    // escrita atômica: grava num temporário (0600) e renomeia por cima.
    await writeFile(tmp, JSON.stringify(entry), { encoding: 'utf8', mode: 0o600 });
    await rename(tmp, file);
  } catch {
    await unlink(tmp).catch(() => {}); // limpa o temporário se o rename falhou
  }
}

/** Apaga todo o cache. Retorna quantos arquivos foram removidos. */
export async function clear(): Promise<number> {
  const dir = cacheDir();
  let count = 0;
  try {
    count = (await readdir(dir)).filter((f) => f.endsWith('.json')).length;
    await rm(dir, { recursive: true, force: true });
  } catch {
    return 0;
  }
  return count;
}

/** Informações do cache: caminho, quantidade de arquivos e tamanho total em bytes. */
export async function stats(): Promise<{ dir: string; files: number; bytes: number }> {
  const dir = cacheDir();
  let files = 0;
  let bytes = 0;
  try {
    for (const name of await readdir(dir)) {
      if (!name.endsWith('.json')) continue;
      files += 1;
      bytes += (await stat(join(dir, name))).size;
    }
  } catch {
    // diretório inexistente = cache vazio
  }
  return { dir, files, bytes };
}
