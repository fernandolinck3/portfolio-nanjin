/**
 * Os seis Módulos — a única fonte do conteúdo da Unidade.
 *
 * ADR-0002 torna o DOM canônico e a Tela uma renderização dele, o que significa que
 * dois consumidores precisam das mesmas strings, o que significa que as strings não
 * podem viver dentro de nenhum dos dois. Elas vivem aqui: só dados, sem marcação e
 * sem chamadas de canvas.
 *
 * São exatamente seis Módulos e não há um sétimo (ADR-0001). ECLIPSE não é um sétimo
 * Módulo — é um estado do instrumento, e mora fora desta lista.
 *
 * ## Português, a partir de 2026-08-28
 *
 * Todo texto público é PT-BR. A consequência que importa aqui é que **os limites da
 * Tela foram recortados de novo**: tinham sido ajustados a strings em inglês, e o
 * português corre mais longo. A Tela não rola (ADR-0009), então o limite é real.
 *
 * ## Voz
 *
 * Sem primeira pessoa fora de CONTATO. Sem `atuo`/`atua` para apresentar
 * competências. Nada de clientes, métricas, resultados, prêmios ou tecnologias
 * inventados — o que não está registrado aparece como lacuna declarada, não como
 * ausência silenciosa.
 */

import { LOCALE } from './locale'
import { EN, translate } from './en'

/** Uma página de um Item, alcançada girando o SOL. `lines` vazio é uma lacuna registrada. */
export type Section = { heading: string; lines: readonly string[] }

/** Para onde um item leva quando é aberto — pela tela, pelo teclado ou pelo toque. */
export type Act =
  | { kind: 'work'; value: string }
  | { kind: 'mail'; value: string }
  | { kind: 'url'; value: string }
  /* Sem `value`: o destino do formulário é uma decisão de infraestrutura (ADR-0027),
     não conteúdo, e não tem por que atravessar este arquivo. */
  | { kind: 'form' }

/** Uma coisa em que a LUA pode parar. */
export type Item = {
  id: string
  label: string
  meta?: string
  sections: readonly Section[]
  act?: Act
}

/**
 * O que LYRA diz em um Módulo.
 *
 * Duas falas, nunca em laço: `open` ao entrar, e `idle` depois de seis segundos sem
 * interação. A segunda é funcional e **nomeia a LUA e o SOL**, porque é a única
 * instrução que o visitante recebe sem ter de procurar por ela.
 */
export type Lyra = { open: readonly string[]; idle: readonly string[] }

/**
 * Como o índice de um Módulo é desenhado.
 *
 * Antes havia uma forma só — um `lead` e uma lista debaixo dele — e ela servia mal a
 * quase todos. Cinco critérios não cabiam com o texto acima; quatro grupos de
 * habilidades pediam uma matriz e não uma coluna; dois blocos do trajeto são um mapa,
 * não uma fila; e QUEM, que não tem lista, gastava a metade direita do painel para
 * não mostrar nada ali.
 *
 * O tipo diz o que a tela **é**, e o desenho segue disso:
 *
 *   `identity`  uma tela de identidade em largura total, sem lista
 *   `list`      nomes, e só nomes — nada acima deles
 *   `index`     índice numerado compacto, com todos os itens sempre visíveis
 *   `grid`      matriz 2x2 de grupos
 *   `nodes`     poucos blocos grandes, ligados visualmente
 */
export type Layout = 'identity' | 'list' | 'index' | 'grid' | 'nodes'

export type Module = {
  slot: number
  id: string
  title: string
  layout: Layout
  /** Forma curta impressa acima da Tecla. ~96px de passo, daí as abreviações. */
  pad: string
  /** A linha que o rodapé da Tela mostra enquanto a Tecla está sob o ponteiro. */
  hint: string
  /** Só no layout `identity`: o nome, desenhado em blackletter como na abertura. */
  name?: string
  /** Só no layout `identity`: o posicionamento, e as disciplinas sob ele. */
  role?: string
  disciplines?: readonly string[]
  /**
   * Os mesmos fatos, no registro que uma máquina lê.
   *
   * **Não é uma segunda cópia do conteúdo** — é a mesma coisa numa forma diferente,
   * e a diferença é tipográfica e não factual. `role` é `GROWTH · CRO · EXPERIÊNCIAS
   * DIGITAIS` porque é assim que a Screen **desenha** um cargo: caixa alta, ponto
   * médio, gravado. Isso vazou para o `schema.org` e, para o Google e para um motor
   * generativo, virou uma string estranha em vez de uma profissão.
   *
   * Derivar um do outro foi considerado e descartado: `toLowerCase` produz
   * "experiências digitais" ou "Experiências Digitais" conforme a heurística, e
   * nenhuma das duas está certa em português. Um humano escreve as cinco linhas uma
   * vez; um algoritmo erraria em cada mudança.
   *
   * O emprego e o lugar já existiam no portfólio — TRAJETO lista os empregadores,
   * QUEM diz a cidade — e a máquina não recebia nenhum dos dois.
   */
  entity?: {
    jobTitle: string
    knowsAbout: readonly string[]
    locality: string
    region: string
    country: string
    worksFor: readonly { name: string; from: string; to: string }[]
  }
  /**
   * A visão geral. **Sempre na tela, nunca atrás de uma roda.**
   *
   * Um índice que já se explica pelos próprios nomes não precisa de um: PROJETOS
   * mostra três títulos e nada acima deles, porque o que o texto diria a lista já
   * disse. Daí `lead` ser opcional agora.
   */
  lead?: readonly string[]
  /** Rodapé do corpo: lugar, idioma, o que qualifica sem competir. */
  dim?: readonly string[]
  /** O que uma marca da LUA percorre, para o rodapé: `LUA · PROJETO 02/03`. */
  unit?: string
  items?: readonly Item[]
  lyra: Lyra
}

