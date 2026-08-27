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

type Base = {
  slot: number
  id: string
  title: string
  /** Short form printed above the Pad. The Plate has ~96px of pitch per Pad, so a
      title like "NOW / NEXT" runs into its neighbours; this is what fits. */
  pad?: string
}

export type Module =
  | (Base & {
      kind: 'prose'
      lines: string[]
      dim?: string[]
      mail?: string
      /** Where else to find him. `url` absent means show the handle, do not link it. */
      links?: readonly { label: string; handle: string; url?: string }[]
    })
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
  /* 6 since PATH became the record: at a 16px step six rows land inside the
     Screen's floor with room for the status line. Verified on the panel, not
     assumed — five was the cap when the step was 18. */
  table: { rows: 6, cellChars: 30 },
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
  kind: 'Unit' | 'Site' | 'Poster' | 'Campaign' | 'Social'
  year: string
  /** Who it was for. Absent on self-directed work. */
  client?: string
  blurb: string[]
  /** Web-sized stills under `public/works/`. The first is the one the panel shows. */
  images?: string[]
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
    no: '002',
    id: 'nelogica-bollinger',
    title: 'Bandas de Bollinger',
    kind: 'Campaign',
    client: 'Nelogica',
    year: '2025',
    images: ['/works/nelogica-bollinger.jpg'],
    blurb: [
      'Launch campaign for an eight-week trading',
      'course. Feed and story, built to be read at',
      'thumb speed on a dark timeline.',
    ],
  },
  {
    no: '003',
    id: 'ru-mine',
    title: 'R U MINE?',
    kind: 'Poster',
    client: 'Classic Reeboks',
    year: '2023',
    images: ['/works/ru-mine-a.jpg', '/works/ru-mine-b.jpg'],
    blurb: [
      'An Arctic Monkeys night in Gravatai. Two',
      'passes at the same bill \u2014 one all halftone and',
      'bleed, one cut into hard red blocks.',
    ],
  },
  {
    no: '004',
    id: 'rifa-handbanners',
    title: 'Rifa Handbanners',
    kind: 'Poster',
    year: '2025',
    images: ['/works/rifa-handbanners.jpg'],
    blurb: [
      'A fan raffle sheet. Arched niches, engraved',
      'serif and a single red \u2014 the closest thing here',
      'to the language the Unit ended up in.',
    ],
  },
  {
    no: '005',
    id: 'graecus',
    title: 'Graecus',
    kind: 'Social',
    client: 'Graecus',
    year: '2026',
    images: ['/works/graecus-mdsale.jpg', '/works/graecus-namorados.jpg'],
    blurb: [
      'Agency social, carousel format. Glass cards',
      'over photography, one accent, a house grid',
      'that survives whatever the brief is.',
    ],
  },
  {
    no: '006',
    id: 'parize',
    title: 'Parize Imoveis',
    kind: 'Social',
    client: 'Parize Imoveis',
    year: '2024',
    images: ['/works/parize-dombosco.jpg', '/works/parize-natal.jpg'],
    blurb: [
      'End-to-end marketing for a local estate agent:',
      'listings, seasonal posts, paid assets and the',
      'landing pages under them.',
    ],
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
    /**
     * This said "No agency. No client case studies yet." It was true when it was
     * written and it is not true now: there is four years of client work behind
     * it — a trading platform, a cruise line, an estate agent, an agency. Copy
     * that undersells is as inaccurate as copy that oversells, and PRODUCT.md
     * asks for claims that check out, in both directions.
     */
    lines: [
      'I build interfaces in the browser, and I think',
      'about who is reading them. Frontend execution',
      'with a marketing head on it, and a read on',
      'culture that is mine rather than borrowed.',
    ],
    /* The budget counts *written* lines; the Screen wraps them to its own width,
       which on this Module is about 33 characters. Two 45-character lines became
       four rendered ones and the Screen said so: "+1 LINES". */
    dim: [
      'Trading platform, cruise line,',
      'agency. Porto Alegre, Brazil.',
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
    pad: 'NOW·NEXT',
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
    /* Retitled: this Module renders the series, not one project — `render.js`
       branches on the id and draws `WORKS` here, so the prose below is unused. */
    title: 'WORKS',
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
    title: 'PATH',
    kind: 'table',
    head: ['WHAT', 'WHERE', ''],
    /**
     * Was a PLACEHOLDER list of influences, which T-13 flagged and which blocked
     * for three sessions. It is the record now, and every row is checkable
     * against Fernando's CV — which is the bar CONTEXT.md sets for the Rack
     * ("every entry verifiable") and the reason the influences never met it.
     *
     * **Renames the Rack.** CONTEXT.md defines it in the eurorack sense: the set
     * of modules you own and patch together. A work history is a defensible
     * reading of that and it is still a change to a glossary term, so it wants
     * Fernando's word and an entry in CONTEXT.md rather than a silent swap.
     *
     * Only what the CV states. Graecus appears in WORKS but not in the CV, so the
     * nature of that engagement is not recorded here rather than guessed at.
     */
    rows: [
      ['Front-end development', 'Nelogica', ''],
      ['Web design & landing pages', 'Nelogica', ''],
      ['AI & automation', 'Independent', ''],
      ['CRO & growth marketing', 'Nelogica', ''],
      ['Program publishing', 'MSC Crociere', ''],
      ['Marketing & design', 'Parize · Graecus', ''],
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
    /* Fernando's real address, chosen by him over the gmail this used to carry.
       It ships; it does not go in fixtures or logs. */
    mail: 'fernandolinck@outlook.com',
    links: [
      { label: 'IG', handle: '@nan._.jin', url: 'https://instagram.com/nan._.jin' },
      /* No `url`: the display name is what Fernando gave, and guessing a LinkedIn
         slug from a name is exactly the kind of invention PRODUCT.md forbids.
         It renders as text until he supplies the address. */
      { label: 'IN', handle: 'Fernando Linck' },
    ],
    /* Was "São Paulo". The CV says Porto Alegre, and so does every role in it. */
    dim: ['Porto Alegre, Brazil. English or Portuguese.'],
  },
]

/** The live Module. Slots are 1-based; the state that drives them is 0-based. */
export function moduleAt(index: number): Module {
  return MODULES[((index % MODULES.length) + MODULES.length) % MODULES.length]
}
