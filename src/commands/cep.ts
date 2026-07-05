import type { Command } from 'commander';
import { ValidationError } from '../core/errors.js';
import { onlyDigits } from '../core/format.js';
import { fetchJson } from '../core/http.js';
import { addGlobalOptions, applyGlobals } from '../core/options.js';
import { isJsonMode, printJson, printKeyValue, withSpinner } from '../core/output.js';

const TTL_24H = 24 * 60 * 60 * 1000;

interface Endereco {
  cep: string;
  state: string;
  city: string;
  neighborhood: string;
  street: string;
  service: string;
}

export function registerCep(program: Command): void {
  const cmd = program
    .command('cep')
    .description('resolve um CEP em endereço (fonte: BrasilAPI)')
    .argument('<cep>', 'CEP com 8 dígitos (com ou sem hífen)')
    .action(async (cepArg: string, _opts: unknown, command: Command) => {
      applyGlobals(command);

      const cep = onlyDigits(cepArg);
      if (cep.length !== 8) {
        throw new ValidationError(
          `CEP inválido: "${cepArg}". Informe 8 dígitos, ex.: 01001-000 ou 01001000.`,
        );
      }

      const url = `https://brasilapi.com.br/api/cep/v2/${cep}`;
      const endereco = await withSpinner(`Consultando CEP ${cep}…`, () =>
        fetchJson<Endereco>(url, { cacheTtlMs: TTL_24H }),
      );

      if (isJsonMode()) {
        printJson(endereco);
        return;
      }

      const dash = '—';
      printKeyValue([
        ['CEP', endereco.cep || dash],
        ['UF', endereco.state || dash],
        ['Cidade', endereco.city || dash],
        ['Bairro', endereco.neighborhood || dash],
        ['Logradouro', endereco.street || dash],
      ]);
    });

  addGlobalOptions(cmd);
}
