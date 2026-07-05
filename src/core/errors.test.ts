import { describe, expect, it } from 'vitest';
import { CliError, NetworkError, NotFoundError, ValidationError } from './errors.js';

describe('erros do CLI', () => {
  it('CliError carrega mensagem e exitCode padrão 1', () => {
    const err = new CliError('falhou');
    expect(err.message).toBe('falhou');
    expect(err.exitCode).toBe(1);
  });

  it('NotFoundError e NetworkError usam exit code 1', () => {
    expect(new NotFoundError('x').exitCode).toBe(1);
    expect(new NetworkError('x').exitCode).toBe(1);
  });

  it('ValidationError usa exit code 2', () => {
    expect(new ValidationError('x').exitCode).toBe(2);
  });

  it('subclasses continuam sendo instância de CliError', () => {
    expect(new ValidationError('x')).toBeInstanceOf(CliError);
    expect(new NotFoundError('x')).toBeInstanceOf(CliError);
  });
});
