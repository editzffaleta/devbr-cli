# Changelog

Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/), em português.

## [0.3.0] — 2026-07-05

### Adicionado
- Comando `cache` com `info` (caminho, quantidade e tamanho) e `clear` (limpa o cache).
- Validação do dígito verificador do CNPJ: um CNPJ com DV errado é rejeitado sem tocar a rede.
- Validação da faixa de ano em `feriados` (1900–2199).
- Uma nova tentativa automática em respostas `429`/`503` (com espera curta e jitter).
- Variável `DEBUG=devbr` para imprimir a causa original de falhas de rede no `stderr`.

### Corrigido
- Resposta não-JSON da API (ex.: página de erro HTML de CDN) agora vira uma mensagem clara em
  português, em vez de um erro cru em inglês.
- `cotacao` aborta imediatamente em falha de rede/timeout, em vez de tentar vários dias e travar.
- `cotacao` calcula a data-base no fuso de São Paulo (antes usava UTC).
- `fipe` só troca a mensagem por "indisponível na origem" em erros `5xx`; falha de rede/timeout
  mostra a mensagem real.
- Erros de uso (argumento faltando, comando/opção desconhecidos) saem em português, com código de
  saída 2 e no formato `{ "erro": ... }` quando `--json`.

### Melhorado
- Cache: entradas expiradas são removidas ao serem lidas; escrita atômica e permissões restritas
  (diretório `0700`, arquivos `0600`).
- Erros de rede preservam a causa original (`cause`) para diagnóstico.
- Integração contínua passa a rodar também em macOS e Windows.
- Cobertura de testes ampliada (caminho feliz de cada comando, retry, cache corrompido).

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
