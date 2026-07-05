import chalk from 'chalk';
import ora, { type Ora } from 'ora';

/**
 * Camada de saída. Alterna entre saída humana (cor, tabela, spinner) e JSON puro
 * (flag `--json`), garantindo que o modo JSON nunca polua o stdout com cor/spinner.
 */

let jsonMode = false;

export function setJsonMode(enabled: boolean): void {
  jsonMode = enabled;
}

export function isJsonMode(): boolean {
  return jsonMode;
}

function useColor(): boolean {
  return !jsonMode && Boolean(process.stdout.isTTY);
}

/** Emite `data` como JSON em stdout (a saída canônica do modo `--json`). */
export function printJson(data: unknown): void {
  process.stdout.write(`${JSON.stringify(data, null, 2)}\n`);
}

/** Imprime pares chave/valor alinhados (ex.: detalhes de um CEP). */
export function printKeyValue(rows: Array<[string, string]>): void {
  const width = Math.max(0, ...rows.map(([key]) => key.length));
  for (const [key, value] of rows) {
    const label = key.padEnd(width);
    process.stdout.write(`${useColor() ? chalk.cyan(label) : label}  ${value}\n`);
  }
}

/** Imprime uma tabela simples com cabeçalho e colunas alinhadas. */
export function printTable(headers: string[], rows: string[][]): void {
  const widths = headers.map((header, i) =>
    Math.max(header.length, ...rows.map((row) => (row[i] ?? '').length)),
  );
  const format = (cells: string[]): string =>
    cells
      .map((cell, i) => (cell ?? '').padEnd(widths[i] ?? 0))
      .join('  ')
      .replace(/\s+$/, '');

  const head = format(headers);
  process.stdout.write(`${useColor() ? chalk.bold(head) : head}\n`);
  for (const row of rows) {
    process.stdout.write(`${format(row)}\n`);
  }
}

/** Escreve uma mensagem de erro (humana ou JSON) em stderr. */
export function printError(message: string): void {
  if (jsonMode) {
    process.stderr.write(`${JSON.stringify({ erro: message })}\n`);
    return;
  }
  const prefix = process.stderr.isTTY ? chalk.red('Erro:') : 'Erro:';
  process.stderr.write(`${prefix} ${message}\n`);
}

/** Executa `task` com um spinner (desativado em modo JSON ou fora de TTY). */
export async function withSpinner<T>(label: string, task: () => Promise<T>): Promise<T> {
  if (jsonMode || !process.stdout.isTTY) {
    return task();
  }
  const spinner: Ora = ora(label).start();
  try {
    const result = await task();
    spinner.stop();
    return result;
  } catch (err) {
    spinner.stop();
    throw err;
  }
}
