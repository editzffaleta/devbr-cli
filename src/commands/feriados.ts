import type { Command } from 'commander';
import { ValidationError } from '../core/errors.js';
import { formatIsoDate } from '../core/format.js';
import { fetchJson } from '../core/http.js';
import { addGlobalOptions, applyGlobals } from '../core/options.js';
import { isJsonMode, printJson, printTable, withSpinner } from '../core/output.js';

const TTL_24H = 24 * 60 * 60 * 1000;

interface Feriado {
  date: string;
  name: string;
  type: string;
}

export function registerFeriados(program: Command): void {
  const cmd = program
    .command('feriados')
    .description('lista os feriados nacionais de um ano (fonte: BrasilAPI)')
    .argument('[ano]', 'ano com 4 dígitos (padrão: ano atual)')
    .action(async (ano: string | undefined, _opts: unknown, command: Command) => {
      applyGlobals(command);

      const year = ano ?? String(new Date().getFullYear());
      if (!/^\d{4}$/.test(year)) {
        throw new ValidationError(`Ano inválido: "${year}". Informe um ano com 4 dígitos, ex.: 2026.`);
      }
      const yearNum = Number(year);
      if (yearNum < 1900 || yearNum > 2199) {
        throw new ValidationError(`Ano fora do intervalo suportado (1900–2199): ${year}.`);
      }

      const url = `https://brasilapi.com.br/api/feriados/v1/${year}`;
      const feriados = await withSpinner(`Consultando feriados de ${year}…`, () =>
        fetchJson<Feriado[]>(url, { cacheTtlMs: TTL_24H }),
      );

      if (isJsonMode()) {
        printJson(feriados);
        return;
      }

      const rows = [...feriados]
        .sort((a, b) => a.date.localeCompare(b.date))
        .map((f) => [formatIsoDate(f.date), f.name, f.type]);
      printTable(['Data', 'Nome', 'Tipo'], rows);
    });

  addGlobalOptions(cmd);
}
