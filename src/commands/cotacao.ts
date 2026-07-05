import type { Command } from 'commander';
import { NetworkError, ValidationError } from '../core/errors.js';
import { formatBRL } from '../core/format.js';
import { fetchJson } from '../core/http.js';
import { addGlobalOptions, applyGlobals } from '../core/options.js';
import { isJsonMode, printJson, printTable, withSpinner } from '../core/output.js';

const TTL_24H = 24 * 60 * 60 * 1000;
const DEFAULT_MOEDAS = ['USD', 'EUR'];
// moedas suportadas pela cotação PTAX da BrasilAPI (câmbio)
const MOEDAS_SUPORTADAS = ['AUD', 'CAD', 'CHF', 'DKK', 'EUR', 'GBP', 'JPY', 'NOK', 'SEK', 'USD'];

interface Boletim {
  cotacao_compra: number;
  cotacao_venda: number;
  data_hora_cotacao: string;
  tipo_boletim: string;
}

interface CambioResponse {
  cotacoes: Boletim[];
}

interface CotacaoMoeda {
  moeda: string;
  data: string;
  compra: number;
  venda: number;
  boletim: string;
  atualizado: string;
}

function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

function urlFor(moeda: string, data: string): string {
  return `https://brasilapi.com.br/api/cambio/v1/cotacao/${moeda}/${data}`;
}

/** Último boletim do dia (PTAX de fechamento, quando disponível). */
function ultimoBoletim(resp: CambioResponse): Boletim | undefined {
  return resp.cotacoes.at(-1);
}

async function coletar(moedas: string[]): Promise<{ data: string; itens: CotacaoMoeda[] }> {
  // PTAX só tem dias úteis e não libera "hoje" — recua até achar um dia com cotação.
  let dataResolvida: string | undefined;
  let primeira: CambioResponse | undefined;

  for (let i = 1; i <= 8 && !dataResolvida; i++) {
    const data = isoDaysAgo(i);
    try {
      const resp = await fetchJson<CambioResponse>(urlFor(moedas[0]!, data), { cacheTtlMs: TTL_24H });
      if (resp.cotacoes.length > 0) {
        dataResolvida = data;
        primeira = resp;
      }
    } catch {
      // dia sem pregão (400) ou indisponível — tenta o dia anterior
    }
  }

  if (!dataResolvida || !primeira) {
    throw new NetworkError('Não foi possível obter cotações recentes (PTAX indisponível).');
  }

  const itens: CotacaoMoeda[] = [];
  for (const moeda of moedas) {
    const resp =
      moeda === moedas[0]
        ? primeira
        : await fetchJson<CambioResponse>(urlFor(moeda, dataResolvida), { cacheTtlMs: TTL_24H });
    const b = ultimoBoletim(resp);
    if (!b) continue;
    itens.push({
      moeda,
      data: dataResolvida,
      compra: b.cotacao_compra,
      venda: b.cotacao_venda,
      boletim: b.tipo_boletim,
      atualizado: b.data_hora_cotacao,
    });
  }

  return { data: dataResolvida, itens };
}

export function registerCotacao(program: Command): void {
  const cmd = program
    .command('cotacao')
    .description('mostra a cotação de moedas em BRL, via PTAX (fonte: BrasilAPI)')
    .argument('[moedas...]', `códigos de moeda (padrão: USD EUR). Disponíveis: ${MOEDAS_SUPORTADAS.join(', ')}`)
    .action(async (moedasArg: string[], _opts: unknown, command: Command) => {
      applyGlobals(command);

      const moedas = (moedasArg.length > 0 ? moedasArg : DEFAULT_MOEDAS).map((m) => m.toUpperCase());
      const invalidas = moedas.filter((m) => !MOEDAS_SUPORTADAS.includes(m));
      if (invalidas.length > 0) {
        throw new ValidationError(
          `Moeda(s) inválida(s): ${invalidas.join(', ')}. Disponíveis: ${MOEDAS_SUPORTADAS.join(', ')}.`,
        );
      }

      const { itens } = await withSpinner('Consultando cotações (PTAX)…', () => coletar(moedas));

      if (isJsonMode()) {
        printJson(itens);
        return;
      }

      const rows = itens.map((c) => [
        `${c.moeda} → BRL`,
        formatBRL(c.compra),
        formatBRL(c.venda),
        c.boletim,
        c.atualizado.slice(0, 16),
      ]);
      printTable(['Moeda', 'Compra', 'Venda', 'Boletim', 'Atualizado'], rows);
      const boletimData = itens[0]?.atualizado.slice(0, 10) ?? '—';
      process.stderr.write(`\nCotação PTAX (Banco Central) — boletim de ${boletimData}.\n`);
    });

  addGlobalOptions(cmd);
}
