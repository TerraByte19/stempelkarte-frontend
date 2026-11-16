#!/usr/bin/env python3
# tighten.py <aufnahme> <alignment.json> <max_luecke_s> <out.wav> <out.alignment.json> [--set <sekunde>=<luecke_s> ...] [--keep <von>-<bis> ...]
#
# Kuerzt die stillen Luecken einer Aufnahme auf hoechstens <max_luecke_s> und
# schiebt die Zeichen-Zeiten passend nach. Sendet nichts, kostet nichts, und
# die Aufnahme im Ordner voice/ bleibt unveraendert: das Ergebnis ist ein
# Zwischenergebnis im Arbeitsordner und entsteht bei jedem Bau gleich neu.
#
# Warum: die Stimme macht nach jedem Punkt und Fragezeichen von sich aus eine
# Pause von einer halben bis ueber einer Sekunde. Im ersten Video waren das
# zusammen fast 9 Sekunden Stille; die Reels, die am besten laufen, haben
# keine. Die Pausen neu aufzunehmen kostet Geld und aendert sie nicht - sie
# hinterher zu kuerzen kostet nichts.
#
# Was als Stille zaehlt, ist dasselbe wie in engine/mix.mjs (pauses): jede
# Stelle, an der JEDER Abtastwert unter -40 dB liegt. Ein Atemholen ist lauter
# und bleibt deshalb stehen, es wird nie mitten in einem Laut geschnitten.
# Gekuerzt wird in der Mitte der Stille, je die Haelfte der erlaubten Luecke
# bleibt vor und nach dem Schnitt, mit 5 ms Blende an beiden Kanten.
# Anfang und Ende der Aufnahme bleiben, wie sie sind.
#
# --set 13.46=0.55   die Pause VOR dem Wort, das bei Sekunde 13,46 der Aufnahme
#                    beginnt, wird auf genau 0,55 s gebracht: gekuerzt, wenn sie
#                    laenger ist, und verlaengert, wenn sie kuerzer ist. Dafuer
#                    wird in der Mitte der Stille Stille eingefuegt (die Pausen
#                    dieser Stimme liegen bei -88 dB, das hoert niemand). So
#                    bekommt die Pointe ihren Atemzug, auch wenn die Stimme
#                    gleich weitergeredet hat. Gibt es vor dem Wort gar keine
#                    Stille, bleibt die Stelle, wie sie ist (steht im Ergebnis).
# --keep 0.04-2.72   zwischen diesen Sekunden der Aufnahme wird keine Pause gekuerzt.
#                    Fuer Saetze, die ausserhalb des Studios aufgenommen und mit
#                    tools/clip-in.py eingesetzt wurden: der Nutzer hat diesen Vortrag
#                    ausgesucht, eine Kunstpause darin ("Ist das ... koscher?") gehoert
#                    dazu. Die Pausen davor und danach liegen nicht IN dem Abschnitt und
#                    werden behandelt wie alle anderen. Ein Wunsch mit --set geht vor.
import json, subprocess, sys, wave
import numpy as np

SR = 44100
QUIET = 10 ** (-40 / 20)   # -40 dB, wie silencedetect in engine/mix.mjs
FADE = 0.005
MIN_RUN = 0.05             # kuerzere Stille ist ein Verschlusslaut mitten im Wort, keine Pause
SLACK = 0.03               # ein Schnitt von ein paar Millisekunden lohnt die Kante nicht


def decode(path):
    r = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-f', 'f32le', '-ar', str(SR), '-ac', '1', 'pipe:1'], capture_output=True)
    if r.returncode != 0: sys.exit('tighten.py: ffmpeg: ' + r.stderr.decode('utf-8', 'replace')[:300])
    return np.frombuffer(r.stdout, dtype='<f4').copy()


def silent_runs(x):
    """[(anfang, ende)] in Abtastwerten: zusammenhaengende Stellen unter -40 dB."""
    q = np.abs(x) < QUIET
    edges = np.flatnonzero(np.diff(np.concatenate(([0], q.astype(np.int8), [0]))))
    return [(int(a), int(b)) for a, b in zip(edges[0::2], edges[1::2])]


