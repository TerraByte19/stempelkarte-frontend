#!/usr/bin/env python3
# psnr.py <liste.json> - vergleicht Bildpaare [{"name", "a", "b"}] und gibt je Paar
# PSNR (dB), groessten Farbabstand und Anteil abweichender Pixel als JSON aus.
# Gleiche Bilder bekommen "inf" (als Zahl 999, damit JSON gueltig bleibt).
import json, sys
import numpy as np
from PIL import Image

out = []
for p in json.load(open(sys.argv[1])):
    a = np.asarray(Image.open(p['a']).convert('RGB'), dtype=np.float64)
    b = np.asarray(Image.open(p['b']).convert('RGB'), dtype=np.float64)
    if a.shape != b.shape:
        out.append({'name': p['name'], 'psnr': 0, 'error': f'Größe {a.shape} gegen {b.shape}'}); continue
    d = a - b; mse = float(np.mean(d * d))
    out.append({'name': p['name'], 'psnr': 999.0 if mse == 0 else round(10 * np.log10(255 * 255 / mse), 2),
                'identical': mse == 0, 'maxDiff': int(np.abs(d).max()), 'diffPixels': int(np.count_nonzero(np.abs(d).max(axis=2)))})
print(json.dumps(out))
