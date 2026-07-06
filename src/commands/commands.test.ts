import { describe, expect, it } from 'vitest';
import { buildProgram } from '../program.js';
import { ValidationError } from '../core/errors.js';

/**
 * Estes testes exercem a validação de entrada de cada comando. Como a validação
 * ocorre ANTES de qualquer requisição, nenhum deles toca a rede.
 */
function run(args: string[]): Promise<unknown> {
  return buildProgram().parseAsync(['node', 'devbr', ...args]);
}

describe('validação de entrada dos comandos', () => {
  it('feriados rejeita ano não numérico', async () => {
    await expect(run(['feriados', 'abc'])).rejects.toBeInstanceOf(ValidationError);
  });

  it('feriados rejeita ano fora do intervalo 1900–2199 (B7)', async () => {
    await expect(run(['feriados', '1800'])).rejects.toBeInstanceOf(ValidationError);
    await expect(run(['feriados', '3000'])).rejects.toBeInstanceOf(ValidationError);
  });

  it('cep rejeita CEP com menos de 8 dígitos', async () => {
    await expect(run(['cep', '123'])).rejects.toBeInstanceOf(ValidationError);
  });

  it('fipe marcas rejeita tipo inválido', async () => {
    await expect(run(['fipe', 'marcas', 'avioes'])).rejects.toBeInstanceOf(ValidationError);
  });

  it('ibge municipios rejeita UF inválida', async () => {
    await expect(run(['ibge', 'municipios', 'xyz'])).rejects.toBeInstanceOf(ValidationError);
  });

  it('ddd rejeita código que não tem 2 dígitos', async () => {
    await expect(run(['ddd', '123'])).rejects.toBeInstanceOf(ValidationError);
  });

  it('cnpj rejeita CNPJ com menos de 14 dígitos', async () => {
    await expect(run(['cnpj', '123'])).rejects.toBeInstanceOf(ValidationError);
  });

  it('cnpj rejeita dígito verificador inválido, sem tocar a rede (M2)', async () => {
    await expect(run(['cnpj', '11222333000182'])).rejects.toBeInstanceOf(ValidationError);
  });

  it('bancos rejeita código não numérico', async () => {
    await expect(run(['bancos', 'abc'])).rejects.toBeInstanceOf(ValidationError);
  });
});