/**
 * O que cabe na Tela. A textura tem 1024 x 576 e desenha cerca de um terço disso na
 * Placa, então estes são limites duros.
 *
 * Recortados para o português: `lineChars` subiu de 52 para 58 e `labelChars` de 30
 * para 34. Não por generosidade — a mesma frase em português é mais longa, e
 * apertá-la produziria uma tradução pior, não uma tela melhor.
 */
export const SCREEN_BUDGET = {
  /**
   * Um `lead` guarda **frases, não linhas.**
   *
   * Guardava linhas: o texto vinha quebrado à mão em 58 caracteres e o Screen
   * quebrava de novo no que coubesse na coluna. Duas quebras sobre o mesmo texto dão
   * o que Fernando viu — *"a quebra de linhas também tá um pouco estranha"* — porque
   * a segunda quebra parte a primeira metade e deixa a segunda começando sozinha:
   * "Experimentos de ponta a ponta: da / pesquisa à / implementação e ao aprendizado."
   *
   * Quem sabe onde a linha cabe é quem mede, e quem mede é o Screen. Aqui ficam as
   * frases inteiras; `paraChars` é só um teto para que uma delas não vire um parágrafo.
   */
  lead: { lines: 5, paraChars: 96 },
  dim: { lines: 2, lineChars: 62 },
  /**
   * Quantos itens uma lista comporta — **por layout**, porque os quatro desenhos não
   * comportam o mesmo. `drawGrid` corta em quatro (`slice(0, 4)`) e `drawNodes` em três
   * (`Math.min(items.length, 3)`); `drawList` e `drawIndex` não cortam nada. Um número
   * só para os quatro era conservador em dois e otimista nos outros dois, que é o
   * assunto do T-16.
   *
   * `list: 7` foi **medido em 2026-09-02**, não estimado: com os quatro sites da
   * parceria, PROJETOS passou a ter sete itens e a Tela foi exportada da textura
   * (960x540) com o índice inteiro desenhado, legível e sem aviso de excesso. A
   * aritmética dizia 4px de folga e a aritmética é onde este projeto já errou —
   * ver `docs/adr/0028-quatro-sites-da-parceria.md`.
   *
   * Isto **não fecha o T-16**: o ticket também quer que cada desenho conte no
   * `overflow` o que não coube, e `drawGrid` e `drawNodes` continuam cortando em
   * silêncio. Este limite apenas para de mentir sobre o que cada um mostra.
   */
  items: { max: 7, labelChars: 34, metaChars: 34, byLayout: { list: 7, index: 6, grid: 4, nodes: 3 } },
  section: { max: 6, lines: 5, lineChars: 58, headingChars: 20 },
  hintChars: 62,
} as const

/**
 * Quantos itens um layout mostra, com o teto geral como piso da resposta.
 *
 * `byLayout` não nomeia `identity`, porque uma tela de identidade não tem lista. Isso
 * fazia todo chamador indexar um objeto estreito com uma chave larga e cair no
 * `?? max` — que funciona e **não compila**: o `vitest` transpila sem checar tipos,
 * então a suíte ficava verde enquanto o `typecheck` do CI quebrava, que é o caminho
 * exato que o `pages.yml` documenta.
 *
 * A resposta mora aqui, uma vez, ao lado dos números que ela lê.
 */
export const itemsMaxFor = (layout: Layout): number =>
  (SCREEN_BUDGET.items.byLayout as Partial<Record<Layout, number>>)[layout] ?? SCREEN_BUDGET.items.max

/**
 * O que a sétima tela diz — e por que ela deixou de ser um formulário.
 *
 * Ela mostrava um campo desenhado como controle de verdade e marcado `SEM SERVIDOR`,
 * porque não havia endpoint para decidir quem chegou primeiro. Era honesto e lia como
 * inacabado: quem atravessa o objeto inteiro e faz a luz cruzar de ponta a ponta
 * encontra uma caixa de texto quebrada.
 *
 * O prêmio de um segredo é ter sido encontrado. Então o campo saiu e no lugar dele
 * ficou o que aconteceu, dito por extenso — inclusive a parte de que não há prêmio,
 * que assim vira intenção em vez de ausência.
 *
 * Duas faces porque há dois caminhos: descer a luz para a noite acorda a LUA, subir
 * para o dia acorda o SOL. O texto muda; o que ele diz, não.
 */
const ECLIPSE_PT = {
  moon: {
    tag: 'ECLIPSE DA LUA',
    lines: ['Você levou a luz de volta ao escuro,', 'e a sétima marca acendeu.'],
  },
  sun: {
    tag: 'ECLIPSE DO SOL',
    lines: ['Você trouxe a luz de volta ao dia,', 'e a sétima marca acendeu.'],
  },
  found: 'SINAL ENCONTRADO',
  /**
   * O prêmio existe, e não precisa de servidor para existir.
   *
   * A tela dizia que não havia nenhum, o que era verdade sobre a infraestrutura e
   * mentira sobre a intenção — *"temos um prêmio though, a pessoa me mandar um print
   * ou ir direto pro Instagram."* Um print mandado no direct é a prova; a pessoa
   * carrega, ninguém precisa arbitrar, e o canal já existe.
   */
  note: ['Mande um print desta tela.'],
  claim: { label: 'ABRIR O INSTAGRAM  ·  @NAN._.JIN', url: 'https://instagram.com/nan._.jin' },
} as const

