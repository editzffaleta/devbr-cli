import { describe, expect, it } from 'vitest';
import { formatBRL, formatIsoDate, formatNumberBR, onlyDigits } from './format.js';

describe('formatIsoDate', () => {
  it('converte ISO para DD/MM/AAAA', () => {
    expect(formatIsoDate('2026-01-01')).toBe('01/01/2026');
  });

  it('devolve a entrada quando não é ISO válido', () => {
    expect(formatIsoDate('abc')).toBe('abc');
  });
});

describe('onlyDigits', () => {
  it('remove hífens e espaços', () => {
    expect(onlyDigits('01001-000')).toBe('01001000');
    expect(onlyDigits(' 12 34 ')).toBe('1234');
  });
});

describe('formatNumberBR / formatBRL', () => {
  it('formata número no padrão brasileiro', () => {
    expect(formatNumberBR('5.4321')).toBe('5,4321');
    expect(formatNumberBR(1234.5, 2)).toBe('1.234,50');
  });

  it('formata valor monetário em reais', () => {
    expect(formatBRL('5.43')).toBe('R$ 5,43');
  });

  it('devolve a string original quando não é número', () => {
    expect(formatNumberBR('n/a')).toBe('n/a');
  });
});
