import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildProgram } from '../program.js';
import { setCacheEnabled } from '../core/http.js';
import { setJsonMode } from '../core/output.js';

setCacheEnabled(false);

afterEach(() => {
  vi.restoreAllMocks();
  setJsonMode(false);
});

/** Roda `<args> --json` com o fetch mockado e devolve o stdout já parseado. */
async function runJson(args: string[], response: unknown): Promise<unknown> {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => response }),
  );
  const chunks: string[] = [];
  const spy = vi
    .spyOn(process.stdout, 'write')
    .mockImplementation((s: string | Uint8Array): boolean => {
      chunks.push(String(s));
      return true;
    });
  try {
    await buildProgram().parseAsync(['node', 'devbr', ...args, '--json']);
  } finally {
    spy.mockRestore();
  }
  return JSON.parse(chunks.join('')); // lança se o stdout não for JSON puro
}

describe('caminho feliz de cada comando (--json) (B8)', () => {
  it('feriados mapeia a lista da API', async () => {
    const json = (await runJson(
      ['feriados', '2026'],
      [{ date: '2026-01-01', name: 'Confraternização mundial', type: 'national' }],
    )) as Array<{ name: string }>;
    expect(json[0]?.name).toBe('Confraternização mundial');
  });

  it('cep mapeia o endereço', async () => {
    const json = (await runJson(['cep', '01001-000'], {
      cep: '01001000',
      state: 'SP',
      city: 'São Paulo',
      neighborhood: 'Sé',
      street: 'Praça da Sé',
      service: 'open-cep',
    })) as { city: string };
    expect(json.city).toBe('São Paulo');
  });

  it('cnpj mapeia os dados cadastrais', async () => {
    const json = (await runJson(['cnpj', '11222333000181'], {
      razao_social: 'EMPRESA EXEMPLO LTDA',
      descricao_situacao_cadastral: 'ATIVA',
    })) as { razao_social: string };
    expect(json.razao_social).toBe('EMPRESA EXEMPLO LTDA');
  });

  it('ddd mapeia estado e cidades', async () => {
    const json = (await runJson(['ddd', '71'], {
      state: 'BA',
      cities: ['CAMAÇARI', "DIAS D'ÁVILA"],
    })) as { state: string; cities: string[] };
    expect(json.state).toBe('BA');
    expect(json.cities).toContain('CAMAÇARI');
  });

  it('fipe marcas mapeia a lista', async () => {
    const json = (await runJson(['fipe', 'marcas', 'motos'], [{ nome: 'HONDA', valor: '77' }])) as Array<{
      nome: string;
    }>;
    expect(json[0]?.nome).toBe('HONDA');
  });

  it('ibge estados mapeia a lista', async () => {
    const json = (await runJson(['ibge', 'estados'], [
      { id: 12, sigla: 'AC', nome: 'Acre', regiao: { nome: 'Norte' } },
    ])) as Array<{ sigla: string }>;
    expect(json[0]?.sigla).toBe('AC');
  });

  it('bancos detalha uma instituição pelo código', async () => {
    const json = (await runJson(['bancos', '341'], {
      ispb: '60701190',
      name: 'ITAÚ UNIBANCO S.A.',
      code: 341,
      fullName: 'Itaú Unibanco S.A.',
    })) as { code: number };
    expect(json.code).toBe(341);
  });
});
