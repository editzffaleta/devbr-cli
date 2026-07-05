import type { Command } from 'commander';
import { ValidationError } from '../core/errors.js';
import { formatIsoDate, onlyDigits } from '../core/format.js';
import { fetchJson } from '../core/http.js';
import { addGlobalOptions, applyGlobals } from '../core/options.js';
import { isJsonMode, printJson, printKeyValue, withSpinner } from '../core/output.js';

const TTL_24H = 24 * 60 * 60 * 1000;

interface CnpjResponse {
  razao_social: string;
  nome_fantasia: string;
  descricao_situacao_cadastral: string;
  data_inicio_atividade: string;
  cnae_fiscal_descricao: string;
  descricao_tipo_de_logradouro: string;
  logradouro: string;
  numero: string;
  bairro: string;
  municipio: string;
  uf: string;
  cep: string;
}

export function registerCnpj(program: Command): void {
  const cmd = program
    .command('cnpj')
    .description('consulta os dados cadastrais de um CNPJ (fonte: BrasilAPI)')
    .argument('<cnpj>', 'CNPJ com 14 dígitos (com ou sem pontuação)')
    .action(async (cnpjArg: string, _opts: unknown, command: Command) => {
      applyGlobals(command);

      const cnpj = onlyDigits(cnpjArg);
      if (cnpj.length !== 14) {
        throw new ValidationError(`CNPJ inválido: "${cnpjArg}". Informe 14 dígitos.`);
      }

      const url = `https://brasilapi.com.br/api/cnpj/v1/${cnpj}`;
      const d = await withSpinner(`Consultando CNPJ ${cnpj}…`, () =>
        fetchJson<CnpjResponse>(url, { cacheTtlMs: TTL_24H }),
      );

      if (isJsonMode()) {
        printJson(d);
        return;
      }

      const dash = '—';
      const via = [d.descricao_tipo_de_logradouro, d.logradouro].filter(Boolean).join(' ').trim();
      const temNumero = d.numero && !via.endsWith(d.numero);
      const endereco = (temNumero ? `${via}, ${d.numero}` : via) || dash;
      printKeyValue([
        ['Razão social', d.razao_social || dash],
        ['Nome fantasia', d.nome_fantasia || dash],
        ['Situação', d.descricao_situacao_cadastral || dash],
        ['Abertura', d.data_inicio_atividade ? formatIsoDate(d.data_inicio_atividade) : dash],
        ['Atividade', d.cnae_fiscal_descricao || dash],
        ['Endereço', endereco],
        ['Bairro', d.bairro || dash],
        ['Município/UF', [d.municipio, d.uf].filter(Boolean).join(' / ') || dash],
      ]);
    });

  addGlobalOptions(cmd);
}