export const LYRA_NAME = 'LYRA'
export const LYRA_BUBBLE_CHARS = 26

/** Quantos milissegundos LYRA espera antes de trocar a atmosfera pela instrução. */
export const LYRA_IDLE_MS = 6000

/**
 * O que uma Section mostra quando o conteúdo ainda não existe.
 *
 * Uma string, em um lugar, para que toda lacuna leia igual e para que encontrar
 * todas seja uma busca por um símbolo em vez de por seis formulações.
 */
const GAP_PT = 'Ainda não registrado.'


/* ---------------- os projetos ---------------- */

export type Work = {
  no: string
  id: string
  title: string
  kind: string
  year?: string
  client?: string
  blurb: readonly string[]
  images?: readonly string[]
  /** Verdadeiro enquanto o projeto é um estado vazio honesto, sem obra publicada. */
  empty?: boolean
}

/**
 * Sete projetos.
 *
 * Eram três por decisão de Fernando em 2026-08-28 — um recorte, não uma retratação.
 * Em 2026-09-02 ele pediu os quatro sites feitos em parceria com Eduardo Braga, e o
 * recorte foi desfeito exatamente como se previa que seria: acrescentando linhas.
 * Ver `docs/adr/0028-quatro-sites-da-parceria.md`.
 *
 * As quatro entradas que saíram em agosto — Bandas de Bollinger, R U MINE?, Rifa
 * Handbanners e Parize — continuam em `public/works/` e continuam fora daqui.
 */
const WORKS_PT: readonly Work[] = [
  {
    no: '001',
    id: 'graecus',
    title: 'Graecus',
    kind: 'Site institucional + blog',
    client: 'Graecus',
    /* As capturas do site vêm primeiro: são o trabalho que o case descreve. As duas
       peças sociais fecham a sequência — são do mesmo cliente e de outro trabalho. */
    images: [
      '/works/graecus-home-hero.jpg',
      '/works/graecus-services.jpg',
      '/works/graecus-blog-archive.jpg',
      '/works/graecus-blog-article.jpg',
      '/works/graecus-faq-open.jpg',
      '/works/graecus-mobile-home.jpg',
      '/works/graecus-mdsale.jpg',
      '/works/graecus-namorados.jpg',
    ],
    blurb: [
      'Site institucional e blog em WordPress com tema',
      'personalizado, sem page builder.',
    ],
  },
  {
    no: '002',
    id: 'cmpinox',
    title: 'CMP Inox',
    kind: 'Site institucional',
    year: '2024',
    client: 'CMP Inox',
    images: [
      '/works/cmpinox-home.jpg',
      '/works/cmpinox-produtos.jpg',
      '/works/cmpinox-tabelas.jpg',
      '/works/cmpinox-contato.jpg',
      '/works/cmpinox-mobile.jpg',
    ],
    blurb: [
      'Site institucional de uma distribuidora de aço inox,',
      'com catálogo, tabelas técnicas e orçamento.',
    ],
  },
  {
    no: '003',
    id: 'maiara',
    title: 'Maiara Teixeira',
    kind: 'Site de advocacia',
    client: 'Maiara Teixeira Advocacia',
    images: [
      '/works/maiara-home.jpg',
      '/works/maiara-sobre.jpg',
      '/works/maiara-servicos.jpg',
      '/works/maiara-processo.jpg',
      '/works/maiara-contato.jpg',
      '/works/maiara-mobile.jpg',
    ],
    blurb: [
      'Site de uma advocacia de direito imobiliário e',
      'sucessões, com agendamento e tema claro e escuro.',
    ],
  },
  {
    no: '004',
    id: 'anelise',
    title: 'Anelise Porto',
    kind: 'Site de advocacia',
    client: 'Anelise Porto Advocacia',
    images: [
      '/works/anelise-home.jpg',
      '/works/anelise-sobre.jpg',
      '/works/anelise-servicos.jpg',
      '/works/anelise-processo.jpg',
      '/works/anelise-cta.jpg',
      '/works/anelise-mobile.jpg',
    ],
    blurb: [
      'Site de uma advocacia generalista, com seis áreas',
      'do direito e contato direto por WhatsApp.',
    ],
  },
  {
    no: '005',
    id: 'helder',
    title: 'Hélder Rodrigues',
    kind: 'Landing page',
    year: '2026',
    client: 'Hélder Rodrigues',
    images: [
      '/works/helder-home.jpg',
      '/works/helder-resultados.jpg',
      '/works/helder-metodologia.jpg',
      '/works/helder-servicos.jpg',
      '/works/helder-mobile.jpg',
    ],
    blurb: [
      'Landing page de um personal trainer, desenhada no',
      'Figma e construída em React.',
    ],
  },
  /* Sexto, e não primeiro: decisão de Fernando em 2026-09-02. O objeto em que o
     visitante já está de pé não precisa abrir a lista — o trabalho de cliente precisa.
     As capturas são do próprio instrumento, tiradas do Chrome dirigido por CDP: a
     Tela sai do `emissiveMap` da Placa em 960x540, que é a resolução real do painel,
     e não uma foto de um disco de 190px. */
  {
    no: '006',
    id: 'portfolio',
    title: 'Portfólio pessoal',
    kind: 'Site interativo',
    images: [
      '/works/portfolio-objeto.jpg',
      '/works/portfolio-quem.jpg',
      '/works/portfolio-projetos.jpg',
      '/works/portfolio-criterios.jpg',
      '/works/portfolio-flat.jpg',
    ],
    blurb: [
      'Um portfólio concebido como instrumento.',
      'Seis teclas acessam os módulos, a LUA percorre o',
      'conteúdo e o SOL aprofunda a seleção.',
    ],
  },
  {
    no: '007',
    id: 'miscelanea',
    title: 'Miscelânea',
    kind: 'Galeria de artes',
    /* `empty` continua verdadeiro: a galeria segue em construção. O que mudou é que
       ela deixou de estar vazia — duas peças reais entraram. Nenhuma data, nenhum
       título inventado; o que não se sabe continua não sendo dito. */
    empty: true,
    images: ['/works/alt-escape.jpg', '/works/ru-mine-a.jpg', '/works/ru-mine-b.jpg'],
    blurb: [
      'Uma galeria em construção para reunir pôsteres,',
      'composições e estudos visuais em um mesmo arquivo.',
    ],
  },
]

