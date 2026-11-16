# sfx.py <cues.json> <out.wav> - baut alle Effekte selbst aus Sinus und Rauschen
# (lizenzfrei, keine fremden Aufnahmen) und mischt sie auf die Zeiten des Videos.
#
# cues.json kommt aus der Seite (window.CUES): {"duration": s, "events": [{"t", "name", "vol", "pitch"}]}.
# Die Klangerzeugung ist unveraendert aus dem ersten Video uebernommen - gleiche
# Toene in gleicher Reihenfolge ergeben bitgleich dieselbe Datei. Zwei Fallen:
#   - rng ist EIN gemeinsamer Zufallsgenerator: das Rauschen eines Tons haengt
#     davon ab, welche Toene vor ihm zum ersten Mal vorkamen. Wer hier einen
#     Ton einfuegt oder umsortiert, veraendert den Klang aller rauschenden Toene.
#   - Am Ende wird auf Spitze 0,7 normiert. Ein einzelner sehr lauter Ton macht
#     also alle anderen leiser.
# Neue Namen muessen auch in engine/engine.js (SOUNDS) stehen.
#
# Seit dem Doener-Video (17.11.2026) gibt es daneben echte Klaenge aus der
# Bibliothek studio/sounds/ (Skript: "sounds" an einer Szene). Sie kommen als
# Ereignisse mit "lib": true und laufen NICHT durch die Schleife unten: sie
# verbrauchen keinen Zufall und aendern die Normierung der berechneten Toene
# nicht. Gibt es keine solchen Ereignisse (alle aelteren Skripte), laeuft
# genau der alte Weg und die Datei bleibt bytegleich. Weitere, freiwillige
# Angaben nur fuer diesen Fall (tools/soundlib.py):
#   --speech <json>   Wortzeiten [[anfang, ende], ...] im Video: darunter werden die Klaenge abgesenkt
#   --duck <dB>       wie weit (Vorgabe -10)
#   --voice <datei> --lead <s> --gains <stimme>,<effekte>   misst, wie weit die Stimme ueber jedem Klang liegt
import json, sys, wave
import numpy as np
SR = 48000
rng = np.random.default_rng(7)
def env(n, a=0.004, d=8.0):
    t = np.arange(n) / SR
    return np.minimum(t / a, 1.0) * np.exp(-d * t)
def sine_sweep(f0, f1, dur, d=10.0, a=0.003):
    n = int(dur * SR); t = np.arange(n) / SR
    f = f0 * (f1 / f0) ** (t / dur)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, a, d)
def lowpass(x, fc):
    # einfacher einpoliger Tiefpass; fc darf ein Verlauf sein
    fc = np.broadcast_to(np.asarray(fc, dtype=float), x.shape)
    a = 1 - np.exp(-2 * np.pi * fc / SR); y = np.empty_like(x); s = 0.0
    for i in range(len(x)):
        s += a[i] * (x[i] - s); y[i] = s
    return y
def bell(freqs, dur, d=6.0):
    n = int(dur * SR); t = np.arange(n) / SR
    return sum(np.sin(2 * np.pi * f * t) * np.exp(-(d + i * 2) * t) / (i + 1) for i, f in enumerate(freqs)) * np.minimum(t / 0.002, 1)
def pop(p=1.0): return sine_sweep(720 * p, 300 * p, 0.09, d=38) * 0.9
def thud():
    body = sine_sweep(130, 48, 0.3, d=14)
    n = int(0.05 * SR); click = lowpass(rng.standard_normal(n), 1800) * env(n, 0.001, 70) * 1.6
    out = body.copy(); out[:n] += click; return out
def whoosh():
    n = int(0.42 * SR); t = np.arange(n) / n
    x = lowpass(rng.standard_normal(n), 500 + 5200 * np.sin(np.pi * t) ** 2)
    return (x - lowpass(x, 250)) * np.sin(np.pi * t) ** 2 * 1.3
def drop(): return sine_sweep(520, 110, 0.42, d=5, a=0.02) * 0.6 + whoosh() * 0.5
def chime(): 
    out = np.zeros(int(0.9 * SR))
    for i, f in enumerate([1046.5, 1318.5, 1568.0]):
        b = bell([f, f * 2.01], 0.6, 7) * 0.5; o = int(i * 0.07 * SR); out[o:o + len(b)] += b
    return out
def ding():
    out = np.zeros(int(1.0 * SR))
    for i, f in enumerate([1318.5, 1760.0]):
        b = bell([f, f * 2, f * 3.01], 0.8, 5) * 0.55; o = int(i * 0.11 * SR); out[o:o + len(b)] += b
    return out
def buzz():
    n = int(0.38 * SR); t = np.arange(n) / SR
    return np.tanh(3 * np.sin(2 * np.pi * 155 * t)) * (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * 9 * t))) * np.clip(np.sin(np.pi * t / t[-1]), 0, 1) ** 0.5 * 0.25
def tick(): return sine_sweep(1900, 1500, 0.04, d=90) * 0.7
def scan():
    n = int(0.8 * SR); t = np.arange(n) / SR
    return np.sin(2 * np.pi * (900 + 500 * np.abs(np.sin(np.pi * t / 0.8))) * t) * np.sin(np.pi * t / 0.8) * 0.16
def ok():
    a = bell([1175, 2350], 0.25, 14) * 0.5; b = bell([1568, 3136], 0.5, 9) * 0.5
    out = np.zeros(int(0.7 * SR)); out[:len(a)] += a; o = int(0.09 * SR); out[o:o + len(b)] += b; return out
