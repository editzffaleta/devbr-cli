# Contribuindo

Obrigado pelo interesse! Este guia cobre o ambiente de desenvolvimento e como adicionar um comando.

## Requisitos

- **Node.js 18+** (o CLI usa `fetch` nativo).
- **npm**.

## Ambiente

```bash
git clone https://github.com/editzffaleta/devbr-cli.git
cd devbr-cli
npm install
```

Rodar o CLI localmente, sem build:

```bash
npm run dev -- feriados 2026
npm run dev -- cep 01001-000 --json
```

## Scripts

| Script | O que faz |
|---|---|
| `npm run dev -- <args>` | Executa o CLI a partir do fonte (via `tsx`). |
| `npm run typecheck` | `tsc --noEmit`. |
| `npm run lint` | ESLint. |
| `npm run format` | Prettier (escreve). |
| `npm test` | Testes com Vitest. |
| `npm run build` | Gera o bundle `dist/cli.js` (tsup). |

Antes de abrir um PR, garanta que `lint`, `typecheck`, `test` e `build` passam — é o mesmo conjunto
que a integração contínua executa.

## Estrutura

```
src/
  cli.ts            # entrypoint: trata erros e chama o programa
  program.ts        # monta o commander e registra os comandos
  core/             # infraestrutura compartilhada
    http.ts         # cliente HTTP (fetch) com timeout e cache
    cache.ts        # cache em disco com TTL
    errors.ts       # erros tipados (CliError e subclasses)
    output.ts       # saída humana (tabela/chave-valor/spinner) e --json
    options.ts      # flags globais (--json, --no-cache)
    format.ts       # helpers puros de formatação
  commands/         # um arquivo por comando
```

## Adicionando um comando

1. Crie `src/commands/<nome>.ts` exportando `register<Nome>(program: Command)`.
2. Dentro do handler:
   - chame `applyGlobals(command)` no início;
   - **valide a entrada antes de qualquer requisição** e lance `ValidationError` quando inválida;
   - busque os dados com `fetchJson` (informe um `cacheTtlMs` adequado);
   - respeite `isJsonMode()` para escolher entre `printJson()` e a saída humana;
   - chame `addGlobalOptions(cmd)` no comando.
3. Registre em `src/program.ts`.
4. Adicione um teste de validação em `src/commands/commands.test.ts`.
5. Documente o comando em [`docs/comandos.md`](docs/comandos.md) e no README.

Referência: qualquer comando existente (ex.: `src/commands/cep.ts`) serve de modelo.

## Padrões

- Mensagens ao usuário em **português**.
- Erros sempre tipados (`ValidationError` para entrada, `NotFoundError`/`NetworkError` para a API),
  com o código de saída correto.
- Dependências mínimas — preferimos APIs nativas do Node.
- Testes não devem acessar a rede real (use `vi.stubGlobal('fetch', ...)`).

## Commits

Mensagens no padrão [Conventional Commits](https://www.conventionalcommits.org/pt-br/), em português
(ex.: `feat: comando cnpj`, `fix: valida UF antes da requisição`).
