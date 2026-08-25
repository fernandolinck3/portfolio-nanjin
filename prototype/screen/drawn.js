/* The Wizard, hand-drawn — second pass, against the `character` board.

   What the references actually agree on, and what the first pass got wrong:

   - A HAIR MASS, not a hairline. The 2-bit schoolgirl, the chibi with the red
     bag and the dithered portraits all lead with a heavy fringe and hair falling
     past the jaw. It frames the face and is most of the silhouette.
   - EYES WITH A HIGHLIGHT. Every face on that board has a glint in the pupil.
     Two dark squares read as a mask; two dark squares with one lit pixel read as
     someone looking at you.
   - FOUR TONES. The green schoolgirl is Game Boy 4-tone and the portrait tiles
     dither greys. Two tones cannot hold a fringe, a face and a robe apart.
   - SHE CARRIES SOMETHING. The rabbit knight has a mace-staff, the cat a sword,
     the chibi a bag. The prop does the work a pose would.

   Authored as text so the repo still ships no binary (ADR-0013). One character
   per pixel:

     .  transparent    #  light — face, highlights
     -  mid — the robe    =  deep — hair, shadow
     o  the ground showing through, as a drawn line

   Still a placeholder, and still better if Fernando draws it. */

/* The bust: hat, hair, face, jaw. Everything below the shoulders is generated —
   a face is a set of decisions and has to be drawn; a robe is a shape. */
export const BUST = [
  '...................#=.......',
  '..................#==.......',
  '.................#===.......',
  '................#====.......',
  '..............#======.......',
  '............#========.......',
  '..........#==========.......',
  '........#============.......',
  '.##########################.',
  '#==========================#',
  '.##########################.',
  '....=#================#=....',
  '....==#==============#==....',
  '....===#=##==##==##=#===....',
  '....#===#######--======#....',
  '....=#==#oooo##oooo===#=....',
  '....==#=#o#oo##o-oo==#==....',
  '....==#=#oooo##oooo==#==....',
  '....===###oo####oo-=#===....',
  '....#===#######--======#....',
  '....=#==#####oo--=====#=....',
  '....==#=#######--====#==....',
  '....===#####ooo--===#===....',
  '....#===#######--======#....',
  '....#====#####--=======#....',
  '....=#=====####--=====#=....',
  '....==#======##======#==....',
  '....===#=====..=====#===....',
  '....#=======....=======#....',
  '.....=#=====....=====#=.....',
  '.......#===......===#.......',
  '........#==......==#........',
]

/** Her staff. Drawn beside her so the orb can flare on its own during a Cast. */
export const STAFF = [
  '..#..',
  '.#o#.',
  '#o#o#',
  '.#o#.',
  '..#..',
  '..#..',
  '..=..',
  '..#..',
  '..#..',
  '..=..',
  '..#..',
  '..#..',
  '..=..',
  '..#..',
  '..#..',
  '..=..',
  '..#..',
  '..#..',
  '..=..',
  '..#..',
  '..#..',
  '..=..',
  '..#..',
  '..#..',
  '..=..',
  '..#..',
  '..#..',
  '..=..',
  '..#..',
]

/** Her raven. Deep body with a light edge, so it never merges into her hat. */
export const RAVEN = [
  '....oo....',
  '...o==o...',
  '..o====o..',
  '.o==#==o#o',
  'o========o',
  '.o==o===o.',
  '..o.oo.o..',
  '..........',
]

/** Sprite-space anchors: where things she holds and things that sit on her go. */
export const ANCHOR = {
  brim:  [2, 9],      /* the raven's perch, on the left tip of the brim */
  staff: [-3, 6],     /* top-left of the staff sprite, relative to her */
  neck:  [14, 30],    /* where the drawn bust hands over to the generated body */
}

/**
 * Draw a text sprite. Nearest-neighbour by construction — every source pixel is
 * a scale x scale block, so it never goes soft the way an upscaled image does.
 */
export function drawSprite(g, rows, x, y, scale, ink, mid, deep, bg) {
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r]
    for (let c = 0; c < row.length; c++) {
      const ch = row[c]
      if (ch === '.') continue
      g.fillStyle = ch === '#' ? ink : ch === '-' ? mid : ch === '=' ? deep : bg
      g.fillRect(x + c * scale, y + r * scale, scale, scale)
    }
  }
}

export const SPRITE_W = BUST[0].length
export const SPRITE_H = BUST.length
