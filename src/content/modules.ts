/**
 * The six Modules — the single source of the Unit's content.
 *
 * ADR-0002 makes the DOM canonical and the Screen a render of it, which means two
 * consumers need the same strings, which means the strings cannot live inside
 * either one. They live here: data only, no markup and no canvas calls.
 *
 * There are exactly six Modules and there is no seventh (ADR-0001). Every one
 * fits the Screen exactly, because nothing scrolls and no control browses
 * (ADR-0009) — the caps that keep that true are in `SCREEN_BUDGET` below and are
 * enforced by `modules.test.ts`, not by good intentions.
 */

/** One end of the Crossfader's thesis. */
export type Side = { heading: string; lines: string[] }

/** A Rack row: what it is, what kind of thing it is, and when. */
export type Row = readonly [title: string, type: string, year: string]

type Base = { slot: number; id: string; title: string }

export type Module =
  | (Base & { kind: 'prose'; lines: string[]; dim?: string[]; mail?: string })
  | (Base & { kind: 'thesis'; a: Side; b: Side })
  | (Base & { kind: 'table'; head: readonly [string, string, string]; rows: readonly Row[] })
  | (Base & { kind: 'steps'; steps: string[] })

/**
 * What fits on the Screen. The texture is 1024 x 576 and draws around a third of
 * that on the Plate, so these are hard limits — over them a Module either
 * overflows the Screen or goes illegible at render size.
 */
export const SCREEN_BUDGET = {
  prose: { lines: 4, lineChars: 52, dim: 2, dimChars: 58 },
  thesis: { lines: 4, lineChars: 52, headingChars: 40 },
  table: { rows: 5, cellChars: 30 },
  steps: { steps: 6, stepChars: 48 },
} as const

export const MODULES: readonly Module[] = [
  {
    slot: 1,
    id: 'ident',
    title: 'IDENT',
    kind: 'prose',
    lines: [
      'I build interfaces in the browser, and I think',
      'about who is reading them. Frontend execution',
      'with a marketing head on it, and a read on',
      'culture that is mine rather than borrowed.',
    ],
    dim: [
      'No agency. No client case studies yet. This unit',
      'is the first thing I have made in public.',
    ],
  },

  /**
   * The Crossfader carries this Module and nothing else. The B side stays
   * future-tense at its own extreme — a visitor can drag the fader all the way
   * over, and PRODUCT.md still has to hold when they do (ADR-0005).
   */
  {
    slot: 2,
    id: 'now-next',
    title: 'NOW / NEXT',
    kind: 'thesis',
    a: {
      heading: 'A — What I can do today.',
      lines: [
        'Semantic HTML, modern CSS, TypeScript. Positioning,',
        'message hierarchy, and the difference between a',
        'sentence that sounds impressive and one that says',
        'something.',
      ],
    },
    b: {
      heading: 'B — What I am building toward.',
      lines: [
        'AI for small business, process automation, data',
        'analytics. A learning direction — not professional',
        'experience, and not described as such.',
      ],
    },
  },

  {
    slot: 3,
    id: 'project-001',
    title: 'PROJECT 001',
    kind: 'prose',
    /**
     * Every line here names something the visitor can see on the panel in front
     * of them. It was corrected when the copy moved out of the prototype: it
     * still described a rose window and a vigil knob, and the Unit has had
     * neither since the tracery became a foliate engraving and the knob became
     * two Decks (ADR-0009). Copy that describes a version of the object that no
     * longer exists is exactly the claim-without-evidence this Module is here to
     * refuse.
     */
    lines: [
      'This unit is the project. The plate is engraved in',
      'code. Two decks put the candles out, one at a time.',
      'Every control does something real.',
    ],
    dim: [
      'Every claim here points at something visible on',
      'this panel. That is the only proof I have yet.',
    ],
  },

  {
    slot: 4,
    id: 'rack',
    title: 'RACK',
    kind: 'table',
    head: ['TITLE', 'TYPE', 'YEAR'],
    /**
     * PLACEHOLDER — these are influences, not a Rack. CONTEXT.md defines the
     * Rack in the eurorack sense: the set of modules you own and patch together,
     * every entry verifiable. PRODUCT.md forbids inventing them, so this is
     * blocked on Fernando (T-13) and must not be filled in by reading
     * package.json and guessing.
     */
    rows: [
      ['Tenebrae unit', 'Build', '2026'],
      ['Serial Experiments Lain', 'Influence', '1998'],
      ['Baroque · Sting', 'Influence', '1998'],
      ['Alva Noto — Xerrox', 'Influence', '2007'],
      ['In the Mood for Love', 'Influence', '2000'],
    ],
  },

  {
    slot: 5,
    id: 'method',
    title: 'METHOD',
    kind: 'steps',
    steps: [
      'Look at the context before deciding.',
      'Write down what is actually true.',
      'Choose a direction and commit to it.',
      'Build deliberately, one stage at a time.',
      'Check the result against the promise.',
      'Keep the notes.',
    ],
  },

  {
    slot: 6,
    id: 'out',
    title: 'OUT',
    kind: 'prose',
    lines: [
      'A role, a project, or something odd you need built.',
      'Write to me directly — no form, no funnel.',
    ],
    /** Fernando's real address. It ships; it does not go in fixtures or logs. */
    mail: 'fernandolinck3@gmail.com',
    dim: ['São Paulo. English or Portuguese.'],
  },
]

/** The live Module. Slots are 1-based; the state that drives them is 0-based. */
export function moduleAt(index: number): Module {
  return MODULES[((index % MODULES.length) + MODULES.length) % MODULES.length]
}
