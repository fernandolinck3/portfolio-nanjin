# Tenebrae por dentro

Teu portfólio não é um site com páginas. É **um instrumento** — um painel com seis
teclas, duas rodas e um fader, desenhado em 3D no navegador. Este documento explica
como cada parte funciona e como uma mudança tua chega até [nanj.in](https://nanj.in).

*(Escrito para ser lido longe do terminal. O `HANDOFF.md` na raiz é o documento
técnico; este é o mapa.)*

---

## O modelo mental

**Se você ler só uma coisa, leia isto.**

Pense num CDJ de DJ pousado numa mesa escura. Ele tem um **mostrador pequeno** no
meio — 320 por 180 pixels, do tamanho de um visor de aparelho antigo — e é ali que
teu conteúdo aparece. Tudo o mais são controles físicos que mudam o que esse mostrador
está exibindo.

Não existe rolagem, não existe menu, não existe link de navegação. **Você opera o
objeto e ele responde.** Essa é a ideia inteira, e todo o resto é consequência dela.

> **Por que isso importa na prática:** como não há páginas, o Google Analytics padrão
> veria um visitante só, uma vez, sem nada depois. Foi por isso que instrumentamos
> eventos próprios — módulo aberto, projeto aberto, contato clicado. Numa tela única,
> os eventos *são* a análise.

---

## Os controles

| Controle | O que faz |
| --- | --- |
| **6 teclas** | Escolhem o **módulo**: Quem, Projetos, Trajeto, Critérios, Habilidades, Contato. É a navegação principal, e a única. |
| **Roda LUA** | À esquerda. Percorre a **lista** do módulo aberto — os três projetos, os cinco critérios, as rotas de contato. |
| **Roda SOL** | À direita. Vira as **páginas** do item selecionado. Onde não há páginas, ela também percorre a lista, para não ficar morta. |
| **Fader** | É a **luz**. Da esquerda para a direita: noite, crepúsculo, dia. Apaga as velas da sala e muda a atmosfera inteira. |
| **7 estrelas** | Embaixo do mostrador. Uma acende para cada módulo visitado. A do meio é outra coisa — veja *O segredo*. |

### Girar as rodas com o mouse

Isso deu trabalho e vale saber por quê. Uma roda de verdade você gira com a mão em
arco; com mouse ninguém faz arco, faz linha reta. Hoje o código mede **quanto do teu
movimento foi tangente à roda** — puxar para fora do centro não gira nada, arrastar de
lado gira. Sentido horário desce a lista, como uma rodinha de scroll.

---

## O segredo

Quando alguém visita os seis módulos, as seis estrelas acendem e a sétima **arma**. A
partir daí, levar o fader de uma ponta à outra abre uma tela escondida — e a direção
decide qual: do dia para a noite acorda a **Lua**, da noite para o dia acorda o **Sol**.

Ela abre **uma vez só**. Depois disso o pequeno sol no canto do mostrador vira uma
marca clicável, que é a porta de volta. Se abrisse toda vez que o fader cruzasse,
deixaria de ser segredo e viraria um estorvo.

O prêmio é mandar um print no direct. A tela termina num botão que abre teu Instagram.

---

## As quatro peças do código

**1. O objeto — `prototype/scene.js`**
O arquivo grande. Constrói a mesa, a placa gravada, as rodas, as teclas, o fader, as
velas e a iluminação em 3D. É também onde mora toda a navegação: o que acontece quando
você aperta uma tecla ou gira uma roda.

**2. O mostrador — `prototype/screen/render.js`**
Desenha aqueles 320×180 pixels, e só isso. É um desenho, não um HTML: cada letra é
pintada à mão em código. Por isso cada tela tem uma contagem de pixels exata — quando
algo "não cabe", é aritmética, não gosto.

**3. O conteúdo — `src/content/modules.ts`**
**Todo o texto do site vive aqui.** Um arquivo. Se você quiser trocar uma frase, é o
único lugar para mexer — e existem testes automáticos que impedem que o texto cresça
além do que cabe na tela, ou que passe a afirmar coisas que você não disse.

**4. O case do projeto — `prototype/focus.js`**
Quando alguém abre um projeto, a câmera voa até o mostrador e um painel de HTML de
verdade aparece por cima, com imagem em tamanho real e texto legível. O mostrador é bom
para índice e ruim para foto de pôster — por isso o case sai dele.

---

## Como uma mudança chega na internet

1. **Você edita um arquivo** — na maioria das vezes o `modules.ts`, se for texto.
2. **Roda os testes** com `npx vitest run`. São 68 verificações que conferem se o
   conteúdo cabe na tela e se não passou a afirmar nada indevido.
3. **Faz o commit e o push** para o GitHub, no branch `lyra`.
4. **O GitHub reconstrói sozinho.** A receita em `.github/workflows/pages.yml` roda os
   testes de novo, gera o site e publica.
5. **Fica no ar em ~2 minutos** em `nanj.in`. Você não faz upload de nada.

> **Uma armadilha que já custou caro:** o site publicado não é igual ao que você vê
> rodando no seu computador. Coisas como cópia de imagens e caminhos só existem na
> versão construída — já aconteceu de a arte da placa nunca ser publicada, e de a
> página subir em branco. Por isso o passo 4 roda um `verify:site`, que confere a
> página construída e não a local.

---

## Onde ele mora

| O quê | Onde |
| --- | --- |
| Site | [nanj.in](https://nanj.in) — teu domínio, registrado na Hostinger, com HTTPS |
| Código | `github.com/fernandolinck3/tenebrae` — público, branch `lyra` |
| Hospedagem | GitHub Pages, grátis, reconstruindo a cada push |
| DNS | Hostinger, apontando para os servidores do GitHub |

Um detalhe frágil que vale guardar: o arquivo `public/CNAME` é o que segura o domínio.
Se um dia ele sumir num deploy, **o domínio se desconfigura sozinho e em silêncio.**

---

## O que ele mede

O Tag Manager (`GTM-PLPVLQH9`) está instalado e funcionando, mas **o container está
vazio** — nada é gravado ainda. Falta você colar o ID do GA4.

Quando ligar, sete eventos passam a chegar: abertura do objeto (com o tempo que levou),
módulo aberto, item selecionado, página lida, projeto aberto, saída para e-mail ou
Instagram, e o eclipse encontrado. Cada um carrega o UTM que trouxe a visita, para você
saber se quem leu o case do Graecus veio do story ou da bio.

Detalhe em `docs/analytics/README.md`.

---

## O que falta

### Curto — depende só de uma resposta tua

- **O ID do GA4** (`G-XXXXXXXXXX`), para ligar a medição.
- **O nome público.** A tela *Quem* diz *Fernando Bittencourt*; o título da aba, os
  metadados e o LinkedIn ainda dizem *Fernando Linck*. Preciso saber qual é.
- **Gravar o vídeo do story.** Está construído (`?film`) e nunca rodou.

### Trabalho de verdade

- **Espelho acessível do mostrador.** Hoje o conteúdo existe só dentro do desenho —
  quem usa leitor de tela não alcança. É a maior lacuna real do projeto.
- **A arquitetura do painel de case**: 60% imagem, 40% texto, cabeçalho fixo, primeira
  dobra sem rolagem.
- **Conteúdo dos cases** por projeto.
- **Abertura mais rápida**: hoje leva uns 5 segundos, deveria ser usável em 2,5.

Tudo isso está em detalhe no `HANDOFF.md`, na raiz. É o documento que qualquer sessão
nova lê primeiro.
