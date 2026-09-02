# T-31 — O portfólio em inglês

**Track A · pedido por Fernando em 2026-09-02 · `src/content/modules.ts`, `src/content/mirror.ts`, `vite.site.config.ts`**

## Goal

O portfólio existe em inglês como **página construída**, não como tradução em runtime, e o
visitante escolhe qual lê.

## Why

O `PRODUCT.md` nomeia as duas audiências — empregadores e recrutadores avaliando o Fernando, e
clientes de freelance decidindo se começam uma conversa — e **não diz em que língua elas leem**.
Essa lacuna é a primeira decisão deste ticket e é dele, porque decide se o inglês é a versão
principal ou a segunda. Hoje o objeto responde a pergunta por omissão: `<html lang="pt-BR">` e
seis Módulos em português, o que restringe as duas audiências ao Brasil sem que ninguém tenha
escolhido isso.

**A arquitetura já está pronta para receber.** Todo o texto vive em `src/content/modules.ts` e tem
exatamente dois leitores — a Screen por `prototype/screen/render.js`, o espelho por
`src/content/mirror.ts`. Não há texto solto em nenhum outro lugar, então isto é uma mudança em um
arquivo e não uma caçada. É o dividendo do T-01 e do T-18, e é a razão pela qual este ticket é
viável agora e teria sido brutal seis semanas atrás.

## A decisão que decide as outras: página, não toggle

**Um botão que troca o idioma em runtime não entrega um portfólio em inglês.** O espelho é
pré-renderizado no build (`prerenderMirror` em `vite.site.config.ts`), e o HTML que chega a um ATS,
ao Google e a um leitor que não executa JavaScript sai **numa língua só**. Se o inglês só existe
depois do JS rodar, ele não existe exatamente para a audiência que o T-18 e o T-26 foram
construídos para alcançar — o que faria deste ticket um enfeite caro.

Então: **duas páginas construídas**, `/` e `/en/`, cada uma com o seu próprio espelho pré-renderizado
e o seu próprio `lang`, ligadas por `hreflang` recíproco, com `canonical` próprio em cada uma. O
controle na Plate navega entre elas. Isso não é preferência de arquitetura, é a única forma que
satisfaz o motivo pelo qual o espelho existe.

**E não é uma cópia do `index.html`.** O plugin do build emite a segunda página a partir da mesma
fonte, com o espelho renderizado no outro locale — uma fonte, dois artefatos. Um segundo
`prototype/en/index.html` no disco seria a segunda cópia que o `CLAUDE.md` inteiro existe para
impedir, e divergiria na primeira mudança.

## Geo está descartado, e por escrito

Foi perguntado e a resposta é não, por quatro razões que se somam:

1. **IP não é idioma.** Diz de onde veio o pacote. Um recrutador brasileiro em Londres, alguém com
   VPN, um americano contratando para o Brasil — todos recebem a língua errada.
2. **O sinal certo já existe.** `navigator.language` é o que a pessoa declarou no próprio
   navegador: preferência dita, não inferida, e de graça.
3. **Custaria um fornecedor.** O Pages é estático e não há servidor para ler IP, então geo exigiria
   um serviço de geo-IP em runtime. Pela ADR-0027 isso é uma decisão de LGPD e não de bundle, e
   endereço IP é dado pessoal — custo jurídico real por um sinal pior.
4. **Contradiz o objeto.** A linha do LinkedIn ficou inerte por várias sessões em vez de chutar uma
   URL. Adivinhar o idioma de alguém pelo IP é a mesma invenção, com outra roupa.

`navigator.language` **sugere e não redireciona.** Um redirect automático quebra link compartilhado
— alguém manda `nanj.in/en` para um contato e o contato cai no português — e confunde crawler.
A sugestão certa é apontar o controle, não trocar a página por baixo de quem chegou.

## Build

1. **`modules.ts` passa a carregar os dois idiomas.** A forma fica em aberto de propósito: um campo
   por string, ou um segundo módulo com a mesma forma e um teste que prova que as duas têm as
   mesmas chaves. O `modules.test.ts` é que decide — hoje ele falha se o espelho deixa de cobrir um
   campo, e a versão bilíngue dele deve falhar se um idioma ganha conteúdo que o outro não tem.
2. **`mirrorIntoPage` recebe o locale** e o plugin emite as duas páginas.
3. **`hreflang` recíproco + `canonical` próprio** em cada uma, e o `schema.org` de ontem ganha
   `inLanguage`.
4. **O controle.** Onde ele vive é a segunda decisão do Fernando — ver abaixo.
5. **A escolha é lembrada**, em `localStorage`, com o precedente do consentimento: perguntar de novo
   amanhã é insistência.

## As decisões que são dele

- **Inglês é a versão principal ou a segunda?** Decide qual página é `/`, e o `PRODUCT.md` não
  responde.
- **Onde vive o controle.** Um Pad? Uma linha na Plate? Isso adiciona um controle a um objeto que já
  tem nove sem legenda — é literalmente o T-30, e a solução errada aqui piora aquele ticket. Os dois
  deveriam ser resolvidos juntos, ou o controle de idioma deveria ser a primeira coisa que a legenda
  do T-30 rotula.
- **Qual inglês.** É a maior das três e não é engenharia. QUEM, CRITÉRIOS, as falas da Lyra e o texto
  do ECLIPSE estão registrados no `HANDOFF.md` sob *Blocked on Fernando* como texto meu e não dele.
  **Traduzir texto que ainda não é dele multiplica esse problema por dois** — e a tradução, uma vez
  feita, torna a reescrita duas vezes mais cara. Há um argumento forte para a voz dele vir antes
  deste ticket, e não depois.

## Done when

- `nanj.in/en/` serve o portfólio em inglês com o espelho no HTML estático, verificável por `curl`.
- As duas páginas se apontam por `hreflang` e cada uma tem o seu `canonical`.
- Um visitante em qualquer uma chega à outra sem saber a URL.
- `verify:site` afirma o espelho **nas duas**, e nenhum número dele está escrito em dois lugares.
- Nenhum conteúdo existe em dois arquivos.

## Traps

- **O `SCREEN_BUDGET` foi calculado contra português.** Inglês costuma ser 10-15% mais curto, o que é
  folga — mas as larguras de coluna do layout `index` e do `grid` são fixas, e "Trabalho" virando
  "Work" muda o que cabe. Medir, não supor.
- **O espelho e a Screen mudam no mesmo commit** (`CLAUDE.md`). Um idioma que chega só no canvas é
  metade de um bug.
- **O guard do `prerenderMirror` é `ctx.path === 'index.html'`**, e existe porque `prototype/` também
  tem `deck-fit/` e `style-test/`. Alargar esse guard sem cuidado põe um portfólio dentro de uma
  página de teste de fonte.
- **`public/CNAME` continua sendo o domínio.** Nada aqui pode fazer o build chegar sem ele.
- **Não inventar credencial em nenhuma língua.** O `PRODUCT.md` proíbe, e uma tradução é exatamente
  onde "growth, CRO e experiências digitais" vira, sem querer, um cargo que ele nunca teve.
- O `index.html` da raiz — a entrada dormente do `src/` — descreve o Fernando de um jeito diferente
  da página que sobe. Isso já está registrado como Open 9 e vai virar duas inconsistências em duas
  línguas se ninguém resolver antes.

## Source

Pedido direto do Fernando em 2026-09-02. A rota foi decidida na conversa: botão e não geotracking,
página construída e não toggle.
