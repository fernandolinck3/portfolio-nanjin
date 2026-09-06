# ADR-0031 — A parede de capas e a vitrola: o plinto morre

**Data:** 2026-09-06 · **Status:** aceita
**Toca:** `prototype/room-decor.js`, `prototype/summon.js`, `prototype/works-art.js`,
`prototype/room-baroque.js`, `public/quarto/trilho.json`
**Reverte:** ADR-0017 (as obras sobem num plinto) — pela **segunda** vez, e desta vez por escrito

## Contexto

A ADR-0017 pôs as obras num plinto de pedra. O `focus.js` já a tinha revertido uma vez, num
comentário de cabeçalho e sem ADR nenhuma: a foto de um site numa Tela de 320×180 esticada 4,7×
é mingau, então o conteúdo do caso foi para o DOM. Ficou uma contradição de pé — o rito montava
uma peça acesa num pedestal e um painel `inset:0` com `blur(14px)` cobria a sala inteira um
quadro depois.

Em 2026-09-06 ele trouxe três referências (are.na, *projetos section*) e elas concordam numa
anatomia que o quarto não tinha:

- as capas ficam **na parede**, de frente, na altura do olho, em prateleiras de dois dedos;
- o móvel embaixo guarda o resto **de perfil** — é a coleção, não a exposição;
- no tampo fica a **vitrola**, com o disco girando.

E a ideia dele junto: *"os projetos podem ser discos em uma turntable que não é digital, onde o
usuário ao transicionar pra ver a capa em mãos, abre a página de case"*.

## Decisão

**O plinto morre.** Ruling dele, em uma linha, no mesmo dia: *"mata o plinto"*. A razão é de
composição e não de gosto — com a vitrola no tampo havia **dois pedestais dizendo a mesma coisa**
a dois metros um do outro, e numa estação só cabe um lugar onde a obra acontece.

**O aparato da Invocação sobrevive inteiro** e só troca de destino: a peça sobe, a luz de baixo
acende, os quarenta e quatro pontos montam, a Vigília caminha — sobre o prato da vitrola. Ele já
ficou sem chamador uma vez (achado em `2622806`, doze horas antes desta ADR); deixá-lo dormir
de novo por omissão seria a mesma falha duas vezes.

**As sete obras vão para a parede**, em duas prateleiras — quatro sobre três, centradas. Não é a
grade cheia da referência: são sete, e sete fingindo ser vinte é a mesma desonestidade que as
sessenta lombadas anônimas eram.

**A capa é quadrada e é uma folha nova.** `sheetFor` desenha a *peça* — pôster em retrato ou
captura em paisagem. `sleeveFor` desenha a **capa**: 12 polegadas, quadrada, uma silhueta por
índice, o número e o nome impressos. Quatro retratos e três paisagens numa grade não formam uma
parede de discos; formam quadros pendurados.

**A vitrola é analógica, e a oposição é o ponto.** A Unidade é uma CDJ — um controlador sem
disco. O acervo é o contrário exato: comanda-se no aparelho digital e o trabalho toca no
analógico. É um motivo para o quarto existir que não é decoração.

**O espelho dourado anda.** Medido: 2,9 × 5,0 centrado em `z = −2,68`, ocupando de −4,13 a
−1,23, com a credenza em −7,40..−1,40 e a estação olhando para −4,40. A borda dele caía no ponto
exato para onde a estação olha. Mesma classe do quinto painel acústico que estava por cima do
retrato — só que aqui ele não sai, **desce a parede** para `z = +0,80`, entre a ponta da credenza
e a pilha, a caminho da porta. Que é onde um espelho de corpo inteiro fica numa casa.

## Consequências

- `vitrolaPos()` mora em `room-decor.js` e é importada por `scene.js`, que a passa ao
  `createSummoning`. **Uma coordenada, um dono** — foi uma coordenada com dois donos que pôs os
  quarenta discos dentro do móvel.
- A pose `perto` do acervo foi remedida: as capas subiram de `y = −2,05` (a boca da cavidade)
  para `y = 0,05` (o centro das duas prateleiras), e `cabe` caiu de 3,0 para 1,9.
- O prato gira a 33⅓ — 3,49 rad/s — e **para quando o quarto está desligado**.
- **O que esta ADR não decide:** se o disco toca. O T-35 foi construído e revertido; uma vitrola
  girando em silêncio é uma promessa por cumprir, e ele disse *"não sei"*.
- **O que fica para o próximo commit:** a capa em mãos. Hoje o clique ainda abre o painel
  `inset:0`, que é o defeito que abriu esta conversa.
