# Como se trabalha neste projeto

**Escrito em 2026-09-07**, depois de duas semanas em que o quarto deixou de ser fundo e virou
navegação. Não é processo aspiracional: cada regra aqui tem um episódio atrás dela, e os episódios
estão em `docs/log/` e nos corpos dos commits.

O `CLAUDE.md` carrega as armadilhas que custam tempo toda vez. Este arquivo carrega a **ordem** —
que tipo de trabalho vem quando, e como cada tipo se verifica. `HANDOFF.md` carrega o estado.

---

## Os seis momentos

O trabalho aqui não é uma fila de tarefas, são seis tipos de momento, e o erro mais caro é fazer um
deles com a disciplina de outro. Modelar com a disciplina de decidir produz peças bonitas que não
respondem a nada; decidir com a disciplina de medir produz três rodadas de discussão sobre uma coisa
que uma medição resolveria em dez minutos.

### 1. Decidir

Uma decisão é fechada quando existe **uma frase que diz o que a coisa afirma**, não quando existe
uma preferência. O critério que funcionou, e que dá para reusar: *este objeto afirma alguma coisa ou
só decora?* Foi ele que decidiu o que fica em cima da credenza — vitrola, amplificador e a capa do
que está tocando ficaram; planta, caixas de som e velas saíram, cada uma com o motivo escrito.

Regras que saíram de erro:

- **Uma decisão por vez.** Uma lista de sete decisões apresentadas juntas não é decidida, é
  arquivada.
- **Construir e mostrar.** Descrição não fecha decisão estética neste projeto — nunca fechou uma.
  Quando a decisão é de olho, o custo de construir a versão errada é menor que o de descrevê-la.
- **Não montar menu.** Quando quem trabalha aqui levanta um problema, o mesmo turno traz a saída.
  Devolver o problema em forma de três opções transfere para o outro lado um trabalho que é de quem
  levantou.
- **Uma decisão tomada não se re-litiga.** Ela vira ADR se for cara de reverter, e a ADR diz **por
  que**, não o que.

### 2. Medir

**Toda queixa sobre a cena tem um número atrás.** Nenhuma exceção até agora, e o padrão é forte o
bastante para ser o primeiro reflexo: quando algo "parece errado", a pergunta é qual medida está
errada, não qual gosto diverge.

O que a medição já pegou, e cada um destes parecia uma questão de gosto antes de virar número:

| Sintoma | O que a medida disse |
|---|---|
| "a mobília parece jogada" | o tampo do Altar cobria 66% da largura do quarto — a mobília estava **exilada**, não jogada |
| "não tem nada na parede" | as capas nasceram 17 cm dentro da parede: a parede é uma caixa de .6 **centrada**, e a face está em `−SIDE_X + .3` |
| "o quarto está sem contraste" | os sessenta discos estavam dentro do móvel, oclusão total, nenhum chegou a um pixel |
| "a lombada não se lê" | dez pixels de largura no enquadramento da estação, contra cem de uma capa de frente |
| "o quarto está claro demais" | mediana de luminância 17, e **zero** pixels acima de 240: o teto era uma constante da cadeia de pós |

A ferramenta é `__unit.stats()` e a aritmética de projeção. O `rAF` **não roda** numa aba
automatizada, então nada que dependa de tempo pode ser medido por quem não está com a janela aberta:
ritmo de viagem, limiar do visor, abertura e quadros por segundo são medições de quem tem o browser
na frente, e isso tem que ser dito em vez de estimado.

### 3. Modelar

A ADR-0029 divide: **a Unidade é escrita em código, o cenário é modelado.** A razão é medida — um
Chesterfield feito de caixas deformadas chega perto e para, e o objeto é a prova de ofício, então a
fonte dele ser a fonte do repositório é metade do que ele prova.

A ordem que funcionou:

1. **Procurar antes de escrever.** Os 521 modelos do Poly Haven foram varridos e o resultado está em
   `public/mobilia/CREDITS.md`. Não existe lá lareira barroca, porta residencial nem vitrola — e é
   por isso que essas três são escritas. Procurar custa dois minutos e evita uma tarde.
2. **Se não existe, escrever a peça pelo perfil, não pelo volume.** O que faz pedra ler como pedra a
   seis unidades não é o material, é o **perfil**: soco, chanfro, filete, fuste, ovolo, ábaco — cada
   degrau é uma linha de luz separada. `LatheGeometry` faz os seis num torneado só.
3. **Peso é decisão, não consequência.** Oito peças do quarto somam 4,5 MB. Um único modelo baixado
   de banco genérico chega a 13 MB com texturas 4K — mais que dobra o quarto por um objeto. Reduzir
   é trabalho de rodada própria, e uma ferramenta de linha de comando **não** é dependência de
   runtime (a ADR-0004 proíbe a segunda, não a primeira).
4. **Geometria é barata, luz não.** Chanfro em toda aresta, mais objetos, mapas de rugosidade e
   normal: gastar à vontade. Luz nova, clearcoat, transmissão: só com medição. `docs/realism-budget.md`
   tem o modelo de custo.

### 4. Desenhar

