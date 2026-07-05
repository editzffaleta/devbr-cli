<p align="center">
  <img src="https://raw.githubusercontent.com/editzffaleta/devbr-cli/main/docs/assets/capa.svg" alt="devbr-cli — APIs públicas brasileiras no terminal" width="100%"/>
</p>

# devbr-cli ⌨️

[![CI](https://github.com/editzffaleta/devbr-cli/actions/workflows/ci.yml/badge.svg)](https://github.com/editzffaleta/devbr-cli/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/devbr-cli.svg)](https://www.npmjs.com/package/devbr-cli)
[![license](https://img.shields.io/npm/l/devbr-cli.svg)](./LICENSE)

**Ferramenta de linha de comando para desenvolvedores brasileiros.** Consulta, direto do terminal,
as APIs públicas mais úteis do Brasil — sem sair do fluxo de trabalho e sem abrir o navegador.

```bash
npx devbr-cli feriados 2026
npx devbr-cli cotacao
npx devbr-cli cep 01001-000
npx devbr-cli cnpj 19.131.243/0001-97
npx devbr-cli bancos 341
```

<p align="center">
  <img src="https://raw.githubusercontent.com/editzffaleta/devbr-cli/main/docs/assets/demo.svg" alt="Demonstração do devbr-cli: feriados, cotação, CEP e IBGE no terminal" width="82%"/>
</p>

## Comandos

| Comando | O que faz |
|---|---|
| `devbr feriados [ano]` | Feriados nacionais do ano (padrão: ano atual) |
| `devbr cotacao [moedas...]` | Cotação PTAX de moedas em BRL (padrão: USD, EUR) |
| `devbr cep <cep>` | Endereço a partir de um CEP |
| `devbr cnpj <cnpj>` | Dados cadastrais de uma empresa |
| `devbr ddd <ddd>` | Estado e cidades atendidas por um DDD |
| `devbr fipe marcas [tipo]` · `fipe preco <codigoFipe>` | Marcas e preços da tabela FIPE |
| `devbr ibge estados` · `ibge municipios <uf>` | Estados e municípios do IBGE |
| `devbr bancos [codigo]` | Lista bancos ou detalha um pelo código |

📖 Referência completa de cada comando (argumentos, exemplos e saída JSON) em
**[`docs/comandos.md`](docs/comandos.md)**.

Todos os comandos aceitam as flags globais:

- **`--json`** — emite JSON puro em stdout (para compor com `jq` e scripts).
- **`--no-cache`** — ignora o cache local e força uma nova requisição.

```bash
# exemplo: municípios de SP em JSON, filtrando com jq
npx devbr-cli ibge municipios sp --json | jq '.[].nome'
```

> O comando `fipe` depende do serviço FIPE por trás da fonte de dados, que ocasionalmente fica
> indisponível na origem; nesses momentos o comando retorna um erro claro em vez de dado inválido.

## Instalação

Não precisa instalar nada — rode via `npx`:

```bash
npx devbr-cli <comando>
```

Ou instale globalmente:

```bash
npm install -g devbr-cli
devbr <comando>
```

Requer **Node.js 18+** (usa `fetch` nativo).

## Como funciona

- **TypeScript ESM** sobre Node 18+ — `fetch` nativo, sem dependências de HTTP externas.
- **commander** para os comandos, **tsup** para o bundle, **vitest** para os testes, **chalk** +
  **ora** para a experiência no terminal.
- Cliente HTTP único com timeout, **cache em disco** com TTL por comando e **erros tipados** com
  códigos de saída (validação = 2, falha de execução = 1).
- Dados de fontes públicas e sem chave de API.

## Desenvolvimento

```bash
npm install
npm run dev -- feriados 2026   # roda o CLI localmente
npm run typecheck && npm run lint && npm test
npm run build                  # gera dist/cli.js
node dist/cli.js cotacao
```

Detalhes e como adicionar um comando: **[`CONTRIBUTING.md`](CONTRIBUTING.md)**.

## Licença

[MIT](./LICENSE).
