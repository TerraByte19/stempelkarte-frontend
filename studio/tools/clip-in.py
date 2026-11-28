#!/usr/bin/env python3
# clip-in.py - setzt EINEN Satz, der ausserhalb des Studios aufgenommen wurde, in die
# vorhandene Aufnahme eines Videos ein. Sendet nichts, kostet nichts (0 Zeichen).
#
#   python3 studio/tools/clip-in.py <video-ordner> <satz> <clip.mp3>   Satz ersetzen
#       <satz>  der Satz selbst in Anfuehrungszeichen ("Ist das koscher?") oder seine Nummer aus --list
#       --alignment <json>   Zeiten des Anbieters zum Clip. Fehlt die Angabe, wird <clip>.alignment.json
#                            neben dem Clip genommen, wenn es sie gibt. Gebraucht wird daraus nur der
#                            Text (passt der Clip zum Satz?) und eine Notloesung fuer die Wort-Zeiten
#       --words 0.38,0.68    Wortanfaenge von Hand, in Sekunden der Clip-Datei, ab dem ZWEITEN Wort
#                            (das erste beginnt, wo der Ton beginnt). Nur noetig, wenn die Ausgabe zeigt,
#                            dass ein Wort falsch sitzt
#       --check              nur messen und zeigen, nichts ablegen
#   python3 studio/tools/clip-in.py <video-ordner> --list       Saetze mit Nummern, und welche Fassung gilt
#   python3 studio/tools/clip-in.py <video-ordner> --original   zurueck zur Aufnahme ohne fremde Saetze
#   python3 studio/tools/clip-in.py <video-ordner> --prune      abgelegte fremde Saetze loeschen, die die
#                                                              geltende Fassung nicht braucht
#
# Wozu: beim zweiten Video sollten "Ist das koscher?" und "Natürlich ist das koscher!" anders
# klingen (erstaunter, gedehnter, mit kratzendem ch). Das gelang nur mit einem anderen Modell des
# Anbieters, und dessen Aufnahmen entstehen ausserhalb des Studios: ein Satz je Datei, mit einer
# Regieanweisung in eckigen Klammern vor dem Text und nur groben Zeiten. Der Nutzer waehlt unter
# mehreren Proben. Die gewaehlte kommt mit diesem Werkzeug in die Aufnahme, ohne dass der Rest
# neu aufgenommen (und bezahlt) wird.
#
# Warum ein eigenes Werkzeug und kein Befehl von voice.py: voice.py ist die Tuer zur bezahlten
# Schnittstelle, und sein Satz-Austausch ist auf den Abtastwert genau festgenagelt
# (test_voice.py, regress.mjs). Hier wird nur gemessen und zugeschnitten, ohne Netz. Die Ablage
# ist trotzdem dieselbe: abgelegt wird mit voice.store_splice, zusammengesetzt mit voice.splice_merge.
#
# Was es tut:
#   1. Stille am Anfang und Ende des Clips wegnehmen. Es bleiben 40 ms vor dem ersten Laut,
#      so wie voice.py seinen eigenen Satz-Austausch schneidet.
#   2. Wortanfaenge der FREIGEGEBENEN Woerter aus dem Ton selbst bestimmen. Die Zeiten des
#      Anbieters sind bei diesem Modell gleichmaessig verteilt und liegen bis zu 0,16 s daneben
#      (gemessen an sieben Proben), und im Text des Clips steht "Natüüürlich" oder "koscher??".
#      Darum: den Clip mit demselben Satz der vorhandenen Aufnahme vergleichen (deren Zeiten
#      stimmen), Laut fuer Laut, auch wenn ein Wort gedehnt ist; dann jeden Wortanfang auf den
#      naechsten deutlichen Einsatz im Pegel ruecken. Geht der Vergleich nicht, gelten die Zeiten
#      des Anbieters als Naeherung, zuletzt eine gleichmaessige Verteilung nach Buchstaben.
#      Nach diesen Zeiten erscheinen die Woerter im Bild, und an ihnen haengen die Anker.
#   3. Lautstaerke an die Saetze davor und danach angleichen: gleiche mittlere Lautstaerke der
#      gesprochenen Stellen, hoechstens 6 dB in jede Richtung, und nie bis zur Uebersteuerung.
#   4. Als neue Fassung im Ordner voice/ ablegen: der Clip unveraendert (.clip.mp3), dazu Zeiten
#      und Bauanleitung. In der meta steht, woher der Clip kam ("source": "extern", Dateiname,
#      sha256) und "spent": 0.
#   5. <schluessel>.use.json schreiben. Der Text des Skripts aendert sich ja nicht, sein
#      Schluessel bleibt der der Aufnahme; erst dieser Verweis sagt dem Bau, welche Fassung gilt.
#
# Die Aufnahme selbst (.mp3, Zeiten, meta) wird nie angefasst. Zwei Saetze nacheinander gehen:
# der zweite Aufruf baut auf der Fassung des ersten auf. Wird ein Satz noch einmal ersetzt
# (der Nutzer waehlt doch eine andere Probe), entsteht die Kette neu, mit dem neuen Clip an
# derselben Stelle; die Fassungen davor bleiben liegen, bis --prune sie loescht.
import argparse, hashlib, importlib, json, os, re, shutil, subprocess, sys
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
sys.dont_write_bytecode = True   # kein __pycache__ im Studio hinterlassen
voice = importlib.import_module('voice')

