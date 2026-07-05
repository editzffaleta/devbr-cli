/**
 * Validação de CNPJ pelo algoritmo dos dígitos verificadores (módulo 11).
 * Puro e sem I/O — permite rejeitar um CNPJ inválido sem tocar a rede.
 */

const PESOS_DV1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
const PESOS_DV2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

function digitoVerificador(base: string, pesos: number[]): number {
  const soma = base
    .split('')
    .reduce((acc, digito, i) => acc + Number(digito) * (pesos[i] ?? 0), 0);
  const resto = soma % 11;
  return resto < 2 ? 0 : 11 - resto;
}

/**
 * Retorna `true` se `cnpj` (14 dígitos, apenas números) tiver dígitos
 * verificadores válidos. Sequências repetidas (ex.: `00000000000000`) são inválidas.
 */
export function isValidCnpj(cnpj: string): boolean {
  if (!/^\d{14}$/.test(cnpj)) return false;
  if (/^(\d)\1{13}$/.test(cnpj)) return false;

  const dv1 = digitoVerificador(cnpj.slice(0, 12), PESOS_DV1);
  if (dv1 !== Number(cnpj[12])) return false;

  const dv2 = digitoVerificador(cnpj.slice(0, 13), PESOS_DV2);
  return dv2 === Number(cnpj[13]);
}
