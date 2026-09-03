/**
 * O portfólio em inglês.
 *
 * ## Por que um dicionário e não `t(pt, en)` como em `strings.ts`
 *
 * Porque `modules.ts` tem 755 linhas de dados com comentários densos entre elas, e
 * envolvê-lo numa função para receber `t` significaria reescrever o arquivo inteiro
 * por script, com chaves aninhadas, arrays dentro de objetos dentro de arrays. Essa é
 * a operação que quebra um arquivo em silêncio — e o arquivo em questão é o único
 * lugar onde o conteúdo do portfólio existe.
 *
 * Então o conteúdo não é tocado. Este arquivo mapeia português para inglês, e
 * `translate()` troca as folhas da árvore na hora de renderizar a página em inglês.
 * A garantia que em `strings.ts` vem do compilador aqui vem de um teste: ele percorre
 * `MODULES`, `WORKS`, `ECLIPSE` e todo case, e falha nomeando qualquer string visível
 * que não tenha entrada aqui. Uma frase nova em português que ninguém traduziu quebra
 * a suíte, não a página.
 *
 * **A chave é o texto em português.** Editar uma frase no `modules.ts` sem editar a
 * chave aqui faz o teste falhar apontando a frase órfã, que é o comportamento certo:
 * o inglês não deve seguir dizendo o que o português deixou de dizer.
 *
 * ## LUA e SOL não são traduzidos
 *
 * São os nomes **gravados** nos dois controles, como o CUTOFF de um sintetizador.
 * "Turn the MOON" mandaria o visitante procurar um controle chamado MOON, e a Plate
 * diz LUA — a heurística 2 da crítica de 2026-09-01 é exatamente esse desencontro
 * ("LUA/SOL/TECLAS é vocabulário inventado sem legenda na Plate"). Traduzir o texto
 * e não a gravação transformaria um problema de legenda em dois. **T-30 é onde essa
 * decisão deve ser revista**, junto com a legenda que falta — e provavelmente a
 * resposta certa é gravar os dois nomes, não traduzir um deles.
 *
 * ## Inglês americano, e por quê
 *
 * `analog`, `rigor`, `behavior`, `catalog` — não `analogue`, `rigour`, `behaviour`,
 * `catalogue`. A escolha em si é indiferente; a **mistura** não é. Uma página que
 * escreve "behaviour" ao lado de "Analytics" e "Organization" lê como texto montado
 * de pedaços, que é exatamente a impressão que uma versão traduzida não pode dar.
 *
 * Americano por alcance: é a variante que a maior parte do mercado de recrutamento
 * em tecnologia usa, e a que um leitor britânico lê sem tropeçar — o contrário não é
 * igualmente verdade.
 *
 * ## As linhas quebradas à mão
 *
 * Muitas `lines` são metade de uma frase, quebradas em ~58 caracteres porque o Screen
 * mede. Cada uma foi traduzida **como parte do parágrafo a que pertence** e depois
 * requebrada dentro do mesmo orçamento, não isoladamente. Traduzir fragmento por
 * fragmento produz inglês que só faz sentido remontado, e o Screen não remonta.
 */

