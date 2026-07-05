import type { Command } from 'commander';
import { NetworkError, ValidationError } from '../core/errors.js';
import { fetchJson, type FetchOptions } from '../core/http.js';
import { addGlobalOptions, applyGlobals } from '../core/options.js';
import { isJsonMode, printJson, printTable, withSpinner } from '../core/output.js';

const TTL_24H = 24 * 60 * 60 * 1000;
const TIPOS = ['carros', 'motos', 'caminhoes'] as const;

/**
 * O serviço FIPE por trás da BrasilAPI fica indisponível na origem de tempos em
 * tempos (respondendo erro upstream). Traduzimos isso numa mensagem clara em vez
 * do genérico "HTTP 500".
 */
async function fetchFipe<T>(url: string, opts: FetchOptions): Promise<T> {
  try {
    return await fetchJson<T>(url, opts);
  } catch (err) {
    if (err instanceof NetworkError) {
      throw new NetworkError(
        'A tabela FIPE está temporariamente indisponível na origem (BrasilAPI). Tente novamente mais tarde.',
      );
    }
    throw err;
  }
}

interface Marca {
  nome: string;
  valor: string;
}

interface PrecoFipe {
  valor: string;
  marca: string;
  modelo: string;
  anoModelo: number | string;
  combustivel: string;
  codigoFipe: string;
  mesReferencia: string;
}

export function registerFipe(program: Command): void {
  const fipe = program.command('fipe').description('consulta a tabela FIPE (fonte: BrasilAPI)');

  const marcas = fipe
    .command('marcas')
    .description('lista as marcas por tipo de veículo')
    .argument('[tipo]', `tipo de veículo: ${TIPOS.join(' | ')} (padrão: carros)`)
    .action(async (tipoArg: string | undefined, _opts: unknown, command: Command) => {
      applyGlobals(command);

      const tipo = (tipoArg ?? 'carros').toLowerCase();
      if (!TIPOS.includes(tipo as (typeof TIPOS)[number])) {
        throw new ValidationError(`Tipo inválido: "${tipoArg}". Use: ${TIPOS.join(', ')}.`);
      }

      const url = `https://brasilapi.com.br/api/fipe/marcas/v1/${tipo}`;
      const lista = await withSpinner(`Consultando marcas de ${tipo}…`, () =>
        fetchFipe<Marca[]>(url, { cacheTtlMs: TTL_24H }),
      );

      if (isJsonMode()) {
        printJson(lista);
        return;
      }

      const rows = lista.map((m) => [m.valor, m.nome]);
      printTable(['Código', 'Marca'], rows);
    });
  addGlobalOptions(marcas);

  const preco = fipe
    .command('preco')
    .description('mostra o preço de um veículo pelo código FIPE')
    .argument('<codigoFipe>', 'código FIPE do veículo, ex.: 001004-9')
    .action(async (codigo: string, _opts: unknown, command: Command) => {
      applyGlobals(command);

      const codigoFipe = codigo.trim();
      if (!codigoFipe) {
        throw new ValidationError('Informe o código FIPE, ex.: devbr fipe preco 001004-9.');
      }

      const url = `https://brasilapi.com.br/api/fipe/preco/v1/${encodeURIComponent(codigoFipe)}`;
      const registros = await withSpinner(`Consultando preço de ${codigoFipe}…`, () =>
        fetchFipe<PrecoFipe[]>(url, { cacheTtlMs: TTL_24H }),
      );

      if (isJsonMode()) {
        printJson(registros);
        return;
      }

      const rows = registros.map((r) => [
        r.mesReferencia?.trim() ?? '',
        r.marca,
        r.modelo,
        String(r.anoModelo),
        r.combustivel,
        r.valor, // a BrasilAPI já entrega o valor formatado (ex.: "R$ 21.000,00")
      ]);
      printTable(['Referência', 'Marca', 'Modelo', 'Ano', 'Combustível', 'Preço'], rows);
    });
  addGlobalOptions(preco);
}
