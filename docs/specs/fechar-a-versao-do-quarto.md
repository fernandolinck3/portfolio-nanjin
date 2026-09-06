# Fechar a versão do quarto

**2026-09-06 · a ordem para levar o quarto navegável de `?trilho` até `/`**

Isto é o irmão de `quarto-navegavel.md`: aquele desenhou o quarto, este fecha a versão. Cada fase
diz **o que**, **quem** — porque metade disto só ele pode fazer — e **como se verifica**.

**A leitura de "a nova versão":** a versão em que o visitante que digita `nanj.in` recebe o quarto
como navegação, e não o Altar sozinho num fundo preto. Hoje `ROOM_K` começa em 0 e a viagem vive em
`?trilho`, um endereço de bancada. Se a versão que ele quer fechar for outra, esta ordem muda.

---

## O que descobri antes de ordenar (06/09)

**O T-05 saiu do caminho crítico.** `pintarVisor` (`scene.js:6348`) faz
`visorCtx.drawImage(screenBuffer, 0, 0)` — a Tela inteira, o mesmo conteúdo, no canto, quando a
Tela no mundo cai abaixo de `LIMIAR_VISOR`. **O item 4 do T-34 está feito**, pelo visor e não pela
Plate plana. Quatro documentos ainda dizem que não: o board, o bloco do HANDOFF, o cabeçalho do
`trilho.js` e o comentário do gate em `scene.js:7200`. Corrigir isso é a primeira tarefa da Fase 1,
e é barata.

**A branch `memoria` está morta.** `git diff lyra memoria` dá 13.488 deleções contra 930 inserções:
é a história pré-reescrita de 02/09, cujo conteúdo já está em `lyra` com outros shas. Não é fila,
não entra no plano, e pode ser apagada quando ele quiser.

---

## Fase 0 — ele olha (hoje, 15 minutos, e nada começa antes)

Três dias de quarto nunca foram vistos por um humano a 60 quadros. **O `rAF` não roda numa aba
automatizada**, então tudo que é ritmo — a viagem entre estações, o instante em que o visor acende,
a chegada do rito — está construído por aritmética e nunca observado.

```
npm run prototype        e abrir no Chrome dele:
http://localhost:5174/?trilho
```

**Quem:** ele. **O que responder olhando** (e são perguntas fechadas de propósito):

1. Apertar o pad 4 e logo o 5 lê como **varredura** ou como dois arremessos?
2. O visor aparece **na hora certa** ou aparece atrasado/adiantado demais?
3. Numa estação, o que dá vontade de fazer? (esta é a pergunta da Fase 1, e ela vale mais vinda
   dele do que de mim)
4. A pose de repouso — `tilt 72 · dist 11`, três estações no quadro — é de onde se comanda?

Sem isso, as fases seguintes são chute com sotaque de medição.

---

## Fase 1 — a decisão que bloqueia a promoção: o que o visitante toca numa estação

**Este é o problema, e ele não é o T-30.** O comentário do próprio gate diz: numa estação a
Unidade sai do quadro — a origem projeta em `y = −1068` num viewport de 741 — e **nenhum pad é
clicável, e o gesto de voltar não tem por onde ser feito com o mouse**. O `?trilho` contorna isso
forçando `document.body.dataset.debug = '1'` e destapando a `.hud`: hoje **a bancada é o gesto de
voltar**. Um visitante em `/` chegaria num lugar sem controle nenhum ao alcance.

E o item 5 do T-34 não resolve: a roda do sol mora na Plate, que está fora do quadro no mesmo
instante. **Os seis itens do T-34, como estão escritos, não contêm a affordance que a promoção
precisa.**

Três saídas, e este projeto decide olhando:

| | O que é | Custo | Risco |
|---|---|---|---|
| **A. O visor vira controle** | tirar `pointer-events:none` do `#visor` e mandar o clique pelo **mesmo `screenHit`** que a Tela no mundo usa | baixo — o buffer já é o mesmo | virar painel de UI, que é o que a crítica proíbe |
| **B. A câmera nunca solta a Unidade** | reenquadrar as estações para a Plate ficar sempre numa borda | médio, e mexe nas seis poses | mata o enquadramento de estação que o T-34 comprou |
| **C. Affordance nova na tela** | um controle desenhado no canto | baixo | é literalmente o chrome que o T-30 proíbe em três linhas |

**Recomendo A**, e a razão é que ela não cria objeto novo: o visor **já é a Tela**, ele já foi
escolhido por ele entre três formas, e a Tela já tem alvos clicáveis. O que torna A defensável e C
proibido é exatamente isso — um é a mesma superfície, o outro é uma superfície a mais.

**A armadilha, e ela é a lição mais cara deste repositório:** o clique no visor tem que passar pelo
`screenHit`, não por uma segunda lista de alvos. *Duas listas divergem, uma não pode.*

**Quem:** eu constrói, ele julga na tela.

**Feito quando:** de qualquer estação, com o mouse e sem `?debug`, dá para trocar de Módulo, abrir
uma linha e voltar ao Altar. E os quatro comandos passam.

---

## Fase 2 — T-30, pelas rotas que não esperam por ele

O T-30 é o maior bloco solto do board — **onze dos quinze pontos** perdidos na crítica — e o T-34
o declara pré-requisito. Mas ele tem quatro rotas e elas não são iguais em dependência:

- **Rota 1, gravar a Plate.** A mais nativa do objeto, e a que **pinta por cima de arte que o T-12
  vai substituir** — e o T-12 está bloqueado nele há semanas. Fica atrás do T-12, não no caminho
  crítico.
