#!/usr/bin/env python3
# test_clip_in.py - prueft tools/clip-in.py mit einem kuenstlichen Clip, ohne Netz und ohne Kosten.
#
# Was hier festgenagelt wird und warum:
#   1. Die Wortanfaenge kommen aus dem Ton, nicht aus den Zeiten des Anbieters. Bei den Proben
#      fuer das zweite Video lagen dessen Zeiten bis zu 0,16 s daneben, und ein gedehntes Wort
#      ("Natüüürlich") verschiebt alles danach. Nach diesen Zeiten erscheinen die Woerter im Bild.
#   2. Der Clip wird zugeschnitten (Stille weg, 40 ms vor dem ersten Laut bleiben) und an die
#      Lautstaerke der Saetze daneben angeglichen, hoechstens 6 dB.
#   3. Die Aufnahme selbst bleibt Byte fuer Byte, wie sie war. Die Fassung liegt daneben, mit
#      "source": "extern", Dateiname und sha256 des Clips und "spent": 0, und der Clip liegt
#      unveraendert im Cache.
#   4. Der Bau nimmt die Fassung (voice.plan ueber <schluessel>.use.json), kostet 0 Zeichen und
#      sendet nichts; zwei Saetze nacheinander gehen; derselbe Satz laesst sich noch einmal
#      ersetzen; --original stellt die Aufnahme wieder her; ein Verweis ins Leere bricht ab,
#      statt still die alte Betonung zu liefern.
#   5. Ein Clip, der laut seinem Text zu einem anderen Satz gehoert, wird abgelehnt.
#   6. tighten.py kuerzt eine Pause IN einem Satz von ausserhalb nicht (--keep).
#
# Der "Sprecher" ist kuenstlich: jedes Wort ein Klang mit eigener Farbe, dazwischen 60 ms
# Stille wie der Verschluss vor einem k oder t. Das reicht, um den Weg zu pruefen; wie gut die
# Erkennung bei echter Sprache sitzt, steht in den NOTIZEN des zweiten Videos (sieben Proben).
import argparse, importlib.util, json, os, shutil, subprocess, sys, tempfile
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
sys.dont_write_bytecode = True
os.environ['STUDIO_VOICE_OFFLINE'] = '1'
spec = importlib.util.spec_from_file_location('clip_in', os.path.join(HERE, 'clip-in.py'))
ci = importlib.util.module_from_spec(spec); spec.loader.exec_module(ci)
voice = ci.voice; SR = voice.SR
import tighten  # noqa: E402

# Wie in test_voice.py: ein Test, der doch senden wollte, scheitert
_real_run = subprocess.run
def _guard(cmd, *a, **k):
    if cmd and cmd[0] == 'curl': raise AssertionError('Test wollte curl starten: ' + ' '.join(cmd[:6]))
    return _real_run(cmd, *a, **k)
voice.subprocess.run = _guard

results = []
def check(name, cond, detail=''):
    results.append((name, bool(cond), detail)); print(('ok     ' if cond else 'FEHLER ') + name + (' - ' + str(detail) if detail else ''))
files = lambda d: sorted(os.listdir(d)) if os.path.isdir(d) else []
sha = voice.sha256_file

# ---------------------------------------------------------------- kuenstlicher Sprecher
TEXT = 'Eins zwei drei. Vier fuenf sechs sieben! Acht neun.'
WORDS = TEXT.split(' ')
def tone(word, seconds, level=0.2):
    """Ein "Wort": Grundton und Obertoene, je Wort anders gewichtet, mit kurzer Ein- und Ausblende."""
    k = WORDS.index(word); t = np.arange(int(seconds * SR)) / SR; f0 = 110 + 23 * k
    x = sum(np.sin(2 * np.pi * f0 * h * t) * (1.0 if (h + k) % 3 == 0 else 0.25 if (h + k) % 3 == 1 else 0.6) / h for h in range(1, 12))
    n = int(0.008 * SR); env = np.ones(len(t)); env[:n] = np.linspace(0, 1, n); env[-n:] = np.linspace(1, 0, n)
    return (x / np.abs(x).max() * level * env).astype(np.float32)
def say(words, lengths, gap=0.06, lead=0.0, tail=0.0, level=0.2):
    """Ton und Wortanfaenge (s) fuer eine Folge von Woertern."""
    parts = [np.zeros(int(lead * SR), np.float32)]; starts = []; pos = lead
    for w, L in zip(words, lengths):
        starts.append(pos); parts.append(tone(w, L, level)); parts.append(np.zeros(int(gap * SR), np.float32)); pos += L + gap
    parts[-1] = np.zeros(int(tail * SR), np.float32)
    return np.concatenate(parts), starts
