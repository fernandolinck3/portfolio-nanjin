/**
 * @vitest-environment node
 *
 * These assertions are arithmetic over an imported array — no DOM is touched. The
 * repo's default environment is jsdom, and standing jsdom up out of node_modules
 * costs minutes on an iCloud-backed disk (see HANDOFF.md), so this suite opts out
 * the same way `prototype/screen/reaction.test.js` does.
 */
import { existsSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { GAP, MODULES, SCREEN_BUDGET, WORKS, LYRA_IDLE_MS, moduleAt, lyraAt, workById, caseOf, ECLIPSE, type Module, itemsMaxFor } from './modules'
import { EN, translate, visibleStrings } from './en'
import { HOOK, itemKey, mirrorHTML } from './mirror'

/**
 * These are not style tests. "Every Module fits the Screen exactly" is the
 * constraint that lets the Unit have no scrolling and no browsing control
 * (ADR-0009), and it is a constraint a copy edit breaks silently — the source
 * file looks fine, and the overflow only shows up on a 590px-wide Plate.
 */

const longest = (lines: readonly string[]) =>
  lines.reduce((n, l) => Math.max(n, l.length), 0)

const items = MODULES.flatMap(m => (m.items ?? []).map(i => ({ m, i })))
const sections = items.flatMap(({ m, i }) => i.sections.map(s => ({ m, i, s })))

describe('the six Modules', () => {
  it('is exactly six', () => {
    expect(MODULES).toHaveLength(6)
  })

  it('fills slots 1 to 6, once each', () => {
    expect(MODULES.map(m => m.slot)).toEqual([1, 2, 3, 4, 5, 6])
  })

  /**
   * The order is the argument the Unit makes, and reordering the array is a
   * one-line change that rewrites it silently.
   */
  it('runs in the approved order', () => {
    expect(MODULES.map(m => m.id)).toEqual([
      'identity', 'projects', 'path', 'criteria', 'skills', 'contact',
    ])
  })

  it('has a unique id per Module', () => {
    expect(new Set(MODULES.map(m => m.id)).size).toBe(MODULES.length)
  })

  it('wraps at both ends, so the Pads can never index off the array', () => {
    expect(moduleAt(-1)).toBe(MODULES[5])
    expect(moduleAt(6)).toBe(MODULES[0])
  })

  /**
   * `CRITÉR.` and `HABILID.` are allowed on the hardware, where the Pad pitch is
   * ~96px. The Screen always writes them out — an abbreviation is a compromise
   * with a physical limit, and the Screen does not have that limit.
   */
  it('abbreviates only on the hardware, never in the title', () => {
    for (const m of MODULES) {
      expect(m.pad.length).toBeLessThanOrEqual(10)
      expect(m.title).not.toMatch(/\./)
    }
    expect(MODULES.find(m => m.id === 'criteria')!.title).toBe('CRITÉRIOS')
    expect(MODULES.find(m => m.id === 'skills')!.title).toBe('HABILIDADES')
  })

  it('names the unit of any Module that has items', () => {
    for (const m of MODULES) {
      if (m.items?.length) expect(m.unit && m.unit.length).toBeTruthy()
    }
  })

  it('gives every item a unique id within its Module', () => {
    for (const m of MODULES) {
      const ids = (m.items ?? []).map(i => i.id)
      expect(new Set(ids).size).toBe(ids.length)
    }
  })
})

describe('the Screen budget', () => {
  /**
   * A `lead` entry is a sentence, and a sentence that ends without punctuation is a
   * sentence someone broke in half — which is what produced the orphan lines
   * Fernando flagged. The renderer wraps; the source must not.
   */
  it('holds whole sentences in a lead, never half of one', () => {
    for (const m of MODULES) {
      for (const l of m.lead ?? []) {
        /* an address is a token on its own line, not a sentence — CONTATO's is
           lowercase because that is what it is, not because it was cut */
        if (!l.includes(' ')) continue
        if (/^[a-z]/.test(l)) throw new Error(`${m.id}: lead line starts mid-sentence: "${l}"`)
      }
    }
  })

  it.each(MODULES)('$title fits its lead', m => {
    expect((m.lead ?? []).length).toBeLessThanOrEqual(SCREEN_BUDGET.lead.lines)
    expect(longest(m.lead ?? [])).toBeLessThanOrEqual(SCREEN_BUDGET.lead.paraChars)
    expect(m.dim?.length ?? 0).toBeLessThanOrEqual(SCREEN_BUDGET.dim.lines)
    expect(longest(m.dim ?? [])).toBeLessThanOrEqual(SCREEN_BUDGET.dim.lineChars)
    expect(m.hint.length).toBeLessThanOrEqual(SCREEN_BUDGET.hintChars)
  })

  it.each(MODULES)('$title fits its item list', m => {
    const b = SCREEN_BUDGET.items
    /* Por layout: um `grid` corta em quatro e um `nodes` em três, então o teto de uma
       `list` não é o teto deles. T-16. */
    expect((m.items ?? []).length).toBeLessThanOrEqual(itemsMaxFor(m.layout))
    for (const i of m.items ?? []) {
      expect(i.label.length).toBeLessThanOrEqual(b.labelChars)
      expect((i.meta ?? '').length).toBeLessThanOrEqual(b.metaChars)
    }
  })

  it('fits every section the Sun can land on', () => {
    const b = SCREEN_BUDGET.section
    for (const { i, s } of sections) {
      expect(i.sections.length).toBeLessThanOrEqual(b.max)
      expect(s.heading.length).toBeLessThanOrEqual(b.headingChars)
      expect(s.lines.length).toBeLessThanOrEqual(b.lines)
      expect(longest(s.lines)).toBeLessThanOrEqual(b.lineChars)
    }
  })
})

describe('LYRA', () => {
  it('gives every Module exactly two lines, and no more', () => {
    for (let i = 0; i < MODULES.length; i++) {
      const l = lyraAt(i)
      expect(l.open.length).toBeGreaterThan(0)
      expect(l.idle.length).toBeGreaterThan(0)
      expect(Object.keys(l).sort()).toEqual(['idle', 'open'])
    }
  })

  /**
   * The idle line is the only instruction a visitor gets without going looking for
   * one, so where the wheels are the way to the content, it names them.
   *
   * **CONTATO is exempt, and that is the brief contradicting itself.** Its rule says
   * LYRA's instruction must name the MOON and the SUN; its own approved line for
   * CONTATO is "O canal continua aberto." The copy wins, because it is the more
   * specific instruction and because it is right: the address is on screen the
   * moment that Module opens, so nobody there needs to be told how to turn a wheel
   * to find it. Asserted as an exemption rather than dropped, so the rule still
   * holds for the five Modules where it matters.
   */
  /**
   * LYRA names a wheel only where a wheel does something.
   *
   * The rule used to be "every Module but CONTATO must name the MOON", and it was
   * enforcing a lie: QUEM has no list, so both wheels are inert there, and its idle
   * line said *"A LUA escolhe o item."* The rule the copy actually needs is the
   * honest one — **a Module with items names the MOON; a Module without one must
   * not.** CONTATO stays exempt for its own reason: its addresses are on screen the
   * moment it opens, so nobody there needs to be told how to turn a wheel.
   */
  it('names a wheel only where a wheel has something to do', () => {
    for (const m of MODULES) {
      if (m.id === 'contact') continue
      const idle = m.lyra.idle.join(' ')
      if (m.items?.length) expect(idle).toMatch(/LUA/)
      else expect(idle).not.toMatch(/\bLUA\b|\bSOL\b/)
    }
    expect(MODULES.find(m => m.id === 'contact')!.lyra.idle.join(' ')).not.toMatch(/LUA/)
  })

  /** A Module whose index is a bare list must not carry a lead: the names are the
      content, and a paragraph above them only pushes the last one off the panel. */
  it('leaves a bare list to speak for itself', () => {
    expect(MODULES.find(m => m.id === 'projects')!.lead).toBeUndefined()
  })

  it('waits six seconds before saying the useful thing', () => {
    expect(LYRA_IDLE_MS).toBe(6000)
  })
})

describe('what the content is allowed to claim', () => {
  const publicText = MODULES.flatMap(m => [
    ...(m.lead ?? []), ...(m.dim ?? []),
    ...(m.items ?? []).flatMap(i => [i.label, i.meta ?? '', ...i.sections.flatMap(s => s.lines)]),
  ])

  /**
   * First person is allowed in CONTATO and nowhere else. Everywhere else the Unit
   * describes the work rather than performing enthusiasm about it.
   */
  it('uses first person only in CONTATO', () => {
    for (const m of MODULES) {
      if (m.id === 'contact') continue
      const text = [...(m.lead ?? []), ...(m.dim ?? [])].join(' ')
      expect(text).not.toMatch(/\b(eu|meu|minha|mim|comigo)\b/i)
    }
  })

  /** `atuo`/`atua` presents a competence as a role. The brief forbids it outright. */
  it('never uses atuo or atua to present a competence', () => {
    expect(publicText.join(' ')).not.toMatch(/\batu[oa]\b/i)
  })

  /**
   * PRODUCT.md prohibits presenting AI, automation and analytics as established
   * experience. The approved skills list simply does not claim them — this is the
   * tripwire for a future edit that adds one back in as a competence.
   */
  it('does not claim AI, automation or data analytics as a skill', () => {
    const skills = MODULES.find(m => m.id === 'skills')!
    const text = (skills.items ?? [])
      .flatMap(i => [i.label, ...i.sections.flatMap(s => s.lines)]).join(' ').toLowerCase()
    expect(text).not.toMatch(/\b(ia|inteligência artificial|automação|data analytics)\b/)
  })

  /** Companies belong to the chronology. A competence paragraph naming one implies
      it was exercised there, which is a claim nobody made. */
  it('keeps companies out of the competence blocks', () => {
    const path = MODULES.find(m => m.id === 'path')!
    const camadas = path.items!.find(i => i.id === 'camadas')!
    const text = camadas.sections.flatMap(s => s.lines).join(' ')
    expect(text).not.toMatch(/Nelogica|MSC|Graecus|Parize/i)
  })

  it('records the dates exactly as given', () => {
    const path = MODULES.find(m => m.id === 'path')!
    const crono = path.items!.find(i => i.id === 'cronologia')!
    const text = crono.sections.flatMap(s => s.lines).join(' ')
    expect(text).toContain('2019 — 2022')
    expect(text).toContain('2022 — 2024')
    expect(text).toContain('2024 — 2026')
  })

  it('offers exactly one way out, and it is a direct address', () => {
    /* The narrowing is the point, not ceremony: `form` carries no `value`, because
       where the form posts is infrastructure (ADR-0027) and not content. Reading
       `.value` off a bare Act stopped compiling the moment that route existed. */
    const mails = items.flatMap(({ i }) => (i.act?.kind === 'mail' ? [i.act] : []))
    expect(mails).toHaveLength(1)
    expect(mails[0].value).toMatch(/^[^@\s]+@[^@\s]+\.[^@\s]+$/)
  })

  /** The form is a route with no address, and exactly one item may hold it. */
  it('opens the form in one place, and keeps the address beside it', () => {
    const forms = items.filter(({ i }) => i.act?.kind === 'form')
    expect(forms).toHaveLength(1)
    expect(forms[0].m.id).toBe('contact')
  })

  /**
   * The tripwire that used to assert LINKEDIN had no route at all.
   *
   * It stayed inert for several sessions because guessing a slug from a name is the
   * invention PRODUCT.md forbids. Fernando gave the address on 2026-09-01 and the row
   * started acting in the same commit — which is the order this test exists to
   * protect. It cannot check provenance, so it checks the shape a guess would fail:
   * an absolute https address on the host it claims to be.
   */
  it('links only addresses that are real and absolute', () => {
    const urls = items.flatMap(({ i }) => (i.act?.kind === 'url' ? [i.act.value] : []))
    expect(urls.length).toBeGreaterThan(0)
    for (const u of urls) expect(u).toMatch(/^https:\/\/[^/\s]+\.[^/\s]+\//)
    const act = items.find(({ i }) => i.meta === 'LINKEDIN')!.i.act
    expect(act).toMatchObject({ kind: 'url' })
    /* `in` narrows: the form route carries no address, and the union says so. */
    expect(act && 'value' in act ? act.value : '')
      .toMatch(/^https:\/\/(www\.)?linkedin\.com\/in\//)
  })
})

describe('the projects', () => {
  /**
   * Every still a Work names has to be a file that is actually there.
   *
   * A missing image is invisible in review — the panel just shows its empty plate —
   * and the failure only appears in a deployed build if the path is also wrong for
   * the base. `modules.ts` stores these root-relative and `public/` is the root, so
   * the check is a straight join.
   */
  it('points every image at a file that exists', () => {
    for (const w of WORKS) {
      for (const src of w.images ?? []) {
        expect(src.startsWith('/')).toBe(true)
        expect(existsSync(new URL('../../public' + src, import.meta.url))).toBe(true)
      }
    }
  })

  it('é o portfólio, o Graecus, os quatro da parceria e a Miscelânea', () => {
    expect(WORKS.map(w => w.id)).toEqual(
      ['graecus', 'cmpinox', 'maiara', 'anelise', 'helder', 'portfolio', 'miscelanea'])
  })

  it('reaches every project from PROJETOS, and back by id', () => {
    const m = MODULES.find(x => x.id === 'projects')!
    expect(m.items).toHaveLength(WORKS.length)
    for (const i of m.items!) {
      expect(i.act).toEqual({ kind: 'work', value: i.id })
      expect(workById(i.id)).toBeDefined()
    }
  })

  /**
   * Miscelânea invents nothing. The empty state *is* the content, and this asserts
   * it stays that way — the failure mode is a future edit filling it with plausible
   * titles and dates to make the module look finished.
   */
  it('lets Miscelânea show real work and invent none', () => {
    const m = workById('miscelanea')!
    /* still a gallery under construction, which is what `empty` says */
    expect(m.empty).toBe(true)
    /* the guard was never "no images" — it was **no fabricated ones**. Every path
       here has to resolve to a file that exists, and no date may be claimed for work
       whose date nobody stated. */
    for (const src of m.images ?? []) expect(src).toMatch(/^\/works\/[\w-]+\.jpg$/)
    expect(m.year).toBeUndefined()
  })

  /** No quantitative outcome is claimed anywhere, because none is public. */
  it('claims no metrics', () => {
    const text = MODULES.find(x => x.id === 'projects')!
      .items!.flatMap(i => i.sections.flatMap(s => s.lines)).join(' ')
    expect(text).not.toMatch(/\d+\s*%|aumento de|crescimento de|ROI\b/i)
  })

  /**
   * The Graecus case declares CAPTURAS and leaves it empty. The six website
   * screenshots the brief asks for do not exist locally — the two files under
   * `public/works/` are social pieces, which is different work for the same client.
   */
  it('shows the Graecus captures it declares', () => {
    const g = MODULES.find(x => x.id === 'projects')!.items!.find(i => i.id === 'graecus')!
    const capturas = g.sections.find(s => s.heading === 'CAPTURAS')
    expect(capturas).toBeDefined()
    /* it used to be a declared gap: the six screenshots did not exist locally and the
       section said so rather than pretending. They exist now, so the section
       describes them and the Work carries them. */
    expect(capturas!.lines.length).toBeGreaterThan(0)
    const shots = workById('graecus')!.images ?? []
    expect(shots.length).toBeGreaterThanOrEqual(6)
  })
})

/**
 * The drift test.
 *
 * `T-18` asks for a mirror of the Screen in the DOM and then asks the harder
 * question: how does it stay true six months from now, when someone adds a section
 * to a case, the Screen shows it, and the person who would have noticed that the
 * mirror does not cannot see the Screen anyway? **Silent drift is the failure mode
 * of the whole idea.**
 *
 * The first answer is that there is one source and not two renderers — `mirror.ts`
 * builds its markup out of the very array this file is asserting about, so content
 * added below appears in both without anyone doing anything. That is the layer that
 * actually prevents drift.
 *
 * This is the layer that catches what escapes it. Adding a Module, an item or a
 * section without it reaching the mirror turns this suite red, which is the whole
 * difference between a rule and a wish. It asserts against *rendered markup* rather
 * than against the builder's structure on purpose: the question is only ever
 * "can this string be found in the document", because that is the question a screen
 * reader and Ctrl+F are both really asking.
 */
describe('the mirror', () => {
  const html = mirrorHTML()
  /* entities back to text, tags away: what is left is what a reader would hear */
  const text = html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')

  it('carries every Module, not only the live one', () => {
    /* find-in-page and crawlers do not fire your events: all six are always there */
    for (const m of MODULES) expect(text).toContain(m.title)
    expect(html.match(new RegExp(HOOK.module + '=', 'g'))).toHaveLength(MODULES.length)
  })

  it('carries every lead, every dim line and every discipline', () => {
    for (const m of MODULES) {
      for (const l of m.lead ?? []) expect(text).toContain(l)
      for (const d of m.dim ?? []) expect(text).toContain(d)
      for (const d of m.disciplines ?? []) expect(text).toContain(d)
    }
  })

  it('carries every item label, with a control to open it', () => {
    for (const [i, m] of MODULES.entries()) {
      for (const [j, it] of (m.items ?? []).entries()) {
        expect(text).toContain(it.label)
        expect(html).toContain(`${HOOK.item}="${itemKey(i, j)}"`)
      }
    }
  })

  /**
   * The one that catches a case growing a section. Every heading the SUN can page
   * to, and every line under it, has to be findable — including the ones belonging
   * to items in Modules nobody has opened.
   */
  it('carries every case section, heading and prose alike', () => {
    for (const m of MODULES) {
      for (const it of m.items ?? []) {
        for (const sec of it.sections) {
          expect(text).toContain(sec.heading)
          for (const line of sec.lines) expect(text).toContain(line)
        }
      }
    }
  })

  /** A declared gap has to read as *missing*, not be silently absent. */
  it('says so where the content is a declared gap', () => {
    const gaps = MODULES.flatMap(m => (m.items ?? [])
      .flatMap(i => i.sections.filter(s => !s.lines.length)))
    if (gaps.length) expect(text).toContain(GAP)
  })

  it('carries every project blurb', () => {
    for (const w of WORKS) for (const l of w.blurb) expect(text).toContain(l)
  })

  /**
   * The traps, as assertions.
   *
   * `display:none`, `visibility:hidden` and the `hidden` attribute each remove text
   * from find-in-page, which is half of why the mirror exists. The single permitted
   * `hidden` is ECLIPSE, which is a secret rather than a Module (`ADR-0001`) and is
   * meant not to be findable until it has been earned.
   */
  it('hides no Module from find-in-page', () => {
    const modules = html.slice(0, html.indexOf(HOOK.eclipse))
    expect(modules).not.toMatch(/display:\s*none|visibility:\s*hidden/)
    expect(modules).not.toMatch(/<section[^>]*\shidden/)
  })

  it('keeps the seventh screen out of reach until it is opened', () => {
    expect(html).toMatch(new RegExp(`<section ${HOOK.eclipse} hidden`))
    /* and the prize is a real link, which is the whole of T-15 */
    expect(html).toContain(`${HOOK.claim} hidden href="https://instagram.com/nan._.jin"`)
  })

  /**
   * The prize is a control, and it sits with the controls.
   *
   * Left at the end of the ECLIPSE section it would be the last focusable thing in
   * the document, behind all seventeen item buttons — reachable in principle and
   * unreachable in practice, which is the state `T-15` was opened about.
   */
  it('puts the prize where a Tab key reaches it', () => {
    const claimAt = html.indexOf(HOOK.claim)
    const firstItemAt = html.indexOf(HOOK.item)
    const eclipseAt = html.indexOf(HOOK.eclipse)
    expect(claimAt).toBeGreaterThan(-1)
    expect(claimAt).toBeLessThan(firstItemAt)
    expect(claimAt).toBeLessThan(eclipseAt)
  })

  /** Only the announcement lives in the live region; the content stays outside it. */
  it('gives the live region nothing to re-read', () => {
    expect(html).toMatch(new RegExp(`<p ${HOOK.live} role="status" aria-live="polite" aria-atomic="true"></p>`))
  })

  /** Text is text. The content has an `@`, an `&`-free path, and quotes are coming. */
  it('escapes rather than injects', () => {
    expect(mirrorHTML()).not.toMatch(/<script/i)
  })
})

/**
 * The fold is a promise about *which* sections, not how many.
 *
 * The brief asked for project, context and construction without scrolling. The build
 * satisfied a count of three instead, and on Portfólio the third section was
 * REFERÊNCIAS while CONSTRUÇÃO sat fourth — below the fold, on the flagship. Graecus
 * happened to pass because its third section already was CONSTRUÇÃO, which is exactly
 * why a count could look green while the requirement failed.
 *
 * Section names are not hardcoded anywhere in the renderer and must not be: the cases
 * do not share a section list. They are asserted here, once, where a reordering that
 * pushes construction back down fails loudly instead of silently.
 */
describe('the first fold carries the brief', () => {
  for (const id of ['portfolio', 'graecus']) {
    it(`opens ${id} with construction inside the first three sections`, () => {
      const headings = caseOf(id).map(s => s.heading)
      expect(headings.length).toBeGreaterThan(2)
      expect(headings.slice(0, 3)).toContain('CONSTRUÇÃO')
    })
  }

  /**
   * Miscelânea is the single-section case, and it is the reason the rail stopped
   * requiring two headings: one section that overflows still has to say so.
   */
  it('leaves the single-section case alone, and it is still one section', () => {
    expect(caseOf('miscelanea').map(s => s.heading)).toEqual(['EM CONSTRUÇÃO'])
  })
})

/**
 * A tradução, e a regra que a impede de envelhecer em silêncio.
 *
 * `strings.ts` tem a garantia do compilador: `t(pt, en)` exige as duas metades, então
 * uma moldura sem tradução não compila. `modules.ts` não pôde ter isso — envolver 755
 * linhas de dados aninhados numa função por script é a operação que quebra um arquivo
 * calado, e este é o único lugar onde o conteúdo existe. O dicionário em `en.ts` é a
 * troca dessa garantia por esta suíte.
 *
 * O que estes testes protegem é uma coisa só: **uma frase escrita em português depois
 * de hoje não pode chegar à página em inglês sem que alguém a tenha traduzido.**
 */
describe('o portfólio em inglês', () => {
  const everything = () => {
    const all = new Set<string>()
    for (const v of [MODULES, WORKS, ECLIPSE, GAP]) visibleStrings(v, '', all)
    for (const w of WORKS) visibleStrings(caseOf(w.id), '', all)
    return all
  }

  it('traduz toda string visível — uma frase nova em português falha aqui, não na página', () => {
    const missing = [...everything()].filter(s => !(s in EN))
    expect(missing, `sem tradução em en.ts:\n  ${missing.join('\n  ')}`).toEqual([])
  })

  it('não guarda traduções órfãs de frases que o português já não diz', () => {
    const live = everything()
    const orphans = Object.keys(EN).filter(k => !live.has(k))
    expect(orphans, `chaves em en.ts que ninguém usa:\n  ${orphans.join('\n  ')}`).toEqual([])
  })

  it('preserva a forma: mesmos campos, e o mesmo número de linhas em cada bloco', () => {
    const shape = (v: unknown): unknown =>
      Array.isArray(v) ? v.map(shape)
        : v && typeof v === 'object'
          ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, shape(x)]))
          : typeof v
    expect(shape(translate(MODULES))).toEqual(shape(MODULES))
    expect(shape(translate(WORKS))).toEqual(shape(WORKS))
  })

  it('não traduz endereços, ids nem handles — isso quebraria as rotas, não o idioma', () => {
    const en = translate(MODULES)
    const routes = (ms: readonly Module[]) => ms.flatMap(m => (m.items ?? []).flatMap(i => i.act ? [JSON.stringify(i.act)] : []))
    expect(routes(en)).toEqual(routes(MODULES))
  })

  /**
   * Traduzir duas vezes tem de dar o mesmo que traduzir uma.
   *
   * Isto era verdade por sorte e não por construção: bastava alguém traduzir "A" para
   * "B" tendo "B" também como chave, e um texto que passasse duas vezes pela tabela
   * viraria "C". O caminho que fazia isso — o espelho renderizando a partir de
   * `MODULES`, que num navegador em `/en/` já vem resolvido — foi fechado partindo de
   * `SOURCE`. Isto guarda a tabela em si, que é o lugar onde a cadeia nasceria.
   */
  it('não encadeia: nenhum valor inglês é chave de outra tradução', () => {
    const chained = Object.entries(EN).filter(([pt, en]) => pt !== en && en in EN && EN[en] !== en)
    expect(chained, `cadeias em en.ts:\n  ${chained.map(([k, v]) => `${k} -> ${v} -> ${EN[v]}`).join('\n  ')}`)
      .toEqual([])
  })

  it('cabe no mesmo orçamento de tela que o português', () => {
    for (const m of translate(MODULES)) {
      for (const l of m.lead ?? []) expect(l.length, `lead de ${m.id}: "${l}"`).toBeLessThanOrEqual(SCREEN_BUDGET.lead.paraChars)
      for (const d of m.dim ?? []) expect(d.length, `dim de ${m.id}: "${d}"`).toBeLessThanOrEqual(SCREEN_BUDGET.dim.lineChars)
      expect(m.hint.length, `hint de ${m.id}`).toBeLessThanOrEqual(SCREEN_BUDGET.hintChars)
      for (const it of m.items ?? []) {
        expect(it.label.length, `label "${it.label}"`).toBeLessThanOrEqual(SCREEN_BUDGET.items.labelChars)
        if (it.meta) expect(it.meta.length, `meta "${it.meta}"`).toBeLessThanOrEqual(SCREEN_BUDGET.items.metaChars)
      }
    }
    for (const w of WORKS) {
      for (const s of translate(caseOf(w.id))) {
        expect(s.heading.length, `heading "${s.heading}"`).toBeLessThanOrEqual(SCREEN_BUDGET.section.headingChars)
        for (const l of s.lines) expect(l.length, `linha "${l}"`).toBeLessThanOrEqual(SCREEN_BUDGET.section.lineChars)
      }
    }
  })
})