/** Quantos dos projetos já têm obra publicada. */
export const REAL_WORKS = WORKS_PT.filter(w => !w.empty).length

/**
 * O case de um projeto, como as Sections que o SOL percorre.
 *
 * Separado de `WORKS` porque um case é longo e a lista é curta, e porque uma lacuna
 * declarada — uma Section sem linhas — precisa ser visível como *faltando* em vez de
 * silenciosamente ausente. Miscelânea não tem case: o estado vazio é o conteúdo
 * verdadeiro, e inventar títulos, datas ou obras seria a única forma de errar aqui.
 */
function caseOfPT(id: string): readonly Section[] {
  if (id === 'portfolio') return [
  /* A ordem é o briefing, não uma preferência: ele pediu projeto, contexto e
     construção sem rolar, e as três primeiras seções são isso. REFERÊNCIAS fecha,
     porque informa sem ser o que ele pediu na frente. INTERAÇÃO saiu: o `blurb` já
     diz que a LUA percorre e o SOL abre, e repetir na Tela é gastar linha para dizer
     duas vezes. */
    {
      heading: 'VISÃO GERAL',
      lines: [
        'Um portfólio que é um instrumento: uma tela, sem',
        'scroll e sem rota, com o conteúdo morando no display',
        'do próprio aparelho.',
      ],
    },
    {
      heading: 'O MOTIVO',
      lines: [
        'Estratégia, mensagem, design, front-end e análise na',
        'mesma pessoa viram uma lista de cargos quando escritas',
        'em coluna. Aqui são a coisa que o visitante opera',
        'antes de abrir qualquer case.',
      ],
    },
    {
      heading: 'CONSTRUÇÃO',
      lines: [
        'Three.js desenha o objeto. O conteúdo vive num só',
        'arquivo e é lido duas vezes — pela Tela e por um',
        'espelho em HTML, pré-renderizado no build. Um',
        'rastreador lia 465 caracteres; passou a ler 5.675.',
      ],
    },
    {
      heading: 'REFERÊNCIAS',
      lines: [
        'Mapas celestes, gravuras esotéricas, mecanismos',
        'analógicos e terminais monocromáticos. O objeto de',
        'referência é um pedal da Old Blood Noise Endeavors.',
      ],
    },
  ]
  if (id === 'graecus') return [
    {
      heading: 'VISÃO GERAL',
      lines: [
        'Site institucional e blog de uma consultoria de',
        'growth: seis linhas de serviço, de mídia paga a',
        'engenharia de dados, sob uma marca só.',
      ],
    },
    {
      heading: 'O PROBLEMA',
      lines: [
        'Cada linha tem a própria pilha — Google e Meta na',
        'mídia, Hubspot e RD no CRM, BigQuery e Databricks',
        'nos dados. Escritas em coluna, as seis viram um',
        'inventário de logos e nenhuma decisão.',
      ],
    },
    {
      heading: 'CONSTRUÇÃO',
      lines: [
        'Cada serviço é um cartão e as ferramentas são',
        'etiquetas dentro dele. Tema WordPress próprio, sem',
        'page builder: templates PHP para home, serviços,',
        'arquivo, categorias e artigos, com componentes',
        'reutilizáveis.',
      ],
    },
    {
      heading: 'O BLOG',
      lines: [
        'Busca, filtro por categoria, atalhos temáticos e',
        'paginação, todos sobre um único template de artigo.',
      ],
    },
  ]
  /* Os quatro da parceria com Eduardo Braga. Cada um diz como foi construído porque é
     a única coisa que os distingue: são quatro clientes pequenos com o mesmo pedido, e
     quatro decisões de construção diferentes. Nenhum reivindica número de conversão ou
     tráfego — nenhum dos quatro tem dado público, e dizer isso é mais barato do que
     ser desmentido. A linha da parceria fica em todos, sempre com o mesmo texto. */
  if (id === 'cmpinox') return [
    {
      heading: 'VISÃO GERAL',
      lines: [
        'Uma distribuidora de aço inox com trinta anos de',
        'mercado, que vendia por telefone e por indicação.',
        'O site é para o comprador que já sabe o que quer e',
        'só precisa conferir se a liga está lá.',
      ],
    },
    {
      heading: 'O COMPRADOR',
      lines: [
        'Ninguém abre um catálogo de aço por curiosidade.',
        'Ele chega com uma liga e uma bitola anotadas, e a',
        'hierarquia responde a isso: produto antes de',
        'empresa, tabela técnica antes de argumento.',
      ],
    },
    {
      heading: 'A DECISÃO',
      lines: [
        'Nenhum CMS. Projeto no Webflow com o sistema de',
        'classes Client-First, exportado e servido como',
        'arquivos estáticos, com sitemap versionado junto.',
        'As composições químicas são arquivo, não imagem.',
      ],
    },
    {
      heading: 'MEDIÇÃO',
      lines: [
        'GA4 em todas as páginas desde a primeira versão. O',
        'formulário qualifica antes do contato: empresa,',
        'segmento e canal preferido.',
      ],
    },
    {
      heading: 'PARCERIA',
      lines: ['Trabalho feito em parceria com Eduardo Braga.'],
    },
  ]
  if (id === 'maiara') return [
    {
      heading: 'VISÃO GERAL',
      lines: [
        'Advocacia de direito imobiliário e sucessões, em',
        'Cachoeirinha. Uma página só, com tudo dentro dela.',
      ],
    },
    {
      heading: 'QUEM PROCURA',
      lines: [
        'Quem procura um advogado de inventário costuma',
        'chegar num momento difícil, comparando alguns nomes',
        'e buscando quem já tenha feito aquilo antes.',
        'O site foi construído para responder a isso.',
      ],
    },
    {
      heading: 'A DECISÃO',
      lines: [
        'Sem framework e sem etapa de build: um HTML, um CSS',
        'e um JavaScript, servidos estáticos. Formulário',
        'próprio e WhatsApp com a mensagem pré-preenchida',
        'por assunto.',
      ],
    },
    {
      heading: 'PARCERIA',
      lines: ['Trabalho feito em parceria com Eduardo Braga.'],
    },
  ]
  if (id === 'anelise') return [
    {
      heading: 'VISÃO GERAL',
      lines: [
        'Advocacia generalista em Cachoeirinha, com seis',
        'áreas do direito em uma página.',
      ],
    },
    {
      heading: 'O PROBLEMA',
      lines: [
        'Seis áreas disputam a mesma atenção. Listar as seis',
        'com o mesmo peso não ajuda ninguém a escolher, e',
        'esconder qualquer uma perde justamente o cliente',
        'que entrou por ela.',
      ],
    },
    {
      heading: 'A DECISÃO',
      lines: [
        'As áreas abrem no lugar, uma de cada vez, e a',
        'página inteira vem dentro do HTML servido. Sem',
        'framework e sem build.',
      ],
    },
    {
      heading: 'UMA ROTA SÓ',
      lines: [
        'Sem formulário: o site inteiro leva ao WhatsApp,',
        'repetido a cada seção. A promessa do escritório é',
        'resposta rápida, e a rota é única por isso.',
      ],
    },
    {
      heading: 'PARCERIA',
      lines: ['Trabalho feito em parceria com Eduardo Braga.'],
    },
  ]
  if (id === 'helder') return [
    {
      heading: 'VISÃO GERAL',
      lines: [
        'Landing page de um personal trainer, construída em',
        'React a partir de um desenho feito no Figma.',
      ],
    },
    {
      heading: 'O QUE SE VENDE',
      lines: [
        'Treino personalizado não se experimenta antes de',
        'comprar. O que o cliente avalia é o método.',
      ],
    },
    {
      heading: 'A DECISÃO',
      lines: [
        'Avaliação, plano, monitorização e ajuste viram',
        'etapas numeradas, ao lado de um painel de números.',
        'React 19 com Vite e Tailwind, em treze componentes,',
        'e um componente dedicado às meta tags.',
      ],
    },
    {
      heading: 'PARCERIA',
      lines: ['Trabalho feito em parceria com Eduardo Braga.'],
    },
  ]
  /* Miscelânea não tem case, e a última linha desta seção prometia uma "primeira
     seleção em breve" quando ela já tinha entrado: três peças reais estão em
     `images`. Uma galeria que mostra obra e diz que a obra ainda vem se contradiz na
     mesma tela. O que segue verdadeiro é que ela está em formação — isso é dito, e
     nenhuma data é prometida, porque nenhuma foi decidida. */
  return [
    {
      heading: 'EM CONSTRUÇÃO',
      lines: [
        'Uma galeria em construção para reunir pôsteres,',
        'composições e estudos visuais em um mesmo arquivo.',
        'As primeiras peças já estão aqui; o arquivo cresce.',
      ],
    },
  ]
}

