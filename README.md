# Finance Control Mobile

[![Mobile CI](https://github.com/Matheus22003/finance-control-mobile/actions/workflows/ci.yml/badge.svg)](https://github.com/Matheus22003/finance-control-mobile/actions/workflows/ci.yml)

Aplicativo instalado do Finance Control para Android e iOS, construído com React Native e Expo. Ele consome exclusivamente o BFF público versionado em `/api/v1`; nunca acessa Finance Service, Debt Service, bancos de dados ou provedores de infraestrutura diretamente.

## Como este repositório se encaixa

Este é o cliente nativo mobile do Finance Control. O backend público é o
[`finance-control-bff`](https://github.com/Matheus22003/finance-control-bff); o
ambiente integrado e o deploy ficam em
[`finance-control-infra`](https://github.com/Matheus22003/finance-control-infra).

### Funcionalidades atuais

- dashboard, receitas, despesas, orçamento, metas, recorrências e fluxo de caixa;
- relatórios e exportação CSV pelo compartilhamento nativo;
- amigos, convites, grupos e criação de grupos;
- dívidas, pagamentos, liquidação e cotas personalizadas por participante;
- gestão de membros de grupo com regra de dono.

### Identidade e distribuição

| Campo | Valor |
|---|---|
| Expo SDK | `57` |
| Android package | `com.matheus22003.financecontrol` |
| iOS bundle identifier | `com.matheus22003.financecontrol` |
| EAS project | `@dijounas/finance-control-mobile` |

O projeto possui perfis EAS `preview` (APK interno) e `production` (AAB para
loja). A publicação na Google Play está adiada; a distribuição atual é privada.

## Sessão segura

- O access token existe somente em memória.
- O refresh token é opaco, rotativo e guardado exclusivamente no Android Keystore/iOS Keychain com `expo-secure-store`.
- Um UUID aleatório de instalação é persistido no mesmo armazenamento seguro e vincula a sessão ao app instalado, sem coletar identificadores de hardware.
- O app restaura a sessão com `POST /api/v1/auth/mobile/refresh`, faz logout via `POST /api/v1/auth/mobile/logout` e limpa a credencial local mesmo quando estiver offline.
- O app não usa cookies de navegador, `AsyncStorage` nem `localStorage` para tokens.

## API

Por padrão, o aplicativo usa o BFF público atual. Para outro ambiente, defina uma URL pública (não é segredo) antes de iniciar o Expo:

```bash
EXPO_PUBLIC_API_URL=https://seu-bff.example npm run android
```

Em um dispositivo físico, `localhost` aponta para o próprio aparelho; use uma URL HTTPS alcançável pelo dispositivo ou um túnel de desenvolvimento.

## Desenvolvimento

```bash
npm ci
npm run typecheck
npm test
npm run android
```

Os testes rodam com Vitest (`core/**/*.test.ts`) e também são verificados pelo
`tsc`, então uma quebra de tipo em teste falha o `typecheck`. A integração
contínua executa typecheck, testes e o bundle Android em cada push e pull
request para `main` e `develop`.

O primeiro login conectado habilita dashboard, lançamentos e a criação de receitas/despesas reais pelo BFF. A aba Finanças também consulta orçamento mensal, metas, recorrências e projeção de caixa; criação e atualização desses recursos já usa os contratos reais do BFF. A aba Relatórios consulta `/api/v1/reports/overview` por período e exporta `/api/v1/reports/export.csv`, compartilhando o arquivo pelo recurso nativo do sistema.

## Referências

- [Decisão de arquitetura](docs/architecture/mobile-architecture.md)
- [Brief e prompt para Stitch](docs/design/stitch-prompt.md)
