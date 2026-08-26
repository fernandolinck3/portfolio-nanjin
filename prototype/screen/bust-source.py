"""The Wizard's bust — hand-placed. Every row below is a decision, not a rule.

Light falls from her right (image left). 28 wide, 32 tall, because the sprite's
height sets her scale on the Screen: `spriteBox()` divides `fh * .58` by it, and
at the heights in STAGE that lands on scale 2. Change the height and she shrinks.

  .  transparent    #  lit skin / highlight    -  half-light
  =  hair, hat, shadow                        o  black — lashes, eyes, mouth

Three things the first pass got wrong, and what replaced them:

  THE TERMINATOR WAS A STRAIGHT LINE. Every row read `#######--===`, so the shaded
  side of her face was one flat band the same tone as her hair, and the face lost
  five of its twelve columns. Here the boundary follows the form: widest over the
  brow and the cheekbone, cut in at the eye socket, closing as the jaw narrows.

  THE EYES WERE SOLID BLOCKS. Four rows of `o` is a mask. An eye is a lash line
  above, an iris under it, and one lit pixel — and the shaded eye keeps its glint
  in half-light, or she goes blind on that side.

  THE BRIM WAS A PLANK. Three rows of equal width read as a table edge. A brim is
  an ellipse: narrow at the back, widest in the middle, and its underside is the
  darkest thing on her.
"""
W, H = 28, 32
R = []

def row(cells):
    s = ''.join(cells)
    assert len(s) == W, (len(R), len(s), s)
    R.append(s)

def blank():
    return ['.'] * W

def paint(r, a, b, ch):
    """Fill columns a..b inclusive. Clipped, so the arithmetic can be sloppy."""
    for i in range(max(0, a), min(W - 1, b) + 1):
        r[i] = ch

# ---- hat cone. Leaning hard right; the lit edge runs up its left side. ----
for i in range(8):
    r = blank()
    left = round(19 - 11 * i / 7)
    right = round(20 + i / 7)
    paint(r, left, right, '=')
    r[left] = '#'
    if i == 7:                      # hatband, sitting on the brim
        paint(r, left + 1, right - 1, '-')
        r[left] = '#'
    row(r)

# ---- brim. An ellipse in three rows, not a bar. ----
#      row 8  the back edge, narrow and lit along the top
#      row 9  the widest run
#      row 10 the underside — the darkest thing on her, and what lifts the hat
#             off the forehead
for a, b, lit, mid in ((3, 24, 6, 10), (0, 27, 5, 9), (2, 25, -1, -1)):
    r = blank()
    paint(r, a, b, '=')
    if lit >= 0:
        paint(r, a, lit, '#')
        paint(r, lit + 1, mid, '-')
    else:
        r[a] = '-'                  # one lit pixel catching the underside's rim
    row(r)

# ---- head. cols 4..7 hair | 8..19 face | 20..23 hair ----
FL, FR = 8, 19

# Locks, not a hairline: each is a 2px lit run that wanders down the mass.
# Listed rather than generated so they drift instead of stepping.
LOCK_L = [5,5,6,6,4,5,5,6,6,5,4,4,5,5,6,6,5,4,4,5,5]
LOCK_R = [22,21,21,20,22,22,21,20,20,21,22,22,21,20,20,21,22,22,21,21,20]

# The terminator, per face row: (last lit column, last half-light column).
# Read down the first number and you are reading the shape of her skull.
FACE = [
  #  lit  half   what the row is
    (19, 19),  # 11 fringe — solid hair, no face yet
    (19, 19),  # 12 fringe
    (19, 19),  # 13 fringe breaking into points
    (16, 18),  # 14 brow. the forehead is a broad plane and takes the most light
    (15, 17),  # 15 lash line — the socket recedes
    (15, 17),  # 16 iris and glint
    (15, 17),  # 17 lower lid
    (16, 18),  # 18 cheekbone catches, and the light comes back
    (16, 18),  # 19 cheek
    (15, 17),  # 20 nose
    (15, 17),  # 21 nose
    (14, 16),  # 22 under the nose, falling away
    (14, 16),  # 23 mouth
    (13, 15),  # 24 under the mouth
    (12, 14),  # 25 the jaw starts to close
    (11, 13),  # 26 chin
]

