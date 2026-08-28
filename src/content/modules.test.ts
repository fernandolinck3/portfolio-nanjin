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
import { MODULES, SCREEN_BUDGET, WORKS, LYRA_IDLE_MS, moduleAt, lyraAt, workById } from './modules'

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
    expect((m.items ?? []).length).toBeLessThanOrEqual(b.max)
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
    const mails = items.filter(({ i }) => i.act?.kind === 'mail')
    expect(mails).toHaveLength(1)
    expect(mails[0].i.act!.value).toMatch(/^[^@\s]+@[^@\s]+\.[^@\s]+$/)
  })

  /**
   * A route with no address renders as text and must never become a link. Guessing
   * a LinkedIn slug from a name is the invention PRODUCT.md forbids, and this is
   * the tripwire for someone later "fixing" the missing URL.
   */
  it('never links a route whose address is not known', () => {
    const linkedin = items.find(({ i }) => i.meta === 'LINKEDIN')!
    expect(linkedin.i.act).toBeUndefined()
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

  it('is exactly Portfólio, Graecus and Miscelânea', () => {
    expect(WORKS.map(w => w.id)).toEqual(['portfolio', 'graecus', 'miscelanea'])
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
