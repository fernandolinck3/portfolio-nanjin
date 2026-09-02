/**
 * A moldura, dita nas duas línguas.
 *
 * `modules.ts` é o **portfólio** — quem é Fernando, quais são os projetos, o que diz
 * um case. Este arquivo é tudo o que não é isso: rótulos de operação, nomes de
 * controles, avisos legais, estados de formulário. Texto que descreve o instrumento
 * e não o trabalho.
 *
 * ## Por que ele existe
 *
 * Porque a primeira versão do T-31 afirmou que o texto todo vivia em `modules.ts`, e
 * era falso. A moldura estava espalhada por seis arquivos — a fileira de toque no
 * `index.html`, os rótulos do overlay no `focus.js`, o painel inteiro do `contact.js`,
 * a barra do `consent.js`, o piso do `flat.js` e os rótulos próprios do espelho. Cerca
 * de quarenta strings que nenhum `modules.ts` alcançava.
 *
 * Com uma língua isso é desarrumação. Com duas é um bug garantido: a segunda língua
 * nasceria espalhada pelos mesmos seis arquivos e a terceira seria impossível.
 *
 * ## As duas portas, e por que as duas metades são obrigatórias
 *
 * `UI` é resolvido na importação, para o navegador. `stringsFor(locale)` é para o
 * build, o único lugar onde as duas línguas existem no mesmo processo.
 *
 * `t(pt, en)` exige as duas metades, então **uma tradução esquecida não compila**.
 * Não há teste de paridade aqui de propósito: o compilador já garante o que o teste
 * afirmaria, e um teste que repete uma garantia do compilador é manutenção sem
 * informação.
 */

import { forLocale, LOCALE, type Locale } from './locale'

