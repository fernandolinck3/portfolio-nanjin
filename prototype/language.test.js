/**
 * A oferta da outra língua.
 *
 * O comportamento aqui é quase todo condicional — aparece para alguns, nunca para
 * outros, uma vez só — e uma condição sem teste é um palpite. O que estes testes
 * protegem, acima de tudo, é que **isto não redireciona**: a página que a pessoa
 * pediu é a que ela recebe.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

const load = async (lang, languages) => {
  document.documentElement.setAttribute('lang', lang)
  vi.stubGlobal('navigator', { languages, language: languages[0] })
  vi.resetModules()
  return import('./language.js')
}

const bar = () => document.querySelector('.lg-bar')

beforeEach(() => {
  localStorage.clear()
  document.body.innerHTML = ''
  document.head.innerHTML = ''
})

describe('a oferta da outra língua', () => {
  it('aparece para um navegador que prefere a outra', async () => {
    const { offerLanguage } = await load('pt-BR', ['en-US', 'en'])
    expect(offerLanguage()).toBe(true)
    expect(bar()).toBeTruthy()
  })

  it('fala a língua que oferece, não a da página', async () => {
    const { offerLanguage } = await load('pt-BR', ['en-US'])
    offerLanguage()
    expect(bar().lang).toBe('en')
    expect(bar().textContent).toContain('English')
  })

  it('não aparece para quem já está na língua que prefere', async () => {
    const { offerLanguage } = await load('pt-BR', ['pt-BR', 'en'])
    expect(offerLanguage()).toBe(false)
    expect(bar()).toBeNull()
  })

  it('respeita a ordem: quem lista pt antes de en escolheu português', async () => {
    const { offerLanguage } = await load('pt-BR', ['pt', 'en-US'])
    expect(offerLanguage()).toBe(false)
  })

  it('funciona na direção contrária — inglês oferecendo português', async () => {
    const { offerLanguage } = await load('en', ['pt-BR'])
    expect(offerLanguage()).toBe(true)
    expect(bar().lang).toBe('pt-BR')
    expect(bar().querySelector('a').getAttribute('href')).toBe('/')
  })

  it('não redireciona: oferece um link e a página fica onde está', async () => {
    const { offerLanguage } = await load('pt-BR', ['en-US'])
    offerLanguage()
    const a = bar().querySelector('a')
    expect(a.getAttribute('href')).toBe('/en/')
    expect(document.documentElement.lang).toBe('pt-BR')
  })

  it('some para sempre quando a pessoa responde', async () => {
    const first = await load('pt-BR', ['en-US'])
    first.offerLanguage()
    bar().querySelector('[data-stay]').click()
    expect(bar()).toBeNull()

    const again = await load('pt-BR', ['en-US'])
    expect(again.offerLanguage()).toBe(false)
  })

  it('ir também é uma resposta, e não pergunta de novo', async () => {
    const first = await load('pt-BR', ['en-US'])
    first.offerLanguage()
    bar().querySelector('a').dispatchEvent(new Event('click', { bubbles: true }))
    document.body.innerHTML = ''

    const again = await load('pt-BR', ['en-US'])
    expect(again.offerLanguage()).toBe(false)
  })
})
