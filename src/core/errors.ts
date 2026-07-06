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

/**
 * Falha de rede, timeout ou resposta de erro da API.
 *
 * - `status` guarda o código HTTP quando o erro veio de uma resposta (>= 400);
 *   fica `undefined` para falhas sem resposta (rede/timeout).
 * - `cause` preserva o erro original para diagnóstico (visível com `DEBUG=devbr`).
 */
export class NetworkError extends CliError {
  readonly status?: number;

  constructor(message: string, options: { cause?: unknown; status?: number } = {}) {
    super(message, 1);
    this.name = 'NetworkError';
    this.status = options.status;
    if (options.cause !== undefined) this.cause = options.cause;
  }
}

/** Entrada do usuário inválida (ex.: CEP mal formatado, UF com tamanho errado). */
export class ValidationError extends CliError {
  constructor(message: string) {
    super(message, 2);
    this.name = 'ValidationError';
  }
}
