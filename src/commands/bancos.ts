import type { Command } from 'commander';
import { ValidationError } from '../core/errors.js';
import { fetchJson } from '../core/http.js';
import { addGlobalOptions, applyGlobals } from '../core/options.js';
import { isJsonMode, printJson, printKeyValue, printTable, withSpinner } from '../core/output.js';

const TTL_24H = 24 * 60 * 60 * 1000;

interface Banco {
  ispb: string;
  name: string;
  code: number | null;
  fullName: string;
}

export function registerBancos(program: Command): void {
  const cmd = program
    .command('bancos')
    .description('lista instituições bancárias ou detalha uma pelo código (fonte: BrasilAPI)')
    .argument('[codigo]', 'código do banco (COMPE), ex.: 341. Sem código, lista todos')
    .action(async (codigo: string | undefined, _opts: unknown, command: Command) => {
      applyGlobals(command);

      if (codigo !== undefined) {
        if (!/^\d{1,4}$/.test(codigo)) {
          throw new ValidationError(`Código inválido: "${codigo}". Informe o código numérico, ex.: 341.`);
        }
        const url = `https://brasilapi.com.br/api/banks/v1/${Number(codigo)}`;
        const banco = await withSpinner(`Consultando banco ${codigo}…`, () =>
          fetchJson<Banco>(url, { cacheTtlMs: TTL_24H }),
        );

        if (isJsonMode()) {
          printJson(banco);
          return;
        }

        printKeyValue([
          ['Código', String(banco.code ?? '—')],
          ['Nome', banco.fullName || banco.name],
          ['Sigla', banco.name],
          ['ISPB', banco.ispb],
        ]);
        return;
      }

      const url = 'https://brasilapi.com.br/api/banks/v1';
      const lista = await withSpinner('Consultando bancos…', () =>
        fetchJson<Banco[]>(url, { cacheTtlMs: TTL_24H }),
      );

      if (isJsonMode()) {
        printJson(lista);
        return;
      }

      const rows = lista
        .filter((b) => b.code !== null)
        .sort((a, b) => (a.code ?? 0) - (b.code ?? 0))
        .map((b) => [String(b.code), b.name, b.ispb]);
      printTable(['Código', 'Instituição', 'ISPB'], rows);
    });

  addGlobalOptions(cmd);
}
