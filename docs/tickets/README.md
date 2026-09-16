# Tickets

Split out of `SPEC.md`. T-15 to T-17 came later, out of a code review on 2026-08-29 — they are
**findings pinned to work that is already planned**, not new work. Each names what absorbs it, so
whoever picks that work up meets the finding instead of rediscovering it. One ticket is one `/implement` run with fresh context — each states its own
traps so it can be picked up without reading the whole thread.

## The graph

```
  A — the build                     B — the scene                  C — blocked on Fernando

  T-01 content source               T-07 shadows                   T-12 faceplate artwork
    ├── T-02 DOM truth layer        T-08 window + curtain          T-13 RACK contents
    │     ├── T-05 flat plate       T-09 vigil → rite/hour         T-14 publish the repo
    │     └── T-04 scene in src/    T-10 vault · pictures · light
    └── T-03 screen reads source    T-11 volvelle deck faces
          └── T-04                        │
                └── T-06 portrait         └── needs a high-res Calendarium Perpetuum
```

**O quarto navegável** — cadeia nova, 2026-09-05, saída de `docs/specs/quarto-navegavel.md`.
Track B, e a única corrente do board com quatro elos:

```
  T-32 o instrumento encolhe
    ├── T-33 a mobília se reagrupa
    └── T-34 estações, trilho e controles   (também bloqueado por T-30)
          └── T-35 som, e a viagem no tempo
```

`T-32` é a chave: enquanto o tampo do Altar cobrir 66% da largura do quarto, a mobília não tem onde
ficar e o trilho não tem por onde passar. `T-30` deixa de ser opcional — `T-34` dá um décimo
significado a um controle, e fazer isso sem a gravação na Plate é acrescentar o problema que o T-30
já contabiliza.

Track B is prototype work and lands in `prototype/scene.js`. It is **disjoint from track A** — the
two can run in parallel without touching the same files, right up until T-04 ports the scene across.
T-04 is the merge point and should not start while track B is mid-flight.

## Order