/** Português → inglês. Toda string visível de `modules.ts` está aqui. */
export const EN: Readonly<Record<string, string>> = {
  /**
   * O nome não muda, e está aqui **por isso**.
   *
   * Uma entrada idêntica não é ruído: é a diferença entre "decidiram não traduzir" e
   * "esqueceram". O teste de cobertura exige que toda string visível apareça neste
   * arquivo, então a única forma de um nome próprio passar é alguém escrevê-lo.
   */
  'Fernando Linck': 'Fernando Linck',

  /* ---- QUEM ---------------------------------------------------------- */
  'QUEM': 'WHO',
  'QUEM — Growth, CRO e front-end, e como eu junto os três': 'WHO — Growth, CRO and front-end, and how they fit together',
  'GROWTH · CRO · EXPERIÊNCIAS DIGITAIS': 'GROWTH · CRO · DIGITAL PRODUCT',
  'ESTRATÉGIA': 'STRATEGY',
  'MENSAGEM': 'MESSAGING',
  'DESIGN': 'DESIGN',
  'FRONT-END': 'FRONT-END',
  'ANÁLISE': 'ANALYTICS',
  'Experimentos de ponta a ponta: da pesquisa à implementação e ao aprendizado.':
    'End-to-end experiments: from research to implementation to what was learned.',
  'Porto Alegre, Brasil.': 'Porto Alegre, Brazil.',

  /* Os fatos no registro que uma máquina lê — ver `entity` em modules.ts. Nomes de
     lugar e de empresa não mudam; o cargo e as disciplinas mudam. */
  'Growth, CRO e experiências digitais': 'Growth, CRO and digital product experiences',

  /* Os termos de `knowsAbout`. Vários são iguais nas duas línguas — CRO, Figma,
     WordPress, os nomes de linguagem — e estão aqui pelo mesmo motivo que o nome dele:
     entrada idêntica é a diferença entre "decidiram não traduzir" e "esqueceram". */
  'CRO': 'CRO',
  'Otimização de conversão': 'Conversion rate optimization',
  'Testes A/B': 'A/B testing',
  'Experimentação': 'Experimentation',
  'Landing pages': 'Landing pages',
  'Copy de conversão': 'Conversion copywriting',
  'UX/UI': 'UX/UI',
  'Figma': 'Figma',
  'Sistemas de design': 'Design systems',
  'HTML': 'HTML',
  'CSS': 'CSS',
  'JavaScript': 'JavaScript',
  'WordPress': 'WordPress',
  'Front-end': 'Front-end',
  'Porto Alegre': 'Porto Alegre',
  'Rio Grande do Sul': 'Rio Grande do Sul',
  'Brasil': 'Brazil',
  'A unidade despertou.': 'The unit is awake.',
  'Comece aqui.': 'Start here.',
  'As teclas escolhem': 'The keys choose',
  'o módulo.': 'the module.',

  /* ---- PROJETOS ------------------------------------------------------- */
  'PROJETOS': 'PROJECTS',
  'PROJETOS — Sites, landing pages e o raciocínio por trás': 'PROJECTS — Sites, landing pages, and the thinking behind them',
  'PROJETO': 'PROJECT',
  'PORTFÓLIO PESSOAL': 'PERSONAL PORTFOLIO',
  'SITE INTERATIVO': 'INTERACTIVE WEBSITE',
  'Site interativo': 'Interactive website',
  'Portfólio pessoal': 'Personal portfolio',
  'Um portfólio concebido como instrumento.': 'A portfolio conceived as an instrument.',
  'Seis teclas acessam os módulos, a LUA percorre o':
    'Six keys reach the modules, the LUA walks the',
  'conteúdo e o SOL aprofunda a seleção.':
    'content and the SOL opens what is selected.',

  'VISÃO GERAL': 'OVERVIEW',


  'CONSTRUÇÃO': 'BUILD',

  'REFERÊNCIAS': 'REFERENCES',
  'Mapas celestes, gravuras esotéricas, mecanismos':
    'Celestial maps, esoteric engravings, analog',


  'GRAECUS': 'GRAECUS',
  'Graecus': 'Graecus',
  'SITE INSTITUCIONAL + BLOG': 'CORPORATE WEBSITE + BLOG',
  'Site institucional + blog': 'Corporate website + blog',
  'Site institucional e blog em WordPress com tema':
    'A WordPress corporate website and blog on a theme built for it,',
  'personalizado, sem page builder.': 'hand-built, with no page builder.',






  'MISCELÂNEA': 'MISCELLANY',
  'Miscelânea': 'Miscellany',
  'GALERIA DE ARTES': 'ART GALLERY',
  'Galeria de artes': 'Art gallery',
  'EM CONSTRUÇÃO': 'IN PROGRESS',
  'Uma galeria em construção para reunir pôsteres,':
    'A gallery in progress, gathering posters, compositions',
  'composições e estudos visuais em um mesmo arquivo.':
    'and visual studies into a single archive.',
  'As primeiras peças já estão aqui; o arquivo cresce.':
    'The first pieces are here; the archive is growing.',

  'Alguns sinais já chegaram.': 'Some signals have landed.',
  'Outros ainda viajam.': 'Others are still coming.',
  'A LUA percorre a lista.': 'The LUA walks the list.',
  'Toque para abrir.': 'Press to open.',

  /* ---- TRAJETO -------------------------------------------------------- */
  'TRAJETO': 'PATH',
  'TRAJETO — Onde eu trabalhei e do que eu cuidei': 'PATH — Where I worked and what I looked after',
  'O percurso em camadas, e as datas que as sustentam.':
    'The path in layers, and the dates that hold them up.',
  'ETAPA': 'STAGE',
  'CAMADAS': 'LAYERS',
  'O PERCURSO': 'THE PATH',
  'ORIGEM': 'ORIGIN',
  'O percurso começa no design gráfico e na criação':
    'The path begins in graphic design and content',
  'de conteúdo.':
    'creation.',
  'EDITORIAL': 'EDITORIAL',
  'A produção editorial acrescenta rigor, consistência':
    'Editorial production adds rigor, consistency and',
  'e experiência com comunicação multilíngue.':
    'experience with multilingual communication.',
  'EXECUÇÃO': 'EXECUTION',
  'Marketing, landing pages, UX/UI e front-end':
    'Marketing, landing pages, UX/UI and front-end bring',
  'aproximam estratégia e execução.':
    'strategy and execution closer together.',
  'CONEXÃO': 'CONNECTION',
  'CRO e experimentação passam a conectar todas':
    'CRO and experimentation come to connect all of',
  'essas camadas.':
    'those layers.',
  'CRONOLOGIA': 'TIMELINE',
  'AGÊNCIAS': 'AGENCIES',
  'Agências e independente': 'Agency and freelance work',
  'MSC CROCIERE': 'MSC CROCIERE',
  'MSC Crociere': 'MSC Crociere',
  'NELOGICA': 'NELOGICA',
  'Nelogica': 'Nelogica',
  'Nenhuma camada': 'No layer was',
  'foi descartada.': 'thrown away.',
  'Gire a LUA para': 'Turn the LUA to',
  'acompanhar a sequência.': 'follow the sequence.',

  /* ---- CRITÉRIOS ------------------------------------------------------ */
  'CRITÉRIOS': 'CRITERIA',
  'CRITÉR.': 'CRITERIA',
  'CRITÉRIOS — Como eu transformo contexto em trabalho pronto': 'CRITERIA — How I turn context into finished work',
  'Os dados decidem. O encanto também conta.': 'The data decides. Delight counts too.',
  'CRITÉRIO': 'CRITERION',

  'OS DADOS ORIENTAM A DECISÃO': 'THE DATA GUIDES THE DECISION',
  'POR QUÊ': 'WHY',
  'As evidências e o comportamento observado definem o':
    'Evidence and observed behavior set the starting point.',
  'ponto de partida. A solução precisa melhorar o que':
    'The solution has to improve what matters without giving',
  'importa sem abrir mão de clareza, personalidade e':
    'up clarity, personality and the pleasure of using',
  'prazer de uso.':
    '',

  'O PROBLEMA VEM ANTES': 'THE PROBLEM COMES FIRST',
  'Escolher o formato cedo demais pode produzir uma boa':
    'Choosing the format too early can produce a good',
  'solução para a pergunta errada.':
    'solution to the wrong question.',

  'UM SÓ SISTEMA': 'ONE SINGLE SYSTEM',
  'Mensagem, interface e aquisição formam um só sistema.':
    'Messaging, interface and acquisition are one system.',
  'A promessa feita no anúncio precisa continuar':
    'The promise made in the ad has to stay true on the',
  'verdadeira na landing page e no produto.':
    'landing page and in the product.',

  'REDUZIR INCERTEZA': 'REDUCE UNCERTAINTY',
  'Um experimento existe para reduzir incerteza. O':
    'An experiment exists to reduce uncertainty. The aim is',
  'objetivo não é provar que uma ideia estava certa,':
    'not to prove an idea was right, but to produce evidence',
  'mas produzir evidência para decidir o próximo passo.':
    'for deciding the next step.',

  'MÉTRICA QUE MUDA DECISÃO': 'A METRIC THAT MOVES A DECISION',
  'Uma métrica só importa quando muda uma decisão. Antes':
    'A metric only matters when it changes a decision. Before',
  'da medição, é preciso definir o que faria o trabalho':
    'measuring, you have to define what would make the work carry',
  'avançar, mudar de direção ou parar.':
    'on, change direction or stop.',

  'Algumas regras sobrevivem': 'Some rules outlive',
  'às ferramentas.': 'the tools.',
  'Gire a LUA para o próximo.': 'Turn the LUA for the next.',
  'O SOL explica o porquê.': 'The SOL explains why.',

  /* ---- HABILIDADES ---------------------------------------------------- */
  'HABILIDADES': 'SKILLS',
  'HABILID.': 'SKILLS',
  'HABILIDADES — CRO, growth, UX/UI e front-end, na prática': 'SKILLS — CRO, growth, UX/UI and front-end, in practice',
  'As ferramentas à mão, agrupadas pelo que fazem.':
    'The tools at hand, grouped by what they do.',
  'GRUPO': 'GROUP',
  'INCLUI': 'INCLUDES',
  'CRO E EXPERIMENTAÇÃO': 'CRO AND EXPERIMENTATION',
  'CRO e experimentação · Testes A/B': 'CRO and experimentation · A/B tests',
  'Pesquisa quantitativa e qualitativa': 'Quantitative and qualitative research',
  'Análise de funil': 'Funnel analysis',
  'GROWTH E AQUISIÇÃO': 'GROWTH AND ACQUISITION',
  'Growth marketing': 'Growth marketing',
  'Landing pages e copy de conversão': 'Landing pages and conversion copy',
  'DESIGN E INTERFACE': 'DESIGN AND INTERFACE',
  'UX/UI e prototipação · Figma': 'UX/UI and prototyping · Figma',
  'Sistemas de design e bibliotecas de componentes': 'Design systems and component libraries',
  'HTML, CSS e JavaScript': 'HTML, CSS and JavaScript',
  'WordPress e temas personalizados': 'WordPress and custom themes',
  'Ferramentas à mão.': 'Tools at hand.',
  'A LUA escolhe o grupo.': 'The LUA picks the group.',
  'O SOL abre.': 'The SOL opens.',

  /* ---- CONTATO -------------------------------------------------------- */
  'CONTATO': 'CONTACT',
  'CONTATO — Rotas verificadas para chegar até mim': 'CONTACT — Verified routes to reach me',
  'Para uma vaga, um projeto ou uma ideia incomum — escreva direto.':
    'For a role, a project or an unusual idea — write directly.',
  'ROTA': 'ROUTE',
  'Escrever agora': 'Write now',
  'FORMULÁRIO': 'FORM',
  'Abre um formulário nesta página.': 'Opens a form on this page.',
  'EMAIL': 'EMAIL',
  'Toque na linha para escrever.': 'Press the row to write.',
  'INSTAGRAM': 'INSTAGRAM',
  'Toque na linha para abrir.': 'Press the row to open.',
  'LINKEDIN': 'LINKEDIN',
  'Mande o corvo.': 'Send the raven.',
  'Ele conhece o caminho.': 'He knows the way.',
  'O canal continua aberto.': 'The channel stays open.',

  /* ---- ECLIPSE, e a lacuna declarada ---------------------------------- */
  'ECLIPSE DA LUA': 'ECLIPSE OF THE LUA',
  'Você levou a luz de volta ao escuro,': 'You carried the light back into the dark,',
  'e a sétima marca acendeu.': 'and the seventh mark lit up.',
  'ECLIPSE DO SOL': 'ECLIPSE OF THE SOL',
  'Você trouxe a luz de volta ao dia,': 'You brought the light back into the day,',
  'SINAL ENCONTRADO': 'SIGNAL FOUND',
  'Mande um print desta tela.': 'Send a screenshot of this screen.',
  'ABRIR O INSTAGRAM  ·  @NAN._.JIN': 'OPEN INSTAGRAM  ·  @NAN._.JIN',

  /**
   * A lacuna declarada.
   *
   * A crítica de 2026-09-01 chamou isto de a coisa mais empregável do site: uma
   * ausência dita em voz alta em vez de preenchida com invenção. O inglês tem de
   * fazer a mesma coisa — declarar, não pedir desculpa, não prometer data.
   */
  'Ainda não registrado.': 'Not recorded yet.',

  /* Graecus e o portfólio, na mesma régua dos quatro — 2026-09-02 */
  'Site institucional e blog de uma consultoria de':
    'A corporate website and blog for a growth consultancy:',
  'growth: seis linhas de serviço, de mídia paga a':
    'six service lines, from paid media to data',
  'engenharia de dados, sob uma marca só.':
    'engineering, under a single brand.',
  'Cada linha tem a própria pilha — Google e Meta na':
    'Each line has its own stack — Google and Meta in',
  'mídia, Hubspot e RD no CRM, BigQuery e Databricks':
    'media, Hubspot and RD in CRM, BigQuery and',
  'nos dados. Escritas em coluna, as seis viram um':
    'Databricks in data. Written as a column, the six',
  'inventário de logos e nenhuma decisão.':
    'become an inventory of logos and no decision.',
  'Cada serviço é um cartão e as ferramentas são':
    'Each service is a card and the tools are labels',
  'etiquetas dentro dele. Tema WordPress próprio, sem':
    'inside it. A custom WordPress theme, with no page',
  'page builder: templates PHP para home, serviços,':
    'builder: PHP templates for home, services, archive,',
  'arquivo, categorias e artigos, com componentes':
    'categories and articles, all on shared',
  'reutilizáveis.': 'components.',
  'O BLOG': 'THE BLOG',
  'Busca, filtro por categoria, atalhos temáticos e':
    'Search, category filter, thematic shortcuts and',
  'paginação, todos sobre um único template de artigo.':
    'pagination, all on one article template.',

  'Um portfólio que é um instrumento: uma tela, sem':
    'A portfolio that is an instrument: one screen, no',
  'scroll e sem rota, com o conteúdo morando no display':
    'scroll and no routes, with the content living on',
  'do próprio aparelho.': 'the device display itself.',
  'O MOTIVO': 'THE REASON',
  'Estratégia, mensagem, design, front-end e análise na':
    'Strategy, messaging, design, front-end and analytics',
  'mesma pessoa viram uma lista de cargos quando escritas':
    'in one person become a list of job titles when',
  'em coluna. Aqui são a coisa que o visitante opera':
    'written as a column. Here they are the thing the',
  'antes de abrir qualquer case.':
    'visitor operates before opening any case.',
  'Three.js desenha o objeto. O conteúdo vive num só':
    'Three.js draws the object. The content lives in one',
  'arquivo e é lido duas vezes — pela Tela e por um':
    'file and is read twice — by the Screen and by an',
  'espelho em HTML, pré-renderizado no build. Um':
    'HTML mirror, pre-rendered at build time. A crawler',
  'rastreador lia 465 caracteres; passou a ler 5.675.':
    'used to read 465 characters; it now reads 5,675.',
  'analógicos e terminais monocromáticos. O objeto de':
    'analog mechanisms and monochrome terminals. The',
  'referência é um pedal da Old Blood Noise Endeavors.':
    'reference object is an Old Blood Noise Endeavors pedal.',

  /* ---------------- os quatro sites da parceria com Eduardo Braga ----------------

     Um case aqui é uma decisão contada, e a régua é o leitor: alguém que já sabe o que
     é um acordeão, um tema escuro e um arquivo do Figma. **Nenhuma frase existe para
     justificar uma técnica padrão** — Fernando cortou três dessas em 2026-09-02 e
     chamou o tom de noob talk, com razão. O que sobra é o que o leitor não sabe: o
     mercado do cliente, a restrição e a escolha. O inglês segue a mesma régua, e onde a
     virada não sobrevive à tradução literal a frase foi refeita em inglês. */

  'CMP INOX': 'CMP INOX',
  'CMP Inox': 'CMP Inox',
  'SITE INSTITUCIONAL': 'CORPORATE WEBSITE',
  'Site institucional': 'Corporate website',
  'Site institucional de uma distribuidora de aço inox,':
    'A corporate website for a stainless steel supplier, with',
  'com catálogo, tabelas técnicas e orçamento.':
    'a catalog, technical tables and a quote form.',

  'MAIARA TEIXEIRA': 'MAIARA TEIXEIRA',
  'Maiara Teixeira': 'Maiara Teixeira',
  'Maiara Teixeira Advocacia': 'Maiara Teixeira Advocacia',
  'SITE DE ADVOCACIA': 'LAW FIRM WEBSITE',
  'Site de advocacia': 'Law firm website',
  'Site de uma advocacia de direito imobiliário e':
    'A site for a real estate and succession law',
  'sucessões, com agendamento e tema claro e escuro.':
    'practice, with booking and a light and dark theme.',

  'ANELISE PORTO': 'ANELISE PORTO',
  'Anelise Porto': 'Anelise Porto',
  'Anelise Porto Advocacia': 'Anelise Porto Advocacia',
  'Site de uma advocacia generalista, com seis áreas':
    'A site for a general law practice, with six areas',
  'do direito e contato direto por WhatsApp.':
    'of law and direct contact over WhatsApp.',

  'HÉLDER RODRIGUES': 'HÉLDER RODRIGUES',
  'Hélder Rodrigues': 'Hélder Rodrigues',
  'LANDING PAGE': 'LANDING PAGE',
  'Landing page': 'Landing page',
  'Landing page de um personal trainer, desenhada no':
    'A landing page for a personal trainer, designed in',
  'Figma e construída em React.': 'Figma and built in React.',

  /* títulos compartilhados pelos quatro */
  'A DECISÃO': 'THE DECISION',
  'PARCERIA': 'PARTNERSHIP',
  'Trabalho feito em parceria com Eduardo Braga.':
    'Work made in partnership with Eduardo Braga.',

  /* CMP Inox */
  'Uma distribuidora de aço inox com trinta anos de':
    'A stainless steel supplier, thirty years in',
  'mercado, que vendia por telefone e por indicação.':
    'business, that sold by phone and by referral.',
  'O site é para o comprador que já sabe o que quer e':
    'The site is for the buyer who already knows what they',
  'só precisa conferir se a liga está lá.':
    'want and only need to check the alloy is there.',
  'O COMPRADOR': 'THE BUYER',
  'Ninguém abre um catálogo de aço por curiosidade.':
    'Nobody opens a steel catalog out of curiosity. They',
  'Ele chega com uma liga e uma bitola anotadas, e a':
    'arrive with an alloy and a gauge written down, and',
  'hierarquia responde a isso: produto antes de':
    'the hierarchy answers that: product before company,',
  'empresa, tabela técnica antes de argumento.':
    'technical table before argument.',
  'Nenhum CMS. Projeto no Webflow com o sistema de':
    'No CMS. Built in Webflow on the Client-First class',
  'classes Client-First, exportado e servido como':
    'system, exported and served as static files, with',
  'arquivos estáticos, com sitemap versionado junto.':
    'the sitemap versioned alongside them.',
  'As composições químicas são arquivo, não imagem.':
    'The chemical compositions are a file, not an image.',
  'MEDIÇÃO': 'MEASUREMENT',
  'GA4 em todas as páginas desde a primeira versão. O':
    'GA4 on every page from the first version. The form',
  'formulário qualifica antes do contato: empresa,':
    'qualifies before the contact does: company,',
  'segmento e canal preferido.': 'segment and preferred channel.',

  /* Maiara Teixeira */
  'Advocacia de direito imobiliário e sucessões, em':
    'A real estate and succession law practice in',
  'Cachoeirinha. Uma página só, com tudo dentro dela.':
    'Cachoeirinha, Brazil. One page, everything inside.',
  'QUEM PROCURA': 'WHO COMES LOOKING',
  'Quem procura um advogado de inventário costuma':
    'Someone looking for a probate lawyer usually comes',
  'chegar num momento difícil, comparando alguns nomes':
    'at a difficult time, weighing a few names and looking',
  'e buscando quem já tenha feito aquilo antes.':
    'for whoever has done it before.',
  'O site foi construído para responder a isso.':
    'The site was built to answer that.',
  'Sem framework e sem etapa de build: um HTML, um CSS':
    'No framework and no build step: one HTML, one CSS',
  'e um JavaScript, servidos estáticos. Formulário':
    'and one JavaScript, served static. Its own form,',
  'próprio e WhatsApp com a mensagem pré-preenchida':
    'and WhatsApp with the message pre-filled by',
  'por assunto.': 'subject.',

  /* Anelise Porto */
  'Advocacia generalista em Cachoeirinha, com seis':
    'A general law practice in Cachoeirinha, Brazil,',
  'áreas do direito em uma página.':
    'with six areas of law on one page.',
  'O PROBLEMA': 'THE PROBLEM',
  'Seis áreas disputam a mesma atenção. Listar as seis':
    'Six areas compete for the same attention. Listing',
  'com o mesmo peso não ajuda ninguém a escolher, e':
    'all six at equal weight helps nobody choose, and',
  'esconder qualquer uma perde justamente o cliente':
    'hiding any of them loses exactly the client who',
  'que entrou por ela.': 'came in through it.',
  'As áreas abrem no lugar, uma de cada vez, e a':
    'The areas open in place, one at a time, and the',
  'página inteira vem dentro do HTML servido. Sem':
    'whole page comes inside the HTML served. No',
  'framework e sem build.': 'framework and no build.',
  'UMA ROTA SÓ': 'ONE ROUTE ONLY',
  'Sem formulário: o site inteiro leva ao WhatsApp,':
    'No form: the whole site leads to WhatsApp, repeated',
  'repetido a cada seção. A promessa do escritório é':
    'in every section. The practice promises a fast',
  'resposta rápida, e a rota é única por isso.':
    'answer, and that is why there is only one route.',

  /* Hélder Rodrigues */
  'Landing page de um personal trainer, construída em':
    'A landing page for a personal trainer, built in',
  'React a partir de um desenho feito no Figma.':
    'React from a design made in Figma.',
  'O QUE SE VENDE': 'WHAT IS BEING SOLD',
  'Treino personalizado não se experimenta antes de':
    'You cannot try personal training before buying it.',
  'comprar. O que o cliente avalia é o método.':
    'What the client judges is the method.',
  'Avaliação, plano, monitorização e ajuste viram':
    'Assessment, plan, monitoring and adjustment become',
  'etapas numeradas, ao lado de um painel de números.':
    'numbered steps, beside a panel of numbers.',
  'React 19 com Vite e Tailwind, em treze componentes,':
    'React 19 with Vite and Tailwind, in thirteen',
  'e um componente dedicado às meta tags.':
    'components, one of them dedicated to the meta tags.',

}