def write(path, x):
    wav = path + '.tmp.wav'; voice.write_wav(wav, x)
    codec = ['-c:a', 'libmp3lame', '-b:a', '128k'] if path.endswith('.mp3') else []
    r = _real_run(['ffmpeg', '-v', 'error', '-y', '-i', wav, *codec, path], capture_output=True); os.remove(wav)
    if r.returncode != 0: raise RuntimeError(r.stderr.decode()[:300])

def recording():
    """Die "Aufnahme": drei Saetze mit halber Sekunde Pause, dazu Zeichen-Zeiten, wie der Anbieter sie liefert."""
    audio = []; ch, st, en = [], [], []; pos = 0.0
    for s0, s1, sent in voice.sentences(TEXT):
        ws = sent.split(' '); x, starts = say(ws, [0.22] * len(ws)); audio.append(x)
        for w, t in zip(ws, starts):
            for i, c in enumerate(w): ch.append(c); st.append(round(pos + t + i * 0.22 / len(w), 3)); en.append(round(pos + t + (i + 1) * 0.22 / len(w), 3))
            ch.append(' '); st.append(en[-1]); en.append(round(pos + t + 0.28, 3))
        pos += len(x) / SR + 0.5; audio.append(np.zeros(int(0.5 * SR), np.float32)); en[-1] = round(pos, 3)
    ch.pop(); st.pop(); en.pop()
    return np.concatenate(audio)[:int(en[-1] * SR) + 1], {'characters': ch, 'character_start_times_seconds': st, 'character_end_times_seconds': en}

