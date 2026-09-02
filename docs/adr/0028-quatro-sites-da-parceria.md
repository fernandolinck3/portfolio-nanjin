# ADR-0028 — PROJETOS deixa de ter três projetos, e o índice cabe em sete porque foi medido

**Data:** 2026-09-02 · **Status:** aceita
**Reverte:** o recorte de 2026-08-28 registrado no comentário de `WORKS_PT`
**Toca:** T-16 pela metade, e diz qual metade

## Contexto

Em 2026-08-28 Fernando decidiu que PROJETOS teria **três projetos e apenas três**. Quatro entradas
saíram — Bandas de Bollinger, R U MINE?, Rifa Handbanners e Parize — e o comentário no código
registrou a decisão como um **recorte, não uma retratação**, dizendo que um recorte é a coisa mais
fácil de reverter que existe.

Em 2026-09-02 ele pediu os quatro sites feitos em parceria com **Eduardo Braga**: `cmpinox.com.br`,
`maiarateixeira.adv.br`, `aneliseporto.com.br` e `helderrodrigues.com.br`. O levantamento técnico
dos quatro está em `research/cases-parceria-eduardo-braga.md` do repositório privado
`nanjin-notas` — é auditoria de autoria de um parceiro nomeado e saiu do público em
2026-09-02.

Duas perguntas precisavam de resposta antes de escrever uma linha.

**Autoria.** Dois dos quatro têm repositório público, e em ambos 100% dos commits são do Eduardo. Um
recrutador que clique vê isso. Perguntado, Fernando respondeu: *"Trabalhei junto com o Eduardo, só
está no github dele mesmo. Não precisamos adicionar o github."*

**Espaço.** O `SCREEN_BUDGET` declarava `items.max: 6`. Com sete projetos, o teste falhou.

## Decisão

**Os quatro entram, cada um com um case, e nenhum reivindica autoria individual.** Cada case termina
numa seção `PARCERIA` com a mesma frase — *"Trabalho feito em parceria com Eduardo Braga."* — e
nenhum link para o GitHub aparece em lugar nenhum, porque ele pediu que não aparecesse e porque a
frase já diz o que o repositório diria.

Nenhum dos quatro cases cita número de conversão ou de tráfego. Nenhum dos quatro tem dado público,
e dizer isso custa menos do que ser desmentido — é a mesma regra que o case do Graecus já seguia.

**O limite do índice passa a ser por layout, e o número veio de uma medição.**

```
items: { max: 7, byLayout: { list: 7, index: 6, grid: 4, nodes: 3 } }
```

O `max: 6` anterior era um **orçamento declarado, não um limite físico**. Com os sete itens, a Tela
foi carregada num Chrome de verdade, dirigida por `__unit` — `introStep(1)`, `setBoot(1)`,
`press(1)` — e a textura de 960x540 foi exportada do `emissiveMap` da Placa. **Os sete títulos
aparecem desenhados, legíveis, acima do rodapé e sem aviso de excesso.**

A aritmética dizia que a sétima linha cairia com 4px de folga. Quatro pixels é exatamente a margem
em que este projeto já errou antes, e a regra da casa — *medir antes, construir e mostrar* — existe
por causa disso. O número na tabela é o que foi visto, não o que foi calculado.

Os quatro números são diferentes entre si porque **os quatro desenhos são diferentes**: `drawGrid`
corta em quatro (`slice(0, 4)`) e `drawNodes` em três (`Math.min(items.length, 3)`), enquanto
`drawList` e `drawIndex` desenham tudo o que recebem. Um número só para os quatro era conservador em
dois e otimista nos outros dois.

## Consequências

- **PROJETOS tem sete itens**, e a Miscelânea continua na lista. Nada foi cortado para caber.
- **O espelho seguiu sozinho.** Nenhuma linha de `mirror.ts` foi tocada: o conteúdo mora em
  `modules.ts` e os dois consumidores leem de lá, então a posição passou a dizer "PROJETO 2 de 7"
  sem ninguém escrever isso. Duas asserções que fixavam três projetos foram atualizadas — elas eram
  o registro do recorte, não uma regra.
- **Vinte capturas entraram em `public/works/`**, cinco por site, desktop e mobile, tiradas do
  Chrome dirigido por CDP. Os cases dos quatro não repetem o buraco que o case do Portfólio tem.
- **O inglês entrou junto.** Oitenta e seis frases novas em `en.ts`, traduzidas por bloco e
  requebradas dentro do mesmo orçamento, porque uma frase em português sem entrada lá quebra a
  suíte — que foi exatamente o que aconteceu, e é o comportamento certo.

## O que isto **não** resolve

**O T-16 continua aberto, e agora com a metade que falta nomeada.** O ticket quer duas coisas: que o
teste afirme o que cada layout mostra — feito aqui — e que **cada desenho conte no `overflow` o que
não coube**. `drawGrid` e `drawNodes` continuam cortando em silêncio, e `moveSelection` continua
podendo pousar o cursor numa linha que não foi desenhada. Nada hoje tem itens suficientes para isso
morder, e o limite por layout impede que morda por acidente — mas a regra de Fernando, *"nenhum item
pode parecer cortado ou oculto"*, ainda não é verdade por construção.

**A prosa dos quatro cases é minha, não dele.** É honesta e é checável, e continua sendo mais uma
entrada na lista de *Blocked on Fernando* que já inclui QUEM, CRITÉRIOS e as falas da LYRA.
