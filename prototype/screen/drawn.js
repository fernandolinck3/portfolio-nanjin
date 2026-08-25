/* The Wizard, hand-drawn.

   The `character` are.na board is nine references and not one of them is a
   silhouette. The rabbit knight, the caped cat, the 1-bit portrait grid, the
   robed girl with the cat on her back, the 2-bit schoolgirl, the chibi with the
   red bag — every one is DRAWN: an outline, interior detail, hair, and a real
   face with pupils in it. The procedural figure beside this one can never get
   there, because a profile function has no opinion about a face.

   So she is a bitmap, authored as text so the repo still ships no binary asset
   (which is what ADR-0004 was actually protecting). One character per pixel:

     .  transparent      #  ink, her light body
     -  mid, shading     o  dark, the ground showing through as a drawn line

   THIS IS A PLACEHOLDER. It is here to prove the pipeline and to show the
   difference in kind against the procedural version. Fernando is a designer and
   is already drawing the faceplate art; the real one should be his. */

export const WIZARD = [
  '..................#.........',
  '.................##.........',
  '................####........',
  '..............######........',
  '.............#######........',
  '............#########.......',
  '...........##########.......',
  '.........############.......',
  '........##############......',
  '.......###############......',
  '......################......',
  '......oooooooooooooooo......',
  '.....##################.....',
  '..########################..',
  '.##########################.',
  '..oooooooooooooooooooooooo..',
  '.......-############-.......',
  '.....--##############--.....',
  '.....--##############--.....',
  '.....--###oo####oo###--.....',
  '.....--###oo####oo###--.....',
  '.....--##############--.....',
  '.....--######oo######--.....',
  '......--############--......',
  '.......-############-.......',
  '........############........',
  '.........##########.........',
  '..........########..........',
  '.........##########.........',
  '........############........',
  '.......##############.......',
  '.......##############.......',
  '......################......',
  '......######-##-######......',
  '.....##################.....',
  '.....#####-######-#####.....',
  '....####################....',
  '....####################....',
  '...######################...',
  '..------------------------..',
]

/** Her raven. Small, and light so it reads against the dark ground. */
export const RAVEN = [
  '.....##...',
  '....####..',
  '...######.',
  '..#######-',
  '.#########',
  '-####o###.',
  '..#....#..',
  '..........',
]

/** Where her hands sit, in sprite pixels, so held things land in front of her. */
export const HANDS = { l: [4, 33], r: [23, 33], centre: [14, 33] }

/**
 * Draw a text sprite at `scale`. Nearest-neighbour by construction — every
 * source pixel becomes a scale x scale block, so it never goes soft.
 */
export function drawSprite(g, rows, x, y, scale, ink, dim, bg) {
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r]
    for (let c = 0; c < row.length; c++) {
      const ch = row[c]
      if (ch === '.') continue
      g.fillStyle = ch === '#' ? ink : ch === '-' ? dim : bg
      g.fillRect(x + c * scale, y + r * scale, scale, scale)
    }
  }
}

export const SPRITE_W = WIZARD[0].length
export const SPRITE_H = WIZARD.length