| # | Ticket | Track | Depends on | State |
|---|---|---|---|---|
| T-01 | [Content source](T-01-content-source.md) | A | — | **done** — `modules.ts`, 755 linhas, fonte única |
| T-02 | [DOM truth layer](T-02-dom-truth-layer.md) | A | T-01 | ready after T-01 |
| T-03 | [Screen reads the source](T-03-screen-reads-source.md) | A | T-01 | **done** — `PAGES` morreu; `render.js:16` importa `MODULES` |
| T-04 | [Scene into `src/`](T-04-scene-into-src.md) | A | T-02, T-03, track B quiet | later |
| T-05 | [Flat Plate](T-05-flat-plate.md) | A | — | **construído 2026-09-03** — a Tela em CSS; falta o olho dele e uma passada de polimento |
| T-06 | [Portrait recomposition](T-06-portrait.md) | A | T-04 | later |
| T-07 | [Shadows](T-07-shadows.md) | B | — | ready — biggest single win |
| T-08 | [The window and the curtains](T-08-window-and-curtains.md) | B | — | ready |
| T-09 | [Split the Vigil](T-09-split-the-vigil.md) | B | — | ready |
| T-10 | [Vault, pictures, chandelier](T-10-vault-pictures-chandelier.md) | B | T-07 | after T-07 |
| T-11 | [Volvelle deck faces](T-11-volvelle-decks.md) | B | — | blocked on a source image |
| T-12 | [Faceplate artwork](T-12-faceplate-artwork.md) | C | Fernando | blocked |
| T-13 | [RACK contents](T-13-rack-contents.md) | C | Fernando | blocked |
| T-14 | [Publish the repo](T-14-publish-the-repo.md) | C | Fernando | blocked |
| T-15 | [Canvas controls need a DOM twin](T-15-canvas-controls-need-a-dom-twin.md) | A | — | **done** — absorbed by T-18 |
| T-16 | [An index that does not fit must say so](T-16-an-index-that-does-not-fit-must-say-so.md) | B | — | **meio feito 2026-09-02** — o teto virou por layout (ADR-0028); falta o `+N` em `drawGrid`/`drawNodes` |
| T-17 | [PROJETOS never invites the SUN](T-17-projetos-never-invites-the-sun.md) | B | — | absorbed by the PROJETOS preview |
| T-18 | [The accessible mirror of the LCD](T-18-accessible-mirror.md) | A | — | **done** — branch `espelho` |
| T-19 | [Split the handoff](T-19-split-the-handoff.md) | A | — | done 2026-08-31 |
| T-21 | [Boot in 2–2.5s](T-21-boot-in-two-seconds.md) | B | — | **done 2026-09-01** — 5,90s → 2,42s |
| T-22 | [The Screen is five percent](T-22-the-screen-is-five-percent.md) | B | — | **done 2026-09-02** — dist 5.6 → 4.6, Screen 401 → 494px |
| T-23 | [Three holes in the overlay](T-23-the-overlay-has-three-holes.md) | A | T-18 merged | **done 2026-09-01** |
| T-24 | [CONTATO is last, and partly dead](T-24-contato-is-last-and-partly-dead.md) | A | — | ready |
| T-25 | [The documents describe another object](T-25-the-documents-describe-another-object.md) | A | — | **done 2026-09-01** — `ecf4807` |
| T-26 | [The robots still cannot read it](T-26-the-robots-still-cannot-read-it.md) | A | T-18 | **done 2026-09-01** — 465 → 5.745 chars |
| T-27 | [The k in Linck](T-27-the-k-in-linck.md) | B | — | **done 2026-09-01** — no ar |
| T-28 | [A form on CONTATO](T-28-a-form-on-contato.md) | C | Fernando | **done 2026-09-01** — ADR-0027 + formulário |
| T-29 | [O Preview do GTM não conecta](T-29-o-preview-do-gtm-nao-conecta.md) | A | — | precisa do sintoma exato |
| T-30 | [Nine controls and no legend](T-30-the-object-has-no-legend.md) | B | — | ready — 11 dos 15 pontos perdidos na crítica |
| T-31 | [O portfólio em inglês](T-31-o-portfolio-em-ingles.md) | A | — | **done 2026-09-02** — `/` e `/en/`, indexáveis |
| T-32 | [O instrumento encolhe](T-32-the-instrument-shrinks.md) | B | — | **done** — `K = .46`; a Tela segue em 496 px |
| T-33 | [A mobília se reagrupa](T-33-the-furniture-regroups.md) | B | T-32 | **done** — quatro grupos, coordenadas medidas |
| T-34 | [O quarto vira a navegação](T-34-the-room-becomes-the-navigation.md) | B | T-30 | **meio feito** — 1, 2, 3 e 6 em `?trilho`; 4 e 5 atrás do T-30. Desde 05/09 as estações também *fazem* coisas: ver a seção abaixo |
| T-35 | [O objeto faz som](T-35-the-object-makes-a-sound.md) | B | T-30 | **construído e revertido** — `a7850e2`, um `git revert` de volta |
| T-36 | [Contact reliability](T-36-contact-reliability.md) | A | — | done locally — TASK-004; independent PASS, 166 tests, mocked browser checks; not published |
| T-37 | [Mobile usability](T-37-mobile-usability.md) | A | T-36 | done locally — TASK-005; independent PASS, 170 tests, mobile browser checks; not published |
| T-38 | [Room boundary and mobile performance](T-38-room-boundary-and-mobile-performance.md) | A | — | room boundary fixed locally; phone lag awaiting reproduction |
| T-39 | [Default display duplication](T-39-default-display-duplication.md) | A | — | in progress — TASK-008; room-only auxiliary display |

## O que foi construído depois do board (05–06/09)

Este board parou em 05/09 12:04 e o trabalho não. **Dois dias e vinte e dois commits não têm
ticket**, e não é esquecimento: eles saíram de medição em sessão contra a cena, não de uma fila.
Ficam registrados aqui como *feito* para que ninguém os redescubra, com o diário em
`docs/log/2026-09.md` e o raciocínio nos corpos dos commits.