Trabalho de canvas **não precisa da cena**. `deck-fit`, `light-fit` e `capa-fit` existem por isso:
canvas desenha síncrono, então a estrangulação de quadro é irrelevante e se vê a textura em
resolução cheia em vez de um disco de cem pixels numa parede.

Duas regras que a bancada das capas produziu:

- **Mostrar as opções no tamanho real, lado a lado.** A escolha de uma capa não se faz no grande: se
  faz na tira de cem pixels, que é o tamanho que ela tem na parede no enquadramento da estação.
- **Quando todas as opções falham do mesmo jeito, o defeito não é de composição.** Cinco desenhos
  chapados não pedem um sexto desenho: pedem uma camada de **material** — grão, retícula, desgaste,
  brilho oblíquo, sombra de vinco. "Todas estão flat" é uma informação sobre a matéria, não sobre a
  forma.

### 5. Marketing e alcance

A metade do projeto que não é a cena, e a que o objeto sozinho não resolve:

- **O espelho** (`src/content/mirror.ts`) é o portfólio em HTML real, pré-renderizado no build. Ele
  existe porque um rastreador recebia 465 caracteres legíveis; hoje recebe ~9.200. Qualquer coisa
  que muda o que a Tela mostra muda o espelho **no mesmo commit** — a regra está no `CLAUDE.md`.
- **Duas páginas de uma fonte só**: `/` e `/en/`, recíprocas em `hreflang`, com `llms.txt` para os
  dois. `verify:site` afirma isso a cada deploy.
- **A medição de audiência está parada** e não é trabalho de código: o contêiner do GTM nunca foi
  importado, as seis dimensões nunca foram registradas, e nada disso pode ser feito por quem escreve
  o código. Enquanto isso, qualquer versão nova sobe sem saber se alguém a usou.
- **Publicar é decisão do dono, não consequência de uma sessão.** O push para `lyra` constrói e
  publica em cerca de um minuto; nenhuma sessão empurra sem pedido.

### 6. Registrar

O registro não é burocracia aqui — é o que faz a próxima sessão não recomeçar do zero, o que já
aconteceu três vezes.

- **O raciocínio vai no corpo do commit**, não no `HANDOFF.md`. `git log --oneline` é barato e
  ninguém carrega um corpo de commit para o contexto.
- **O `HANDOFF.md` guarda estado e decisões.** A narrativa datada vai para `docs/log/<ano>-<mês>.md`.
- **Uma decisão cara de reverter vira ADR.** Se ela reverte outra, a ADR diz qual e por quê.
- **Se muda a anatomia do objeto, `CONTEXT.md` muda no mesmo commit.** O glossário desatualizado é
  pior que nenhum: dá a impressão de estar coberto.

---

## O que já deu certo, e é para repetir

- **Medir antes de mexer.** Quatro rodadas de otimização às cegas não resolveram nada; vinte minutos
  medindo numa aba real acharam a causa.
- **Usar a referência em vez de redesenhá-la.** Quatro rodadas procedurais foram perdidas onde
  recortar a imagem de referência resolveu em uma.
- **Repesar a direção quando chega referência nova**, em vez de somar à antiga. As fotos do acervo
  não pediam mais objetos na credenza: diziam que a exposição é na parede e a coleção é no móvel.
- **Bancadas de canvas** para tudo que é textura.
- **Um caminho de escrita por gesto.** Apontar para a lareira e apertar o pad de CRITÉRIOS terminam
  no mesmo estado porque os dois vão por `pressPad`. O visor opera pelo mesmo `screenHitEm` da Tela.
  Duas listas divergem; uma não pode.

## O que já deu errado, e é para não repetir

- **Resolver um problema que não foi dado.** Trocar uma peça que ninguém mandou trocar custa a
  rodada inteira e obriga a reverter. Aconteceu duas vezes no mesmo arquivo.
- **Objeto A em cima de objeto B.** Três ocorrências: o painel acústico cobrindo o retrato, o
  espelho cobrindo a baia de discos, a parede engolindo as capas. **Um objeto dentro de outro não dá
  erro nenhum — é geometria válida.** Antes de posicionar qualquer coisa numa parede, listar o que
  já está naquela parede e imprimir as extensões em coordenadas de mundo.
- **Parede de texto.** Duas vezes uma resposta longa produziu incompreensão em vez de decisão. Se a
  resposta não cabe em poucos parágrafos, ela não está pronta para ser dita.
- **Construir sobre geometria não verificada.** Uma pose de câmera medida contra objetos que estavam
  no lugar errado é uma pose errada, e o erro só aparece duas rodadas depois.

## As quatro verificações, e o que elas não pegam

```
npm run check          empacota os três pontos de entrada  (~1s)
npx vitest run         153 testes de conteúdo e espelho    (~3s)
npm run build:site     o site de verdade
npm run verify:site    afirma a estrutura do HTML publicado
```

**Nenhuma das quatro executa um quadro.** Um `Object.assign` com `position` passa nas quatro e mata
a cena inteira no primeiro quadro. A única verificação que pega erro de execução é abrir a página —
e é por isso que a rodada termina no browser, não no terminal.
