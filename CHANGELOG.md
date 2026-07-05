# Changelog

Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/), em português.

## [0.2.0] — 2026-07-05

### Adicionado
- Comando `cnpj <cnpj>` — dados cadastrais de uma empresa (razão social, situação, atividade, endereço).
- Comando `ddd <ddd>` — estado e cidades atendidas por um código DDD.
- Comando `bancos [codigo]` — lista instituições bancárias ou detalha uma pelo código.

### Melhorado
- O comando `fipe` agora informa com clareza quando a origem dos dados está indisponível,
  em vez de exibir um erro genérico.

## [0.1.0] — 2026-07-05

### Adicionado
- Primeira versão do CLI, com os comandos `feriados`, `cotacao` (PTAX), `cep`, `fipe` e `ibge`.
- Cliente HTTP sobre `fetch` nativo com timeout, cache em disco com TTL e erros tipados.
- Flags globais `--json` (saída em JSON puro) e `--no-cache`.
- Suíte de testes (vitest), integração contínua (Node 18/20/22) e distribuição via `npx`.
