# Referência de comandos

Documentação completa dos comandos do `devbr-cli`. Todos os dados vêm de APIs públicas e sem chave.

## Índice

- [Flags globais](#flags-globais)
- [`feriados`](#feriados)
- [`cotacao`](#cotacao)
- [`cep`](#cep)
- [`cnpj`](#cnpj)
- [`ddd`](#ddd)
- [`fipe`](#fipe)
- [`ibge`](#ibge)
- [`bancos`](#bancos)
- [Códigos de saída](#códigos-de-saída)

## Flags globais

Aceitas por qualquer comando:

| Flag | Efeito |
|---|---|
| `--json` | Emite o resultado como JSON puro em `stdout` (para compor com `jq` e scripts). Desliga cores e spinner. |
| `--no-cache` | Ignora o cache local e força uma nova requisição. |
| `-v`, `--version` | Mostra a versão. |
| `-h`, `--help` | Mostra a ajuda (funciona também por comando, ex.: `devbr fipe --help`). |

O cache fica em `~/.cache/devbr-cli` (ou `$XDG_CACHE_HOME/devbr-cli`) e expira por comando.

---

## `feriados`

Lista os feriados nacionais de um ano.

```
devbr feriados [ano]
```

- **`ano`** *(opcional)* — ano com 4 dígitos. Padrão: ano atual.

```console
$ devbr feriados 2026
Data        Nome                      Tipo
01/01/2026  Confraternização mundial  national
17/02/2026  Carnaval                  national
03/04/2026  Sexta-feira Santa         national
...
```

```console
$ devbr feriados 2026 --json
[{ "date": "2026-01-01", "name": "Confraternização mundial", "type": "national" }, ...]
```

---

## `cotacao`

Mostra a cotação PTAX (Banco Central) de moedas em relação ao real. Como a PTAX só tem dias úteis e
não libera o dia corrente, o comando resolve automaticamente o dia útil mais recente disponível.

```
devbr cotacao [moedas...]
```

- **`moedas`** *(opcional)* — um ou mais códigos. Padrão: `USD EUR`.
  Disponíveis: `AUD, CAD, CHF, DKK, EUR, GBP, JPY, NOK, SEK, USD`.

```console
$ devbr cotacao
Moeda      Compra   Venda    Boletim          Atualizado
USD → BRL  R$ 5,17  R$ 5,17  FECHAMENTO PTAX  2026-07-03 13:08
EUR → BRL  R$ 5,91  R$ 5,92  FECHAMENTO PTAX  2026-07-03 13:08
```

```console
$ devbr cotacao gbp jpy --json
[{ "moeda": "GBP", "data": "2026-07-03", "compra": 6.91, "venda": 6.91, "boletim": "FECHAMENTO PTAX", "atualizado": "..." }, ...]
```

Moeda fora da lista suportada resulta em erro de validação (código de saída 2).

---

## `cep`

Resolve um CEP em endereço.

```
devbr cep <cep>
```

- **`cep`** *(obrigatório)* — 8 dígitos, com ou sem hífen.

```console
$ devbr cep 01001-000
CEP         01001000
UF          SP
Cidade      São Paulo
Bairro      Sé
Logradouro  Praça da Sé
```

```console
$ devbr cep 01001000 --json
{ "cep": "01001000", "state": "SP", "city": "São Paulo", "neighborhood": "Sé", "street": "Praça da Sé", "service": "open-cep" }
```

CEP mal formatado é rejeitado **antes** de qualquer requisição (código de saída 2).

---

## `cnpj`

Consulta os dados cadastrais de uma empresa.

```
devbr cnpj <cnpj>
```

- **`cnpj`** *(obrigatório)* — 14 dígitos, com ou sem pontuação.

```console
$ devbr cnpj 19.131.243/0001-97
Razão social   OPEN KNOWLEDGE BRASIL
Nome fantasia  REDE PELO CONHECIMENTO LIVRE
Situação       ATIVA
Abertura       03/10/2013
Atividade      Atividades de associações de defesa de direitos sociais
Endereço       AVENIDA PAULISTA 37
Bairro         BELA VISTA
Município/UF   SAO PAULO / SP
```

Use `--json` para o objeto cadastral completo (sócios, CNAEs secundários, etc.).

---

## `ddd`

Lista o estado e as cidades atendidas por um código DDD.

```
devbr ddd <ddd>
```

- **`ddd`** *(obrigatório)* — 2 dígitos.

```console
$ devbr ddd 71
Estado   BA
Cidades  15

Cidade
CAMAÇARI
DIAS D'ÁVILA
LAURO DE FREITAS
...
```

---

## `fipe`

Consulta a tabela FIPE de preços de veículos. Tem dois subcomandos.

```
devbr fipe marcas [tipo]
devbr fipe preco <codigoFipe>
```

### `fipe marcas [tipo]`

Lista as marcas de um tipo de veículo.

- **`tipo`** *(opcional)* — `carros`, `motos` ou `caminhoes`. Padrão: `carros`.

```console
$ devbr fipe marcas motos
Código  Marca
77      HONDA
80      YAMAHA
...
```

### `fipe preco <codigoFipe>`

Mostra o preço de um veículo pelo código FIPE.

```console
$ devbr fipe preco 001004-9
Referência    Marca  Modelo          Ano   Combustível  Preço
julho de 2026 Fiat   Uno Mille ...    2013  Gasolina     R$ 21.000,00
```

> **Disponibilidade:** o `fipe` depende do serviço FIPE por trás da fonte de dados, que
> ocasionalmente fica indisponível na origem. Nesses momentos o comando informa isso claramente
> em vez de exibir dado inválido.

---

## `ibge`

Dados geográficos do IBGE. Tem dois subcomandos.

```
devbr ibge estados
devbr ibge municipios <uf>
```

### `ibge estados`

```console
$ devbr ibge estados
Sigla  Nome       Região
AC     Acre       Norte
AL     Alagoas    Nordeste
...
```

### `ibge municipios <uf>`

- **`uf`** *(obrigatório)* — sigla da UF com 2 letras.

```console
$ devbr ibge municipios sp
Código IBGE  Município
3500105      ADAMANTINA
3500204      ADOLFO
...
```

Dica: liste tudo em JSON e filtre com `jq`:

```bash
devbr ibge municipios sp --json | jq '.[].nome'
```

---

## `bancos`

Lista instituições bancárias ou detalha uma pelo código.

```
devbr bancos [codigo]
```

- **`codigo`** *(opcional)* — código COMPE do banco. Sem código, lista todos.

```console
$ devbr bancos 341
Código  341
Nome    Itaú Unibanco S.A.
Sigla   ITAÚ UNIBANCO S.A.
ISPB    60701190
```

```console
$ devbr bancos
Código  Instituição            ISPB
1       BCO DO BRASIL S.A.     00000000
33      BCO SANTANDER ...      90400888
...
```

---

## Códigos de saída

| Código | Significado |
|---|---|
| `0` | Sucesso. |
| `1` | Falha de execução (rede, timeout, recurso não encontrado, indisponibilidade da fonte). |
| `2` | Entrada inválida (validação de argumento). |

Em modo `--json`, erros são emitidos como `{ "erro": "..." }` em `stderr`, preservando o código de saída.
