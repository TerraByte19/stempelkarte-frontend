# soundlib.py - Klangbibliothek des Studios (studio/sounds/)
#
#   python3 studio/tools/soundlib.py rebuild   bearbeitete Fassungen und Messwerte aus sounds/original/ neu erzeugen
#   python3 studio/tools/soundlib.py list      Tabelle: Name, Laenge, Lautheit, Quelle
#   python3 studio/tools/soundlib.py verify    prueft Dateien gegen sounds.json (Fingerabdruecke), Ende-Code 1 bei Abweichung
#
# Warum es das gibt: bis zum 16.11.2026 waren alle Toene des Studios aus Sinus und
# Rauschen berechnet (tools/sfx.py). Fuer das Doener-Video wollte der Betreiber echte
# Meme-Klaenge (Vine-Boom, Grillen in der Stille, trauriger Trompeter). Die liegen jetzt
# hier: je Klang das Original, Byte fuer Byte wie geliefert (original/<name>.mp3), und
# eine bearbeitete Fassung (<name>.flac): Stille an beiden Enden weg, Spitze -1 dBFS,
# 48 kHz mono.
#
# Warum FLAC: verlustfrei und auf jedem Rechner bitgleich dekodiert. Bei mp3 oder opus
# haengen Anfang und letzte Bits vom Dekoder ab, und zwei Bauten desselben Skripts
# sollen denselben Ton ergeben. Eine .wav ginge auch, ist aber von Git ausgenommen
# (studio/.gitignore) - ein frischer Checkout haette die Klaenge dann nicht.
#
# Benutzt wird die Bibliothek nur, wenn ein Skript es verlangt ("sounds" an einer
# Szene oder einem Teil). tools/sfx.py importiert diese Datei erst dann; alte Skripte
# laufen durch genau denselben Code wie vorher und ergeben bytegleich dieselbe Spur.
import json, os, sys, hashlib, subprocess
import numpy as np

SR = 48000
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(HERE, '..', 'sounds'))
INDEX = os.path.join(ROOT, 'sounds.json')
PEAK_DB = -1.0                 # gemeinsame Spitze aller bearbeiteten Klaenge
PEAK = 10 ** (PEAK_DB / 20)
# vol 1 im Skript = so laut (Spitze) wie der lauteste Ton der berechneten Spur: sfx.py
# normiert sie auf Spitze 0,7. So bedeutet "vol" fuer beide Arten Ton dasselbe.
LEVEL = 0.7
TRIM_REL_DB = -40.0            # Stille = leiser als 40 dB unter der Spitze des Klangs ...
TRIM_ABS_DB = -50.0            # ... oder leiser als -50 dBFS (was davon hoeher liegt)
PRE, POST = 0.005, 0.020       # so viel bleibt vor dem ersten und nach dem letzten hoerbaren Abtastwert, mit Blende


def die(msg):
    sys.exit('soundlib.py: ' + msg)


def decode(path):
    """Datei -> float64 mono, 48 kHz (ffmpeg)."""
    r = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-f', 'f32le', '-ac', '1', '-ar', str(SR), '-'], capture_output=True)
    if r.returncode != 0:
        die(f'{path} laesst sich nicht dekodieren: {r.stderr.decode(errors="replace")[-300:]}')
    return np.frombuffer(r.stdout, dtype='<f4').astype(np.float64)


def decode_s16(path):
    """Datei -> die 16-bit-Abtastwerte selbst (fuer den Fingerabdruck; ein Umweg ueber float rundet anders)."""
    r = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-f', 's16le', '-ac', '1', '-ar', str(SR), '-'], capture_output=True)
    if r.returncode != 0:
        die(f'{path} laesst sich nicht dekodieren: {r.stderr.decode(errors="replace")[-300:]}')
    return np.frombuffer(r.stdout, dtype='<i2')


