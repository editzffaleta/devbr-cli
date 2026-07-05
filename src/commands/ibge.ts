import type { Command } from 'commander';
import { ValidationError } from '../core/errors.js';
import { fetchJson } from '../core/http.js';
import { addGlobalOptions, applyGlobals } from '../core/options.js';
import { isJsonMode, printJson, printTable, withSpinner } from '../core/output.js';

const TTL_24H = 24 * 60 * 60 * 1000;

interface Estado {
  id: number;
  sigla: string;
  nome: string;
  regiao: { nome: string };
}

interface Municipio {
  nome: string;
  codigo_ibge: string;
}

export function registerIbge(program: Command): void {
  const ibge = program.command('ibge').description('dados geográficos do IBGE (fonte: BrasilAPI)');

  const estados = ibge
    .command('estados')
    .description('lista as unidades federativas')
    .action(async (_opts: unknown, command: Command) => {
      applyGlobals(command);

      const url = 'https://brasilapi.com.br/api/ibge/uf/v1';
      const lista = await withSpinner('Consultando estados…', () =>
        fetchJson<Estado[]>(url, { cacheTtlMs: TTL_24H }),
      );

      if (isJsonMode()) {
        printJson(lista);
        return;
      }

      const rows = [...lista]
        .sort((a, b) => a.sigla.localeCompare(b.sigla))
        .map((e) => [e.sigla, e.nome, e.regiao?.nome ?? '']);
      printTable(['Sigla', 'Nome', 'Região'], rows);
    });
  addGlobalOptions(estados);

  const municipios = ibge
    .command('municipios')
    .description('lista os municípios de uma UF')
    .argument('<uf>', 'sigla da UF com 2 letras, ex.: SP')
    .action(async (ufArg: string, _opts: unknown, command: Command) => {
      applyGlobals(command);

      const uf = ufArg.toUpperCase();
      if (!/^[A-Z]{2}$/.test(uf)) {
        throw new ValidationError(`UF inválida: "${ufArg}". Informe 2 letras, ex.: SP.`);
      }

      const url = `https://brasilapi.com.br/api/ibge/municipios/v1/${uf}`;
      const lista = await withSpinner(`Consultando municípios de ${uf}…`, () =>
        fetchJson<Municipio[]>(url, { cacheTtlMs: TTL_24H }),
      );

      if (isJsonMode()) {
        printJson(lista);
        return;
      }

      const rows = lista.map((m) => [m.codigo_ibge, m.nome]);
      printTable(['Código IBGE', 'Município'], rows);
    });
  addGlobalOptions(municipios);
}