/**
 * Campos que **não** são texto para ler, e portanto não se traduzem.
 *
 * `value` é o alvo de um `Act` — um id de projeto, um endereço de e-mail, uma URL.
 * Traduzir um deles não deixaria a página em inglês: deixaria o LinkedIn quebrado.
 *
 * `kind` **não** está aqui, e a primeira versão punha. O nome colide: em `Act` ele é
 * um token interno (`'work'`, `'mail'`), mas em `Work` ele é a linha que o visitante
 * lê sob o título — "Site interativo". Excluir os dois deixou o tipo de cada projeto
 * em português na página inglesa. Os tokens do `Act` sobrevivem por não terem entrada
 * no dicionário, que é o mesmo motivo pelo qual qualquer string não traduzida passa
 * inteira: a ausência de chave já é a exclusão.
 */
const OPAQUE = new Set(['id', 'url', 'layout', 'value', 'images', 'no', 'year'])

/**
 * Os quatro valores que `Act.kind` pode ter.
 *
 * `kind` precisa ser traduzível porque em `Work` ele é a linha que o visitante lê —
 * "Site interativo". Em `Act` é um token interno. O nome do campo colide, então a
 * exclusão é pelo **valor**, que é o único lugar onde os dois não se parecem.
 */
const ACT_KINDS = new Set(['work', 'mail', 'url', 'form'])

