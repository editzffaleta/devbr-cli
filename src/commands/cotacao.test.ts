import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildProgram } from '../program.js';
import { setCacheEnabled } from '../core/http.js';
import { setJsonMode } from '../core/output.js';

setCacheEnabled(false);

afterEach(() => {
  vi.restoreAllMocks();
  setJsonMode(false);
});

function run(args: string[]): Promise<unknown> {
  return buildProgram().parseAsync(['node', 'devbr', ...args]);
}

function captureStdout(): { chunks: string[]; restore: () => void } {
  const chunks: string[] = [];
  const spy = vi
    .spyOn(process.stdout, 'write')
    .mockImplementation((s: string | Uint8Array): boolean => {
      chunks.push(String(s));
      return true;
    });
  return { chunks, restore: () => spy.mockRestore() };
}

const boletim = {
  cotacoes: [
    {
      cotacao_compra: 5.17,
      cotacao_venda: 5.18,
      data_hora_cotacao: '2026-07-03 13:08:00',
      tipo_boletim: 'FECHAMENTO PTAX',
    },
  ],
};

describe('cotacao', () => {
  it('aborta imediatamente em falha de rede, sem varrer 8 dias (M3)', async () => {
    const spy = vi.fn().mockRejectedValue(new Error('ECONNREFUSED'));
    vi.stubGlobal('fetch', spy);
    await expect(run(['cotacao', 'usd'])).rejects.toMatchObject({
      message: expect.stringContaining('Falha de rede'),
    });
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('recua sobre dias sem pregão (404) até achar cotação', async () => {
    const spy = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 404, json: async () => ({}) })
      .mockResolvedValueOnce({ ok: false, status: 404, json: async () => ({}) })
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => boletim });
    vi.stubGlobal('fetch', spy);

    const out = captureStdout();
    await run(['cotacao', 'usd', '--json']);
    out.restore();

    const itens = JSON.parse(out.chunks.join(''));
    expect(spy).toHaveBeenCalledTimes(3);
    expect(itens[0]).toMatchObject({ moeda: 'USD', compra: 5.17, venda: 5.18 });
  });
});
