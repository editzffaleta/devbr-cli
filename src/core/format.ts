/**
 * Helpers puros de formatação e normalização de entrada, reutilizados pelos
 * comandos. Ficam isolados aqui para serem testados sem I/O.
 */

/** Converte uma data ISO `AAAA-MM-DD` para `DD/MM/AAAA`. */
export function formatIsoDate(iso: string): string {
  const [year, month, day] = iso.split('-');
  if (!year || !month || !day) return iso;
  return `${day}/${month}/${year}`;
}

/** Remove tudo que não for dígito. */
export function onlyDigits(value: string): string {
  return value.replace(/\D/g, '');
}

/** Formata um número (ou string numérica) no padrão brasileiro. */
export function formatNumberBR(value: string | number, maxFractionDigits = 4): string {
  const n = typeof value === 'string' ? Number(value) : value;
  if (Number.isNaN(n)) return String(value);
  return n.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: maxFractionDigits,
  });
}

/** Formata um valor monetário em reais (`R$ 5,43`). */
export function formatBRL(value: string | number): string {
  return `R$ ${formatNumberBR(value, 2)}`;
}
