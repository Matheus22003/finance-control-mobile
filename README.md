# Finance Control Mobile

Aplicativo móvel do Finance Control para Android e iOS, construído com React Native e Expo.

O aplicativo consome exclusivamente o BFF público versionado em `/api/v1`. Ele não acessa Finance Service, Debt Service, bancos de dados, provedores de push ou variáveis de infraestrutura diretamente.

## Estado inicial

Esta primeira entrega estabelece o projeto Expo Router, a estratégia de design e a decisão de arquitetura. A autenticação mobile será implementada antes de qualquer tela que manipule dados financeiros.

## Desenvolvimento

```bash
npm install
npm run android
```

O desenvolvimento Android pode ser feito localmente sem custo. Publicação em lojas e suporte a iOS dependem de requisitos das respectivas plataformas.

## Referências

- [Decisão de arquitetura](docs/architecture/mobile-architecture.md)
- [Brief e prompt para Stitch](docs/design/stitch-prompt.md)
