#!/usr/bin/env python3
# sheet.py <ordner-mit-bildern> <out.png> [spalten] [breite]
# Baut die Uebersicht: ein Bild pro Sekunde, mit Sekundenzahl in der Ecke.
# Die Bilder heissen <sekunde>.jpg (make.mjs legt sie beim Rendern ab).
# Gedacht zum Draufschauen VOR der Abgabe: Ueberlauf, Ueberlappung und
# abgeschnittener Text fallen hier schneller auf als im laufenden Video.
import os, sys
from PIL import Image, ImageDraw, ImageFont

src, out = sys.argv[1], sys.argv[2]
cols = int(sys.argv[3]) if len(sys.argv) > 3 else 10
tw = int(sys.argv[4]) if len(sys.argv) > 4 else 216
files = sorted((f for f in os.listdir(src) if f.endswith('.jpg') and f[:-4].isdigit()), key=lambda f: int(f[:-4]))
if not files: sys.exit('sheet.py: keine Bilder in ' + src)
first = Image.open(os.path.join(src, files[0])); th = round(tw * first.height / first.width)
rows = (len(files) + cols - 1) // cols
sheet = Image.new('RGB', (cols * tw, rows * th), (14, 10, 36))
try: font = ImageFont.load_default(size=max(14, tw // 11))
except TypeError: font = ImageFont.load_default()  # aeltere Pillow-Version: kleine Rasterschrift
draw = ImageDraw.Draw(sheet)
for i, f in enumerate(files):
    im = Image.open(os.path.join(src, f)).convert('RGB').resize((tw, th), Image.LANCZOS)
    x, y = (i % cols) * tw, (i // cols) * th
    sheet.paste(im, (x, y))
    label = f[:-4] + ' s'
    box = draw.textbbox((0, 0), label, font=font)
    draw.rectangle([x, y, x + box[2] + 12, y + box[3] + 10], fill=(14, 10, 36))
    draw.text((x + 6, y + 4), label, fill=(185, 176, 255), font=font)
sheet.save(out, optimize=True)
print(f'{len(files)} Bilder, {sheet.width}x{sheet.height}')
