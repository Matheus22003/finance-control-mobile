# Refinamento visual do Stitch

Este é o comando de refinamento para as telas já geradas no Google Stitch. Ele
preserva os fluxos que foram aprovados e substitui apenas a identidade genérica
gerada pelo modelo pela identidade real do Finance Control web.

```text
Refine as telas mobile JÁ existentes do Finance Control. Não redesenhe os
fluxos, nem altere conteúdo, dados, valores, gráficos, rótulos, estados, ações
ou navegação funcional. A tarefa é exclusivamente alinhar a interface visual à
identidade do produto web Finance Control.

Direção: aplicativo financeiro calmo, preciso e confiável; minimalista, com
respiro e contraste suave. Nunca use neon, roxo ou azul genérico,
glassmorphism excessivo ou aparência de banco infantil.

Use Inter (fallback: fonte sans-serif do sistema), e não Manrope. Tokens claros
exatos: fundo #F5F8FA; superfícies e cartões #FFFFFF; superfície sutil
#EEF4F5; texto principal #132027; texto secundário #64747D; bordas #E1E9EC
(forte #CCDADD); teal principal e positivo #087F73; hover #06685F; teal suave
#E1F5F1; negativo #E86452 com fundo suave #FFF0ED; pendente #C47D13 com fundo
suave #FFF6DF. Use raios de 10px para controles, 14px para componentes e 20px
para cards grandes. Sombras devem ser muito discretas: 0 1px 2px
rgba(15,23,42,.04), usando 0 12px 30px rgba(15,23,42,.08) apenas quando
necessário.

Marca: não invente uma logo. Reproduza a marca existente: um quadrado teal de
36px, raio de 11px, com duas barras brancas horizontais curtas; ao lado, o
wordmark completo "Finance Control", com "Finance" em #132027, peso 500, e
"Control" em #087F73, peso 800. Não use monograma, ícone de carteira,
gradiente ou símbolo alternativo no lugar da marca.

Mantenha o tom calmo, direto e humano do produto. Exemplos: "Sua vida
financeira em equilíbrio", "Dinheiro organizado. Relações mais leves." e
"Finanças pessoais e compartilhadas, sem complicação." Evite linguagem
promocional, bancária ou julgadora.

Navegação: use header elevado e limpo com wordmark à esquerda, e avatar, sino e
troca de tema à direita. Use barra inferior com Início, Finanças, botão central
elevado para adicionar lançamento, Relatórios, Dívidas e Amigos. O botão + é o
único CTA circular elevado: teal #087F73, ícone branco, 50px e aro na cor do
canvas. Segurança e conta continuam acessíveis pelo avatar/perfil, sem competir
com a barra principal. Respeite safe areas e mantenha alvos de toque com pelo
menos 48px, mesmo que o elemento visual pareça menor.

Componentes: cartões brancos com borda sutil e pouco relevo; títulos fortes;
valores com algarismos tabulares; chips de estado sempre acompanhados de texto
ou ícone, nunca só cor; CTA primário teal sólido com texto branco; campos com
fundo branco, borda sutil e halo de foco teal. Preserve a hierarquia da
tela inicial: saldo, receitas/despesas, a receber/a pagar e então ações e
próximos eventos. O cartão de saldo pode usar o gradiente discreto
#087F73 -> #096B66, mas nenhum outro card deve virar gradiente.

Dark mode deve ser entregue como uma variante real e não como inversão de cores:
fundo #08111F; superfície #0F1B2D; sutil #142238; texto #F1F5F9; texto
secundário #94A3B8; bordas #26364D (forte #354861); teal principal/positivo
#2DD4BF; hover #5EEAD4; teal suave rgba(45,212,191,.13); negativo #FB806F;
pendente #F6C453. Preserve a mesma proporção, hierarquia e semântica do tema
claro.

Entregue a revisão visual consistente de todas as telas existentes em temas
claro e escuro. Não acrescente recursos, telas, dados fictícios, textos
promocionais, filtros, gráficos ou mudanças de informação.
```

## Critérios de aceite

- A mesma marca, família tipográfica e escala cromática são reconhecíveis no
  site e no aplicativo.
- Tema claro e dark mode aplicam os tokens acima, com contraste legível.
- O aplicativo é nativo e mobile-first, sem tentar comprimir o layout desktop.
- A navegação preserva o lançamento rápido e o domínio de finanças
  compartilhadas (Amigos).
- Estados de sucesso, atenção e erro têm texto ou ícone além de cor.

## Correção de divergências encontradas

Após a primeira revisão, o Stitch ainda mostrou o ícone genérico de carteira em
parte dos cabeçalhos e omitiu **Amigos** da barra inferior. Este comando deve
ser enviado como uma segunda instrução, sem recriar as telas:

```text
Faça apenas uma correção de fidelidade nas telas refinadas existentes; não
altere layout, conteúdo, dados, valores, tipografia, cores, tema, fluxos,
componentes ou qualquer outra informação.

1. Remova o ícone genérico de carteira (account_balance_wallet) de TODO
cabeçalho, tela de login e navegação. Use exclusivamente a marca oficial do
Finance Control: quadrado teal de 36px com raio 11px e duas barras brancas
horizontais curtas; ao lado, wordmark completo "Finance" em #132027 peso 500
+ "Control" em #087F73 peso 800. No tema escuro, preserve contraste com texto
#F1F5F9 e teal #2DD4BF. Nunca use símbolo alternativo, monograma, gradiente ou
ícone de carteira.

2. Corrija a barra inferior de cada tela autenticada: Início, Finanças, botão
central + para adicionar lançamento, Relatórios, Dívidas e Amigos. O perfil e
as configurações permanecem no avatar do cabeçalho. Quando seis destinos não
couberem com rótulos legíveis em 390px, use o rótulo curto "Amigos" e ícones
lineares de 24px, preservando toque mínimo de 48px; não esconda Amigos nem
substitua-o por Perfil/Planejamento.

Aplique essas duas correções de forma consistente nos temas claro e escuro e
nas telas Login, Início, Lançamentos, Criar lançamento, Planejamento, Dívidas,
Relatórios, Notificações e Perfil e segurança. Entregue somente a revisão das
telas existentes.
```
