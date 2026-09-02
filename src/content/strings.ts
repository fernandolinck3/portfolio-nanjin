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
    languageLabel: t('Idioma', 'Language'),

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