for i, (lit, half) in enumerate(FACE):
    r = blank()
    n = len(R)
    # hair mass both sides
    paint(r, 4, FL - 1, '=')
    paint(r, FR + 1, 23, '=')
    j = n - 11
    if j < len(LOCK_L) and j % 3 != 1:
        r[LOCK_L[j]] = '-'
        r[LOCK_R[j]] = '-'
    # face, lit into half into deep
    paint(r, FL, FR, '=')
    if lit < FR:
        paint(r, FL, half, '-')
        paint(r, FL, lit, '#')
    row(r)

def at(n):
    """The row list index for sprite row n."""
    return n

# ---- the fringe breaks into points over the forehead ----
# Dark spikes hanging into the lit brow, two rows deep so the edge is not a
# 1px zigzag. Cut into rows 13 and 14 after the fact.
def spike(n, cols, depth):
    r = list(R[n])
    for c in cols:
        for d in range(depth):
            if r[c] != '.':
                r[c] = '='
    R[n] = ''.join(r)

r13 = list(R[13])
for c in (9, 10, 13, 14, 17, 18):     # the notches where the fringe is short
    r13[c] = '-' if c > 15 else '#'
R[13] = ''.join(r13)
r14 = list(R[14])
for c in (8, 12, 16):                 # spikes still hanging into the brow
    r14[c] = '='
R[14] = ''.join(r14)

# ---- eyes. Lash line, iris, glint. The shaded eye keeps its glint. ----
def put(n, spec):
    """spec: (col, char) pairs written into sprite row n."""
    r = list(R[n])
    for c, ch in spec:
        r[c] = ch
    R[n] = ''.join(r)

# lit eye cols 9..11, shaded eye cols 14..16
put(15, [(9,'o'),(10,'o'),(11,'o'),  (15,'o'),(16,'o'),(17,'o')])          # lashes
put(16, [(9,'o'),(10,'#'),(11,'o'),  (15,'o'),(16,'-'),(17,'o')])          # iris + glint
put(17, [(9,'-'),(10,'o'),(11,'o'),  (15,'='),(16,'o'),(17,'o')])          # lower lid

# ---- nose: two marks, not a block. Mouth: one line with a lit lower lip. ----
put(20, [(12,'o')])
put(21, [(11,'o'),(12,'o')])
put(23, [(10,'o'),(11,'o'),(12,'o')])
put(24, [(11,'#'),(12,'#')])
put(19, [(8,'-')])                    # the plane turns under the cheekbone
put(26, [(9,'-'),(10,'-')])           # jaw line

# ---- jaw closes, then two rows of neck in shadow ----
r = blank(); paint(r, 4, 23, '='); r[LOCK_L[16]] = '-'
r[LOCK_R[16]] = '-'; paint(r, 10, 15, '-'); paint(r, 10, 12, '#')
row(r)                                                        # 27 jaw point
r = blank(); paint(r, 5, 22, '='); paint(r, 10, 15, '-'); paint(r, 10, 12, '#')
row(r)                                                        # 28 neck
r = blank(); paint(r, 6, 21, '='); paint(r, 11, 14, '-')
row(r)                                                        # 29 neck in shadow

# ---- high collar. It stands up either side of the neck. ----
r = blank(); paint(r, 5, 22, '='); r[5] = '#'; r[22] = '#'; paint(r, 10, 15, '-')
row(r)                                                        # 30
r = blank(); paint(r, 4, 23, '='); r[4] = '#'; r[23] = '#'; paint(r, 9, 16, '=')
row(r)                                                        # 31

assert len(R) == H, len(R)
print("  /* %d x %d */" % (W, H))
print('\n'.join("  '%s'," % r for r in R))