def pcm_sha(q):
    """Fingerabdruck der 16-bit-Abtastwerte, unabhaengig davon, wie der FLAC-Kodierer die Datei verpackt."""
    return hashlib.sha256(np.asarray(q, dtype='<i2').tobytes()).hexdigest()


def file_sha(path):
    return hashlib.sha256(open(path, 'rb').read()).hexdigest()


def process(x):
    """Stille an beiden Enden weg, kurze Blenden, Spitze auf PEAK_DB. Gibt (Signal, Info) zurueck."""
    peak = float(np.abs(x).max()) if len(x) else 0.0
    if peak <= 0:
        die('Datei ist still')
    thr = max(peak * 10 ** (TRIM_REL_DB / 20), 10 ** (TRIM_ABS_DB / 20))
    loud = np.nonzero(np.abs(x) > thr)[0]
    a = max(0, int(loud[0] - PRE * SR)); b = min(len(x), int(loud[-1] + POST * SR) + 1)
    y = x[a:b].copy()
    # Blende ueber genau das Stueck, das unter der Schwelle liegt: der Einsatz selbst bleibt scharf
    fi = min(len(y), int(loud[0] - a)); fo = min(len(y), int(b - 1 - loud[-1]))
    if fi > 1: y[:fi] *= np.linspace(0, 1, fi, endpoint=False)
    if fo > 1: y[-fo:] *= np.linspace(1, 0, fo)
    gain = PEAK / float(np.abs(y).max())
    y *= gain
    return y, {'trim': [round(a / SR, 4), round(b / SR, 4)], 'gainDb': round(20 * np.log10(gain), 2)}


def encode_flac(y, path):
    q = np.clip(np.round(y * 32767), -32768, 32767).astype('<i2')
    # bitexact und ohne Metadaten: dieselben Abtastwerte ergeben dieselbe Datei, egal welche ffmpeg-Fassung
    r = subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 's16le', '-ar', str(SR), '-ac', '1', '-i', '-', '-map_metadata', '-1',
                        '-fflags', '+bitexact', '-flags:a', '+bitexact', '-c:a', 'flac', '-compression_level', '8', path], input=q.tobytes(), capture_output=True)
    if r.returncode != 0:
        die('FLAC schreiben: ' + r.stderr.decode(errors='replace')[-300:])
    return q


def loudness(path):
    """Integrierte Lautheit (LUFS) und wahre Spitze (dBTP) nach EBU R128. Kurze Klaenge werden mit Stille
    aufgefuellt: die faellt unter die Gate-Schwelle und zaehlt nicht mit, die Messung braucht aber 0,4 s Bloecke."""
    r = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', path, '-af', 'apad=pad_dur=1,ebur128=peak=true', '-f', 'null', '-'], capture_output=True)
    err = r.stderr.decode(errors='replace'); s = err[err.rfind('Summary:'):]
    import re
    i = re.search(r'I:\s+(-?[\d.]+) LUFS', s); p = re.search(r'Peak:\s+(-?[\d.]+) dBFS', s)
    return (float(i.group(1)) if i else None), (float(p.group(1)) if p else None)


def index():
    if not os.path.exists(INDEX):
        die(f'{INDEX} fehlt')
    return json.load(open(INDEX, encoding='utf-8'))


