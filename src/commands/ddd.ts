import type { Command } from 'commander';
import { ValidationError } from '../core/errors.js';
import { onlyDigits } from '../core/format.js';
import { fetchJson } from '../core/http.js';
import { addGlobalOptions, applyGlobals } from '../core/options.js';
import { isJsonMode, printJson, printKeyValue, printTable, withSpinner } from '../core/output.js';

const TTL_24H = 24 * 60 * 60 * 1000;

interface DddResponse {
  state: string;
  cities: string[];
}

export function registerDdd(program: Command): void {
  const cmd = program
    .command('ddd')
    .description('lista o estado e as cidades de um código DDD (fonte: BrasilAPI)')
    .argument('<ddd>', 'código DDD com 2 dígitos, ex.: 11')
    .action(async (dddArg: string, _opts: unknown, command: Command) => {
      applyGlobals(command);

      const ddd = onlyDigits(dddArg);
      if (ddd.length !== 2) {
        throw new ValidationError(`DDD inválido: "${dddArg}". Informe 2 dígitos, ex.: 11.`);
      }

      const url = `https://brasilapi.com.br/api/ddd/v1/${ddd}`;
      const data = await withSpinner(`Consultando DDD ${ddd}…`, () =>
        fetchJson<DddResponse>(url, { cacheTtlMs: TTL_24H }),
      );

      if (isJsonMode()) {
        printJson(data);
        return;
      }

      printKeyValue([
        ['Estado', data.state],
        ['Cidades', String(data.cities.length)],
      ]);
      process.stdout.write('\n');
      const cidades = [...data.cities].sort((a, b) => a.localeCompare(b, 'pt-BR'));
      printTable(['Cidade'], cidades.map((c) => [c]));
    });

  addGlobalOptions(cmd);
}
