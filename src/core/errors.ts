/**
 * Erros tipados do CLI. Cada um carrega o `exitCode` que o processo deve retornar,
 * permitindo que scripts distingam validação (2) de falha de execução (1).
 */
export class CliError extends Error {
  readonly exitCode: number;

  constructor(message: string, exitCode = 1) {
    super(message);
    this.name = 'CliError';
    this.exitCode = exitCode;
  }
}

/** Recurso não encontrado na API (ex.: CEP inexistente, código FIPE inválido). */
export class NotFoundError extends CliError {
  constructor(message: string) {
    super(message, 1);
    this.name = 'NotFoundError';
  }
}

/** Falha de rede, timeout ou resposta de erro da API. */
export class NetworkError extends CliError {
  constructor(message: string) {
    super(message, 1);
    this.name = 'NetworkError';
  }
}

/** Entrada do usuário inválida (ex.: CEP mal formatado, UF com tamanho errado). */
export class ValidationError extends CliError {
  constructor(message: string) {
    super(message, 2);
    this.name = 'ValidationError';
  }
}
