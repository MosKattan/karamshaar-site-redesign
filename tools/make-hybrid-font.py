"""Builds "KS Hybrid": an upright sans with serif italic letters woven in, for the testing ground.

It is put together from two open-licensed fonts (SIL Open Font License 1.1), not drawn from or traced over any other typeface:
  the sans      Inter Tight                https://github.com/google/fonts/tree/main/ofl/intertight
  the italics   Playfair Display Italic    https://github.com/google/fonts/tree/main/ofl/playfairdisplay
The result carries neither of their names (Playfair Display is a reserved font name) and is under the same licence.

  python tools/make-hybrid-font.py <folder with InterTight.ttf and PlayfairItalic.ttf> <out.woff2>
  needs: pip install fonttools brotli

What the font does on its own, with no markup (features "rclt" and "calt"; browsers switch calt off wherever
letter-spacing is set, which is every heading here, so the same rules are also filed under rclt, which they leave on):
  a word that ends in y (three letters or more) gets an italic y; a word that ends in ing gets an italic ing.
Feature "ss01" turns every letter italic, for a whole emphasised word:  font-feature-settings:"ss01"
"""
import sys
from fontTools import subset
from fontTools.feaLib.builder import addOpenTypeFeaturesFromString
from fontTools.pens.recordingPen import DecomposingRecordingPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

src, out = sys.argv[1], sys.argv[2]
SANS_WEIGHT, ITALIC_WEIGHT = 440, 440
ITALIC_SIZE = 1.03      # on top of matching the two x-heights: the italic reads small beside a sans otherwise
NAME = 'KS Hybrid'

sans = instantiateVariableFont(TTFont(f'{src}/InterTight.ttf'), {'wght': SANS_WEIGHT})
ital = instantiateVariableFont(TTFont(f'{src}/PlayfairItalic.ttf'), {'wght': ITALIC_WEIGHT})
for t in ('STAT', 'avar', 'MVAR', 'HVAR'):
    if t in sans: del sans[t]

upm = sans['head'].unitsPerEm
k = sans['OS/2'].sxHeight / ital['OS/2'].sxHeight * ITALIC_SIZE
scmap, icmap, iset, glyf = sans.getBestCmap(), ital.getBestCmap(), ital.getGlyphSet(), sans['glyf']
lower, upper = 'abcdefghijklmnopqrstuvwxyz', 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
pairs = []   # (sans glyph, its italic twin)
for ch in lower + upper + ".,'’":
    sname, iname = scmap[ord(ch)], icmap[ord(ch)]
    rec = DecomposingRecordingPen(iset); iset[iname].draw(rec)
    pen = TTGlyphPen(None); rec.replay(TransformPen(pen, (k, 0, 0, k, 0, 0)))
    g = pen.glyph(); new = sname + '.it'
    glyf[new] = g; g.recalcBounds(glyf)
    width = round(iset[iname].width * k)
    if ch in "'’":   # the italic apostrophe sits in a wide space of its own; it is set close, as in Syria's
        left, right = round(.03 * upm), round(.015 * upm)
        pen = TTGlyphPen(None); rec.replay(TransformPen(pen, (k, 0, 0, k, left - g.xMin, 0)))
        width = g.xMax - g.xMin + left + right
        g = pen.glyph(); glyf[new] = g; g.recalcBounds(glyf)
    sans['hmtx'][new] = (width, getattr(g, 'xMin', 0))
    pairs.append((sname, new))
order = sans.getGlyphOrder() + [b for _, b in pairs if b not in sans.getGlyphOrder()]
sans.setGlyphOrder(order); glyf.setGlyphOrder(order)
if hasattr(sans, '_reverseGlyphOrderDict'): del sans._reverseGlyphOrderDict

n = {ch: scmap[ord(ch)] for ch in lower + upper}
cls = lambda chars: '[' + ' '.join(n[c] for c in chars) + ']'
fea = f"""
languagesystem DFLT dflt; languagesystem latn dflt;
@lc = {cls(lower)}; @letter = {cls(lower + upper)};
feature ss01 {{ {' '.join(f'sub {a} by {b};' for a, b in pairs)} }} ss01;
lookup final_y {{ sub @lc @lc {n['y']}' by {n['y']}.it; }} final_y;
lookup final_g {{ sub @lc {n['i']} {n['n']} {n['g']}' by {n['g']}.it; }} final_g;
lookup not_final {{ sub {n['y']}.it' @letter by {n['y']}; sub {n['g']}.it' @letter by {n['g']}; }} not_final;
lookup ing_n {{ sub {n['i']} {n['n']}' {n['g']}.it by {n['n']}.it; }} ing_n;
lookup ing_i {{ sub {n['i']}' {n['n']}.it {n['g']}.it by {n['i']}.it; }} ing_i;
feature rclt {{ lookup final_y; lookup final_g; lookup not_final; lookup ing_n; lookup ing_i; }} rclt;
feature calt {{ lookup final_y; lookup final_g; lookup not_final; lookup ing_n; lookup ing_i; }} calt;
"""
addOpenTypeFeaturesFromString(sans, fea, tables=['GSUB'])

names = {1: NAME, 2: 'Regular', 3: NAME + ' 1.0', 4: NAME, 6: NAME.replace(' ', ''), 16: None, 17: None, 25: None, 5: 'Version 1.0',
         0: 'Built from Inter Tight (The Inter Project Authors) and Playfair Display Italic (The Playfair Display Project Authors).',
         13: 'This Font Software is licensed under the SIL Open Font License, Version 1.1.', 14: 'https://openfontlicense.org'}
table = sans['name']
table.names = [r for r in table.names if r.nameID not in names]
for i, v in names.items():
    if v: table.setName(v, i, 3, 1, 0x409)

opts = subset.Options(); opts.layout_features = ['kern', 'rclt', 'calt', 'ss01']; opts.name_IDs = ['*']; opts.hinting = False; opts.notdef_outline = True
sub = subset.Subsetter(opts)
sub.populate(unicodes=[*range(0x20, 0x7F), *range(0xA0, 0x100), *range(0x2010, 0x2028), 0x2030, 0x2039, 0x203A, 0x20AC, 0x2122, 0x2212])
sub.subset(sans)
sans.flavor = 'woff2'; sans.save(out)
print(f'  {out}: {len(sans.getGlyphOrder())} glyphs')
