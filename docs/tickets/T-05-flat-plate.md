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