| O que | Onde | Commits |
|---|---|---|
| A estação do retrato: o painel que cobria a pintura, a pose fechada, o olhar pelo ponteiro | `portrait.js`, `room-baroque.js` | `f92ee1c`, `004404b` |
| A Lyra deixa de ser pintura e vira mostrador, com `REACTION_FRAMES` — a que PROJETOS desenha | `portrait.js` | `8ad1a31`, `fab64bc`, `eecb9fe`, `ef486c0` |
| O oráculo de QUEM: quatro perguntas, a Vigília escolhe a resposta, a bio chega antes | `portrait.js`, `modules.ts` | `d081490`, `7cc86bd`, `838c732` |
| A matéria do quarto: a escala de mundo na parede, o bloom opcional, a lareira, a porta, o relógio, o vaso, e o PBR inteiro dos modelos | `room-baroque.js`, `room-mobilia.js`, `post.js` | `774e301`, `831549c`, `9e9c726`, `c490850` |
| A luz: o teto do grade e as duas chamas de cor chapada | `post.js`, `chama.js` | `4063a93`, `0c5bfd2` |
| O acervo: a credenza vira móvel, os discos saem de dentro dela, as sete obras entram e viram capa | `room-decor.js`, `scene.js` | `75b91ec`, `293fd7f`, `e79ca07` |
| A Invocação passa a acontecer — o voo do `focus` vira o relógio do rito | `summon.js`, `focus.js`, `scene.js` | `2622806` |

**O que essa fila deixou em aberto**, e que ainda não é ticket:

- `drawWorks` continua sem chamador. Latente de propósito — a peça carrega o próprio número e
  nome impressos, e o caso fica no painel em DOM — mas é código vivo que ninguém executa.
- A pose `perto` do acervo e o realce da capa **nunca foram vistos por ele**. Foram medidos numa
  aba automatizada, onde o `rAF` não roda.
- O acervo é a terceira estação a ganhar o par *estação → perto*, depois do retrato. Se uma quarta
  ganhar, isso vira uma regra e devia estar escrito num lugar só.

O **T-35** foi construído e tirado do ar de propósito, em `a7850e2`: seis vozes sintetizadas, oito
passos, um toque toca e segurar grava, o padrão nos pads. A premissa se sustentou; o acabamento
não, e código desligado atrás de um `if` apodrece. Um `git revert` daquele commit o traz de volta.
Falta, quando voltar, a viagem cair no tempo forte — e isso depende do trilho contínuo, ou seja do
T-30, como tudo nesta ponta.

O que sobra do **T-34** é a metade que o T-30 segura: a leitura na Plate plana (item 4) e a roda
do sol como trilho contínuo (item 5). O estado, o anel, o pad que leva e a ECLIPSE ao chegar já
estão em `?trilho` — endereço de bancada, porque a Tela de 496 px cai para perto de 170 px a seis
unidades de distância e é a Plate plana que responde a isso.

## Where T-21 to T-25 came from

A two-axis code review and an Impeccable critique, both run on 2026-09-01 against the shipped site.
They are **findings with a measurement attached**, not new ideas — each names the number that
justifies it so nobody re-argues it from taste. The critique scored the object 25/40 and its P0
(the portfolio serves 214 characters of text to a crawler) is already answered by T-18 on `espelho`,
which is why no ticket here repeats it.

## Standing rules for every ticket

- Read `CONTEXT.md` for the vocabulary before writing a line. Use the Unit's words.
- **Anything that changes what the Screen displays changes the mirror in the same commit.** Put the
  content in `src/content/modules.ts` and both read it; see `CLAUDE.md` and T-18.
- `SPEC.md §7` lists four decisions that look like bugs and are not. Do not fix them back.
- Verify at render size in a real browser, not in a headless still and not in the source file.
- If a ticket changes the Unit's anatomy, update `CONTEXT.md` in the same commit.
