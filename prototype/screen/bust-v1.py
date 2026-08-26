"""Hand-placed. Every row below is a decision, not a rule.

Light falls from her right (image left), so the far side of the face carries a
mid tone and then a deep one. 28 wide.

  .  transparent    #  lit skin / highlight    -  half-light
  =  hair, hat, shadow                          o  black — lashes, eyes, mouth
"""
W = 28
R = []
def row(*seg):
    s = ''.join(seg); assert len(s) == W, (len(R), len(s), s); R.append(s)

d = lambda n: '.' * n

# ---- hat. Leaning right, lit edge on the left. ----
row(d(19), '#=',              d(7))
row(d(18), '#==',             d(7))
row(d(17), '#===',            d(7))
row(d(16), '#====',           d(7))
row(d(14), '#======',         d(7))
row(d(12), '#========',       d(7))
row(d(10), '#==========',     d(7))
row(d(8),  '#============',   d(7))
# brim
row(d(1), '#' * 26, d(1))
row('#', '=' * 26, '#')
row(d(1), '#' * 26, d(1))

# ---- head. Each row is: 4 gap | hair 4 | face 12 | hair 4 | 4 gap ----
# The hair strands are listed, not generated, so they wander instead of stepping.
HL = ['=#==','==#=','===#','#===','=#==','==#=','==#=','===#','#===','=#==',
      '==#=','===#','#===','#===','=#==','==#=','===#','#===','=#==']
HR = ['==#=','=#==','#===','===#','==#=','=#==','=#==','#===','===#','==#=',
      '=#==','#===','===#','===#','==#=','=#==','#===','===#','==#=']
face = [
  '============',   # fringe, solid
  '============',   # fringe
  '=##==##==##=',   # the fringe breaks into points over the forehead
  '#######--===',   # forehead. shadow ramp: 7 lit, 2 half, 3 deep
  '#oooo##oooo=',   # lashes
  '#o#oo##o-oo=',   # glint — bright in the lit eye, half-light in the shaded one
  '#oooo##oooo=',
  '##oo####oo-=',   # lower lid
  '#######--===',
  '#####oo--===',   # nose
  '#######--===',
  '####ooo--===',   # mouth
  '#######--===',
  '=#####--====',   # jaw starts to close
  '===####--===',   # chin
  '=====##=====',   # chin point
]
for i, f in enumerate(face):
    row(d(4), HL[i], f, HR[i], d(4))

# ---- hair keeps falling past the jaw ----
row(d(4), HL[16], '=====', d(2), '=====', HR[16], d(4))
row(d(4), HL[17], '====',  d(4), '====',  HR[17], d(4))
row(d(5), '=#=',  '====',  d(4), '====',  '=#=',  d(5))

# ---- high collar ----
row(d(7), '#', '===', d(6), '===', '#', d(7))
row(d(8), '#', '==',  d(6), '==',  '#', d(8))

print('rows', len(R))
print('\n'.join("  '%s'," % r for r in R))
