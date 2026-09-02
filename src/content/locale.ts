/**
 * Em que língua o objeto fala.
 *
 * ## Por que isto não é um parâmetro
 *
 * A tentação óbvia é `MODULES(locale)`. Ela não sobrevive ao mapa de consumidores:
 * `scene.js`, `render.js`, `flat.js`, `focus.js` e `mirror.js` importam `MODULES`,
 * `WORKS`, `GAP` e `ECLIPSE` como **valores**, não por acessores. Tornar o idioma um
 * parâmetro obrigaria a atravessar o renderizador do canvas — 5.000 linhas que não
 * têm e não deveriam ter noção de idioma — só para que a última função da pilha
 * soubesse escolher entre duas strings.
 *
 * A decisão de duas páginas (T-31) já resolveu isso de outro jeito. Cada página
 * construída tem o seu próprio `<html lang>`, então **o idioma é constante durante
 * toda a vida do documento**. Um valor que nunca muda não precisa ser parâmetro: ele
 * é resolvido uma vez, na importação, e todo consumidor continua lendo `MODULES` sem
 * saber que isto existe.
 *
 * ## As duas portas
 *
 * `t()` é para o navegador e lê o idioma resolvido. `forLocale()` é para o build, que
 * é o único lugar onde os dois idiomas precisam existir no mesmo processo — o plugin
 * do Vite renderiza o espelho duas vezes, uma por página, e não pode depender de um
 * módulo que já se decidiu na importação.
 */

export type Locale = 'pt-BR' | 'en'

export const LOCALES: readonly Locale[] = ['pt-BR', 'en']
export const DEFAULT_LOCALE: Locale = 'pt-BR'

/** Um par autorado. As duas metades são obrigatórias — ver `T` abaixo. */
export type T = <A extends string>(pt: A | string, en: string) => string

/**
 * O idioma desta página.
 *
 * Lido de `<html lang>` porque é o build que o escreve e porque é a mesma fonte que
 * o leitor de tela e o Google usam — um idioma guardado em outro lugar poderia
 * divergir do que o documento declara, e aí um dos dois estaria mentindo.
 *
 * Fora de um navegador — `node`, o build, os testes — não há documento e o padrão
 * vale. O build nunca depende disto: ele usa `forLocale()`.
 */
export const LOCALE: Locale = (() => {
  if (typeof document === 'undefined') return DEFAULT_LOCALE
  const tag = document.documentElement.getAttribute('lang') ?? ''
  return tag.toLowerCase().startsWith('en') ? 'en' : DEFAULT_LOCALE
})()

/** Escolhe a metade certa de um par, no idioma desta página. */
export const t: T = (pt, en) => (LOCALE === 'en' ? en : (pt as string))

/**
 * O mesmo, para um idioma pedido explicitamente.
 *
 * Existe para o build e para o teste de paridade. Note que **as duas metades são
 * argumentos obrigatórios** da assinatura: uma tradução esquecida é um erro de
 * compilação e não uma linha em português numa página em inglês. É por isso que não
 * há teste de paridade de chaves neste projeto — o compilador já é o teste, e um
 * teste que repete o que o compilador garante é manutenção sem informação.
 */
export const forLocale = (locale: Locale): T => (pt, en) => (locale === 'en' ? en : (pt as string))

/** O caminho de uma página, a partir da raiz do site. `pt-BR` mora em `/`. */
export const pathFor = (locale: Locale): string => (locale === 'en' ? '/en/' : '/')

/** O `lang` que a página declara. */
export const langFor = (locale: Locale): string => (locale === 'en' ? 'en' : 'pt-BR')

/**
 * O mesmo idioma, na forma que o Open Graph usa.
 *
 * OG quer `xx_XX` e não uma tag BCP 47: `pt_BR`, `en_US`. Trocar o hífen por
 * sublinhado resolvia o português por acaso — `pt-BR` vira `pt_BR` — e deixava o
 * inglês como `en`, que o Facebook não reconhece e simplesmente ignora.
 */
export const ogFor = (locale: Locale): string => (locale === 'en' ? 'en_US' : 'pt_BR')

/**
 * O outro idioma, e como chamá-lo.
 *
 * O nome de uma língua se escreve **nela mesma** — "English", não "Inglês". Quem
 * precisa do botão é, por definição, quem não lê a língua da página em que está.
 */
export const other = (locale: Locale): { locale: Locale; path: string; name: string; lang: string } =>
  locale === 'en'
    ? { locale: 'pt-BR', path: '/', name: 'Português', lang: 'pt-BR' }
    : { locale: 'en', path: '/en/', name: 'English', lang: 'en' }