SR = voice.SR
PAD = voice.PAD          # 40 ms vor dem ersten Laut, wie beim Satz-Austausch in voice.py
TAIL = 0.03              # so viel Ausklang bleibt nach dem letzten Laut (darin liegt die Blende von voice.py)
HOP, WIN = 0.005, 0.02   # Pegel alle 5 ms, gemessen ueber 20 ms
GATE_DB = 25             # was mehr als 25 dB unter den lauten Stellen liegt, zaehlt als Pause
MAX_GAIN_DB = 6          # mehr Angleich waere kein Angleich mehr, sondern ein anderer Clip
CEILING = 0.97           # hoeher darf die Spitze des Clips nach dem Angleich nicht liegen
NEIGHBOUR = 4.0          # Sekunden der Aufnahme davor und danach, an denen die Lautstaerke gemessen wird
SNAP = 0.10              # so weit darf ein Wortanfang zum naechsten Einsatz im Pegel ruecken
SNAP_HINT = 0.15         # die Zeiten des Anbieters lagen an den Proben bis zu 0,11 s neben dem Einsatz: dort etwas weiter suchen
MIN_WORD = 0.06          # kuerzer ist kein Wort


class Stop(Exception):
    """Abbruch mit einer Meldung fuer den Menschen; es wurde nichts geschrieben."""