/* ---------------- os módulos ---------------- */

const MODULES_PT: readonly Module[] = [
  /**
   * 1 — QUEM.
   *
   * **Sem itens.** A informação essencial não pode depender de uma roda, e um nome
   * atrás de um controle rotativo é um nome que ninguém lê. A LUA não faz nada aqui
   * e o rodapé diz isso, o que é melhor do que inventar algo para ela percorrer.
   */
  {
    slot: 1,
    id: 'identity',
    title: 'QUEM',
    layout: 'identity',
    pad: 'QUEM',
    hint: 'QUEM — A perspectiva que ele traz',
    /**
     * O nome, e a hierarquia sob ele.
     *
     * Estava tudo em caixa alta numa linha só — `FERNANDO LINCK — GROWTH, CRO E
     * EXPERIÊNCIAS DIGITAIS.` — o que faz do nome mais uma linha de texto. Ele é a
     * primeira coisa da tela de identidade e passa a ser desenhado como tal: em
     * blackletter, do mesmo jeito que a abertura o escreve.
     */
    name: 'Fernando Linck',
    role: 'GROWTH · CRO · EXPERIÊNCIAS DIGITAIS',
    disciplines: ['ESTRATÉGIA', 'MENSAGEM', 'DESIGN', 'FRONT-END', 'ANÁLISE'],
    lead: [
      'Experimentos de ponta a ponta: da pesquisa à implementação e ao aprendizado.',
    ],
    dim: ['Porto Alegre, Brasil.'],
    entity: {
      jobTitle: 'Growth, CRO e experiências digitais',
      knowsAbout: ['Estratégia', 'Mensagem', 'Design', 'Front-end', 'Análise'],
      locality: 'Porto Alegre',
      region: 'Rio Grande do Sul',
      country: 'Brasil',
      /* As mesmas três etapas que o TRAJETO desenha, com as mesmas datas. */
      worksFor: [
        { name: 'Nelogica', from: '2024', to: '2026' },
        { name: 'MSC Crociere', from: '2022', to: '2024' },
        { name: 'Agências e independente', from: '2019', to: '2022' },
      ],
    },
    lyra: {
      open: ['A unidade despertou.', 'Comece aqui.'],
      /* QUEM não tem lista, então nem a LUA nem o SOL fazem nada aqui. A fala dizia
         que faziam, o que ensinava, logo no primeiro módulo, que as rodas mentem. */
      idle: ['As teclas escolhem', 'o módulo.'],
    },
  },

  {
    slot: 2,
    id: 'projects',
    title: 'PROJETOS',
    layout: 'list',
    pad: 'PROJETOS',
    hint: 'PROJETOS — Trabalhos e o raciocínio por trás deles',
    /* Sem `lead`. Três títulos dizem o que são; o texto acima deles só empurrava o
       terceiro contra o rodapé. */
    unit: 'PROJETO',
    items: WORKS_PT.map(w => ({
      id: w.id,
      label: w.title.toUpperCase(),
      meta: w.kind.toUpperCase(),
      act: { kind: 'work' as const, value: w.id },
      sections: caseOf(w.id),
    })),
    lyra: {
      open: ['Alguns sinais já chegaram.', 'Outros ainda viajam.'],
      idle: ['A LUA percorre a lista.', 'Toque para abrir.'],
    },
  },

  /**
   * 3 — TRAJETO.
   *
   * CAMADAS e CRONOLOGIA ficam em blocos separados, e **empresas aparecem somente na
   * cronologia**. Misturar as duas é como um currículo passa a alegar que cada
   * competência foi exercida em cada empresa — uma alegação que ninguém fez e que
   * não se pode checar.
   */
  {
    slot: 3,
    id: 'path',
    title: 'TRAJETO',
    layout: 'nodes',
    pad: 'TRAJETO',
    hint: 'TRAJETO — Onde ele trabalhou e do que cuidou',
    lead: ['O percurso em camadas, e as datas que as sustentam.'],
    unit: 'ETAPA',
    items: [
      {
        id: 'camadas',
        label: 'CAMADAS',
        meta: 'O PERCURSO',
        sections: [
          {
            heading: 'ORIGEM',
            lines: ['O percurso começa no design gráfico e na criação', 'de conteúdo.'],
          },
          {
            heading: 'EDITORIAL',
            lines: [
              'A produção editorial acrescenta rigor, consistência',
              'e experiência com comunicação multilíngue.',
            ],
          },
          {
            heading: 'EXECUÇÃO',
            lines: [
              'Marketing, landing pages, UX/UI e front-end',
              'aproximam estratégia e execução.',
            ],
          },
          {
            heading: 'CONEXÃO',
            lines: ['CRO e experimentação passam a conectar todas', 'essas camadas.'],
          },
        ],
      },
      {
        id: 'cronologia',
        label: 'CRONOLOGIA',
        meta: '2019 — 2026',
        sections: [
          { heading: 'AGÊNCIAS', lines: ['Agências e independente', '2019 — 2022'] },
          { heading: 'MSC CROCIERE', lines: ['MSC Crociere', '2022 — 2024'] },
          { heading: 'NELOGICA', lines: ['Nelogica', '2024 — 2026'] },
        ],
      },
    ],
    lyra: {
      open: ['Nenhuma camada', 'foi descartada.'],
      idle: ['Gire a LUA para', 'acompanhar a sequência.'],
    },
  },

  /**
   * 4 — CRITÉRIOS.
   *
   * Um critério por seleção. Comprimir os cinco na Tela ao mesmo tempo os reduziria
   * a slogans, que é exatamente a forma que um princípio assume quando deixa de ser
   * defensável.
   */
  {
    slot: 4,
    id: 'criteria',
    title: 'CRITÉRIOS',
    layout: 'index',
    /* `CRITÉR.` só existe no hardware — a Tela sempre escreve por extenso. */
    pad: 'CRITÉR.',
    hint: 'CRITÉRIOS — Como contexto vira trabalho terminado',
    /* Uma linha. Cinco critérios têm de caber inteiros na mesma tela, e duas linhas
       de abertura custavam o quinto. */
    lead: ['Os dados decidem. O encanto também conta.'],
    unit: 'CRITÉRIO',
    items: [
      {
        id: 'dados',
        label: 'OS DADOS ORIENTAM A DECISÃO',
        meta: '01',
        sections: [{
          heading: 'POR QUÊ',
          lines: [
            'As evidências e o comportamento observado definem o',
            'ponto de partida. A solução precisa melhorar o que',
            'importa sem abrir mão de clareza, personalidade e',
            'prazer de uso.',
          ],
        }],
      },
      {
        id: 'problema',
        label: 'O PROBLEMA VEM ANTES',
        meta: '02',
        sections: [{
          heading: 'POR QUÊ',
          lines: [
            'Escolher o formato cedo demais pode produzir uma boa',
            'solução para a pergunta errada.',
          ],
        }],
      },
      {
        id: 'sistema',
        label: 'UM SÓ SISTEMA',
        meta: '03',
        sections: [{
          heading: 'POR QUÊ',
          lines: [
            'Mensagem, interface e aquisição formam um só sistema.',
            'A promessa feita no anúncio precisa continuar',
            'verdadeira na landing page e no produto.',
          ],
        }],
      },
      {
        id: 'experimento',
        label: 'REDUZIR INCERTEZA',
        meta: '04',
        sections: [{
          heading: 'POR QUÊ',
          lines: [
            'Um experimento existe para reduzir incerteza. O',
            'objetivo não é provar que uma ideia estava certa,',
            'mas produzir evidência para decidir o próximo passo.',
          ],
        }],
      },
      {
        id: 'metrica',
        label: 'MÉTRICA QUE MUDA DECISÃO',
        meta: '05',
        sections: [{
          heading: 'POR QUÊ',
          lines: [
            'Uma métrica só importa quando muda uma decisão. Antes',
            'da medição, é preciso definir o que faria o trabalho',
            'avançar, mudar de direção ou parar.',
          ],
        }],
      },
    ],
    lyra: {
      open: ['Algumas regras sobrevivem', 'às ferramentas.'],
      idle: ['Gire a LUA para o próximo.', 'O SOL explica o porquê.'],
    },
  },

  /**
   * 5 — HABILIDADES.
   *
   * **Agrupado, e essa é a única liberdade tomada com a lista.** O handoff traz onze
   * competências e pede a lista sem AGORA/DEPOIS. Onze linhas não cabem: a Tela não
   * rola (ADR-0009) e o corpo comporta seis. Elas viram quatro grupos, e as onze
   * aparecem por inteiro dentro deles — nada foi cortado, resumido ou reescrito.
   *
   * Nenhuma delas é IA, automação ou análise de dados. Isso não é descuido: o
   * PRODUCT.md proíbe apresentar essas três como experiência estabelecida, e a lista
   * aprovada simplesmente não as reivindica. A regra continua valendo por não haver
   * o que ela precise conter.
   */
  {
    slot: 5,
    id: 'skills',
    title: 'HABILIDADES',
    layout: 'grid',
    pad: 'HABILID.',
    hint: 'HABILIDADES — Com o que ele trabalha',
    lead: ['As ferramentas à mão, agrupadas pelo que fazem.'],
    unit: 'GRUPO',
    items: [
      {
        id: 'cro',
        label: 'CRO E EXPERIMENTAÇÃO',
        sections: [{
          heading: 'INCLUI',
          lines: [
            'CRO e experimentação · Testes A/B',
            'Pesquisa quantitativa e qualitativa',
            'Análise de funil',
          ],
        }],
      },
      {
        id: 'growth',
        label: 'GROWTH E AQUISIÇÃO',
        sections: [{
          heading: 'INCLUI',
          lines: ['Growth marketing', 'Landing pages e copy de conversão'],
        }],
      },
      {
        id: 'design',
        label: 'DESIGN E INTERFACE',
        sections: [{
          heading: 'INCLUI',
          lines: [
            'UX/UI e prototipação · Figma',
            'Sistemas de design e bibliotecas de componentes',
          ],
        }],
      },
      {
        id: 'front',
        label: 'FRONT-END',
        sections: [{
          heading: 'INCLUI',
          lines: ['HTML, CSS e JavaScript', 'WordPress e temas personalizados'],
        }],
      },
    ],
    lyra: {
      open: ['Ferramentas à mão.'],
      idle: ['A LUA escolhe o grupo.', 'O SOL abre.'],
    },
  },

  /**
   * 6 — CONTATO.
   *
   * O único Módulo em primeira pessoa, e o endereço está na tela no instante em que
   * ele abre. A LUA e o SOL são um segundo caminho até ele, nunca o único.
   */
  {
    slot: 6,
    id: 'contact',
    title: 'CONTATO',
    layout: 'list',
    pad: 'CONTATO',
    hint: 'CONTATO — Rotas verificadas para chegar até mim',
    /**
     * Uma frase, e nenhuma linha `dim`.
     *
     * O lead repetia o e-mail que já é o primeiro item da lista e ocupava o painel
     * inteiro — as três rotas não apareciam e o Screen avisava com `+2` no canto.
     * A conta é fixa: o corpo do slot 6 tem 96px, três rotas custam 45, e o que
     * sobra são três linhas. O que uma lista já diz, o texto acima dela não precisa
     * dizer de novo, e a cidade já está em QUEM.
     */
    lead: ['Para uma vaga, um projeto ou uma ideia incomum — escreva direto.'],
    unit: 'ROTA',
    items: [
      /* Primeiro item porque é a rota que funciona para quem está no celular e usa
         webmail — um `mailto:` ali não abre nada. O endereço continua logo abaixo:
         quando o envio falha, a mensagem na tela aponta para ele. */
      {
        id: 'write',
        label: 'Escrever agora',
        meta: 'FORMULÁRIO',
        act: { kind: 'form' },
        sections: [{ heading: 'FORMULÁRIO', lines: ['Abre um formulário nesta página.'] }],
      },
      {
        id: 'mail',
        label: 'fernandolinck@outlook.com',
        meta: 'EMAIL',
        act: { kind: 'mail', value: 'fernandolinck@outlook.com' },
        sections: [{ heading: 'EMAIL', lines: ['Toque na linha para escrever.'] }],
      },
      {
        id: 'ig',
        label: '@nan._.jin',
        meta: 'INSTAGRAM',
        act: { kind: 'url', value: 'https://instagram.com/nan._.jin' },
        sections: [{ heading: 'INSTAGRAM', lines: ['Toque na linha para abrir.'] }],
      },
      /* Ficou sem `act` por várias sessões, e de propósito: adivinhar um endereço do
         LinkedIn a partir de um nome é exatamente a invenção que o PRODUCT.md proíbe.
         O endereço veio dele em 2026-09-01 e a rota passou a agir no mesmo commit —
         que é a ordem certa, e a razão de a linha ter ficado inerte em vez de chutar. */
      {
        id: 'in',
        label: 'Fernando Linck',
        meta: 'LINKEDIN',
        act: { kind: 'url', value: 'https://www.linkedin.com/in/fernandolinck/' },
        sections: [{ heading: 'LINKEDIN', lines: ['Toque na linha para abrir.'] }],
      },
    ],
    lyra: {
      open: ['Mande o corvo.', 'Ele conhece o caminho.'],
      idle: ['O canal continua aberto.'],
    },
  },
]

