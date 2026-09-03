# T-05 — The Flat Plate

**Track A · depends on T-02**

## Goal

The Unit rendered as a printed silkscreen in CSS from the DOM truth layer, served where the 3D cannot
be carried: no WebGL, low power, `prefers-reduced-motion`.

## Why

ADR-0008. It is a designed deliverable with its own design pass — not a fallback, not a degraded
screenshot. It is also what crawlers and link previews see, so it is the version most recruiters
encounter before they ever load the 3D.

## Build

The same six Modules, the same six Pads, the same Crossfader — laid out as the Plate is laid out,
drawn in CSS. Print colours only, no relief, no attempt to fake the metal. It should read as the
object's technical drawing rather than as a photograph of it.

Selection: no WebGL context, `prefers-reduced-motion: reduce`, low `deviceMemory` /
`hardwareConcurrency`, or a genuine context loss at runtime.

## Done when

- Every Module reads correctly with JavaScript's 3D path never loading.
- It looks deliberate. Show it to Fernando as a render, not as a description — descriptions do not
  land, and this one is a design decision he will have opinions about.
- Switching to it at runtime after context loss does not lose the live Module or the Vigil state.

## Traps

- `prefers-reduced-motion` means reduce motion, not remove the portfolio. The Flat Plate is the good
  outcome for that user, so design it for them, not around them.

## Comments

**2026-09-01 — o ticket ganhou um motivo urgente e um piso por baixo dele.**

PageSpeed devolve `Error!` em todas as métricas: *"O Lighthouse não carregou de maneira
confiável o URL solicitado, porque a página parou de responder."* A causa foi encontrada e não
é lentidão. O Lighthouse roda sem GPU, o Chrome cai para um rasterizador por software, e
`prewarmStep` faz um `post.render()` inteiro por marca de pré-aquecimento, uma vez por frame
(`scene.js:5147` → `:4981`). Cada um leva segundos em vez de um milissegundo, o processo de
renderização para de responder e o navegador mata a página — `PAGE_HUNG`.

Não é um problema do robô. Quem está com aceleração de hardware desligada, ou num Android
velho sem driver utilizável, via a mesma aba travada e o mesmo diálogo perguntando se queria
forçar o fechamento. **Não havia nenhuma verificação de WebGL no código.**

Já existe um piso, e ele não é este ticket. `prototype/boot.js` decide antes de importar
`scene.js`; `capability.js` faz a checagem; `flat.js` tira o recorte do espelho, dá uma coluna
de leitura ao texto e monta o formulário. `?flat` força isso numa máquina que funciona.

**O que continua sendo o T-05:** o piso mostra o conteúdo em tipo simples e diz numa linha que
o objeto não carregou. Ele deliberadamente **não** imita o Unit. O `SPEC.md` §6 promete um Flat
Plate *desenhado* — "a designed deliverable with its own pass, not a degraded screenshot" — e
isso continua por fazer. Quando for feito, ele substitui a apresentação do `flat.js` e mantém a
detecção, que é infraestrutura e não desenho.

---

## Construído em 2026-09-03, e esperando o olho dele

O piso virou a Tela. `prototype/flat-skin.js` veste a marcação do espelho com a
paleta e as faces de `render.js`, e a LYRA entra com os dez quadros de reação e a
respiração de `reaction.js`.

**O ticket pedia a Plate; o que foi construído é a Screen.** A mudança é dele, e o
argumento que a sustenta: a Plate é onde moram os controles, e uma tecla desenhada
em CSS que não toca é ornamento — o objeto inteiro é construído contra isso. A
Screen é onde mora o conteúdo, que é o que uma página de texto precisa. A
referência que ele trouxe (basement.studio) usa estética de terminal e não de
painel, o que sustenta a mesma escolha.

**Como olhar:** `?flat` na URL. É a única forma sem desligar aceleração gráfica.

### O que já está resolvido e não deve ser refeito

- **A distinção dos cinco layouts vem do espelho**, por `data-mirror-layout` e por
  cinco ganchos de campo. Redesenhar isso no CSS criaria a segunda fonte.
- **Caixa de frase por CSS**, não por segunda string: o Módulo continua se chamando
  `CRITÉRIOS` no DOM, e só o desenho o mostra como *Critérios*. Ver `render.js:621`,
  que já tinha registrado por que blackletter em caixa alta não se lê.
- **Emissão, não grão.** Halo proporcional ao peso do texto, apertado no Silkscreen
  porque ele é bitmap. Varredura a 6%: a 16% vira textura.
- **As falas da LYRA ficam fora do espelho.** Interface em personagem não é conteúdo
  de portfólio, e num HTML que um ATS lê elas seriam ruído.

### O que sobrou para a passada de polimento

Ele aprovou como está e pediu para polir depois. Sem lista fechada — o que se sabe
hoje é que ninguém olhou em tela ainda, nem em telefone, e que a dose de três coisas
é palpite e não medição: a opacidade da varredura, a largura do halo por peso, e a
profundidade da vinheta.

**Depois disto vem a URL própria por projeto.** Era o motivo de tudo isto: uma página
de projeto que parece desenhada muda o cálculo sobre conteúdo fino, que era o único
argumento contra as sete páginas.