def rebuild():
    data = index()
    for s in data['sounds']:
        src = os.path.join(ROOT, s['original'])
        if not os.path.exists(src):
            die(f'Original fehlt: {src}')
        x = decode(src)
        y, info = process(x)
        out = os.path.join(ROOT, s['file'])
        q = encode_flac(y, out); yq = q.astype(np.float64) / 32768
        lufs, tp = loudness(out)
        s.update({
            'durationOriginal': round(len(x) / SR, 3), 'duration': round(len(yq) / SR, 3), **info,
            'peakDb': round(20 * np.log10(np.abs(yq).max()), 2), 'rmsDb': round(10 * np.log10(np.mean(yq ** 2) + 1e-20), 2),
            'lufs': lufs, 'truePeakDb': tp,
            'sha256Original': file_sha(src), 'sha256': file_sha(out), 'pcmSha256': pcm_sha(q)
        })
        print(f"{s['name']:20s} {s['durationOriginal']:6.3f} s -> {s['duration']:6.3f} s, Anhebung {info['gainDb']:+6.2f} dB, {lufs} LUFS")
    data['format'] = {'sampleRate': SR, 'channels': 1, 'bits': 16, 'codec': 'flac', 'peakDb': PEAK_DB,
                      'trim': f'Stille = leiser als {TRIM_REL_DB:g} dB unter der Spitze oder {TRIM_ABS_DB:g} dBFS; {PRE * 1000:g} ms davor und {POST * 1000:g} ms danach bleiben, mit Blende'}
    json.dump(data, open(INDEX, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    open(INDEX, 'a', encoding='utf-8').write('\n')
    print(len(data['sounds']), 'Klänge')


def verify():
    data, bad = index(), []
    for s in data['sounds']:
        f, o = os.path.join(ROOT, s['file']), os.path.join(ROOT, s['original'])
        if not os.path.exists(f) or not os.path.exists(o):
            bad.append(f"{s['name']}: Datei fehlt"); continue
        if file_sha(o) != s['sha256Original']: bad.append(f"{s['name']}: Original weicht ab")
        if pcm_sha(decode_s16(f)) != s['pcmSha256']: bad.append(f"{s['name']}: bearbeitete Fassung weicht ab")
    print(json.dumps({'ok': not bad, 'count': len(data['sounds']), 'problems': bad}, ensure_ascii=False))
    sys.exit(1 if bad else 0)


# ------------------------------------------------------------------ Mischen (fuer tools/sfx.py)
_cache = {}


def names():
    return [s['name'] for s in index()['sounds']]


def load(name):
    if name not in _cache:
        entry = next((s for s in index()['sounds'] if s['name'] == name), None)
        if entry is None:
            die(f'Klang "{name}" gibt es nicht. Erlaubt: {", ".join(names())}')
        _cache[name] = decode(os.path.join(ROOT, entry['file']))
    return _cache[name]


def duck_gain(n, speech, duck_db, pre=0.05, post=0.08):
    """Verstaerkung je Abtastwert: 1 ausserhalb der Woerter, duck_db darunter. Die Absenkung beginnt
    50 ms vor dem Wort (das Wort soll nie in einen lauten Effekt hineinfallen) und laesst 80 ms danach los.
    Gerechnet in Millisekunden mit schneller Absenkung und langsamer Erholung, damit es nicht pumpt."""
    ms = n * 1000 // SR + 2
    mask = np.zeros(ms, bool)
    for s, e in speech:
        mask[max(0, int((s - pre) * 1000)):max(0, int((e + post) * 1000))] = True
    target = np.where(mask, 10 ** (duck_db / 20), 1.0)
    g = np.empty(ms); cur = 1.0
    down, up = 1 - np.exp(-1 / 12.0), 1 - np.exp(-1 / 70.0)  # Zeitkonstanten 12 ms und 70 ms
    for i in range(ms):
        tgt = target[i]; cur += (down if tgt < cur else up) * (tgt - cur); g[i] = cur
    return np.interp(np.arange(n) / SR * 1000, np.arange(ms), g)


def overlap(a, b, speech):
    return sum(max(0.0, min(b, e) - max(a, s)) for s, e in speech)


def render(events, total, speech, duck_db=-10.0):
    """Mischt die Bibliotheksklaenge. events: [{t, name, vol, duck}]. Gibt (Spur, Einzelspuren, Info je Klang) zurueck."""
    track = np.zeros(total); parts = []; info = []
    gain = duck_gain(total, speech, duck_db) if speech else None
    for e in events:
        x = load(e['name']) * e['vol'] * LEVEL / PEAK
        o = int(round(e['t'] * SR))
        if o >= total:
            continue
        x = x[:total - o].copy()
        ducked = bool(e.get('duck', True)) and gain is not None
        if ducked:
            x *= gain[o:o + len(x)]
        track[o:o + len(x)] += x
        parts.append((o, x))
        end = e['t'] + len(x) / SR
        info.append({'t': e['t'], 'name': e['name'], 'vol': e['vol'], 'duck': ducked, 'end': round(end, 3), 'seconds': round(len(x) / SR, 3),
                     'overlapWords': round(overlap(e['t'], end, speech), 3), 'peakDb': round(20 * np.log10(np.abs(x).max() + 1e-12), 1)})
    return track, parts, info


def margins(parts, info, voice_file, lead, speech, voice_gain, sfx_gain, win=0.1):
    """Wie weit liegt die Stimme ueber jedem Klang, dort wo beide gleichzeitig zu hoeren sind?
    Gemessen in Fenstern von 0,1 s ueber den Stellen, an denen gesprochen wird, mit den Lautstaerken
    der Vormischung (Stimme mal voice_gain, Effekte mal sfx_gain). Fenster, in denen die Stimme gerade
    zwischen zwei Silben fast still ist, zaehlen nicht: dort verdeckt der Klang kein Wort."""
    v = decode(voice_file) * voice_gain
    off = int(round(lead * SR)); w = int(win * SR)
    def rms_db(a):
        return 10 * np.log10(np.mean(a ** 2) + 1e-20)
    # typischer Pegel der Stimme beim Sprechen: Median der Fenster in den Woertern
    levels = []
    for s, e in speech:
        for a in range(int(s * SR), int(e * SR) - w + 1, w):
            seg = v[a - off:a - off + w] if a - off >= 0 else None
            if seg is not None and len(seg) == w: levels.append(rms_db(seg))
    typical = float(np.median(levels)) if levels else -20.0
    for (o, x), it in zip(parts, info):
        vals = []
        for a in range(o, o + len(x) - w + 1, w):
            t = a / SR
            if not any(s <= t + win / 2 <= e for s, e in speech):
                continue
            seg = v[a - off:a - off + w] if a - off >= 0 else np.zeros(0)
            if len(seg) < w:
                continue
            vd = rms_db(seg)
            if vd < typical - 12:
                continue
            ed = rms_db(x[a - o:a - o + w] * sfx_gain)
            if ed < -70:
                continue
            vals.append(vd - ed)
        it['marginDb'] = {'min': round(min(vals), 1), 'median': round(float(np.median(vals)), 1), 'windows': len(vals)} if vals else None
    return typical


def write_float_wav(path, mono):
    """32-bit-Float-WAV, zwei gleiche Kanaele wie die bisherige Effektspur. Float, weil die Summe aus berechneten
    Toenen (Spitze 0,7) und Bibliotheksklaengen ueber 1 gehen kann; 16 bit wuerden dort hart abschneiden. Den
    Rest erledigt der Begrenzer der Mischung."""
    import struct
    data = np.stack([mono, mono], 1).astype('<f4').tobytes()
    head = b'RIFF' + struct.pack('<I', 4 + 26 + 12 + 8 + len(data)) + b'WAVE'
    head += b'fmt ' + struct.pack('<IHHIIHHH', 18, 3, 2, SR, SR * 8, 8, 32, 0)
    head += b'fact' + struct.pack('<II', 4, len(mono))
    head += b'data' + struct.pack('<I', len(data))
    with open(path, 'wb') as f:
        f.write(head); f.write(data)


if __name__ == '__main__':
    cmd = sys.argv[1] if len(sys.argv) > 1 else 'list'
    if cmd == 'rebuild':
        rebuild()
    elif cmd == 'verify':
        verify()
    elif cmd == 'list':
        for s in index()['sounds']:
            print(f"{s['name']:20s} {s.get('duration', 0):6.3f} s  {s.get('lufs')} LUFS  {s['source']}")
    else:
        die('unbekannter Befehl ' + cmd + ' (rebuild, list, verify)')
