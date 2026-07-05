import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildProgram } from '../program.js';
import { setCacheEnabled } from '../core/http.js';

setCacheEnabled(false);

afterEach(() => {
  vi.restoreAllMocks();
});

function run(args: string[]): Promise<unknown> {
  return buildProgram().parseAsync(['node', 'devbr', ...args]);
}

describe('fipe — tradução de erro (B3)', () => {
  it('reescreve a mensagem quando a origem responde 5xx', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500, json: async () => ({}) }));
    await expect(run(['fipe', 'marcas', 'carros'])).rejects.toMatchObject({
      message: expect.stringContaining('indisponível na origem'),
    });
  });

  it('mantém a mensagem de rede em falha sem resposta (offline/timeout)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('ECONNREFUSED')));
    await expect(run(['fipe', 'marcas', 'carros'])).rejects.toMatchObject({
      message: expect.stringContaining('Falha de rede'),
    });
  });
});
