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

/** Uma página de um Item, alcançada girando o SOL. `lines` vazio é uma lacuna registrada. */
export type Section = { heading: string; lines: readonly string[] }

/** Para onde um item leva quando é aberto — pela tela, pelo teclado ou pelo toque. */
export type Act =
  | { kind: 'work'; value: string }
  | { kind: 'mail'; value: string }
  | { kind: 'url'; value: string }

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

export type Module = {
  slot: number
  id: string
  title: string
  /** Forma curta impressa acima da Tecla. ~96px de passo, daí as abreviações. */
  pad: string
  /** A linha que o rodapé da Tela mostra enquanto a Tecla está sob o ponteiro. */
  hint: string
  /** A visão geral. **Sempre na tela, nunca atrás de uma roda.** */
  lead: readonly string[]
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
  items: { max: 6, labelChars: 34, metaChars: 34 },
  section: { max: 6, lines: 5, lineChars: 58, headingChars: 20 },
  hintChars: 62,
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
export const GAP = 'Ainda não registrado.'

const gap = (heading: string): Section => ({ heading, lines: [] })

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
 * Três projetos, e apenas três.
 *
 * Decisão de Fernando em 2026-08-28. As quatro entradas que saíram — Bandas de
 * Bollinger, R U MINE?, Rifa Handbanners e Parize — eram trabalho real e checável,
 * com imagens, e continuam em `public/works/`. Não foram apagadas porque a decisão
 * foi de **recorte**, não de retratação, e um recorte é a coisa mais fácil de
 * reverter que existe.
 */
export const WORKS: readonly Work[] = [
  {
    no: '001',
    id: 'portfolio',
    title: 'Portfólio',
    kind: 'Site interativo',
    blurb: [
      'Um portfólio concebido como instrumento.',
      'Seis teclas acessam os módulos, a LUA percorre o',
      'conteúdo e o SOL aprofunda a seleção.',
    ],
  },
  {
    no: '002',
    id: 'graecus',
    title: 'Graecus',
    kind: 'Site institucional + blog',
    client: 'Graecus',
    images: ['/works/graecus-mdsale.jpg', '/works/graecus-namorados.jpg'],
    blurb: [
      'Site institucional e blog em WordPress com tema',
      'personalizado, sem page builder.',
    ],
  },
  {
    no: '003',
    id: 'miscelanea',
    title: 'Miscelânea',
    kind: 'Galeria de artes',
    empty: true,
    blurb: [
      'Uma galeria em construção para reunir pôsteres,',
      'composições e estudos visuais em um mesmo arquivo.',
    ],
  },
]

/** Quantos dos projetos já têm obra publicada. */
export const REAL_WORKS = WORKS.filter(w => !w.empty).length

/**
 * O case de um projeto, como as Sections que o SOL percorre.
 *
 * Separado de `WORKS` porque um case é longo e a lista é curta, e porque uma lacuna
 * declarada — uma Section sem linhas — precisa ser visível como *faltando* em vez de
 * silenciosamente ausente. Miscelânea não tem case: o estado vazio é o conteúdo
 * verdadeiro, e inventar títulos, datas ou obras seria a única forma de errar aqui.
 */
export function caseOf(id: string): readonly Section[] {
  if (id === 'portfolio') return [
    {
      heading: 'VISÃO GERAL',
      lines: [
        'Um portfólio concebido como instrumento. Em vez de',
        'percorrer páginas convencionais, a navegação acontece',
        'por meio de um artefato físico virtual.',
      ],
    },
    {
      heading: 'MOTIVO',
      lines: [
        'Como apresentar estratégia, mensagem, design, front-end',
        'e análise sem reduzir o percurso a uma lista de cargos',
        'ou ferramentas? A interface passa a ser a resposta.',
      ],
    },
    {
      heading: 'REFERÊNCIAS',
      lines: [
        'Mapas celestes, gravuras esotéricas, mecanismos',
        'analógicos e terminais monocromáticos, combinados como',
        'princípios de interação e materialidade.',
      ],
    },
    {
      heading: 'CONSTRUÇÃO',
      lines: [
        'Three.js cuida do objeto, dos materiais e da iluminação.',
        'Uma camada semântica em HTML mantém textos e controles',
        'legíveis, testáveis e acessíveis.',
      ],
    },
    {
      heading: 'INTERAÇÃO',
      lines: [
        'A LUA seleciona. O SOL abre. As seis teclas dão acesso',
        'direto. O enquadramento permanece controlado para',
        'preservar a legibilidade.',
      ],
    },
  ]
  if (id === 'graecus') return [
    {
      heading: 'VISÃO GERAL',
      lines: [
        'Site institucional e blog em WordPress com tema',
        'personalizado. Conecta posicionamento, oferta, prova,',
        'conteúdo e contato em uma sequência direta.',
      ],
    },
    {
      heading: 'CONTEXTO',
      lines: [
        'Era preciso explicar uma oferta extensa e',
        'multidisciplinar sem tornar a experiência densa',
        'ou fragmentada demais.',
      ],
    },
    {
      heading: 'CONSTRUÇÃO',
      lines: [
        'Tema WordPress próprio, sem page builder. Templates PHP',
        'para home, institucional, serviços, arquivo, categorias',
        'e artigos, com componentes reutilizáveis.',
      ],
    },
    {
      heading: 'BLOG',
      lines: [
        'Busca, filtros por categoria, atalhos temáticos e',
        'paginação. O template de artigo define a hierarquia de',
        'autoria, data, categorias e tempo de leitura.',
      ],
    },
    {
      heading: 'RESULTADO',
      lines: [
        'Um sistema que permite publicar novos serviços e',
        'conteúdos sem romper o sistema visual. Não há dados',
        'públicos de conversão ou tráfego.',
      ],
    },
    /* As capturas do site — hero, serviços, FAQ, arquivo, artigo e mobile — ainda não
       existem localmente. As duas imagens em `public/works/` são peças de social da
       Graecus, que é trabalho diferente para o mesmo cliente. */
    gap('CAPTURAS'),
  ]
  return [
    {
      heading: 'EM CONSTRUÇÃO',
      lines: [
        'Uma galeria em construção para reunir pôsteres,',
        'composições e estudos visuais em um mesmo arquivo.',
        'A primeira seleção será publicada em breve.',
      ],
    },
  ]
}

/* ---------------- os módulos ---------------- */

export const MODULES: readonly Module[] = [
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
    pad: 'QUEM',
    hint: 'QUEM — A perspectiva que ele traz',
    lead: [
      'FERNANDO LINCK — GROWTH, CRO E EXPERIÊNCIAS DIGITAIS.',
      'Estratégia, mensagem, design, front-end e análise.',
      'Experimentos de ponta a ponta: da pesquisa à implementação e ao aprendizado.',
    ],
    dim: ['Porto Alegre, Brasil. Português ou inglês.'],
    lyra: {
      open: ['A unidade despertou.', 'Comece aqui.'],
      idle: ['A LUA escolhe o item.', 'O SOL revela mais.'],
    },
  },

  {
    slot: 2,
    id: 'projects',
    title: 'PROJETOS',
    pad: 'PROJETOS',
    hint: 'PROJETOS — Trabalhos e o raciocínio por trás deles',
    lead: [
      'Gire a LUA para escolher e o SOL para ler.',
      'Toque no projeto na tela para abrir por inteiro.',
    ],
    unit: 'PROJETO',
    items: WORKS.map(w => ({
      id: w.id,
      label: w.title.toUpperCase(),
      meta: w.kind.toUpperCase(),
      act: { kind: 'work' as const, value: w.id },
      sections: caseOf(w.id),
    })),
    lyra: {
      open: ['Alguns sinais já chegaram.', 'Outros ainda viajam.'],
      idle: ['Gire a LUA para escolher.', 'O SOL abre.'],
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
    pad: 'TRAJETO',
    hint: 'TRAJETO — Onde ele trabalhou e do que cuidou',
    lead: [
      'O percurso em camadas, e as datas que as sustentam.',
      'Gire a LUA para percorrer.',
    ],
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
    /* `CRITÉR.` só existe no hardware — a Tela sempre escreve por extenso. */
    pad: 'CRITÉR.',
    hint: 'CRITÉRIOS — Como contexto vira trabalho terminado',
    lead: [
      'Cinco regras que sobrevivem às ferramentas.',
      'Gire a LUA para ler a próxima, o SOL para o porquê.',
    ],
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
    pad: 'HABILID.',
    hint: 'HABILIDADES — Com o que ele trabalha',
    lead: [
      'As ferramentas à mão, agrupadas pelo que fazem.',
      'Gire a LUA para percorrer a lista.',
    ],
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
      idle: ['Gire a LUA para', 'percorrer a lista.'],
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
    pad: 'CONTATO',
    hint: 'CONTATO — Rotas verificadas para chegar até mim',
    lead: [
      'Para uma vaga, um projeto ou uma ideia incomum que precise atravessar estratégia e execução:',
      'fernandolinck@outlook.com',
      'Escreva diretamente para mim. Sem formulário, sem funil.',
    ],
    dim: ['Porto Alegre, Brasil. Português ou inglês.'],
    unit: 'ROTA',
    items: [
      {
        id: 'mail',
        label: 'fernandolinck@outlook.com',
        meta: 'EMAIL',
        act: { kind: 'mail', value: 'fernandolinck@outlook.com' },
        sections: [{ heading: 'EMAIL', lines: ['Pressione o SOL para escrever.'] }],
      },
      {
        id: 'ig',
        label: '@nan._.jin',
        meta: 'INSTAGRAM',
        act: { kind: 'url', value: 'https://instagram.com/nan._.jin' },
        sections: [{ heading: 'INSTAGRAM', lines: ['Pressione o SOL para abrir.'] }],
      },
      /* Sem `act`: adivinhar um endereço do LinkedIn a partir de um nome é exatamente
         a invenção que o PRODUCT.md proíbe. Fica como texto até ele informar. */
      {
        id: 'in',
        label: 'Fernando Linck',
        meta: 'LINKEDIN',
        sections: [{ heading: 'LINKEDIN', lines: ['Endereço ainda não informado.'] }],
      },
    ],
    lyra: {
      open: ['Mande o corvo.', 'Ele conhece o caminho.'],
      idle: ['O canal continua aberto.'],
    },
  },
]

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
