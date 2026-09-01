# T-29 — O Preview do GTM não conecta, e ninguém sabe por quê ainda

**Track A · `prototype/index.html`, `prototype/track.js` · precisa do sintoma exato antes de começar**

## Goal

Dá para depurar as tags no `nanj.in` sem publicar e torcer.

## O que se sabe

Fernando importou o container atualizado (doze eventos, `dl.status`) e **não consegue depurar**.
Duas observações separadas, e provavelmente com causas diferentes:

- **O DebugView está vazio.** Isso é esperado e não é bug: nada no site manda `debug_mode`, e o
  DebugView só mostra tráfego marcado como depuração. Verificado — o termo não aparece nem no
  código nem no container. O caminho normal é o Preview do GTM, e é ele que não vai.
- **O Preview / Tag Assistant não funciona.** O sintoma exato ainda não foi coletado.

## O que já foi descartado

- **O loader está certo.** `prototype/index.html:71-77` monta o `gtm.js` com `GTM-PLPVLQH9` e é
  travado em `/(^|\.)nanj\.in$/`, então em produção ele carrega. Confirmado no HTML publicado.
- **O regex do gatilho cobre os doze eventos**, incluindo os três do formulário. Conferido no JSON.
- **`?track` não colide** com o parâmetro que o Tag Assistant acrescenta (`gtm_debug`).

## Primeiro passo: qual dos três é

O ticket não pode começar sem isto, porque as causas não se parecem:

1. Fica em *"Connecting…"* para sempre → o Tag Assistant não consegue estabelecer a ponte.
   Suspeita principal: **o boot de 5,9s** (T-21). A página só fica interativa depois dele, e o
   Tag Assistant tem seu próprio tempo limite. Seria o T-21 se manifestando pela terceira vez,
   depois do PageSpeed e da atenção do recrutador.
2. Conecta mas nenhum evento aparece → é o gatilho ou a variável, e o Preview mostra qual.
3. Nem abre a janela → cookies de terceiros bloqueados, ou extensão.

## Traps

- **O DebugView vazio não é o bug.** Se alguém "consertar" mandando `debug_mode` sempre, todo
  visitante real passa a poluir o DebugView e os relatórios. Se for preciso, que seja atrás de
  uma flag, como `?track` já é.
- **Não republique o container para testar.** É exatamente o que o Preview existe para evitar, e
  o container só tem uma importação boa até agora.
- O `?track` abre os pushes em qualquer host e é a forma barata de ver o `dataLayer` sem o GTM
  no meio. Use-o para separar "o evento não foi empurrado" de "o GTM não o pegou".
