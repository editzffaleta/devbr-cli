import type { Command } from 'commander';
import { setCacheEnabled } from './http.js';
import { setJsonMode } from './output.js';

/**
 * Opções globais compartilhadas por todos os comandos. São registradas tanto no
 * programa raiz quanto em cada (sub)comando, para funcionarem antes ou depois do
 * nome do comando (`devbr --json feriados` e `devbr feriados --json`).
 */

export function addGlobalOptions(cmd: Command): Command {
  return cmd
    .option('--json', 'saída em JSON puro, para compor com scripts (jq, etc.)')
    .option('--no-cache', 'ignora o cache local e força uma nova requisição');
}

/** Lê as opções globais (mescladas) do comando e aplica os modos correspondentes. */
export function applyGlobals(cmd: Command): void {
  const opts = cmd.optsWithGlobals() as { json?: boolean; cache?: boolean };
  setJsonMode(Boolean(opts.json));
  setCacheEnabled(opts.cache !== false);
}
