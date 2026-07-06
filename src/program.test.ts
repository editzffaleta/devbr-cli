import { CommanderError } from 'commander';
import { describe, expect, it } from 'vitest';
import { buildProgram, traduzErroCommander } from './program.js';

function run(args: string[]): Promise<unknown> {
  return buildProgram().parseAsync(['node', 'devbr', ...args]);
}

describe('erros de uso do commander (B5)', () => {
  it('argumento obrigatório ausente lança CommanderError com código conhecido', async () => {
    await expect(run(['cep'])).rejects.toMatchObject({
      name: 'CommanderError',
      code: 'commander.missingArgument',
    });
  });

  it('comando desconhecido lança CommanderError', async () => {
    await expect(run(['foobar'])).rejects.toMatchObject({ code: 'commander.unknownCommand' });
  });

  it('traduz as mensagens comuns para pt-BR', () => {
    const missing = new CommanderError(1, 'commander.missingArgument', "error: missing required argument 'cep'");
    expect(traduzErroCommander(missing)).toBe('argumento obrigatório ausente: cep.');

    const unknownCmd = new CommanderError(1, 'commander.unknownCommand', "error: unknown command 'foobar'");
    expect(traduzErroCommander(unknownCmd)).toBe('comando desconhecido: foobar.');

    const unknownOpt = new CommanderError(1, 'commander.unknownOption', "error: unknown option '--xyz'");
    expect(traduzErroCommander(unknownOpt)).toBe('opção desconhecida: --xyz.');

    const outro = new CommanderError(1, 'commander.other', 'algo');
    expect(traduzErroCommander(outro)).toContain('uso inválido');
  });
});
