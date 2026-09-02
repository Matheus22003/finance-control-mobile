# Decisão de arquitetura mobile

## Decisão

O Finance Control Mobile usará React Native com Expo Router.

## Motivo

O objetivo inclui um aplicativo móvel instalado, uma experiência própria para toque e valor de portfólio para vagas internacionais. React Native tem ecossistema amplo, usa TypeScript e permite componentes de plataforma, sem transformar o frontend Angular desktop em aplicativo.

Expo reduz a complexidade inicial de desenvolvimento, deep links, build e notificações. Caso uma capacidade nativa exija configuração adicional, o projeto pode evoluir para prebuild sem mudar o contrato do aplicativo.

## Limites arquiteturais

- Todo acesso de negócio passa pelo BFF via HTTPS e `/api/v1`.
- O aplicativo não chama serviços internos, bancos ou provedores de notificação.
- A UI mobile é independente da UI Angular; apenas contratos, linguagem de domínio e tokens visuais podem ser compartilhados.
- Push é um aviso de mudança. O estado oficial continua sendo relido pelo BFF.

## Autenticação: primeiro marco funcional

O fluxo web atual usa access token em memória e refresh cookie `HttpOnly`. Isso é adequado ao navegador, mas não deve ser transportado automaticamente para o aplicativo.

Antes das telas financeiras, o BFF precisa oferecer uma sessão mobile explícita:

1. access token curto apenas em memória;
2. refresh token opaco, rotativo, revogável e associado ao dispositivo;
3. refresh token guardado no Keychain (iOS) ou Keystore (Android), nunca em AsyncStorage;
4. logout que revoga a sessão e remove a credencial segura;
5. lista e revogação de dispositivos na área de segurança.

## Entrega incremental

1. autenticação mobile, sessão segura e deep links;
2. resumo, saldo e lançamentos;
3. orçamento, metas e dívidas;
4. registro de dispositivo e push FCM/APNs;
5. relatórios e estratégia deliberada de cache/offline.

## Custos e plataformas

- Android local e o SDK Expo são gratuitos;
- Firebase Cloud Messaging não exige custo para o canal de mensagens;
- distribuição pela Play Store e App Store possui requisitos próprios;
- a primeira validação será Android-first, em dispositivo físico, sem depender de publicação em loja.

## Fontes oficiais

- [React Native](https://reactnative.dev/docs/getting-started)
- [Expo Router](https://docs.expo.dev/router/introduction/)
- [Expo SecureStore](https://docs.expo.dev/versions/latest/sdk/securestore/)
- [Expo Notifications](https://docs.expo.dev/push-notifications/overview/)
