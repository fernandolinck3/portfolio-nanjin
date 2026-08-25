import { describe, expect, it } from 'vitest'
import { MODULES, SCREEN_BUDGET, moduleAt, type Module } from './modules'

/**
 * These are not style tests. "Every Module fits the Screen exactly" is the
 * constraint that lets the Unit have no scrolling and no browsing control
 * (ADR-0009), and it is a constraint a copy edit breaks silently — the source
 * file looks fine, and the overflow only shows up on a 590px-wide Plate. So the
 * budget is asserted here rather than trusted.
 */

const longest = (lines: readonly string[]) =>
  lines.reduce((n, l) => Math.max(n, l.length), 0)

describe('the six Modules', () => {
  it('is exactly six', () => {
    expect(MODULES).toHaveLength(6)
  })

  it('fills slots 1 to 6, once each', () => {
    expect(MODULES.map(m => m.slot)).toEqual([1, 2, 3, 4, 5, 6])
  })

  it('has a unique id per Module', () => {
    expect(new Set(MODULES.map(m => m.id)).size).toBe(6)
  })

  it('wraps at both ends, so the Pads can never index off the array', () => {
    expect(moduleAt(0)).toBe(MODULES[0])
    expect(moduleAt(6)).toBe(MODULES[0])
    expect(moduleAt(-1)).toBe(MODULES[5])
  })
})

describe('the Screen budget', () => {
  const of = <K extends Module['kind']>(kind: K) =>
    MODULES.filter((m): m is Extract<Module, { kind: K }> => m.kind === kind)

  it.each(of('prose'))('$title fits as prose', m => {
    const b = SCREEN_BUDGET.prose
    expect(m.lines.length).toBeLessThanOrEqual(b.lines)
    expect(longest(m.lines)).toBeLessThanOrEqual(b.lineChars)
    expect(m.dim?.length ?? 0).toBeLessThanOrEqual(b.dim)
    expect(longest(m.dim ?? [])).toBeLessThanOrEqual(b.dimChars)
  })

  it.each(of('thesis'))('$title fits on both sides of the Crossfader', m => {
    const b = SCREEN_BUDGET.thesis
    for (const side of [m.a, m.b]) {
      expect(side.lines.length).toBeLessThanOrEqual(b.lines)
      expect(longest(side.lines)).toBeLessThanOrEqual(b.lineChars)
      expect(side.heading.length).toBeLessThanOrEqual(b.headingChars)
    }
  })

  it.each(of('table'))('$title fits as a table', m => {
    const b = SCREEN_BUDGET.table
    expect(m.rows.length).toBeLessThanOrEqual(b.rows)
    for (const row of m.rows) expect(longest(row)).toBeLessThanOrEqual(b.cellChars)
  })

  it.each(of('steps'))('$title fits as steps', m => {
    const b = SCREEN_BUDGET.steps
    expect(m.steps.length).toBeLessThanOrEqual(b.steps)
    expect(longest(m.steps)).toBeLessThanOrEqual(b.stepChars)
  })
})

describe('what the content is allowed to claim', () => {
  /**
   * PRODUCT.md prohibits presenting AI, automation and analytics as established
   * experience. The Crossfader can be dragged fully to Next, so the B side has
   * to stay honest at its own extreme (ADR-0005) — this is the tripwire for a
   * future copy edit that makes it sound stronger.
   */
  it('keeps the Next side of the thesis future-tense', () => {
    const thesis = MODULES.find(m => m.kind === 'thesis')
    expect(thesis).toBeDefined()
    const next = (thesis as Extract<Module, { kind: 'thesis' }>).b
    const text = [next.heading, ...next.lines].join(' ').toLowerCase()

    expect(text).toMatch(/building toward|learning/)
    expect(text).not.toMatch(/years of experience|expert|specialis|specializ|proven/)
  })

  it('offers exactly one way out, and it is a direct address', () => {
    const withMail = MODULES.filter(m => m.kind === 'prose' && m.mail)
    expect(withMail).toHaveLength(1)
    /* The address itself is deliberately not asserted — it is Fernando's real
       contact, and a test fixture is one of the places it should not be. */
    const mail = (withMail[0] as Extract<Module, { kind: 'prose' }>).mail!
    expect(mail).toMatch(/^[^@\s]+@[^@\s]+\.[^@\s]+$/)
  })
})
