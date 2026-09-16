# ADR-0031 — A parede de capas e a vitrola: o plinto morre

**Data:** 2026-09-06 · **Status:** aceita, emendada em 2026-09-07
**Toca:** `prototype/room-decor.js`, `prototype/summon.js`, `prototype/works-art.js`,
`prototype/sleeve-art.js`, `prototype/room-baroque.js`, `public/quarto/trilho.json`
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

**Na decisão inicial, o aparato da Invocação sobrevive inteiro** e só troca de destino: a peça sobe, a luz de baixo
acende, os quarenta e quatro pontos montam, a Vigília caminha — sobre o prato da vitrola. Ele já
ficou sem chamador uma vez (achado em `2622806`, doze horas antes desta ADR); deixá-lo dormir
de novo por omissão seria a mesma falha duas vezes. A emenda visual abaixo substitui esta parte
depois de observá-la em movimento na cena real.

**As sete obras vão para a parede**, em duas prateleiras — quatro sobre três, centradas. Não é a
grade cheia da referência: são sete, e sete fingindo ser vinte é a mesma desonestidade que as
sessenta lombadas anônimas eram.

**A capa é quadrada e é uma folha nova.** `sheetFor` desenha a *peça* — pôster em retrato ou
captura em paisagem. `sleeveFor` desenha a **capa**: 12 polegadas, quadrada, com a assinatura
completa do cliente sempre que ela sobreviver à distância. A congruência vem da mesma matéria,
da mesma tinta dourada e da mesma caixa óptica nas sete; a diferença vem da marca real de cada
trabalho. Ícone sozinho é fallback, não sistema. Portfólio e Miscelânea recebem lettering porque
não têm uma marca de cliente. Números, categorias e recortes da página saem.

**A credenza fecha e as sessenta lombadas saem.** Ele não reconheceu uma coleção: reconheceu
retângulos coloridos. Quatro frentes almofadadas, ferragens e pés torneados dão ao móvel o perfil
do mockup aprovado sem afirmar sessenta álbuns que não existem. As sete capas e a vitrola já dizem
que aquilo é um acervo.

**A arandela que ocupava a capa 007 sai.** Não anda para outro ponto arbitrário da mesma grade: o
globo no chão já ilumina essa parede de baixo, como nas referências, e a exposição fica livre.

**A vitrola é analógica, e a oposição é o ponto.** A Unidade é uma CDJ — um controlador sem
disco. O acervo é o contrário exato: comanda-se no aparelho digital e o trabalho toca no
analógico. É um motivo para o quarto existir que não é decoração.

### Emenda visual — 2026-09-07

**A Invocação deixa de participar da abertura.** Na cena real, o pôster intermediário não lia
como um trabalho subindo da vitrola: em Miscelânea, o crescente vermelho aparecia como um card
estranho atravessando a capa escolhida. Além disso, o clique na parede enquadrava a capa e o
clique no visor enquadrava esse pôster — dois gestos iguais com duas transições diferentes.

Os dois caminhos agora resolvem a obra para **a mesma capa na parede**, fazem o mesmo voo e
entregam o mesmo case ao DOM. A Vigília não é tomada. A peça, os motes e a luz da antiga
Invocação deixam de ser construídos pela cena; `summon.js` fica apenas como registro histórico.

**A capa encostada sai.** A seleção Graecus reaparecia sobre o tampo e parecia um oitavo vinil
com outra função. Parede e visor já expressam o mesmo estado; uma terceira cópia confundia.

**A credenza escrita sai do Acervo.** Ela é substituída pelo modelo CC0 `Modern Wooden Cabinet`,
da Poly Haven: madeira com PBR, portas curvas ripadas e pés metálicos. O modelo é ajustado à
pegada existente e preserva a altura do tampo, portanto vitrola, capas, câmera e hit areas não
mudam. Pires, chaves e cartas procedurais acrescentados para disfarçar a caixa também saem.

**O espelho dourado anda.** Medido: 2,9 × 5,0 centrado em `z = −2,68`, ocupando de −4,13 a
−1,23, com a credenza em −7,40..−1,40 e a estação olhando para −4,40. A borda dele caía no ponto
exato para onde a estação olha. Mesma classe do quinto painel acústico que estava por cima do
retrato — só que aqui ele não sai, **desce a parede** para `z = +0,80`, entre a ponta da credenza
e a pilha, a caminho da porta. Que é onde um espelho de corpo inteiro fica numa casa.

### Emenda de matéria — 2026-09-07

**O quadrado branco sobre a vitrola era parte do arquivo.** O disco do modelo é um quad com
uma fotografia circular sobre fundo branco no atlas JPEG. Não havia outro cilindro para remover:
o próprio fundo da fotografia estava sendo renderizado, achatado pela perspectiva. O atlas passa
a PNG com alfa só nesse recorte e o material usa `MASK`; a malha e o disco original permanecem.

**O oval claro que ainda cruzava o tampo vinha do visor.** A variante `relogio` acrescenta uma
coroa de latão acima da moldura e, sobreposta à cena no canto, ela caía exatamente atrás da
vitrola. O comentário e o desenho já definiam `tela` como padrão, mas a atribuição ainda dizia
`relogio`. O padrão passa a `tela`; as variantes continuam disponíveis por endereço e o visor
mantém a mesma interação.

**O tampo ganha duas peças laterais e perde o globo escrito.** As três referências novas repetem
a mesma hierarquia: vitrola dominante, vegetação pequena e uma fonte de luz lateral. Entram os
modelos CC0 `Potted Plant 04` e `Industrial Pipe Lamp`, ambos da Poly Haven. A lâmpada continua
obedecendo à Vigília, mas sua fonte agora está dentro de um objeto visível. Não entram caixas,
amplificador, pilhas anônimas nem outra capa; seriam repetição, não vida.

## Consequências

- A altura do tampo continua pertencendo a `room-decor.js`; trocar a forma visual do móvel não
  desloca a vitrola nem as prateleiras.
- A pose `perto` do acervo foi remedida: as capas subiram de `y = −2,05` (a boca da cavidade)
  para `y = 0,05` (o centro das duas prateleiras), e `cabe` caiu de 3,0 para 1,9.
- `sleeve-art.js` é a fonte compartilhada entre a textura da cena e a bancada `capa-fit`; a prova
  a cem pixels e o que chega à parede não podem divergir.
- A vitrola modelada chegou como malha única: cobrir o disco dela com um segundo cilindro
  produziu clipping visível, então o importado fica estático até a malha ser separada de
  verdade. A vitrola procedural de fallback sai junto com a regra nova de só usar modelos.
  O fundo branco do quad original é transparência de material, não uma segunda malha.
- **O que esta ADR não decide:** se o disco toca. O T-35 foi construído e revertido; uma vitrola
  girando em silêncio é uma promessa por cumprir, e ele disse *"não sei"*.
- A “capa em mãos” é o voo até a própria capa. O case continua no DOM porque é ali que texto e
  imagens chegam em resolução legível; não há outra arte 3D no meio do caminho.