tmp = tempfile.mkdtemp(prefix='stampit-clip-in-test-')
try:
    d = os.path.join(tmp, 'video', 'voice'); work = os.path.join(tmp, 'work'); os.makedirs(os.path.join(tmp, 'video'))
    SETTINGS = voice.merge_settings()
    base_audio, base_al = recording()
    assert ''.join(base_al['characters']) == TEXT
    write(os.path.join(tmp, 'aufnahme.flac'), base_audio)
    with open(os.path.join(tmp, 'aufnahme.json'), 'w', encoding='utf-8') as f: json.dump(base_al, f)
    own = voice.seed(d, TEXT, SETTINGS, os.path.join(tmp, 'aufnahme.flac'), os.path.join(tmp, 'aufnahme.json'))['key']
    before = {f: sha(os.path.join(d, f)) for f in files(d)}

    # Der Clip von ausserhalb: Satz 2, erstes Wort stark gedehnt, 0,3 s Stille davor, 0,4 s danach, 4 dB leiser.
    # Seine "Zeiten des Anbieters" tragen eine Regieanweisung und liegen daneben.
    S2 = voice.sentences(TEXT)[1][2]; W2 = S2.split(' ')
    quiet = 0.2 * 10 ** (-4 / 20)
    clip, truth = say(W2, [0.9, 0.2, 0.3, 0.25], lead=0.3, tail=0.4, level=quiet)
    clip_path = os.path.join(tmp, 'probe-b.mp3'); write(clip_path, clip)
    al_text = '[froh, gedehnt] Vieeer fuenf sechs sieben!!'
    off_by = [t + 0.12 for t in truth]   # so grob wie beim Anbieter
    with open(os.path.join(tmp, 'probe-b.alignment.json'), 'w', encoding='utf-8') as f:
        chars = list(al_text); st = [0.0] * len(chars); k = 0
        for i, c in enumerate(chars):
            if i >= len('[froh, gedehnt] ') and (i == len('[froh, gedehnt] ') or chars[i - 1] == ' '): st[i] = off_by[k]; k += 1
            elif i > 0: st[i] = st[i - 1]
        json.dump({'characters': chars, 'character_start_times_seconds': st, 'character_end_times_seconds': st}, f)

    # ---------------------------------------------------------------- 1. Messen
    s0, s1, _ = voice.sentences(TEXT)[1]
    a_t, b_t, c_t = ci.sentence_frame(base_al, s0, s1)
    ref = base_audio[int(a_t * SR):int((b_t + 0.05) * SR)]
    ref_starts = [base_al['character_start_times_seconds'][s0 + i] - a_t for i in (0, 5, 11, 17)]
    dec = voice.decode(clip_path)
    r = ci.analyse(dec, W2, ref, ref_starts)
    err = [abs(t + r['offset'] - want) for t, want in zip(r['starts'], truth)]
    check('Zuschnitt: Stille vorn und hinten ist weg, 40 ms vor dem ersten Laut bleiben',
          abs(r['offset'] - 0.26) < 0.02 and abs(r['starts'][0] - 0.04) < 0.015 and abs(r['seconds'] - (0.04 + 1.83 + 0.03)) < 0.03, f'vorn {r["offset"]} s weg, bleibt {r["seconds"]} s')
    check('Wortanfänge aus dem Ton: Vergleich mit dem Satz der Aufnahme, auf den Einsatz gerückt, auch hinter dem gedehnten Wort (höchstens 20 ms daneben)',
          max(err) < 0.02 and all('vergleich+einsatz' in h for h in r['how'][1:]), ', '.join(f'{w} {t + r["offset"]:.3f} statt {want:.3f}' for w, t, want in zip(W2, r['starts'], truth)))
    text_al, words_al, hints = ci.hint_words(voice.load_json(os.path.join(tmp, 'probe-b.alignment.json')))
    check('Zeiten des Anbieters: Regieanweisung in eckigen Klammern zählt nicht als Wort, gedehnte Schreibweise gilt als derselbe Satz',
          words_al == ['Vieeer', 'fuenf', 'sechs', 'sieben!!'] and ci.plain(text_al) == ci.plain(S2) and ci.plain('[x] Natüüürlichhh ist das koscher!') == ci.plain('Natürlich ist das koscher!') and ci.plain('Ist das... koscher??') == ci.plain('Ist das koscher?'))
    h = ci.analyse(dec, W2, None, None, hints)
    check('Ohne Vergleich: die Zeiten des Anbieters sind nur der Anhalt, der Einsatz im Ton entscheidet (0,12 s daneben wird nicht übernommen)',
          max(abs(t + h['offset'] - want) for t, want in zip(h['starts'], truth)) < 0.02 and all(x == 'anbieter+einsatz' for x in h['how'][1:]), ' '.join(h['how']))
    e = ci.analyse(dec, W2)
    check('Ohne Vergleich und ohne Zeiten: gleichmäßig verteilt, in der Reihenfolge der Wörter, innerhalb des Tons',
          all(x.startswith('verteilt') for x in e['how'][1:]) and all(a < b for a, b in zip(e['starts'], e['starts'][1:])) and e['starts'][-1] < e['voiced'][1], ' '.join(e['how']))
    g = ci.analyse(dec, W2, ref, ref_starts, None, [1.3, 1.5, 1.9])
    check('--words: Wortanfänge von Hand gelten, in Sekunden der Clip-Datei', [round(t + g['offset'], 2) for t in g['starts'][1:]] == [1.3, 1.5, 1.9] and g['how'][1] == 'von Hand')
    try: ci.analyse(np.zeros(SR, np.float32), W2); silent = False
    except ci.Stop: silent = True
    check('Ein stiller Clip wird abgelehnt', silent)
    # Kunstpause: 0,8 s Stille mitten im Satz. Beim Vergleich passt Stille auf Stille; das Wort beginnt am Ende der Pause.
    pc, pt = say(W2, [0.25, 0.2, 0.3, 0.25], lead=0.1, tail=0.1)
    cut = int((pt[2] - 0.03) * SR); pc = np.concatenate([pc[:cut], np.zeros(int(0.8 * SR), np.float32), pc[cut:]]); pt = pt[:2] + [t + 0.8 for t in pt[2:]]
    pr = ci.analyse(pc, W2, ref, ref_starts)
    check('Kunstpause im Clip: das Wort danach beginnt am Ende der Pause, nicht mittendrin', max(abs(t + pr['offset'] - want) for t, want in zip(pr['starts'], pt)) < 0.02, ', '.join(f'{t + pr["offset"]:.3f}/{want:.3f}' for t, want in zip(pr['starts'], pt)))

    # ---------------------------------------------------------------- 2. Lautstaerke
    cutc = dec[r['cut'][0]:r['cut'][1]]
    # dieselben Wörter einmal in voller Lautstärke als "Sätze daneben" (mit Pause dazwischen), einmal 4 dB leiser als Clip
    loud, _ = say(W2, [0.22] * 4); soft, _ = say(W2, [0.22] * 4, level=quiet); around = np.concatenate([loud, np.zeros(SR, np.float32), loud])
    gain, lo = ci.loudness(soft, around, len(loud), len(loud) + SR)
    check('Lautstärke: gemessen werden nur die gesprochenen Stellen (eine Pause macht nicht leiser), der 4 dB leisere Clip wird um 4 dB angehoben',
          abs(lo['gain_db'] - 4) < 0.15 and not lo['limited'] and abs(20 * np.log10(ci.gated_rms(around) / ci.gated_rms(loud))) < 0.15, f'{lo["gain_db"]:+} dB, mit Pause {20 * np.log10(ci.gated_rms(around) / ci.gated_rms(loud)):+.2f} dB')
    gain2, lo2 = ci.loudness(cutc * 0.1, base_audio, int(a_t * SR), int(c_t * SR))
    check('Lautstärke: mehr als 6 dB werden nicht angeglichen, und das steht im Ergebnis', abs(lo2['gain_db'] - 6) < 0.01 and lo2['limited'] and lo2['wanted_db'] > 20, f'{lo2["gain_db"]:+} dB statt {lo2["wanted_db"]:+} dB')
    gain3, lo3 = ci.loudness(cutc / np.abs(cutc).max() * 0.9, base_audio * 6, int(a_t * SR), int(c_t * SR))
    check('Lautstärke: nie bis zur Übersteuerung', lo3['peak_capped'] and lo3['peak_after_db'] <= 20 * np.log10(ci.CEILING) + 0.01, f'Spitze danach {lo3["peak_after_db"]} dB')

    # ---------------------------------------------------------------- 3. Ablegen
    ns = lambda **k: argparse.Namespace(**{'sentence': None, 'clip': None, 'alignment': None, 'words': None, 'check': False, 'list': False, 'original': False, 'prune': False, **k})
    folder = os.path.join(tmp, 'video'); run = lambda **k: ci.run(folder, ns(**k), TEXT, SETTINGS)
    import io, contextlib
    def quiet_run(**k):
        with contextlib.redirect_stdout(io.StringIO()): return run(**k)
    c0 = quiet_run(sentence=S2, clip=clip_path, check=True)
    check('--check: misst und zeigt, legt aber nichts ab', c0['written'] is False and files(d) == sorted(before))
    out = quiet_run(sentence=S2, clip=clip_path); k1 = out['key']; p1 = voice.paths(d, k1); m1 = voice.load_meta(d, k1)
    check('Aufnahme unverändert: dieselben Dateien, Byte für Byte', all(sha(os.path.join(d, f)) == h for f, h in before.items()))
    check('Im Cache liegen der Clip, seine Zeiten, die Zeiten der Fassung, die Bauanleitung und der Verweis - keine .wav',
          [f for f in files(d) if f not in before] == sorted([k1 + '.alignment.json', k1 + '.clip.alignment.json', k1 + '.clip.mp3', k1 + '.meta.json', own + '.use.json']))
    check('meta: "source": "extern", Dateiname und sha256 des Clips, 0 Zeichen ausgegeben; der Clip liegt unverändert im Cache',
          m1['source'] == 'extern' and m1['spent'] == 0 and m1['from'] == 'probe-b.mp3' and m1['extern']['file'] == 'probe-b.mp3' and m1['extern']['source'] == 'extern'
          and m1['extern']['sha256'] == m1['clip_sha256'] == sha(clip_path) == sha(p1['clip']) and m1['base'] == own and m1['text'] == TEXT and m1['extern']['alignment_text'] == al_text)
    al1 = voice.load_json(p1['alignment']); a1 = voice.audio_array(d, k1)
    from_al = lambda al, i: al['character_start_times_seconds'][i]
    idx = [s0 + i for i in (0, 5, 11, 17)]; got = [from_al(al1, i) - a_t - 0.04 for i in idx]; want = [t - truth[0] for t in truth]
    check('Zeichen-Zeiten der Fassung: derselbe Text, die Wörter des Satzes an ihren Stellen im Ton', ''.join(al1['characters']) == TEXT and max(abs(x - y) for x, y in zip(got, want)) < 0.02, ', '.join(f'{x:.3f}' for x in got))
    shift = out['shift']; s3 = voice.sentences(TEXT)[2][0]
    check('Alles nach dem Satz verschiebt sich um den Längenunterschied, im Ton wie in den Zeiten',
          abs(shift - (len(a1) - len(voice.audio_array(d, own))) / SR) < 0.002 and abs(from_al(al1, s3) - from_al(base_al, s3) - shift) < 0.002 and shift > 0.5, f'{shift:+} s')
    seg = a1[int((a_t + 0.04) * SR):int((a_t + 0.04 + 1.8) * SR)]; third = a1[int(from_al(al1, s3) * SR):int((from_al(al1, s3) + 0.4) * SR)]
    beside = ci.gated_rms(np.concatenate([base_audio[:int(a_t * SR)], base_audio[int(c_t * SR):]])); diff = 20 * np.log10(ci.gated_rms(seg) / beside)
    check('Im zusammengesetzten Ton ist der Satz so laut wie die Sätze daneben (0,3 dB), und der Satz danach beginnt, wo seine Zeiten es sagen',
          abs(diff) < 0.3 and abs(m1['extern']['loudness']['gain_db'] - 20 * np.log10(m1['clip_gain'])) < 0.01 and ci.gated_rms(third) > 0.5 * beside, f'{diff:+.2f} dB, angeglichen um {m1["extern"]["loudness"]["gain_db"]:+} dB')

    # ---------------------------------------------------------------- 4. Der Bau nimmt die Fassung
    pl = voice.plan(d, TEXT, SETTINGS)
    check('voice.plan: nimmt die Fassung statt der Aufnahme, 0 Zeichen', pl['key'] == k1 and pl['cached'] and pl['would_spend'] == 0 and pl['take_of'] == own)
    en = voice.ensure(d, TEXT, SETTINGS, allow=False, work=work)
    check('voice.ensure ohne Freigabe: liefert den zusammengesetzten Ton als .wav im Arbeitsordner und nennt den Satz von außerhalb',
          en['spent'] == 0 and en['audio'].startswith(work + os.sep) and len(en['extern']) == 1 and en['extern'][0]['file'] == 'probe-b.mp3' and abs(en['extern'][0]['from'] - (a_t + 0.04)) < 0.02)
    snap = {f: sha(os.path.join(d, f)) for f in files(d)}
    again = quiet_run(sentence=S2, clip=clip_path)
    check('Derselbe Aufruf noch einmal: derselbe Schlüssel, dieselben Dateien mit demselben Inhalt', again['key'] == k1 and {f: sha(os.path.join(d, f)) for f in files(d)} == snap)

    # zweiter Satz obendrauf (ohne Zeiten des Anbieters: nur der Klang sagt, ob der Clip passt)
    S1 = voice.sentences(TEXT)[0][2]; c1, _ = say(S1.split(' '), [0.3, 0.5, 0.25], lead=0.2, tail=0.2)
    clip1 = os.path.join(tmp, 'probe-a.mp3'); write(clip1, c1)
    keep1 = {f: sha(os.path.join(d, f)) for f in files(d) if f.startswith(k1)}
    out2 = quiet_run(sentence='1', clip=clip1); k2 = out2['key']; m2 = voice.load_meta(d, k2)
    check('Zweiter Satz obendrauf: baut auf der ersten Fassung auf, die bleibt unverändert, der Verweis zeigt auf die neue',
          m2['base'] == k1 and voice.plan(d, TEXT, SETTINGS)['key'] == k2 and all(sha(os.path.join(d, f)) == h for f, h in keep1.items()) and [c['number'] for c in out2['chain']] == [2, 1]
          and all(sha(os.path.join(d, f)) == h for f, h in before.items()))
    al2 = voice.load_json(voice.paths(d, k2)['alignment']); a2 = voice.audio_array(d, k2)
    check('Zwei Sätze ersetzt: Text unverändert, Länge = Aufnahme + beide Verschiebungen, kein Hinweis auf einen falschen Clip',
          ''.join(al2['characters']) == TEXT and abs((len(a2) - len(base_audio)) / SR - shift - out2['shift']) < 0.003 and 'closer_to' not in out2 and len(voice.ensure(d, TEXT, SETTINGS, work=work)['extern']) == 2, f'{len(a2) / SR:.3f} s')

    # derselbe Satz noch einmal, mit einem anderen Clip: die Kette entsteht neu, mit zwei Gliedern
    clipx, _ = say(W2, [0.5, 0.2, 0.3, 0.25], lead=0.15, tail=0.15); clip_x = os.path.join(tmp, 'probe-c.mp3'); write(clip_x, clipx)
    out3 = quiet_run(sentence=S2, clip=clip_x); k3 = out3['key']; root, links = ci.chain(d, k3)
    check('Derselbe Satz noch einmal ersetzt: wieder genau zwei Sätze von außerhalb, der neue Clip an der Stelle des alten',
          root == own and [m['extern']['file'] for m in links] == ['probe-c.mp3', 'probe-a.mp3'] and k3 not in (k1, k2) and voice.cached(d, k3) and voice.plan(d, TEXT, SETTINGS)['key'] == k3)
    pr = quiet_run(prune=True)
    check('--prune: löscht nur Fassungen, die nicht mehr gebraucht werden; Aufnahme und geltende Kette bleiben',
          sorted(pr['pruned']) == sorted([k1, k2]) and not any(f.startswith(k1) or f.startswith(k2) for f in files(d)) and voice.cached(d, k3) and all(sha(os.path.join(d, f)) == h for f, h in before.items()))

    # ---------------------------------------------------------------- 5. Ablehnen und zurueck
    wrong = os.path.join(tmp, 'falsch.mp3'); shutil.copyfile(clip_path, wrong); shutil.copyfile(os.path.join(tmp, 'probe-b.alignment.json'), os.path.join(tmp, 'falsch.alignment.json'))
    n = len(files(d))
    try: quiet_run(sentence=S1, clip=wrong); refused = ''
    except ci.Stop as e: refused = str(e)
    check('Ein Clip, der laut seinem Text zu einem anderen Satz gehört, wird abgelehnt, nichts wird abgelegt', 'anderen Satz' in refused and len(files(d)) == n, refused[:90])
    noal = os.path.join(tmp, 'ohne-zeiten.mp3'); shutil.copyfile(clip_path, noal)
    with contextlib.redirect_stdout(io.StringIO()): o4 = ci.run(folder, ns(sentence=S1, clip=noal, check=True), TEXT, SETTINGS)
    check('Ein Clip ohne Zeiten, der wie ein anderer Satz klingt: Warnung mit dem Satz, dem er ähnlicher ist', o4.get('closer_to', {}).get('number') == 2 and any('ANDEREN Satz' in w for w in o4['warnings']), next((w for w in o4['warnings'] if 'ANDEREN' in w), '')[:110])
    try: quiet_run(sentence='Das steht nicht da.', clip=clip_path); missing = ''
    except ci.Stop as e: missing = str(e)
    check('Ein Satz, der nicht im Text steht, wird abgelehnt', 'steht nicht im gesprochenen Text' in missing)
    with open(voice.paths(d, own)['use'], encoding='utf-8') as f: ptr = json.load(f)
    with open(voice.paths(d, own)['use'], 'w', encoding='utf-8') as f: json.dump({**ptr, 'use': '0123456789abcdef'}, f)
    try: voice.plan(d, TEXT, SETTINGS); dangling = ''
    except SystemExit as e: dangling = str(e)
    check('Verweis ins Leere: der Bau bricht ab, statt still die Aufnahme mit der alten Betonung zu nehmen', 'verweist auf die Fassung' in dangling and 'nichts gesendet' in dangling)
    with open(voice.paths(d, own)['use'], 'w', encoding='utf-8') as f: json.dump(ptr, f)
    back = quiet_run(original=True)
    check('--original: der Verweis ist weg, der Bau nimmt wieder die Aufnahme', back['key'] == own and voice.plan(d, TEXT, SETTINGS)['key'] == own and 'take_of' not in voice.plan(d, TEXT, SETTINGS) and not os.path.exists(voice.paths(d, own)['use']))

    # ---------------------------------------------------------------- 6. Pause im fremden Satz bleibt
    x = np.concatenate([tone('Eins', 1.0), np.zeros(int(0.9 * SR), np.float32), tone('zwei', 1.0), np.zeros(int(0.9 * SR), np.float32), tone('drei.', 1.0)])
    y0, e0, _, _ = tighten.tighten(x, 0.4)
    y1, e1, _, _ = tighten.tighten(x, 0.4, (), [(0.5, 2.5)])
    check('tighten.py --keep: eine Pause IN einem Satz von außerhalb bleibt, die Pause danach wird wie immer gekürzt',
          len(e0) == 2 and len(e1) == 1 and e1[0][0] > 2.5 and abs((len(x) - len(y1)) / SR - 0.5) < 0.01, f'{len(x) / SR:.2f} s -> {len(y1) / SR:.2f} s (ohne Schutz {len(y0) / SR:.2f} s)')
finally:
    shutil.rmtree(tmp)

bad = [r for r in results if not r[1]]
print(f'{len(results) - len(bad)} von {len(results)} Prüfungen bestanden')
sys.exit(1 if bad else 0)
