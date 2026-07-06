import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Command, CommanderError } from 'commander';
import { registerBancos } from './commands/bancos.js';
import { registerCache } from './commands/cache.js';
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

/** Códigos do commander que representam saída normal (--help / --version). */
export const CODIGOS_SAIDA_OK = new Set([
  'commander.help',
  'commander.helpDisplayed',
  'commander.version',
]);

/** Traduz os erros de uso do commander para mensagens em pt-BR. */
export function traduzErroCommander(err: CommanderError): string {
  const alvo = err.message.match(/'([^']+)'/)?.[1];
  switch (err.code) {
    case 'commander.missingArgument':
      return `argumento obrigatório ausente${alvo ? `: ${alvo}` : ''}.`;
    case 'commander.unknownCommand':
      return `comando desconhecido${alvo ? `: ${alvo}` : ''}.`;
    case 'commander.unknownOption':
      return `opção desconhecida${alvo ? `: ${alvo}` : ''}.`;
    case 'commander.excessArguments':
      return 'argumentos em excesso.';
    case 'commander.missingMandatoryOptionValue':
      return `valor obrigatório ausente para a opção${alvo ? ` ${alvo}` : ''}.`;
    default:
      return 'uso inválido. Rode com --help para ver as opções.';
  }
}

/**
 * Faz cada comando (e subcomando) lançar um `CommanderError` em vez de escrever em
 * inglês no stderr e chamar `process.exit`. O tratamento fica centralizado no cli.ts.
 */
function hardenErrors(cmd: Command): void {
  cmd.exitOverride();
  cmd.configureOutput({ writeErr: () => {} });
  for (const sub of cmd.commands) hardenErrors(sub);
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
  registerCache(program);

  hardenErrors(program);

  return program;
}
