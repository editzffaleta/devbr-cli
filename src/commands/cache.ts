import type { Command } from 'commander';
import * as cache from '../core/cache.js';
import { addGlobalOptions, applyGlobals } from '../core/options.js';
import { isJsonMode, printJson, printKeyValue } from '../core/output.js';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

export function registerCache(program: Command): void {
  const cmd = program.command('cache').description('gerencia o cache local do CLI');

  const info = cmd
    .command('info')
    .description('mostra o caminho, a quantidade de arquivos e o tamanho do cache')
    .action(async (_opts: unknown, command: Command) => {
      applyGlobals(command);
      const s = await cache.stats();
      if (isJsonMode()) {
        printJson(s);
        return;
      }
      printKeyValue([
        ['Diretório', s.dir],
        ['Arquivos', String(s.files)],
        ['Tamanho', formatBytes(s.bytes)],
      ]);
    });
  addGlobalOptions(info);

  const clear = cmd
    .command('clear')
    .description('apaga todo o cache local')
    .action(async (_opts: unknown, command: Command) => {
      applyGlobals(command);
      const removed = await cache.clear();
      if (isJsonMode()) {
        printJson({ removidos: removed });
        return;
      }
      process.stdout.write(`Cache limpo: ${removed} arquivo(s) removido(s).\n`);
    });
  addGlobalOptions(clear);
}