/** Uma string que não é prosa: endereço, handle, marca. */
const isOpaqueText = (s: string) =>
  /^https?:\/\//.test(s) || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) || /^@[\w._]+$/.test(s)

/**
 * O mesmo conteúdo, em inglês.
 *
 * Percorre a árvore e troca **só as folhas de texto**, preservando a forma: mesmos
 * campos, mesma quantidade de linhas, mesma ordem. O Screen mede o que recebe, então
 * uma tradução que devolvesse três linhas onde havia duas mudaria o layout sem que
 * ninguém pedisse.
 *
 * Uma string sem entrada volta como está. Isso é deliberado — a página em inglês com
 * uma frase em português é feia, mas uma página que estoura é pior, e o teste em
 * `modules.test.ts` falha antes de qualquer uma das duas chegar a existir.
 */
export function translate<V>(value: V, dict: Readonly<Record<string, string>> = EN, key = ''): V {
  if (typeof value === 'string') {
    if (OPAQUE.has(key) || isOpaqueText(value)) return value
    if (key === 'kind' && ACT_KINDS.has(value)) return value
    return (dict[value] ?? value) as unknown as V
  }
  if (Array.isArray(value)) return value.map(v => translate(v, dict, key)) as unknown as V
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value)) out[k] = translate(v, dict, k)
    return out as V
  }
  return value
}

/**
 * Toda string visível de uma árvore de conteúdo, para o teste de cobertura.
 *
 * Mesma travessia de `translate`, mesmas exclusões — de propósito. Se as duas
 * discordassem, o teste afirmaria a cobertura de um conjunto que a tradução não usa.
 */
export function visibleStrings(value: unknown, key = '', into = new Set<string>()): Set<string> {
  if (typeof value === 'string') {
    const token = key === 'kind' && ACT_KINDS.has(value)
    if (!OPAQUE.has(key) && !token && !isOpaqueText(value) && /[a-zA-ZÀ-ÿ]/.test(value)) into.add(value)
    return into
  }
  if (Array.isArray(value)) { value.forEach(v => visibleStrings(v, key, into)); return into }
  if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) visibleStrings(v, k, into)
  }
  return into
}
