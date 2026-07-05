# Política de segurança — devbr-cli

`devbr-cli` é uma ferramenta de linha de comando que consulta **APIs públicas e sem chave**
(BrasilAPI). Ainda assim, levamos a segurança do pacote a sério.

## Como reportar

- **Não abra issue pública** para vulnerabilidades. Contato: **brunofaleta0@gmail.com**.
- Inclua descrição, reprodução, impacto e o arquivo/comando afetado.
- Resposta inicial em até 72h úteis.

## Escopo

Código do CLI (`src/**`, bundle `dist/**`), o `package.json` (dependências e campo `files`), o
processo de build/distribuição e os workflows de CI (`.github/workflows/**`).

## Postura

- Sem segredos no repositório: as APIs consumidas são públicas e não exigem chave; `.env` nunca é
  versionado.
- CI de qualidade em cada push/PR: lint, typecheck, testes e build.
- Publicação no npm com `files` restrito a `dist/` — nunca publicamos `src/`, testes ou segredos.
- Dependências mínimas e auditadas (`npm audit`); preferimos APIs nativas (`fetch`) a libs extras.
