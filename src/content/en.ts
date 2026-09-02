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
  'QUEM — A perspectiva que ele traz': 'WHO — The perspective he brings',
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
  'Estratégia': 'Strategy',
  'Mensagem': 'Messaging',
  'Front-end': 'Front-end',
  'Análise': 'Analytics',
  'Porto Alegre': 'Porto Alegre',
  'Rio Grande do Sul': 'Rio Grande do Sul',
  'Brasil': 'Brazil',
  'Design': 'Design',
  'A unidade despertou.': 'The unit has woken.',
  'Comece aqui.': 'Start here.',
  'As teclas escolhem': 'The keys choose',
  'o módulo.': 'the module.',

  /* ---- PROJETOS ------------------------------------------------------- */
  'PROJETOS': 'PROJECTS',
  'PROJETOS — Trabalhos e o raciocínio por trás deles': 'PROJECTS — Work, and the thinking behind it',
  'PROJETO': 'PROJECT',
  'PORTFÓLIO': 'PORTFOLIO',
  'SITE INTERATIVO': 'INTERACTIVE SITE',
  'Site interativo': 'Interactive site',
  'Portfólio': 'Portfolio',
  'Um portfólio concebido como instrumento.': 'A portfolio conceived as an instrument.',
  'Seis teclas acessam os módulos, a LUA percorre o':
    'Six keys reach the modules, the LUA walks the',
  'conteúdo e o SOL aprofunda a seleção.':
    'content and the SOL goes deeper into it.',

  'VISÃO GERAL': 'OVERVIEW',
  'Um portfólio concebido como instrumento. Em vez de':
    'A portfolio conceived as an instrument. Instead of',
  'percorrer páginas convencionais, a navegação acontece':
    'moving through conventional pages, navigation happens',
  'por meio de um artefato físico virtual.':
    'by way of a virtual physical artefact.',

  'MOTIVO': 'WHY',
  'Como apresentar estratégia, mensagem, design, front-end':
    'How do you present strategy, messaging, design, front-end',
  'e análise sem reduzir o percurso a uma lista de cargos':
    'and analytics without reducing the path to a list of job',
  'ou ferramentas? A interface passa a ser a resposta.':
    'titles or tools? The interface becomes the answer.',

  'CONSTRUÇÃO': 'BUILD',
  'Three.js cuida do objeto, dos materiais e da iluminação.':
    'Three.js handles the object, its materials and its light.',
  'Uma camada semântica em HTML mantém textos e controles':
    'A semantic HTML layer keeps text and controls readable,',
  'legíveis, testáveis e acessíveis.':
    'testable and accessible.',

  'REFERÊNCIAS': 'REFERENCES',
  'Mapas celestes, gravuras esotéricas, mecanismos':
    'Celestial maps, esoteric engravings, analogue',
  'analógicos e terminais monocromáticos, combinados como':
    'mechanisms and monochrome terminals, combined as',
  'princípios de interação e materialidade.':
    'principles of interaction and materiality.',

  'INTERAÇÃO': 'INTERACTION',
  'A LUA seleciona. O SOL abre. As seis teclas dão acesso':
    'The LUA selects. The SOL opens. The six keys give direct',
  'direto. O enquadramento permanece controlado para':
    'access. The framing stays controlled in order to',
  'preservar a legibilidade.':
    'preserve legibility.',

  'GRAECUS': 'GRAECUS',
  'Graecus': 'Graecus',
  'SITE INSTITUCIONAL + BLOG': 'COMPANY SITE + BLOG',
  'Site institucional + blog': 'Company site + blog',
  'Site institucional e blog em WordPress com tema':
    'A WordPress company site and blog on a custom theme,',
  'personalizado. Conecta posicionamento, oferta, prova,':
    'connecting positioning, offer, proof, content and',
  'conteúdo e contato em uma sequência direta.':
    'contact in one direct sequence.',
  'personalizado, sem page builder.': 'custom-built, with no page builder.',

  'CONTEXTO': 'CONTEXT',
  'Era preciso explicar uma oferta extensa e':
    'A wide, multidisciplinary offer had to be explained',
  'multidisciplinar sem tornar a experiência densa':
    'without making the experience too dense or too',
  'ou fragmentada demais.':
    'fragmented.',

  'Tema WordPress próprio, sem page builder. Templates PHP':
    'An own WordPress theme, no page builder. PHP templates',
  'para home, institucional, serviços, arquivo, categorias':
    'for home, company, services, archive, categories and',
  'e artigos, com componentes reutilizáveis.':
    'articles, with reusable components.',

  'BLOG': 'BLOG',
  'Busca, filtros por categoria, atalhos temáticos e':
    'Search, category filters, thematic shortcuts and',
  'paginação. O template de artigo define a hierarquia de':
    'pagination. The article template sets the hierarchy of',
  'autoria, data, categorias e tempo de leitura.':
    'author, date, categories and reading time.',

  'RESULTADO': 'OUTCOME',
  'Um sistema que permite publicar novos serviços e':
    'A system that allows new services and content to be',
  'conteúdos sem romper o sistema visual. Não há dados':
    'published without breaking the visual system. There is',
  'públicos de conversão ou tráfego.':
    'no public conversion or traffic data.',

  'CAPTURAS': 'SCREENS',
  'Home, serviços, arquivo do blog, um artigo, o FAQ':
    'Home, services, the blog archive, an article, the FAQ',
  'aberto e a home em mobile.':
    'open, and the home page on mobile.',

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
  'TRAJETO — Onde ele trabalhou e do que cuidou': 'PATH — Where he worked and what he looked after',
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
    'Editorial production adds rigour, consistency and',
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
  'Agências e independente': 'Agencies and freelance',
  'MSC CROCIERE': 'MSC CROCIERE',
  'MSC Crociere': 'MSC Crociere',
  'NELOGICA': 'NELOGICA',
  'Nelogica': 'Nelogica',
  'Nenhuma camada': 'No layer here',
  'foi descartada.': 'was discarded.',
  'Gire a LUA para': 'Turn the LUA to',
  'acompanhar a sequência.': 'follow the sequence.',

  /* ---- CRITÉRIOS ------------------------------------------------------ */
  'CRITÉRIOS': 'CRITERIA',
  'CRITÉR.': 'CRITERIA',
  'CRITÉRIOS — Como contexto vira trabalho terminado': 'CRITERIA — How context becomes finished work',
  'Os dados decidem. O encanto também conta.': 'The data decides. Delight counts too.',
  'CRITÉRIO': 'CRITERION',

  'OS DADOS ORIENTAM A DECISÃO': 'THE DATA GUIDES THE DECISION',
  'POR QUÊ': 'WHY',
  'As evidências e o comportamento observado definem o':
    'Evidence and observed behaviour set the starting point.',
  'ponto de partida. A solução precisa melhorar o que':
    'The solution has to improve what matters without giving',
  'importa sem abrir mão de clareza, personalidade e':
    'up clarity, personality and the pleasure of using the',
  'prazer de uso.':
    'thing.',

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
    'measuring, you have to define what would make the work',
  'avançar, mudar de direção ou parar.':
    'go on, change direction or stop.',

  'Algumas regras sobrevivem': 'Some rules outlive',
  'às ferramentas.': 'the tools.',
  'Gire a LUA para o próximo.': 'Turn the LUA for next.',
  'O SOL explica o porquê.': 'The SOL explains why.',

  /* ---- HABILIDADES ---------------------------------------------------- */
  'HABILIDADES': 'SKILLS',
  'HABILID.': 'SKILLS',
  'HABILIDADES — Com o que ele trabalha': 'SKILLS — What he works with',
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

  /* ---------------- os quatro sites da parceria com Eduardo Braga ---------------- */

  'CMP INOX': 'CMP INOX',
  'CMP Inox': 'CMP Inox',
  'SITE INSTITUCIONAL': 'COMPANY SITE',
  'Site institucional': 'Company site',
  'Site institucional de uma distribuidora de aço inox,':
    'A company site for a stainless steel supplier, with',
  'com catálogo, tabelas técnicas e orçamento.':
    'a catalogue, technical tables and a quote form.',
  'Site institucional de uma distribuidora de aço':
    'A company site for a stainless steel supplier with',
  'inoxidável com mais de trinta anos de mercado.':
    'more than thirty years in the market. A catalogue,',
  'Catálogo, tabelas técnicas e pedido de orçamento.':
    'technical tables and a request for a quote.',
  'Quem compra aço inox chega sabendo a liga e a bitola':
    'Whoever buys stainless steel arrives knowing the',
  'de que precisa. O site tinha de responder à':
    'alloy and the gauge. The site had to answer the',
  'especificação antes de argumentar sobre a empresa.':
    'specification before arguing about the company.',
  'Projeto no Webflow com o sistema de classes':
    'Built in Webflow on the Client-First class system,',
  'Client-First, exportado e servido como estático.':
    'exported and served as a static site. No CMS to',
  'Sem CMS a manter e sem banco no caminho.':
    'maintain and no database in the way.',
  'MEDIÇÃO': 'MEASUREMENT',
  'O GA4 entrou no mesmo dia da primeira versão e em':
    'GA4 went in on the same day as the first version',
  'todas as páginas, não como etapa posterior. O':
    'and on every page, not as a later step. The form',
  'formulário pede segmento e canal de contato, e':
    'asks for the segment and the preferred channel,',
  'qualifica antes do primeiro telefonema. Não há':
    'and qualifies before the first call. There is no',
  'dados públicos de conversão ou tráfego.':
    'public conversion or traffic data.',
  'PARCERIA': 'PARTNERSHIP',
  'Trabalho feito em parceria com Eduardo Braga.':
    'Work made in partnership with Eduardo Braga.',
  'Home, catálogo, tabelas de composição química,':
    'Home, catalogue, chemical composition tables,',
  'contato e a home em mobile.': 'contact and the home on mobile.',

  'MAIARA TEIXEIRA': 'MAIARA TEIXEIRA',
  'Maiara Teixeira': 'Maiara Teixeira',
  'Maiara Teixeira Advocacia': 'Maiara Teixeira Advocacia',
  'SITE DE ADVOCACIA': 'LAW PRACTICE SITE',
  'Site de advocacia': 'Law practice site',
  'Site de uma advocacia de direito imobiliário e':
    'A site for a real estate and succession law',
  'sucessões, com agendamento e tema claro e escuro.':
    'practice, with booking and a light and dark theme.',
  'Site de uma advocacia especializada em direito':
    'A site for a practice specialised in real estate',
  'imobiliário e sucessões, em Cachoeirinha, RS.':
    'and succession law, in Cachoeirinha, Brazil.',
  'Quem procura advogado para um inventário ou a compra':
    'Whoever looks for a lawyer for an estate or a',
  'de um imóvel decide por confiança. A página precisa':
    'property purchase decides on trust. The page has',
  'mostrar competência antes de pedir o contato.':
    'to show competence before asking for contact.',
  'HTML, CSS e JavaScript escritos à mão, sem framework':
    'HTML, CSS and JavaScript written by hand, with no',
  'e sem etapa de build. Uma página com âncoras, servida':
    'framework and no build step. One page with anchors,',
  'estática — o conteúdo vem dentro do HTML. Tem tema':
    'served static — the content comes inside the HTML.',
  'claro e escuro, navegação mobile própria e um FAQ':
    'It has a light and dark theme, its own mobile',
  'que abre no lugar.': 'navigation and a FAQ that opens in place.',
  'CONVERSÃO': 'CONVERSION',
  'Formulário de contato e WhatsApp com a mensagem já':
    'A contact form, and WhatsApp with the message',
  'escrita, para o visitante não começar de uma tela':
    'already written so the visitor does not start',
  'em branco. Não há dados públicos de conversão.':
    'from blank. There is no public conversion data.',
  'Home, áreas do direito, como funciona, contato e a':
    'Home, areas of law, how it works, contact and',
  'home em mobile.': 'the home on mobile.',

  'ANELISE PORTO': 'ANELISE PORTO',
  'Anelise Porto': 'Anelise Porto',
  'Anelise Porto Advocacia': 'Anelise Porto Advocacia',
  'Site de uma advocacia generalista, com seis áreas':
    'A site for a general law practice, with six areas',
  'do direito e contato direto por WhatsApp.':
    'of law and direct contact over WhatsApp.',
  'Site de uma advocacia generalista em Cachoeirinha,':
    'A site for a general law practice in Cachoeirinha,',
  'RS, com seis áreas do direito em uma página.':
    'Brazil, with six areas of law on one page.',
  'Seis áreas competem pela mesma atenção. Listar todas':
    'Six areas compete for the same attention. Listing',
  'com o mesmo peso não ajuda a escolher, e esconder':
    'them all at equal weight does not help anyone',
  'qualquer uma perde o cliente que veio por ela.':
    'choose, and hiding one loses the client it drew.',
  'HTML, CSS e JavaScript à mão, sem framework. As áreas':
    'HTML, CSS and JavaScript by hand, with no framework.',
  'abrem no lugar, uma de cada vez, e a página inteira':
    'The areas open in place, one at a time, and the',
  'chega dentro do HTML servido.':
    'whole page arrives inside the HTML that is served.',
  'Uma rota só, repetida: falar agora no WhatsApp. Sem':
    'One route, repeated: talk now on WhatsApp. No',
  'formulário, porque a resposta rápida é o argumento.':
    'form, because the quick answer is the argument.',
  'Não há dados públicos de conversão.':
    'There is no public conversion data.',
  'Home, áreas do direito, como funciona, chamada final':
    'Home, areas of law, how it works, the closing call',
  'e a home em mobile.': 'and the home on mobile.',

  'HÉLDER RODRIGUES': 'HÉLDER RODRIGUES',
  'Hélder Rodrigues': 'Hélder Rodrigues',
  'LANDING PAGE': 'LANDING PAGE',
  'Landing page': 'Landing page',
  'Landing page de um personal trainer, desenhada no':
    'A landing page for a personal trainer, designed in',
  'Figma e construída em React.': 'Figma and built in React.',
  'Landing page de um personal trainer, construída em':
    'A landing page for a personal trainer, built in',
  'React a partir de um desenho feito no Figma.':
    'React from a design made in Figma.',
  'Treino personalizado é um serviço que só se avalia':
    'Personal training is a service you can only judge',
  'depois de contratado. A página vende o método, e o':
    'after buying it. The page sells the method, and',
  'método precisava ficar visível numa tela.':
    'the method had to be visible on one screen.',
  'React com Vite e Tailwind, em treze componentes.':
    'React with Vite and Tailwind, in thirteen',
  'O desenho veio antes do código e está versionado':
    'components. The design came before the code and is',
  'junto dele, o que mantém os dois conferíveis.':
    'versioned beside it, which keeps both checkable.',
  'MÉTODO NA TELA': 'THE METHOD ON SCREEN',
  'Avaliação, plano, monitorização e ajuste aparecem':
    'Assessment, plan, monitoring and adjustment appear',
  'como etapas, ao lado de um painel de números.':
    'as steps, beside a panel of numbers. What is',
  'O que é vendido é mostrado, não descrito.':
    'being sold is shown, not described.',
  'Home, resultados, metodologia, serviços e a home':
    'Home, results, methodology, services and the home',
  'em mobile.': 'on mobile.',

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
