import { describe, expect, it } from 'vitest';
import { isValidCnpj } from './cnpj.js';

describe('isValidCnpj', () => {
  it('aceita CNPJs com dígitos verificadores corretos', () => {
    expect(isValidCnpj('11222333000181')).toBe(true);
    expect(isValidCnpj('19131243000197')).toBe(true);
  });

  it('rejeita dígito verificador errado', () => {
    expect(isValidCnpj('11222333000182')).toBe(false);
    expect(isValidCnpj('19131243000198')).toBe(false);
  });

  it('rejeita sequências repetidas', () => {
    expect(isValidCnpj('00000000000000')).toBe(false);
    expect(isValidCnpj('11111111111111')).toBe(false);
  });

  it('rejeita comprimento diferente de 14 dígitos', () => {
    expect(isValidCnpj('1122233300018')).toBe(false);
    expect(isValidCnpj('112223330001810')).toBe(false);
  });
});
