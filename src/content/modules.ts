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

/**
 * What Lyra says, one line per Module, in slot order.
 *
 * She is the Screen's inhabitant, not its salesman. These lines describe what she
 * is doing and what the visitor is looking at; they never make a claim about
 * Fernando's experience, because every such claim has to be checkable against the
 * object (PRODUCT.md) and a line in a speech bubble cannot be.
 *
 * Kept short on purpose — the bubble draws inside a 320x180 Screen beside her.
 */
export const LYRA_NAME = 'LYRA'
export const LYRA_BUBBLE_CHARS = 26

export const LYRA_LINES: readonly (readonly string[])[] = [
  /* 1 IDENT      */ ['The unit is awake.', 'Turn a deck and see.'],
  /* 2 NOW / NEXT */ ['I hold both ends.', 'The mark does not move.'],
  /* 3 PROJECT 001*/ ['He built this one first.', 'You are standing in it.'],
  /* 4 RACK       */ ['Everything here is', 'patched into something.'],
  /* 5 METHOD     */ ['Six steps. No secrets.', 'The notes are kept.'],
  /* 6 OUT        */ ['Send the raven.', 'It knows the way.'],
]

/** Her line for a 0-based Module index. */
export function lyraAt(index: number): readonly string[] {
  return LYRA_LINES[((index % LYRA_LINES.length) + LYRA_LINES.length) % LYRA_LINES.length]
}

/**
 * A Work — something Fernando made, numbered from this Unit onward.
 *
 * Kept separate from `MODULES` on purpose. Where these get *shown* is undecided:
 * a website or a poster is an image with real detail in it, and the Screen is a
 * 320x180 four-tone inset seen at an angle, so it physically cannot carry one.
 * Whatever answers that (see ADR-0017 once it is written) will read this list;
 * the list itself does not need to know.
 *
 * `blurb` is what can be said on the Screen. `sheet` is the image that needs
 * somewhere bigger to live.
 */
export type Work = {
  no: string
  id: string
  title: string
  kind: 'Unit' | 'Site' | 'Poster'
  year: string
  blurb: string[]
  sheet?: string
  /** True while this row is a stand-in and its content is not yet Fernando's. */
  placeholder?: boolean
}

/**
 * The series.
 *
 * 001 is real and checkable — the visitor is standing in it. Everything after it
 * is a PLACEHOLDER holding a shape, and says so in its own row: Fernando has
 * websites and posters to add, and the titles, years and copy below are not them.
 * PRODUCT.md forbids illustrative concepts presented as real work, so these must
 * be replaced before the Unit is published (T-14) rather than quietly kept.
 */
export const WORKS: readonly Work[] = [
  {
    no: '001',
    id: 'tenebrae',
    title: 'Tenebrae',
    kind: 'Unit',
    year: '2026',
    blurb: [
      'The unit you are holding. A single instrument',
      'rendered in real time, engraved in code.',
    ],
  },
  {
    no: '002', id: 'site-a', title: 'Untitled site', kind: 'Site', year: '—',
    placeholder: true,
    blurb: ['Placeholder. A website Fernando has built,', 'not yet chosen or written up.'],
  },
  {
    no: '003', id: 'site-b', title: 'Untitled site', kind: 'Site', year: '—',
    placeholder: true,
    blurb: ['Placeholder. A website Fernando has built,', 'not yet chosen or written up.'],
  },
  {
    no: '004', id: 'poster-a', title: 'Untitled poster', kind: 'Poster', year: '—',
    placeholder: true,
    blurb: ['Placeholder. A poster from Fernando\'s own', 'graphic work.'],
  },
  {
    no: '005', id: 'poster-b', title: 'Untitled poster', kind: 'Poster', year: '—',
    placeholder: true,
    blurb: ['Placeholder. A poster from Fernando\'s own', 'graphic work.'],
  },
]

/** How many of the series are real rather than holding a shape. */
export const REAL_WORKS = WORKS.filter(w => !w.placeholder).length

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
