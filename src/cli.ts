import { CommanderError } from 'commander';
import { CliError } from './core/errors.js';
import { printError, setJsonMode } from './core/output.js';
import { buildProgram, CODIGOS_SAIDA_OK, traduzErroCommander } from './program.js';

async function main(): Promise<void> {
  const program = buildProgram();
  await program.parseAsync(process.argv);
}

main().catch((err: unknown) => {
  if (err instanceof CommanderError) {
    // --help / --version já escreveram a saída em stdout: encerra sem erro.
    if (CODIGOS_SAIDA_OK.has(err.code)) {
      process.exit(err.exitCode);
    }
    if (process.argv.includes('--json')) setJsonMode(true);
    printError(traduzErroCommander(err));
    process.exit(2);
  }

  const message = err instanceof Error ? err.message : String(err);
  const exitCode = err instanceof CliError ? err.exitCode : 1;
  printError(message);
  process.exit(exitCode);
});
