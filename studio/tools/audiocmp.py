#!/usr/bin/env python3
# audiocmp.py cmp <a> <b>        vergleicht den Ton zweier Dateien (mp4, m4a, wav, mp3)
# audiocmp.py sha <a> [anzahl]   Fingerabdruck des dekodierten Tons (erste <anzahl> Abtastwerte)
#
# Beide Dateien werden ueber ffmpeg zu 16 bit mono 44,1 kHz dekodiert und dann
# Abtastwert fuer Abtastwert verglichen. Ausgabe als JSON. tools/regress.mjs
# benutzt das, um den Ton des Studios mit den veroeffentlichten Videos zu
# vergleichen: dieselbe Aufnahme, dieselben Effekte, dieselbe Mischung muessen
# nach dem Dekodieren denselben Ton ergeben.
import hashlib, json, subprocess, sys
import numpy as np


def decode(path):
    r = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-vn', '-f', 's16le', '-ar', '44100', '-ac', '1', 'pipe:1'], capture_output=True)
    if r.returncode != 0: sys.exit('ffmpeg: ' + r.stderr.decode('utf-8', 'replace')[:300])
    return np.frombuffer(r.stdout, dtype='<i2')


def compare(pa, pb):
    a, b = decode(pa).astype(np.float64), decode(pb).astype(np.float64)
    n = min(len(a), len(b))
    if n == 0: sys.exit('audiocmp: eine der Dateien hat keinen Ton')
    x, y = a[:n], b[:n]; d = x - y
    rms = lambda v: float(np.sqrt(np.mean(v * v))) if len(v) else 0.0
    tail = a[n:] if len(a) > n else b[n:]
    return {
        'samplesA': len(a), 'samplesB': len(b), 'common': n,
        'differing': int(np.count_nonzero(d)), 'maxDiff': int(np.abs(d).max()),
        # Abstand des Unterschieds zum Signal in dB (je kleiner, desto gleicher; -200 = kein Unterschied)
        'rmsDiffDb': round(20 * np.log10(max(rms(d), 1e-7) / max(rms(x), 1e-7)), 1) if rms(d) > 0 else -200.0,
        'correlation': round(float(np.corrcoef(x, y)[0, 1]), 8),
        'peakA': int(np.abs(a).max()), 'peakB': int(np.abs(b).max()),
        # was eine Datei laenger ist als die andere: darf nur Stille sein
        'extraSamples': abs(len(a) - len(b)), 'extraPeak': int(np.abs(tail).max()) if len(tail) else 0,
        'sha256Common': hashlib.sha256(a[:n].astype('<i2').tobytes()).hexdigest(),
    }


if __name__ == '__main__':
    if len(sys.argv) >= 4 and sys.argv[1] == 'cmp': print(json.dumps(compare(sys.argv[2], sys.argv[3])))
    elif len(sys.argv) >= 3 and sys.argv[1] == 'sha':
        x = decode(sys.argv[2]); n = int(sys.argv[3]) if len(sys.argv) > 3 else len(x)
        print(json.dumps({'samples': len(x), 'counted': min(n, len(x)), 'sha256': hashlib.sha256(x[:n].tobytes()).hexdigest(), 'peak': int(np.abs(x).max()) if len(x) else 0}))
    else: sys.exit('Aufruf: audiocmp.py cmp <a> <b>  |  audiocmp.py sha <a> [anzahl]')