- **Rota 3, a primeira volta ensina.** Responde à falha real do Jordan — ele gira uma roda em QUEM,
  que não tem itens, e aprende que os controles são decorativos — **sem uma palavra nova**. É a
  mais barata e a que não depende de ninguém.
- **Rota 4, os atalhos no espelho.** Doze atalhos reais e nenhum anunciado; o espelho é o lugar
  honesto, e não custa nada ao objeto.
- **Rota 2, rótulo na aproximação.** Meio-termo; entra se 3 e 4 não fecharem o *"o que as duas
  rodas fazem, sem girá-las"*.

**Fazer 3 e 4 agora, deixar 1 atrás do T-12.** Isso destrava a parte do T-34 que o T-30 segura sem
pedir nada a ele.

**Quem:** eu. **Feito quando:** girar qualquer roda pela primeira vez produz resposta visível; os
atalhos existem em algum lugar legível; a composição em repouso não ficou mais cheia.

---

## Fase 3 — o resto do T-34 (item 5)

A roda do sol deixa de rolar o corpo do texto e passa a percorrer o trilho de forma contínua; a
rolagem vai para a superfície de leitura. É **um** item, e ele só é defensável depois da Fase 2 —
dar um décimo significado a um controle mudo é acrescentar o problema que o T-30 contabiliza.

**Quem:** eu constrói, ele julga o ritmo (o `rAF` de novo).

---

## Fase 4 — a promoção: `?trilho` deixa de ser bancada

Aqui a versão vira a versão. É a fase com mais decisões de produto e a menos escrita hoje:

1. **`ROOM_K` liga para quem chega em `/`** — e com ele entram **4,5 MB de `public/mobilia`**. O
   boot em 2,42s custou uma sessão inteira (T-21); o quarto tem que carregar **depois** do primeiro
   quadro utilizável, nunca antes, como o `trilho.json` já faz.
2. **A abertura.** A intro pousa no Altar hoje. Ela continua igual, e a viagem é algo que se
   descobre? Ou a abertura mostra o quarto e recolhe? É decisão dele, e é a primeira impressão
   inteira.
3. **O orçamento de quadro, medido.** O laço de luz é **58% do quadro** com doze luzes de quinze, e
   o custo do caminho com o quarto ligado **nunca foi medido a quadro real** — não dá para medir
   aqui. Um número dele num Chrome de verdade decide se a Fase 4 precisa de uma passada de corte.
4. **O `?flat` e o caminho sem GPU** continuam recebendo a versão sem quarto, e isso está certo.

**Quem:** eu construo 1 e 4; 2 é dele; 3 é uma medição que só ele pode tirar.

---

## Fase 5 — o celular

Nunca visto: o consent, e o quarto num telefone. O quadro virado é design deliberado para *ler*;
uma **estação** num viewport de 402 px é outra conversa — o `PerspectiveCamera(38)` tem fov
vertical e nada neste projeto compensa aspecto, que é exatamente o defeito que cortou as perguntas
do oráculo pelas duas pontas em 05/09. **A mesma classe de bug vai aparecer nas seis estações.**

**Quem:** ele segura o telefone, eu conserto. **Feito quando:** as seis estações enquadram em
retrato e a barra de consent foi vista uma vez numa janela anônima.

---

## Fase 6 — o conteúdo é dele, e roda em paralelo desde hoje

Tecnicamente nada disto bloqueia; para "finalizada", tudo bloqueia. **Uma versão cujas afirmações
sobre ele foram escritas por outra pessoa não está pronta, por melhor que o quarto fique.**

- **QUEM, CRITÉRIOS, as falas da Lyra e o texto da ECLIPSE** ainda são meus. Honestos, e não a voz
  dele.
- **T-13 — HABILIDADES lista influências, não ferramentas.** Bloqueado há mais de quatro sessões.
- **T-12 — a arte da Plate**, que também é o que destrava a rota 1 do T-30.
- **PROJETOS**: falta imagem no caso do próprio portfólio, e a preview do SOL (item 5 do brief).

**Quem:** ele escreve, eu monto. É a fase mais longa em calendário e a mais curta em trabalho meu —
por isso começa hoje e corre por fora das outras.

---

## Fase 7 — publicar, que é decisão dele

O push para `lyra` constrói e publica em ~1 minuto. Duas coisas antes:

1. **O GTM nunca foi importado** — sem isso a versão nova sobe sem medição nenhuma, e não dá para
   saber se alguém viajou pelo quarto.
2. **O histórico público** ainda carrega as notas privadas. Se a versão nova é a que vai para
   recrutador, essa janela é agora: zero forks na hora da separação, e reescrever depois é pior.

---

## O que este plano deliberadamente não faz

- **Não mexe no T-02/T-04** (`src/` dono do DOM, a cena portada). Reorganização de código no meio
  de uma versão é como se perde uma versão.
- **Não traz o som de volta** (T-35). Ele foi revertido por acabamento, e a viagem cair no tempo
  forte depende da Fase 3.
- **Não persegue o `www`**, o T-11 (espera imagem) nem o T-07 (sombras) — sombras foram medidas em
  06/09 e **deixaram o quadro mais escuro sem ganhar drama**.

## As constantes que valem em todas as fases

- **O `rAF` não roda na minha aba.** Todo número de ritmo e de quadro é dele. Eu dirijo a cena com
  `__unit.step(t)` + `__unit.render()` e leio estado com `__unit.nav()`.
- **Construir e mostrar.** Descrição não decide nada aqui; três sessões provaram isso.
- **Uma variável, um caminho.** Qualquer controle novo entra pelo `pressPad`/`screenHit` ou não
  entra.
- **`npm run check`, `npx vitest run`, `npm run build:site`, `npm run verify:site`** antes de
  entregar qualquer fase.
