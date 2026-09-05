# T-33 — A mobília deixa as paredes e forma grupos

**Track B · blocked by: T-32 · `prototype/room-mobilia.js` · spec: `docs/specs/quarto-navegavel.md`**

Status: blocked

## Goal

As oito peças de `room-mobilia.js` saem da faixa rente às paredes e passam a formar quatro grupos
com razão de estar: o estar virado para o Altar, o canto da lareira, o canto de leitura e a
entrada. O plinto sai de junto do Altar e vai para o acervo de discos.

## Why

Hoje as coordenadas não são uma composição, são o que sobrou: o tampo do Altar proibia o meio do
quarto e a mobília ficou onde cabia. Com T-32 a pegada proibida cai para `|x| < 3,6 · |z| < 2,2` e
o meio abre — este ticket é gastar esse chão.

Agrupar é o que conserta "parece jogado". Uma poltrona sozinha encarando a parede lê como objeto
posto; duas poltronas e um sofá em L virados para o fogo leem como um lugar onde alguém senta.

## Build

Editar a tabela `MOBILIA`. As posições propostas, todas conferidas contra a nova pegada:

| Peça | Hoje | Fica | Grupo |
|---|---|---|---|
| `WoodenChair_01` | `0,9 · 5,7` | `0,9 · 3,4` | Altar |
| `Sofa_01` | `−4,0 · 6,6` | `−5,2 · 4,8` | Estar |
| `sofa_03` | `5,2 · 6,2` | `7,4 · 1,8` | Lareira |
| `ArmChair_01` | `9,0 · 0,1` | `8,2 · −3,4` | Lareira |
| `GreenChair_01` | `−9,1 · 5,2` | `8,0 · 5,4` | Leitura |
| `Shelf_01` | `11,0 · 3,6` | inalterado | Leitura |
| `ClassicConsole_01` | `−10,5 · 1,4` | `−10,5 · 6,8` | Porta |
| `GothicCabinet_01` | `−9,5 · −10,1` | inalterado | Fundo |
| Plinto (`PED`, `summon.js`) | `5,6 · −4,2` | `−7,6 · −6,4` | Acervo |

Mais: o tapete do Altar encolhe com `k` (T-32 faz isso), e um segundo tapete pequeno marca o canto
da lareira. Uma luminária de mesa na estante, emissiva, sem luz nova.

## Traps

- **Conferir a pegada antes de cada coordenada.** É o erro que já custou uma rodada: a poltrona em
  `(7,2 · −1,4)` não estava escura, estava embaixo da mesa.
- **O que já está na sala tem dono.** A baia de discos ocupa `z −7,4..−1,4` na parede esquerda; a
  lareira vai de `z −2,75..+0,75` na direita; a porta de `z +3,5..+6,2` à esquerda; o espelho fica
  sobre a baia. Nada disto é de `room-mobilia.js` e nada disto se move aqui.
- **A câmera de `?sala` corta perto de `z = +7`.** Móvel além disso é peso baixado à toa.
- **As sombras de contato** são geradas a partir da caixa envolvente de cada peça e seguem sozinhas.

## Done when

- Em `?sala`, cada peça pertence visivelmente a um grupo e nenhuma está sob o tampo.
- `__unit.setRoom(false)` continua apagando as nove peças (a correção em `mobilia.pronto`).
- Os quatro comandos de verificação passam.