def crumple():
    n = int(0.45 * SR); out = np.zeros(n)
    for _ in range(26):
        o = int(rng.uniform(0, 0.36) * SR); m = int(rng.uniform(0.004, 0.02) * SR)
        g = rng.standard_normal(m) * env(m, 0.0005, rng.uniform(150, 500)) * rng.uniform(0.3, 1)
        out[o:o + m] += g
    return (out - lowpass(out, 900)) * 0.9
def kaching():
    n = int(0.06 * SR); chk = (lambda x: x - lowpass(x, 2500))(rng.standard_normal(n)) * env(n, 0.001, 60) * 0.8
    b = bell([2093, 2637, 3136, 4186], 1.1, 4.5) * 0.6
    out = np.zeros(int(1.3 * SR)); out[:n] += chk; o = int(0.07 * SR); out[o:o + len(b)] += b
    o2 = int(0.19 * SR); b2 = bell([2637, 3520], 0.9, 5) * 0.35; out[o2:o2 + len(b2)] += b2
    return out
def sparkle():
    out = np.zeros(int(0.9 * SR))
    for i in range(9):
        f = rng.uniform(2400, 5200); b = bell([f, f * 1.5], 0.35, 14) * rng.uniform(0.15, 0.35); o = int(i * 0.05 * SR); out[o:o + len(b)] += b
    return out
def riser():
    n = int(0.9 * SR); t = np.arange(n) / n
    x = lowpass(rng.standard_normal(n), 300 + 7000 * t ** 2)
    tone = np.sin(2 * np.pi * np.cumsum(220 * 4 ** t) / SR) * 0.25
    return ((x - lowpass(x, 200)) * 0.9 + tone) * t ** 2.2 * np.minimum((1 - t) / 0.02, 1)
def impact():
    body = sine_sweep(95, 34, 0.9, d=4.5) * 1.3
    n = int(0.12 * SR); hit = lowpass(rng.standard_normal(n), 1200) * env(n, 0.001, 35) * 1.4
    out = body.copy(); out[:n] += hit; return out
def wtick(): return sine_sweep(2600, 2200, 0.018, d=160)
def pad():
    n = int(data['duration'] * SR); t = np.arange(n) / SR
    x = sum(np.sin(2 * np.pi * f * t + i) * (0.6 + 0.4 * np.sin(2 * np.pi * (0.07 + 0.03 * i) * t)) for i, f in enumerate([110.0, 164.81, 220.0, 277.18]))
    return x * 0.022 * np.minimum(t / 1.5, 1) * np.minimum((t[-1] - t) / 2.0, 1)
MAKE = dict(sparkle=sparkle, riser=riser, impact=impact, wtick=wtick, pad=pad, pop=pop, thud=thud, whoosh=whoosh, drop=drop, chime=chime, ding=ding, buzz=buzz, tick=tick, scan=scan, ok=ok, crumple=crumple, kaching=kaching)
data = json.load(open(sys.argv[1])); total = int((data['duration'] + 0.05) * SR)
lib = [e for e in data['events'] if e.get('lib')]
events = [e for e in data['events'] if not e.get('lib')]
unknown = sorted({e['name'] for e in events} - set(MAKE))
if unknown: sys.exit('sfx.py: unbekannte Töne ' + ', '.join(unknown) + ' - erlaubt: ' + ', '.join(sorted(MAKE)))
mix = np.zeros(total); cache = {}
for e in events:
    k = (e['name'], e['pitch'])
    if k not in cache: cache[k] = MAKE[e['name']](e['pitch']) if e['name'] == 'pop' else MAKE[e['name']]()
    s = cache[k] * e['vol']; o = int(e['t'] * SR)
    if o >= total: continue
    s = s[:total - o]; mix[o:o + len(s)] += s
mix = mix / max(1e-9, np.abs(mix).max()) * 0.7
if lib:
    # Klaenge aus der Bibliothek: nach der Normierung dazu, damit "vol" 1 so laut ist wie der lauteste
    # berechnete Ton (Spitze 0,7), egal welche anderen Toene das Video hat
    import os
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    import soundlib
    arg = lambda k, d=None: sys.argv[sys.argv.index(k) + 1] if k in sys.argv else d
    speech = json.load(open(arg('--speech'))) if arg('--speech') else []
    duck = float(arg('--duck', -10))
    track, parts, info = soundlib.render(lib, total, speech, duck)
    mix = mix + track
    typical = None
    if arg('--voice'):
        gv, gs = (float(v) for v in arg('--gains', '1.5,0.45').split(','))
        typical = soundlib.margins(parts, info, arg('--voice'), float(arg('--lead', 0)), speech, gv, gs)
    soundlib.write_float_wav(sys.argv[2], mix)
    json.dump({'duckDb': duck, 'speechWindows': len(speech), 'voiceTypicalDb': None if typical is None else round(typical, 1), 'peak': round(float(np.abs(mix).max()), 3), 'sounds': info},
              open(sys.argv[2] + '.lib.json', 'w'), ensure_ascii=False, indent=1)
else:
    pcm = (np.stack([mix, mix], 1) * 32767).astype('<i2')
    with wave.open(sys.argv[2], 'wb') as f:
        f.setnchannels(2); f.setsampwidth(2); f.setframerate(SR); f.writeframes(pcm.tobytes())
print(len(data['events']), 'Töne,', round(total / SR, 2), 's')