/**
 * O conteúdo, no idioma **desta página**.
 *
 * Aqui é onde a segunda língua chega a todo mundo. `LOCALE` sai do `<html lang>` que
 * o build escreveu, então numa página `/en/` estes exports já vêm em inglês e nenhum
 * consumidor precisou saber que existe um segundo idioma: `scene.js`, `render.js`,
 * `flat.js`, `focus.js` e `mirror.js` seguem importando `MODULES` como sempre.
 *
 * A primeira tentativa traduziu **só o espelho**, e o resultado foi uma página em
 * inglês cuja Tela — a única coisa que o visitante de fato olha — continuava em
 * português. O idioma tinha chegado ao HTML que ninguém vê e parado antes do objeto.
 *
 * Em `node` não há documento, `LOCALE` é o padrão, e estes são o português cru. É o
 * que os testes leem e o que o build passa para `translate()` ao montar a outra
 * página, então a fonte continua sendo uma só em qualquer caminho.
 */
export const MODULES: readonly Module[] = LOCALE === 'en' ? translate(MODULES_PT) : MODULES_PT
export const WORKS: readonly Work[] = LOCALE === 'en' ? translate(WORKS_PT) : WORKS_PT
export const ECLIPSE = (LOCALE === 'en' ? translate(ECLIPSE_PT) : ECLIPSE_PT) as typeof ECLIPSE_PT
export const GAP: string = LOCALE === 'en' ? (EN[GAP_PT] ?? GAP_PT) : GAP_PT