# ---------------------------------------------------------------- Messen
def envelope(x):
    """Pegel in dB, ein Wert je 5 ms, jeweils ueber 20 ms um diese Stelle."""
    n, h = int(WIN * SR), int(HOP * SR)
    pad = np.concatenate([np.zeros(n // 2), np.asarray(x, dtype=np.float64), np.zeros(n)])
    c = np.concatenate([[0.0], np.cumsum(pad ** 2)])
    i = np.arange(0, max(1, len(x)), h)
    return 10 * np.log10((c[i + n] - c[i]) / n + 1e-12)


def voiced_span(db):
    """
    (erster, letzter Pegelwert, der zur Sprache gehoert, schwelle). Schwelle: 25 dB unter den
    lauten Stellen. Ein einzelner Knacks zaehlt nicht: verlangt werden 25 von 30 ms darueber.
    """
    thr = max(float(np.percentile(db, 95)) - GATE_DB, -60.0); on = db > thr; n = len(on)
    solid = lambda v, a: bool(v[a]) and v[a:a + 6].sum() >= min(5, n - a)
    first = next((a for a in range(n) if solid(on, a)), None)
    if first is None: return None, None, thr
    rev = on[::-1]
    return first, n - 1 - next(a for a in range(n) if solid(rev, a)), thr


def gated_rms(x):
    """
    Mittlere Lautstaerke der gesprochenen Stellen: Bloecke von 50 ms (alle 12,5 ms einer), ohne
    die leisen (unter -50 dB, und mehr als 10 dB unter dem Mittel der uebrigen). Pausen zaehlen
    so nicht mit - ein Satz mit langer Pause waere sonst "leiser" als derselbe Satz ohne.
    """
    n = int(0.05 * SR)
    if len(x) < n: return 0.0
    c = np.concatenate([[0.0], np.cumsum(np.asarray(x, dtype=np.float64) ** 2)]); i = np.arange(0, len(x) - n + 1, n // 4)
    p = (c[i + n] - c[i]) / n
    p = p[p > 10 ** (-50 / 10)]
    if not len(p): return 0.0
    p = p[p > p.mean() * 10 ** (-10 / 10)]
    return float(np.sqrt(p.mean()))


def mfcc(x):
    """
    Klangfarbe je 10 ms (12 Werte), unabhaengig von Lautstaerke und Aufnahme: damit lassen
    sich zwei Aufnahmen desselben Satzes Laut fuer Laut zuordnen.
    """
    n, h, bands = 1024, 441, 30
    x = np.concatenate([np.zeros(n // 2), np.asarray(x, dtype=np.float64), np.zeros(n)])
    k = 1 + (len(x) - n) // h
    idx = np.arange(n)[None, :] + h * np.arange(k)[:, None]
    spec = np.abs(np.fft.rfft(x[idx] * np.hanning(n), axis=1)) ** 2
    mel = lambda f: 2595 * np.log10(1 + f / 700); inv = lambda m: 700 * (10 ** (m / 2595) - 1)
    edges = inv(np.linspace(mel(100), mel(7000), bands + 2)); fr = np.fft.rfftfreq(n, 1 / SR)
    fb = np.zeros((bands, len(fr)))
    for b in range(bands):
        lo, mid, hi = edges[b], edges[b + 1], edges[b + 2]
        fb[b] = np.clip(np.minimum((fr - lo) / (mid - lo), (hi - fr) / (hi - mid)), 0, None)
    logmel = np.log(spec @ fb.T + 1e-9)
    dct = np.cos(np.pi / bands * (np.arange(bands)[None, :] + 0.5) * np.arange(1, 13)[:, None])
    c = logmel @ dct.T
    return (c - c.mean(axis=0)) / (c.std(axis=0) + 1e-9)


def dtw_map(ref, clip, ref_times=()):
    """
    Ordnet die Stellen `ref_times` (Sekunden in der Vergleichsaufnahme) dem Clip zu, auch wenn
    der Clip einzelne Laute viel laenger haelt. Gibt (zeiten_im_clip, abstand) zurueck;
    abstand = mittlerer Unterschied entlang des Weges, je kleiner, desto aehnlicher.
    """
    a, b = mfcc(ref), mfcc(clip); n, m = len(a), len(b)
    d = np.sqrt(((a[:, None, :] - b[None, :, :]) ** 2).sum(axis=2)).tolist()
    INF = float('inf'); acc = [[INF] * (m + 1) for _ in range(n + 1)]; acc[0][0] = 0.0
    for i in range(1, n + 1):
        row, prev, di = acc[i], acc[i - 1], d[i - 1]
        for j in range(1, m + 1):
            x = prev[j - 1]; y = prev[j]; z = row[j - 1]
            row[j] = di[j - 1] + (x if x <= y and x <= z else y if y <= z else z)
    i, j, steps, by_ref = n, m, 0, {}
    while i > 0 and j > 0:
        by_ref.setdefault(i - 1, []).append(j - 1); steps += 1
        x, y, z = acc[i - 1][j - 1], acc[i - 1][j], acc[i][j - 1]
        if x <= y and x <= z: i, j = i - 1, j - 1
        elif y <= z: i -= 1
        else: j -= 1
    out = [float(np.mean(by_ref[min(n - 1, max(0, int(round(t / 0.01))))])) * 0.01 for t in ref_times]
    return out, acc[n][m] / steps


def onsets(db, thr):
    """
    Deutliche Einsaetze im Pegel: [(sekunde, anstieg_dB)]. Ein Einsatz ist die Mitte eines
    Anstiegs von mindestens 8 dB innerhalb von 30 ms, der ueber die Pausenschwelle fuehrt -
    der Verschluss vor einem k, d oder t und der Laut danach sehen genau so aus.
    """
    sm = np.convolve(db, np.ones(3) / 3, mode='same'); n = len(sm); rise = np.zeros(n)
    rise[3:n - 3] = sm[6:] - sm[:n - 6]
    out = []
    for k in range(3, n - 3):
        if rise[k] < 8 or sm[min(n - 1, k + 3)] < thr: continue
        if rise[k] >= rise[max(0, k - 8):min(n, k + 9)].max(): out.append((k * HOP, float(min(rise[k], 40.0))))
    # zwei Stellen desselben Anstiegs (gleicher Wert nebeneinander): die erste gilt
    return [o for i, o in enumerate(out) if i == 0 or o[0] - out[i - 1][0] > 0.04]


def spread(words, t0, t1):
    """Notloesung: Wortanfaenge gleichmaessig nach Buchstabenzahl zwischen t0 und t1."""
    n = np.cumsum([0] + [len(w) + 1 for w in words]); total = n[-1] - 1
    return [t0 + (t1 - t0) * float(k) / total for k in n[:-1]]


def analyse(clip, words, ref=None, ref_starts=None, hints=None, given=None):
    """
    Schneidet den Clip zu und bestimmt die Wortanfaenge. Zeiten im Ergebnis zaehlen ab dem
    Anfang des ZUGESCHNITTENEN Clips ("offset" = was vorn wegfiel).
      ref, ref_starts   derselbe Satz aus der vorhandenen Aufnahme und seine Wortanfaenge (s)
      hints             Wortanfaenge laut Anbieter, in Sekunden der Clip-Datei (nur Notloesung)
      given             Wortanfaenge von Hand ab dem zweiten Wort, in Sekunden der Clip-Datei
    """
    db = envelope(clip); first, last, thr = voiced_span(db)
    if first is None: raise Stop('Im Clip ist kein Ton zu finden (alles still).')
    h = int(HOP * SR)
    v0, v1 = first * h, min(len(clip), (last + 1) * h)
    c0, c1 = max(0, v0 - int(PAD * SR)), min(len(clip), v1 + int(TAIL * SR))
    if (v1 - v0) / SR < MIN_WORD * len(words): raise Stop(f'Der Clip hat nur {(v1 - v0) / SR:.2f} s Ton, das reicht nicht für {len(words)} Wörter.')
    off = c0 / SR; t0, t1, length = v0 / SR - off, v1 / SR - off, (c1 - c0) / SR
    cand = [(t - off, r) for t, r in onsets(db, thr) if v0 / SR + MIN_WORD < t < v1 / SR - 0.02]
    cost = None
    if given is not None:
        if len(given) != len(words) - 1: raise Stop(f'--words: erwartet {len(words) - 1} Zeiten (ab dem zweiten Wort), bekam {len(given)}')
        est = [t0] + [g - off for g in given]; how = ['anfang'] + ['von Hand'] * (len(words) - 1)
    else:
        est = None
        if ref is not None and ref_starts is not None and len(words) > 1:
            rf, rl, _ = voiced_span(envelope(ref))
            if rf is not None and (rl - rf) * HOP > 0.1:
                r0, r1 = rf * h, min(len(ref), (rl + 1) * h)
                mapped, cost = dtw_map(ref[r0:r1], clip[v0:v1], [max(0.0, s - r0 / SR) for s in ref_starts[1:]])
                est = [t0] + [t0 + m for m in mapped]; how = ['anfang'] + ['vergleich'] * (len(words) - 1)
        if est is None and hints is not None and len(hints) == len(words):
            est = [t0] + [min(t1, max(t0, x - off)) for x in hints[1:]]; how = ['anfang'] + ['anbieter'] * (len(words) - 1)
        if est is None:
            est = spread(words, t0, t1); how = ['anfang'] + ['verteilt'] * (len(words) - 1)
        for k in range(1, len(words)):
            lo = est[k - 1] + MIN_WORD
            # Ein Wort beginnt nicht mitten in einer Pause. Faellt die Stelle in eine ("Ist das ... koscher?"
            # mit Kunstpause: beim Vergleich passt Stille auf Stille, wo genau, ist beliebig), gilt ihr Ende.
            i = int(round((est[k] + off) / HOP))
            if 0 <= i < len(db) and db[i] <= thr:
                j = next((q for q in range(i, len(db)) if db[q] > thr), None)
                if j is not None and j * HOP - off < t1: est[k] = j * HOP - off; how[k] += '+pause'
            # Dann auf den naechsten deutlichen Einsatz ruecken: der staerkere gewinnt, die Naehe zaehlt mit
            reach = SNAP_HINT if how[k].startswith('anbieter') else SNAP
            near = [(r - 150 * abs(t - est[k]), t) for t, r in cand if abs(t - est[k]) <= reach and t > lo]
            if near: est[k] = max(near)[1]; how[k] += '+einsatz'
            elif est[k] <= lo: est[k] = lo; how[k] += ', geschoben'
    for k in range(1, len(est)):
        if not (est[k - 1] + 0.02 < est[k] < length): raise Stop(f'Wortanfänge liegen nicht in der Reihenfolge der Wörter oder außerhalb des Clips (Sekunden der Clip-Datei): {[round(e + off, 3) for e in est]}')
    return {'cut': [int(c0), int(c1)], 'seconds': round(length, 3), 'offset': round(off, 3), 'voiced': [round(t0, 3), round(t1, 3)],
            'starts': [round(e, 3) for e in est], 'how': how, 'onsets': [(round(t, 3), round(r, 1)) for t, r in cand],
            'dtw_cost': None if cost is None else round(cost, 3), 'threshold_db': round(thr, 1)}


def char_times(sentence, starts, end):
    """
    Zeichen-Zeiten fuer den freigegebenen Satz: jedes Wort beginnt an seinem Wortanfang, seine
    Zeichen teilen sich die Zeit bis kurz vor dem naechsten Wort. Das letzte Zeichen endet am Ende
    des Clips: daraus rechnet voice.py, um wie viel sich alles Spaetere verschiebt.
    """
    ch, st, en = [], [], []; words = sentence.split(' ')
    if len(words) != len(starts): raise Stop('Wortzahl und Zahl der Wortanfänge passen nicht zusammen')
    for k, w in enumerate(words):
        nxt = starts[k + 1] if k + 1 < len(words) else end
        stop = nxt if k + 1 == len(words) else nxt - min(0.04, 0.25 * (nxt - starts[k]))
        step = (stop - starts[k]) / len(w)
        for i, c in enumerate(w):
            ch.append(c); st.append(round(starts[k] + i * step, 3)); en.append(round(starts[k] + (i + 1) * step, 3))
        if k + 1 < len(words): ch.append(' '); st.append(round(stop, 3)); en.append(round(nxt, 3))
    en[-1] = round(end, 3)
    return {'characters': ch, 'character_start_times_seconds': st, 'character_end_times_seconds': en}


def loudness(clip_cut, base, a, c):
    """Faktor, der den Clip so laut macht wie die Aufnahme davor (bis Abtastwert a) und danach (ab c)."""
    n = int(NEIGHBOUR * SR)
    near = np.concatenate([base[max(0, a - n):a], base[c:c + n] if c is not None else np.zeros(0, np.float32)])
    want, have = gated_rms(near), gated_rms(clip_cut)
    if want <= 0 or have <= 0: return 1.0, {'note': 'keine Sprache zum Vergleichen gefunden, die Lautstärke bleibt'}
    raw = want / have; lim = 10 ** (MAX_GAIN_DB / 20); gain = min(lim, max(1 / lim, raw))
    peak = float(np.abs(clip_cut).max()); capped = peak * gain > CEILING
    if capped: gain = CEILING / peak
    db = lambda v: round(float(20 * np.log10(v)), 2)
    return float(gain), {'neighbour_rms_db': db(want), 'clip_rms_db': db(have), 'wanted_db': db(raw), 'gain_db': db(gain),
                         'limited': bool(abs(raw - min(lim, max(1 / lim, raw))) > 1e-12), 'peak_capped': bool(capped), 'peak_after_db': db(peak * gain)}


# ---------------------------------------------------------------- Text
def plain(s):
    """Zum Vergleichen: ohne Regieanweisung in eckigen Klammern, ohne Satzzeichen, gedehnte Buchstaben einfach."""
    s = re.sub(r'\[[^\]]*\]', ' ', s).casefold()
    s = re.sub(r'[^\w\s]', ' ', s)
    return re.sub(r'(\w)\1+', r'\1', ' '.join(s.split()))


def hint_words(al):
    """(Text, Woerter, Wortanfaenge) laut Anbieter, ohne die Regieanweisung. Die Zeiten sind nur eine Naeherung."""
    text = ''.join(al['characters']); st = al['character_start_times_seconds']
    skip = [m.span() for m in re.finditer(r'\[[^\]]*\]', text)]
    words = []; cur = None
    for i, c in enumerate(text):
        if any(a <= i < b for a, b in skip) or c.isspace(): cur = None; continue
        if cur is None: cur = [c, st[i]]; words.append(cur)
        else: cur[0] += c
    return text, [w for w, _ in words], [float(t) for _, t in words]


def pick_sentence(text, want):
    sents = voice.sentences(text)
    if re.fullmatch(r'\d+', want.strip()):
        i = int(want) - 1
        if not 0 <= i < len(sents): raise Stop(f'Satz {want} gibt es nicht: der Text hat {len(sents)} Sätze (siehe --list).')
        return i
    hits = [i for i, s in enumerate(sents) if s[2] == want.strip()] or [i for i, s in enumerate(sents) if plain(s[2]) == plain(want)]
    if not hits: raise Stop(f'Der Satz "{want}" steht nicht im gesprochenen Text (siehe --list).')
    if len(hits) > 1: raise Stop(f'Der Satz "{want}" kommt {len(hits)}-mal vor (Nummern {", ".join(str(i + 1) for i in hits)}). Bitte die Nummer angeben.')
    return hits[0]


# ---------------------------------------------------------------- Ablage
def chain(d, key):
    """Die Fassung `key` als Kette: (Aufnahme ohne fremde Saetze, [meta je eingesetztem Satz, der unterste zuerst])."""
    links = []
    while True:
        m = voice.load_meta(d, key)
        if not m: raise Stop(f'Im Ordner voice/ fehlt die meta zu {key}.')
        if m.get('source') != 'extern': return key, links[::-1]
        links.append(m); key = m['base']


def variant_key(base_key, i, clip_sha):
    """Schluessel einer Fassung: dieselbe Grundlage, derselbe Satz und derselbe Clip ergeben denselben."""
    return hashlib.sha256(json.dumps({'extern': 1, 'base': base_key, 'sentence': i, 'clip': clip_sha}, sort_keys=True).encode()).hexdigest()[:16]


def sentence_frame(al, s0, s1):
    """Dieselben Schnittstellen wie voice.splice_merge: 40 ms vor dem ersten Laut des Satzes, sein Ende, 40 ms vor dem naechsten Satz."""
    st, en, ch = al['character_start_times_seconds'], al['character_end_times_seconds'], al['characters']
    a_t = max(0.0, st[s0] - PAD); b_t = en[s1 - 1]
    nxt = next((j for j in range(s1, len(ch)) if not ch[j].isspace()), None)
    return a_t, b_t, (max(b_t, st[nxt] - PAD) if nxt is not None else None)


def put(d, text, settings, base_key, i, clip_path, opts, write=True):
    """
    Setzt den Clip als Satz i auf die Fassung base_key und legt das Ergebnis ab. Gibt
    (schluessel, bericht) zurueck. Dieselben Eingaben ergeben denselben Schluessel und
    dieselben Dateien: ein zweiter Aufruf aendert nichts.
    """
    sents = voice.sentences(text); s0, s1, sentence = sents[i]; words = sentence.split(' ')
    base_al = voice.load_json(voice.paths(d, base_key)['alignment']); base = voice.audio_array(d, base_key)
    if ''.join(base_al['characters']) != text: raise Stop(f'Die Zeiten der Fassung {base_key} passen nicht zum gesprochenen Text des Skripts.')
    st = base_al['character_start_times_seconds']
    a_t, b_t, c_t = sentence_frame(base_al, s0, s1)
    ref = base[int(a_t * SR):int(min(len(base) / SR, b_t + 0.05) * SR)]
    ref_starts = [st[s0 + m.start()] - a_t for m in re.finditer(r'\S+', sentence)]
    clip = voice.decode(clip_path)
    res = analyse(clip, words, ref, ref_starts, opts.get('hints'), opts.get('words'))
    cut = clip[res['cut'][0]:res['cut'][1]]
    gain, loud = loudness(cut, base, int(a_t * SR), None if c_t is None else int(c_t * SR))
    # Die Pause nach dem Satz bleibt so lang, wie sie in der Aufnahme WAR, gemessen am Ton. voice.py laesst
    # zwischen Satzende und naechstem Satz die Luecke aus den Zeichen-Zeiten stehen; manche Aufnahme rechnet
    # die Stille aber dem letzten Zeichen zu (im ersten Video 0,8 s am Ausrufezeichen). Mit dem zugeschnittenen
    # Clip waere diese Pause weg, und der Satz davor stuende zu kurz im Bild. Was fehlt, folgt dem Clip als Stille.
    pad = 0
    if c_t is not None:
        seg = base[int(a_t * SR):int(c_t * SR)]; _, f1, _ = voiced_span(envelope(seg))
        if f1 is not None:
            was = len(seg) - min(len(seg), (f1 + 1) * int(HOP * SR))
            pad = max(0, was - (len(cut) - int(round(res['voiced'][1] * SR))) - int((c_t - b_t) * SR))
    clip_al = char_times(sentence, res['starts'], (len(cut) + pad) / SR)
    sha = voice.sha256_file(clip_path); key = variant_key(base_key, i, sha)
    inner = lambda k: [(round(t - res['starts'][k], 3), r) for t, r in res['onsets'] if res['starts'][k] + 0.03 < t < (res['starts'][k + 1] if k + 1 < len(words) else res['seconds']) - 0.03]
    report = {'key': key, 'base': base_key, 'sentence': sentence, 'number': i + 1, 'clip': os.path.basename(clip_path), 'clip_sha256': sha,
              'clip_seconds': round(len(clip) / SR, 3), 'kept_seconds': res['seconds'], 'trimmed': {'start': res['offset'], 'end': round((len(clip) - res['cut'][1]) / SR, 3)},
              'old_seconds': round(b_t - a_t, 3),
              'words': [{'word': w, 'at': t, 'in_file': round(t + res['offset'], 3), 'how': h, 'onsets_inside': inner(k)} for k, (w, t, h) in enumerate(zip(words, res['starts'], res['how']))],
              'dtw_cost': res['dtw_cost'], 'loudness': loud, 'silence_added': round(pad / SR, 3),
              'pause_after': None if c_t is None else round((len(cut) - int(round(res['voiced'][1] * SR)) + pad) / SR + c_t + PAD - b_t, 3), 'spent': 0}
    if not opts.get('alignment_text') and res['dtw_cost'] is not None:
        # Ohne Text vom Anbieter bleibt nur der Klang als Probe, ob der Clip zu DIESEM Satz gehoert:
        # er muss ihm aehnlicher sein als jedem anderen Satz der Aufnahme.
        v = clip[res['cut'][0] + int(PAD * SR):res['cut'][1] - int(TAIL * SR)]; other = []
        for j, (q0, q1, s) in enumerate(sents):
            if j == i: continue
            qa, qb, _ = sentence_frame(base_al, q0, q1); seg = base[int(qa * SR):int(qb * SR)]
            if len(seg) > 0.1 * SR: other.append((dtw_map(seg, v)[1], j + 1, s))
        if other and min(other)[0] < res['dtw_cost']: report['closer_to'] = {'number': min(other)[1], 'sentence': min(other)[2], 'dtw_cost': round(min(other)[0], 3)}
    if not write: return key, report
    os.makedirs(d, exist_ok=True); p = voice.paths(d, key)
    if not (os.path.exists(p['clip']) and voice.sha256_file(p['clip']) == sha): shutil.copyfile(clip_path, p['clip'])   # unveraendert kopieren, nicht neu schreiben
    extern = {'source': 'extern', 'file': opts.get('file') or os.path.basename(clip_path), 'sha256': sha, 'tool': 'clip-in.py',
              'alignment_text': opts.get('alignment_text'), 'hints': opts.get('hints'), 'given_words': opts.get('words'),
              'words': report['words'], 'dtw_cost': res['dtw_cost'], 'loudness': loud, 'trimmed': report['trimmed']}
    how = voice.store_splice(d, key, text, settings, base_key, i, clip_al,
                             {'from': extern['file'], 'spent': 0, 'clip_cut': res['cut'], 'clip_pad': int(pad), 'clip_gain': round(gain, 6), 'extern': extern}, source='extern')
    report['shift'] = how['shift']
    return key, report


def use_path(d, text, settings): return voice.paths(d, voice.cache_key(text, settings))['use']


def set_use(d, text, settings, key, done):
    with open(use_path(d, text, settings), 'w', encoding='utf-8') as f:
        json.dump({'key': voice.cache_key(text, settings), 'use': key, 'sentences': [{'number': n, 'sentence': s, 'clip': c} for n, s, c in done],
                   'note': 'Der Bau nimmt für diesen Text die Fassung "use" statt der Aufnahme "key" (tools/clip-in.py). Diese Datei löschen oder "clip-in.py <ordner> --original": dann gilt wieder die Aufnahme.'},
                  f, ensure_ascii=False, indent=1)


# ---------------------------------------------------------------- Ausgabe
def bars(db, offset, at, span=0.1):
    """Pegel um eine Stelle herum, alle 10 ms eine Zeile: so sieht man, ob das Wort auf einem Einsatz sitzt."""
    out = []
    for k in range(-int(round(span / 0.01)), int(round(span / 0.01)) + 1):
        t = at + k * 0.01; i = int(round((t + offset) / HOP))
        if 0 <= i < len(db): out.append(f'      {t:7.3f} s {db[i]:6.1f} dB {"#" * max(0, int((db[i] + 60) / 2))}{"  <== Wortanfang" if k == 0 else ""}')
    return '\n'.join(out)


def show(rep, clip_path):
    lo = rep['loudness']; db = envelope(voice.decode(clip_path))
    print(f'Satz {rep["number"]}: "{rep["sentence"]}"  <-  {rep["clip"]} (sha256 {rep["clip_sha256"][:12]}...)')
    print(f'  Clip {rep["clip_seconds"]} s, davon bleiben {rep["kept_seconds"]} s (vorn {rep["trimmed"]["start"]} s, hinten {rep["trimmed"]["end"]} s weggenommen). Der Satz dauerte bisher {rep["old_seconds"]} s.')
    if 'gain_db' in lo:
        print(f'  Lautstärke: Clip {lo["clip_rms_db"]} dB, Aufnahme daneben {lo["neighbour_rms_db"]} dB, angeglichen um {lo["gain_db"]:+} dB'
              + (f' (auf {MAX_GAIN_DB} dB begrenzt, nötig wären {lo["wanted_db"]:+} dB)' if lo['limited'] else '') + (' (weniger als nötig, damit die Spitze nicht übersteuert)' if lo['peak_capped'] else '')
              + f', Spitze danach {lo["peak_after_db"]} dB')
    else: print('  Lautstärke: ' + lo['note'])
    if rep['dtw_cost'] is not None: print(f'  Vergleich mit dem Satz der Aufnahme: Abstand {rep["dtw_cost"]} (kleiner = ähnlicher)')
    print('  Wortanfänge, Sekunden im zugeschnittenen Clip (in Klammern: in der Clip-Datei):')
    for w in rep['words']:
        print(f'    {w["at"]:6.3f} s ({w["in_file"]:6.3f} s)  {w["word"]:<16} {w["how"]}' + (f'   weitere Einsätze im Wort nach {", ".join(f"{t:.2f} s" for t, _ in w["onsets_inside"])}' if w['onsets_inside'] else ''))
    print('  Pegel um jeden Wortanfang (Sekunden im zugeschnittenen Clip):')
    for w in rep['words']:
        print(f'    {w["word"]}'); print(bars(db, rep['trimmed']['start'], w['at']))
    if rep.get('pause_after') is not None:
        print(f'  Pause nach dem letzten Laut des Satzes bis zum nächsten Satz: {rep["pause_after"]} s, wie in der Aufnahme' + (f' (dafür folgen dem Clip {rep["silence_added"]} s Stille)' if rep['silence_added'] else '') + '. "timing.maxGap" und "gapBefore" im Skript stellen sie beim Bau ein.')


# ---------------------------------------------------------------- Befehl
def script_text(folder):
    """Gesprochener Text und Einstellungen des Skripts. Der Text kommt aus engine/script.mjs: es gibt nur diese eine Ableitung."""
    with open(os.path.join(folder, 'script.json'), encoding='utf-8') as f: script = json.load(f)
    r = subprocess.run(['node', os.path.join(HERE, 'times.mjs'), folder, '--text'], capture_output=True, text=True)
    if r.returncode != 0: raise Stop('Der gesprochene Text ließ sich nicht aus dem Skript ableiten: ' + (r.stderr or r.stdout).strip()[:300])
    return r.stdout, voice.merge_settings(script.get('voice'))


def run(folder, a, text=None, settings=None):
    if text is None: text, settings = script_text(folder)
    d = os.path.join(folder, 'voice'); own = voice.cache_key(text, settings)
    active, _ = voice.active_key(d, text, settings)
    if not voice.cached(d, active): raise Stop(f'Im Ordner voice/ liegt keine Aufnahme zum Text des Skripts (Schlüssel {own}). Es gibt nichts, in das sich ein Satz einsetzen ließe.')
    root, links = chain(d, active); sents = voice.sentences(text)
    number = lambda m: next(j for j, s in enumerate(sents) if s[0] == m['cut'][0]) + 1
    if a.list:
        print(f'Aufnahme {root}' + (f'. Es gilt die Fassung {active} mit {len(links)} fremden Sätzen.' if links else ', keine fremden Sätze.'))
        by = {number(m): m for m in links}
        for j, (_, _, s) in enumerate(sents): print(f'{j + 1:3}  {s}' + (f'    <- {by[j + 1]["extern"]["file"]}' if j + 1 in by else ''))
        return {'key': active, 'root': root, 'sentences': len(sents), 'extern': [{'number': number(m), 'file': m['extern']['file']} for m in links]}
    if a.original:
        p = use_path(d, text, settings); had = os.path.exists(p)
        if had: os.remove(p)
        print(f'Es gilt {"wieder " if had else ""}die Aufnahme {root}.' + (' Die abgelegten fremden Sätze bleiben im Ordner voice/ (--prune löscht sie).' if had else ''))
        return {'key': root, 'root': root, 'removed_use': had}
    if a.prune:
        keep = {root} | {m['key'] for m in links}; gone = []
        for name in sorted(os.listdir(d)):
            if not name.endswith('.meta.json'): continue
            m = voice.load_meta(d, name[:-len('.meta.json')])
            if not m or m.get('source') != 'extern' or m['key'] in keep: continue
            # nur was dieses Werkzeug selbst abgelegt hat, und nur die vier Dateien dieser einen Fassung
            for f in (voice.paths(d, m['key'])[k] for k in ('clip', 'clip_alignment', 'alignment', 'meta')):
                if os.path.exists(f): os.remove(f)
            gone.append(m['key'])
        print(f'{len(gone)} nicht mehr gebrauchte Fassungen gelöscht' + (': ' + ', '.join(gone) if gone else '') + '.')
        return {'key': active, 'root': root, 'pruned': gone}

    if not a.sentence or not a.clip: raise Stop('Aufruf: clip-in.py <video-ordner> <satz> <clip.mp3>   (oder --list, --original, --prune)')
    if not os.path.isfile(a.clip): raise Stop(f'Den Clip {a.clip} gibt es nicht.')
    if not a.clip.lower().endswith('.mp3'): raise Stop('Der Clip muss eine .mp3 sein: so liegt er unverändert im Ordner voice/ und damit im Repo (.wav ist von Git ausgenommen).')
    i = pick_sentence(text, a.sentence); sentence = sents[i][2]
    opts = {'file': os.path.basename(a.clip), 'words': None, 'hints': None, 'alignment_text': None}
    side = a.clip[:-4] + '.alignment.json'; al_path = a.alignment or (side if os.path.exists(side) else None)
    warnings = []
    if al_path:
        al_text, al_words, al_starts = hint_words(voice.load_json(al_path)); opts['alignment_text'] = al_text
        if plain(al_text) != plain(sentence):
            raise Stop(f'Der Clip gehört laut seinen Zeiten zu einem anderen Satz: "{al_text}" statt "{sentence}". Nichts abgelegt.')
        if len(al_words) == len(sentence.split(' ')): opts['hints'] = [round(t, 3) for t in al_starts]
    if a.words:
        try: opts['words'] = [float(x) for x in a.words.split(',')]
        except ValueError: raise Stop('--words erwartet Sekunden mit Komma dazwischen, z. B. 0.38,0.68')

    # Kette neu aufbauen: jeder schon eingesetzte Satz bleibt an seiner Stelle, dieser kommt obenauf
    # oder loest seinen Vorgaenger ab. Fassungen, an denen sich nichts aendert, bleiben, wie sie sind.
    old = lambda m: {'file': m['extern']['file'], 'words': m['extern'].get('given_words'), 'hints': m['extern'].get('hints'), 'alignment_text': m['extern'].get('alignment_text')}
    plan = [(number(m) - 1, voice.paths(d, m['key'])['clip'], old(m), m['key']) for m in links]
    new = (i, a.clip, opts, None)
    plan = [new if q[0] == i else q for q in plan] if any(q[0] == i for q in plan) else plan + [new]
    key = root; done = []; rep = None
    for k, clip_path, o, was in plan:
        same = was is not None and was == variant_key(key, k, voice.load_meta(d, was)['clip_sha256']) and voice.cached(d, was)
        if same: key = was
        else: key, r = put(d, text, settings, key, k, clip_path, o, write=not a.check)
        done.append((k + 1, sents[k][2], o['file']))
        if k == i: rep = r
        if a.check and k == i: break   # was darueber liegt, braucht erst die abgelegte Fassung
    show(rep, a.clip)
    if not al_path:
        warnings.append('Zum Clip gibt es keine Zeiten des Anbieters. Ob er wirklich diesen Satz spricht, zeigt nur der Klangvergleich mit der Aufnahme und das Anhören.')
        if rep.get('closer_to'): warnings.append(f'Der Clip klingt einem ANDEREN Satz der Aufnahme ähnlicher: Satz {rep["closer_to"]["number"]} "{rep["closer_to"]["sentence"]}" (Abstand {rep["closer_to"]["dtw_cost"]} statt {rep["dtw_cost"]}). Richtiger Clip?')
    if any(w['how'].split('+')[0] in ('vergleich', 'anbieter', 'verteilt') and 'einsatz' not in w['how'] for w in rep['words']):
        warnings.append('Mindestens ein Wortanfang sitzt nicht auf einem deutlichen Einsatz im Pegel, sondern ist geschätzt. Oben nachsehen, notfalls mit --words von Hand setzen.')
    for w in warnings: print('  ACHTUNG ' + w)
    if a.check:
        print('Nur gemessen (--check): nichts abgelegt.')
        return {**rep, 'written': False, 'warnings': warnings}
    set_use(d, text, settings, key, done)
    print(f'Abgelegt als Fassung {key} im Ordner voice/, 0 Zeichen. Der nächste Bau nimmt sie ({os.path.basename(use_path(d, text, settings))} zeigt darauf). Die Aufnahme {root} bleibt unverändert.')
    return {**rep, 'key': key, 'root': root, 'own_key': own, 'written': True, 'chain': [{'number': n, 'sentence': s, 'clip': c} for n, s, c in done], 'warnings': warnings}


def main(argv=None):
    ap = argparse.ArgumentParser(description='Setzt einen ausserhalb des Studios aufgenommenen Satz in die Aufnahme eines Videos ein. Sendet nichts.')
    ap.add_argument('folder'); ap.add_argument('sentence', nargs='?'); ap.add_argument('clip', nargs='?')
    ap.add_argument('--alignment'); ap.add_argument('--words'); ap.add_argument('--check', action='store_true')
    ap.add_argument('--list', action='store_true'); ap.add_argument('--original', action='store_true'); ap.add_argument('--prune', action='store_true')
    a = ap.parse_args(argv)
    folder = next((f for f in (os.path.abspath(a.folder), os.path.join(HERE, '..', 'videos', a.folder)) if os.path.exists(os.path.join(f, 'script.json'))), None)
    if not folder: print(f'clip-in.py: kein script.json gefunden in "{a.folder}".', file=sys.stderr); return 2
    try: out = run(folder, a)
    except Stop as e:
        print('clip-in.py: ' + str(e), file=sys.stderr); return 1
    # letzte Zeile: das Ergebnis fuer Programme, wie bei voice.py
    print(json.dumps(out, ensure_ascii=False)); return 0


if __name__ == '__main__':
    try: sys.exit(main())
    except BrokenPipeError:
        # die Ausgabe wurde abgeschnitten (z. B. "| head"); abgelegt ist dann schon alles
        os.dup2(os.open(os.devnull, os.O_WRONLY), sys.stdout.fileno()); sys.exit(0)
