import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Command } from 'commander';
import { registerBancos } from './commands/bancos.js';
import { registerCep } from './commands/cep.js';
import { registerCnpj } from './commands/cnpj.js';
import { registerCotacao } from './commands/cotacao.js';
import { registerDdd } from './commands/ddd.js';
import { registerFeriados } from './commands/feriados.js';
import { registerFipe } from './commands/fipe.js';
import { registerIbge } from './commands/ibge.js';
import { addGlobalOptions } from './core/options.js';

function readVersion(): string {
  try {
    const pkgPath = join(dirname(fileURLToPath(import.meta.url)), '..', 'package.json');
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as { version?: string };
    return pkg.version ?? '0.0.0';
  } catch {
    return '0.0.0';
  }
}

/** Monta o programa commander com todos os comandos registrados. */
export function buildProgram(): Command {
  const program = new Command();

  program
    .name('devbr')
    .description('APIs públicas brasileiras direto do terminal: feriados, câmbio, CEP, CNPJ, DDD, FIPE, IBGE e bancos.')
    .version(readVersion(), '-v, --version', 'mostra a versão do devbr-cli');

  addGlobalOptions(program);

  registerFeriados(program);
  registerCotacao(program);
  registerCep(program);
  registerCnpj(program);
  registerDdd(program);
  registerFipe(program);
  registerIbge(program);
  registerBancos(program);

  return program;
}
