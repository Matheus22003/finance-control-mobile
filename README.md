# Finance Control Mobile

Aplicativo instalado do Finance Control para Android e iOS, construído com React Native e Expo. Ele consome exclusivamente o BFF público versionado em `/api/v1`; nunca acessa Finance Service, Debt Service, bancos de dados ou provedores de infraestrutura diretamente.

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
npm install
npm run test
npx tsc --noEmit
npm run android
```

O primeiro login conectado habilita dashboard, lançamentos e a criação de receitas/despesas reais pelo BFF. A aba Finanças também consulta orçamento mensal, metas, recorrências e projeção de caixa; criação e atualização desses recursos já usa os contratos reais do BFF.

## Referências

- [Decisão de arquitetura](docs/architecture/mobile-architecture.md)
- [Brief e prompt para Stitch](docs/design/stitch-prompt.md)