export function stringsFor(locale: Locale) {
  const t = forLocale(locale)
  return {
    /** O painel de estado do espelho. Lidos em voz alta, então são substantivos. */
    state: t('Estado', 'State'),
    position: t('Posição', 'Position'),
    light: t('Luz', 'Light'),

    /**
     * Os dois controles que só existem em certos momentos.
     *
     * "Voltar um nível" e não "Voltar": o espelho tem mais de um botão de voltar em
     * jogo — este sai de um item para o Módulo — e um leitor de tela linear anuncia
     * o nome sem o contexto que a tela dá ao olho.
     */
    backOneLevel: t('Voltar um nível', 'Back one level'),
    reopenEclipse: t('Reabrir o eclipse', 'Reopen the eclipse'),

    /**
     * O controle de idioma.
     *
     * O nome de uma língua se escreve **nela mesma**, e por isso não passa por `t`:
     * quem precisa deste controle é, por definição, quem não lê a língua da página em
     * que caiu. "Inglês" não ajuda ninguém que só lê inglês.
     */

    /* ---- a fileira de toque, e o aviso de virar o aparelho ---------------- */

    /**
     * Onde não há hover nem gesto rotativo, estes quatro são o instrumento.
     *
     * Em caixa alta porque a Plate inteira é, e curtos porque dividem a largura do
     * aparelho em quatro. "PREVIOUS/NEXT" cabe; "PREVIOUS ITEM" não caberia.
     */
    touchPrev: t('‹ ANTERIOR', '‹ PREVIOUS'),
    touchNext: t('PRÓXIMO ›', 'NEXT ›'),
    touchOpen: t('ABRIR', 'OPEN'),
    touchBack: t('VOLTAR', 'BACK'),
    touchPrevLabel: t('Item anterior', 'Previous item'),
    touchNextLabel: t('Próximo item', 'Next item'),
    touchOpenLabel: t('Abrir o item selecionado', 'Open the selected item'),
    touchBackLabel: t('Voltar um nível', 'Back one level'),
    touchRowLabel: t('Controles de toque', 'Touch controls'),

    /** Um convite, não uma exigência: a página funciona virada, só fica menor. */
    turnPhone: t('Vire o celular para uma tela maior', 'Turn your phone for a larger screen'),

    /* ---- o overlay de projeto -------------------------------------------- */

    workBack: t('← VOLTAR', '← BACK'),
    workSections: t('Seções do case', 'Case sections'),
    workImages: t('Imagens do projeto', 'Project images'),
    workPrevImage: t('Imagem anterior', 'Previous image'),
    workNextImage: t('Próxima imagem', 'Next image'),
    workZoomIn: t('Ampliar a imagem', 'Enlarge the image'),
    workZoomOut: t('Reduzir a imagem', 'Shrink the image'),
    /** O rodapé só aparece quando há imagens, e ensina as duas coisas que se faz com elas. */
    workHint: t(
      'clique na imagem para ampliar · ← → para percorrer as imagens',
      'click the image to enlarge · ← → to move through them',
    ),

    /* ---- a barra de consentimento ---------------------------------------- */

    /**
     * A fórmula reconhecível, e não a voz do objeto.
     *
     * Uma barra de cookie é uma das poucas superfícies onde a pessoa procura uma
     * forma conhecida em vez de ler. Isso vale nas duas línguas, e o inglês tem a
     * sua própria fórmula — por isso aqui não se traduz frase, se escreve a fórmula
     * de novo. Nomeia o Google Analytics e a finalidade, que é o que o art. 9º pede,
     * e não linka política de privacidade porque não existe uma.
     */
    consentText: t(
      'Utilizamos cookies do Google Analytics para medir o tráfego deste site. Você pode aceitar ou recusar — recusar não afeta a navegação.',
      'We use Google Analytics cookies to measure traffic on this site. You can accept or decline — declining does not affect browsing.',
    ),
    consentTitle: t('Cookies.', 'Cookies.'),
    consentAccept: t('Aceitar', 'Accept'),
    consentDecline: t('Recusar', 'Decline'),

    /* ---- o formulário ----------------------------------------------------- */

    contactTitle: t('Escrever', 'Write'),
    contactLead: t('Uma vaga, um projeto ou uma ideia incomum.', 'A role, a project, or an unusual idea.'),
    contactName: t('Nome', 'Name'),
    contactEmail: t('E-mail', 'Email'),
    contactMessage: t('Mensagem', 'Message'),
    contactSend: t('Enviar', 'Send'),
    contactCancel: t('Voltar', 'Back'),
    /** O honeypot. Ninguém deveria ler isto; quem lê é um robô, e a instrução é para ele. */
    contactTrap: t('Não preencha', 'Do not fill this in'),
    contactFallback: t('Se preferir o seu próprio cliente de e-mail:', 'If you prefer your own mail client:'),

    /**
     * O aviso do art. 9º da LGPD, na primeira pessoa.
     *
     * Primeira pessoa nas duas línguas: é o site dele e uma terceira pessoa aqui lê
     * como uma agência operando a página em nome dele. E não menciona caixa de
     * entrada, que ele pediu para tirar.
     */
    contactNotice: t(
      'Nome, e-mail e mensagem são enviados por um serviço externo (Web3Forms, servidores nos EUA) e chegam direto para mim. Servem só para te responder. Não ficam armazenados no serviço e não vão para mais ninguém. Para corrigir ou apagar, escreva para o mesmo endereço.',
      'Your name, email and message are sent through an external service (Web3Forms, servers in the US) and come straight to me. They are used only to reply to you. They are not stored by the service and go to nobody else. To correct or delete them, write to the same address.',
    ),

    /**
     * Os estados do envio.
     *
     * `status` separa "o serviço recusou" de "o visitante não tinha conexão", que
     * pedem respostas diferentes — daí as duas falhas serem frases distintas e não
     * um "erro" genérico.
     */
    contactIncomplete: t('Preencha nome, e-mail e mensagem.', 'Fill in name, email and message.'),
    contactBadEmail: t('Esse e-mail não parece completo.', 'That email does not look complete.'),
    contactSending: t('Enviando…', 'Sending…'),
    contactSent: t('Enviado. Respondo nesse e-mail.', 'Sent. I reply to that address.'),
    contactRefused: t(
      'Não foi possível enviar. Escreva direto para o endereço abaixo.',
      'It could not be sent. Write directly to the address below.',
    ),
    contactOffline: t(
      'Sem conexão com o envio. Escreva direto para o endereço abaixo.',
      'No connection to the sender. Write directly to the address below.',
    ),

    /* ---- o piso sem GPU --------------------------------------------------- */

    /**
     * Diz o que é e por que, em uma linha, e não pede desculpa.
     *
     * O `SPEC` promete um Flat Plate desenhado (T-05) e isto não é ele. É o piso
     * debaixo dele, e a frase existe para o visitante saber que está vendo a versão
     * em texto de propósito e não uma página quebrada.
     */
    flatNote: t(
      'Esta é a versão em texto. O portfólio é um instrumento em 3D e o seu navegador não tem aceleração gráfica disponível, então ele não foi carregado — o conteúdo abaixo é o mesmo.',
      'This is the text version. The portfolio is a 3D instrument and your browser has no graphics acceleration available, so it was not loaded — the content below is the same.',
    ),

    /**
     * A única prosa autoral do espelho, e ela fala do instrumento e não do portfólio.
     *
     * Sem ela, um leitor de tela encontra um punhado de botões chamados "Roda da Lua"
     * e nenhuma pista de que eles percorrem a lista logo abaixo. LUA e SOL ficam sem
     * tradução aqui pelo mesmo motivo que em `en.ts`: são os nomes gravados nos
     * controles, e o inglês não deve mandar procurar um controle que não existe.
     */
    mirrorLead: t(
      'Portfólio apresentado como um instrumento. As seis teclas acima escolhem o módulo, a LUA percorre a lista e o SOL abre o que estiver selecionado. Tudo que a tela do instrumento mostra está escrito abaixo, e os seis módulos estão sempre aqui — inclusive os que não estão acesos.',
      'A portfolio presented as an instrument. The six keys above choose the module, the LUA walks the list and the SOL opens whatever is selected. Everything the instrument’s screen shows is written out below, and all six modules are always here — including the ones that are not lit.',
    ),

    languageLabel: t('Idioma', 'Language'),

    /**
     * A oferta da outra língua, **na língua desta página**.
     *
     * A primeira versão escrevia a oferta na língua oferecida, com o argumento de que
     * quem precisa da linha não lê a página onde caiu. O argumento até se sustentava
     * — a barra só nasce para quem prefere a outra língua, e essa pessoa lê as duas —
     * mas o resultado era uma página em inglês com uma frase solta em português.
     *
     * *"a barra tem que estar sempre no idioma que o resto do portfólio está"*, e ele
     * está certo: coerência da página vale mais do que otimizar para o caso alvo,
     * ainda mais quando o caso alvo entende as duas de qualquer jeito. Uma frase fora
     * da língua lê como defeito para todo mundo que não é o alvo — inclusive para um
     * recrutador passando o olho.
     *
     * **O nome da língua é a exceção e continua nela mesma.** O botão diz "Português",
     * nunca "Portuguese": é convenção firme de seletor de idioma e é a única palavra
     * que a pessoa reconhece sem ler o resto. Ele não vem daqui — vem de
     * `other().name`, que é onde os nomes das línguas moram.
     */
    languageOffer: t(
      'Este site também está em inglês.',
      'This site is also available in Portuguese.',
    ),
    languageStay: t('Ficar', 'Stay'),

    /**
     * O que a aba, o Google e um cartão de link dizem.
     *
     * O `<title>` inglês não traduz "experiências digitais" ao pé da letra —
     * "digital experiences" é vago em inglês de recrutamento, onde "digital
     * product experiences" é a forma que quer dizer alguma coisa. O `PRODUCT.md`
     * proíbe inventar credencial, então isto continua sendo o mesmo cargo dito na
     * forma que a outra língua reconhece, e não um cargo maior.
     */
    pageTitle: t(
      'Fernando Linck — Growth, CRO e experiências digitais',
      'Fernando Linck — Growth, CRO and digital product experiences',
    ),
    pageDescription: t(
      'Portfólio de Fernando Linck — growth, CRO e experiências digitais — apresentado como um instrumento: seis teclas, duas rodas e um fader que vai da noite ao dia.',
      'Fernando Linck’s portfolio — growth, CRO and digital product experiences — presented as an instrument: six keys, two wheels and a fader that runs from night to day.',
    ),
    ogDescription: t(
      'Um portfólio apresentado como instrumento: seis teclas, duas rodas e um fader que vai da noite ao dia.',
      'A portfolio presented as an instrument: six keys, two wheels and a fader that runs from night to day.',
    ),
  }
}

export type Strings = ReturnType<typeof stringsFor>

/** A moldura desta página. */
export const UI: Strings = stringsFor(LOCALE)