def tighten(x, max_gap, wishes=(), protect=()):
    """
    Gibt (ton, aenderungen, pausen, offene_wuensche) zurueck.
    aenderungen = [(stelle_s, bis_s, eingefuegt_s)] in der Zeit der ALTEN Aufnahme:
    ein Schnitt nimmt [stelle, bis) heraus, eine Einfuegung setzt Stille an `stelle`.
    """
    runs = [(a, b) for a, b in silent_runs(x) if a > 0 and b < len(x) and (b - a) / SR >= MIN_RUN]
    target = {}; missed = []
    # Wuensche zuerst: die Pause VOR dem Wort bei t. Es zaehlt die laengste Stille, die kurz vor t endet.
    for t, gap in wishes:
        near = [(b - a, i) for i, (a, b) in enumerate(runs) if t - 0.45 <= b / SR <= t + 0.25 or a / SR <= t <= b / SR]
        if not near: missed.append({'at': t, 'gap': gap}); continue
        target[max(near)[1]] = gap
    edits = []; pauses = []; out = []; pos = 0
    n = int(FADE * SR); up = np.linspace(0, 1, n, dtype=np.float32); down = up[::-1]
    for i, (a, b) in enumerate(runs):
        length = (b - a) / SR
        if length >= 0.3: pauses.append({'at': round(a / SR, 3), 'seconds': round(length, 3)})
        want = target.get(i, min(length, max_gap))
        # eine Pause, die ganz in einem geschuetzten Abschnitt liegt, bleibt (ausser ein Wunsch nennt sie)
        if i not in target and any(k0 < a / SR and b / SR < k1 for k0, k1 in protect): continue
        if abs(want - length) <= SLACK: continue
        if want < length:
            keep = int(want * SR / 2); c0, c1 = a + keep, b - keep
            part = x[pos:c0].copy()
            if len(part) >= n: part[-n:] *= down
            out.append(part); pos = c1; edits.append((c0 / SR, c1 / SR, 0.0))
            out.append(None)                              # Merker: das naechste Stueck beginnt an einer Schnittkante
        else:
            mid = (a + b) // 2; add = int((want - length) * SR)
            out.append(x[pos:mid].copy()); out.append(np.zeros(add, np.float32)); pos = mid
            edits.append((mid / SR, mid / SR, add / SR))
    out.append(x[pos:].copy())
    pieces = []; fade_next = False
    for part in out:
        if part is None: fade_next = True; continue
        if fade_next and len(part) >= n: part[:n] *= up
        fade_next = False; pieces.append(part)
    return np.concatenate(pieces).astype(np.float32), edits, pauses, missed


def shift_times(times, edits):
    """Zeiten der alten Aufnahme -> Zeiten der neuen. Eine Zeit mitten in einem Schnitt rutscht an dessen Anfang."""
    out = []
    for t in times:
        s = 0.0
        for a, b, ins in edits:
            if ins:
                if t >= a: s -= ins
            elif t >= b: s += b - a
            elif t > a: s += t - a
        out.append(round(t - s, 3))
    return out


def main(argv):
    if len(argv) < 5: sys.exit('Aufruf: tighten.py <aufnahme> <alignment.json> <max_luecke_s> <out.wav> <out.alignment.json> [--set <sekunde>=<luecke_s> ...]')
    audio, al_path, max_gap, out_wav, out_al = argv[0], argv[1], float(argv[2]), argv[3], argv[4]
    wishes = []; protect = []; rest = argv[5:]
    for i, a in enumerate(rest):
        if a == '--set' and i + 1 < len(rest):
            t, gap = rest[i + 1].split('='); wishes.append((float(t), float(gap)))
        if a == '--keep' and i + 1 < len(rest):
            k0, k1 = rest[i + 1].split('-'); protect.append((float(k0), float(k1)))
    if not 0.15 <= max_gap <= 3: sys.exit('tighten.py: die erlaubte Lücke muss zwischen 0.15 und 3 s liegen')
    x = decode(audio)
    with open(al_path, encoding='utf-8') as f: al = json.load(f)
    y, edits, pauses, missed = tighten(x, max_gap, wishes, protect)
    new = {'characters': al['characters'],
           'character_start_times_seconds': shift_times(al['character_start_times_seconds'], edits),
           'character_end_times_seconds': shift_times(al['character_end_times_seconds'], edits)}
    # Kein Laut darf in einem Schnitt verschwinden: jedes Zeichen behaelt seine Reihenfolge
    st = new['character_start_times_seconds']
    if any(b < a - 0.0005 for a, b in zip(st, st[1:])): sys.exit('tighten.py: Zeichen-Zeiten laufen nach dem Kürzen rückwärts - Abbruch, nichts geschrieben')
    pcm = (np.clip(y, -1, 1) * 32767).astype('<i2')
    with wave.open(out_wav, 'wb') as f:
        f.setnchannels(1); f.setsampwidth(2); f.setframerate(SR); f.writeframes(pcm.tobytes())
    with open(out_al, 'w', encoding='utf-8') as f: json.dump(new, f, ensure_ascii=False)
    cuts = [{'at': round(a, 3), 'removed': round(b - a, 3)} for a, b, ins in edits if not ins]
    added = [{'at': round(a, 3), 'added': round(ins, 3)} for a, b, ins in edits if ins]
    print(json.dumps({'audio': out_wav, 'alignment': out_al, 'maxGap': max_gap, 'wishes': [{'at': t, 'gap': g} for t, g in wishes], 'missed': missed,
                      **({'kept': [{'from': k0, 'to': k1} for k0, k1 in protect]} if protect else {}),
                      'cuts': cuts, 'removed': round(sum(c['removed'] for c in cuts), 3), 'inserts': added, 'added': round(sum(c['added'] for c in added), 3),
                      'secondsBefore': round(len(x) / SR, 3), 'secondsAfter': round(len(y) / SR, 3),
                      'pausesBefore': pauses}, ensure_ascii=False))


if __name__ == '__main__':
    main(sys.argv[1:])