/** O case de um projeto, no idioma desta página. */
export function caseOf(id: string): readonly Section[] {
  const pt = caseOfPT(id)
  return LOCALE === 'en' ? translate(pt) : pt
}

/**
 * O conteúdo **antes** de qualquer idioma, para quem precisa escolher o seu.
 *
 * O build monta as duas páginas no mesmo processo, e nesse processo os exports acima
 * já se decidiram — em `node` pelo padrão. Renderizar a página em inglês a partir
 * deles significaria traduzir o que talvez já esteja traduzido. Hoje isso é inofensivo
 * porque nenhuma tradução encadeia com outra, mas isso é sorte e não construção:
 * bastaria alguém traduzir "A" para "B" tendo "B" como chave. Quem escolhe idioma
 * parte daqui, e a tradução acontece exatamente uma vez.
 */
export const SOURCE = {
  modules: MODULES_PT,
  works: WORKS_PT,
  eclipse: ECLIPSE_PT,
  gap: GAP_PT,
  caseOf: caseOfPT,
} as const

/** O Módulo vivo. Slots são 1-based; o estado que os move é 0-based. */
export function moduleAt(index: number): Module {
  return MODULES[((index % MODULES.length) + MODULES.length) % MODULES.length]
}

/** As falas de LYRA para um índice 0-based. */
export function lyraAt(index: number): Lyra {
  return moduleAt(index).lyra
}

/** Um projeto por id, para a sobreposição. */
export function workById(id: string): Work | undefined {
  return WORKS.find(w => w.id === id)
}
