import { CliError } from './core/errors.js';
import { printError } from './core/output.js';
import { buildProgram } from './program.js';

async function main(): Promise<void> {
  const program = buildProgram();
  await program.parseAsync(process.argv);
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  const exitCode = err instanceof CliError ? err.exitCode : 1;
  printError(message);
  process.exit(exitCode);
});
