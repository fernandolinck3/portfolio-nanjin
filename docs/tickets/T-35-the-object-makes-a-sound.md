# T-35 — O objeto faz som, e a viagem cai no tempo

**Track B · blocked by: T-34 · spec: `docs/specs/quarto-navegavel.md`**

Status: blocked

## Goal

Os seis pads viram um sequenciador de oito passos, sintetizado, sem arquivos. O quarto responde no
tempo. E a viagem entre estações passa a ser **quantizada**: a câmera larga na hora e chega no
tempo.

## Why

Um quarto só de navegação com propósito é um menu com paredes. O que faz alguém ficar é a parte que
não serve para nada — e num portfólio em forma de CDJ, a parte que não serve para nada é usar o
objeto **como instrumento**. É a única ideia desta lista que fecha a piada.

A quantização é o que junta as duas metades: com a roda do sol como trilho (T-34) e um andamento
definido, trocar de módulo deixa de ser um corte e vira uma virada. Navegação e brincadeira passam
a ser a mesma coisa.

## Build

- **Seis vozes** em Web Audio: um bumbo, um estalo, dois tons, dois ruídos filtrados. Osciladores e
  envelopes — **zero bytes de asset**. O projeto não tem hoje uma linha de áudio; este é o eixo
  novo, e ele entra sem baixar nada.
- **O contexto nasce no primeiro toque num pad.** Não é concessão: é o que a política de *autoplay*
  exige, e um pad já é o gesto.
- **Oito passos, seis pistas.** Segura-se um pad e ele grava; solta e roda em laço.
- **O quarto no tempo:** chamas pulsam, os anéis dos decks giram, o lustre balança. Tudo emissivo e
  geometria — **nenhuma luz nova**, ADR-0019 intacto.
- **Quantizar a viagem** do T-34 ao tempo forte.

## Traps

- **Nada de placar.** Sem pontuação, tempo, ranking ou tela de resultado. O momento em que isto vira
  jogo com objetivo é o momento em que passa a competir com o portfólio em vez de segurar alguém
  nele. É a única regra dura deste ticket.
- **O *mute* é um controle como qualquer outro** e vive na Plate, gravado, lembrado entre visitas.
  Som que chega sem ser pedido é o jeito mais rápido de perder alguém — e a legenda cai sob o T-30.
- **O espelho não fala em som.** Nada do que o sequenciador produz é conteúdo, então nada dele entra
  em `modules.ts` nem no espelho do DOM. Se em algum momento parecer que precisa entrar, é sinal de
  que virou conteúdo e a regra do placar foi quebrada.
- **`prefers-reduced-motion`** já é respeitado na página; a resposta do quarto ao tempo obedece a
  ele também.

## Done when

- Um padrão pode ser montado, ouvido e silenciado, e o silêncio persiste entre visitas.
- Trocar de módulo com o laço rodando chega no tempo forte.
- Com o som mudo, nada do resto do objeto muda de comportamento.
- Os quatro comandos de verificação passam.
