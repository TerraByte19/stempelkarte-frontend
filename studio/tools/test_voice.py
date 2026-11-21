#!/usr/bin/env python3
# test_voice.py - prueft voice.py, OHNE ElevenLabs zu erreichen.
#
# Was hier festgenagelt wird und warum:
#   1. Der Satz-Austausch (splice_merge) baut aus der alten Aufnahme und dem neu
#      aufgenommenen Satz genau den Ton, der im ersten Video verwendet wurde.
#      Verglichen wird mit dem Fingerabdruck der damaligen liam.wav
#      (fixtures/referenz-ton.json), nicht mit einer Datei, die das Studio selbst
#      erzeugt hat: sonst pruefte der Test nur, dass er zweimal dasselbe rechnet.
#   2. Der Cache braucht keine .wav. Frueher lag die Aufnahme nur als .wav im
#      Ordner voice/, und .wav ist von Git ausgenommen: ein frischer Checkout
#      wollte 698 Zeichen neu bezahlen, und --splice fand keine Grundlage mehr
#      (690 statt 11 Zeichen). Jetzt liegen .mp3, Zeiten und Bauanleitung da.
#   3. Ohne --allow-voice-spend wird nie gesendet, mit Cache wird nie zweimal
#      gesendet, eine bezahlte Antwort geht nicht verloren, und nach einem
#      Aufruf ohne Antwort wird nicht von selbst noch einmal gesendet. Das sind
#      die Wege, auf denen sonst Geld verschwindet.
#   4. Der Schluessel haengt nicht davon ab, ob 1 oder 1.0 dasteht und ob das
#      Skript die Vorgaben ausschreibt. seed und speed gehoeren zum Schluessel
#      und zur Anfrage.
#   5. STUDIO_VOICE_OFFLINE=1 sperrt die Schnittstelle, bevor curl startet.
#
# Die Schnittstelle ist durch eine Attrappe ersetzt (voice.http_post). Zusaetzlich
# ist curl in diesem Prozess gesperrt: ein Test, der doch senden wollte, scheitert.
import base64, hashlib, json, os, shutil, subprocess, sys, tempfile
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
sys.dont_write_bytecode = True  # kein __pycache__ im Studio hinterlassen
os.environ['STUDIO_VOICE_OFFLINE'] = '1'
import voice  # noqa: E402
REAL_POST = voice.http_post

FIX = os.path.join(HERE, 'fixtures')
fx = lambda name: os.path.join(FIX, name)
OLD_MP3, CLIP_MP3 = fx('satz-austausch-vorher.mp3'), fx('satz-austausch-neuer-satz.mp3')
OLD_AL = voice.load_json(fx('satz-austausch-vorher.alignment.json'))
NEW_AL = voice.load_json(fx('satz-austausch-nachher.alignment.json'))
CLIP_AL = voice.load_json(fx('satz-austausch-neuer-satz.alignment.json'))
PINNED = voice.load_json(fx('referenz-ton.json'))['v7']
OLD_TEXT, NEW_TEXT = ''.join(OLD_AL['characters']), ''.join(NEW_AL['characters'])
# Einstellungen des ersten Videos (Tempo 1,0). Die Vorgabe ist inzwischen 1,05.
SETTINGS = voice.merge_settings({'speed': 1.0})

_real_run = subprocess.run
def _guard(cmd, *a, **k):
    if cmd and cmd[0] == 'curl': raise AssertionError('Test wollte curl starten: ' + ' '.join(cmd[:6]))
    return _real_run(cmd, *a, **k)
voice.subprocess.run = _guard

pcm_sha = lambda audio: hashlib.sha256(voice.to_pcm(audio).tobytes()).hexdigest()
files = lambda d: sorted(os.listdir(d)) if os.path.isdir(d) else []

print('Hinweis: Zeilen wie "ElevenLabs: ... Zeichen werden jetzt gesendet" stammen hier von der Attrappe. Es wird nichts gesendet.')
results = []
def check(name, cond, detail=''):
    results.append((name, bool(cond), detail)); print(('ok     ' if cond else 'FEHLER ') + name + (' - ' + str(detail) if detail else ''))

# ---------------------------------------------------------------- 1. Saetze und Satz-Austausch
i = voice.one_sentence_diff(OLD_TEXT, NEW_TEXT)
s_old = voice.sentences(OLD_TEXT)[i]; s_new = voice.sentences(NEW_TEXT)[i]
check('Texte unterscheiden sich in genau einem Satz', (s_old[2], s_new[2]) == ('Und das lohnt sich:', 'Und das lohnt sich!'), f'{s_old[2]!r} -> {s_new[2]!r}, Zeichen {s_new[0]}..{s_new[1] - 1}')
audio, al, how = voice.splice_merge(voice.decode(OLD_MP3), OLD_AL, s_old[0], s_old[1] - 1, voice.decode(CLIP_MP3), CLIP_AL)
check('Satz-Austausch: Länge wie im ersten Video', len(audio) == PINNED['voiceSamples'], f'{len(audio)} gegen {PINNED["voiceSamples"]} Abtastwerte')
check('Satz-Austausch: Ton bitgleich mit der Aufnahme des ersten Videos (Fingerabdruck der damaligen liam.wav)', pcm_sha(audio) == PINNED['voicePcmSha256'],
      f'Verstärkung {how["gain"]:.6f}, Verschiebung {how["shift"]} s, sha256 {pcm_sha(audio)[:16]}...')
check('Satz-Austausch: Zeichen-Zeiten wie im ersten Video', al == NEW_AL, f'{len(al["characters"])} Zeichen')

# ---------------------------------------------------------------- 2. Schluessel und Einstellungen
d0 = voice.merge_settings()
check('Vorgabe: Tempo 1,05, kein seed', d0['voice_settings']['speed'] == 1.05 and d0['seed'] is None)
check('Schlüssel gleich, ob 1 oder 1.0 dasteht (Node schreibt 1, Python 1.0)',
      voice.cache_key(NEW_TEXT, voice.merge_settings({'speed': 1})) == voice.cache_key(NEW_TEXT, voice.merge_settings({'speed': 1.0})) == '7a2c3c949a5bda46')
check('Schlüssel gleich, ob das Skript die Vorgaben ausschreibt oder weglässt',
      voice.cache_key(NEW_TEXT, voice.merge_settings({})) == voice.cache_key(NEW_TEXT, voice.merge_settings({'stability': 0.35, 'similarity_boost': 0.75, 'style': 0.6, 'speed': 1.05, 'voice_id': 'TX3LPaxmHKxFdv7VOQHJ'})))
keys = {voice.cache_key(NEW_TEXT, voice.merge_settings(o)) for o in ({}, {'speed': 1.0}, {'seed': 3303}, {'seed': 3304}, {'stability': 0.5})}
check('Tempo, seed und jede andere Einstellung ändern den Schlüssel', len(keys) == 5)
check('Schlüssel des veröffentlichten Videos (Tempo 1,05, seed 3303)', voice.cache_key(NEW_TEXT, voice.merge_settings({'speed': 1.05, 'seed': 3303})) == '72d308895ddb5686')
def exits(fn):
    try: fn(); return ''
    except SystemExit as e: return str(e)
check('unbekannte Einstellung und unsinniges Tempo werden abgelehnt', 'unbekannte Einstellung' in exits(lambda: voice.merge_settings({'sped': 1.05})) and 'speed' in exits(lambda: voice.merge_settings({'speed': 3})) and 'seed' in exits(lambda: voice.merge_settings({'seed': 'abc'})))

# ---------------------------------------------------------------- 3. Cache, Freigabe, Attrappe
calls = []
def fake_post(url, body):
    calls.append((url, body))
    if body['text'] == OLD_TEXT: mp3, a = OLD_MP3, OLD_AL
    elif body['text'] == 'Und das lohnt sich!': mp3, a = CLIP_MP3, CLIP_AL
    else: return 400, json.dumps({'detail': 'unbekannter Text in der Attrappe'})
    with open(mp3, 'rb') as f: return 200, json.dumps({'audio_base64': base64.b64encode(f.read()).decode(), 'alignment': a, 'normalized_alignment': a})
voice.http_post = fake_post

tmp = tempfile.mkdtemp(prefix='stampit-voice-test-')
try:
    d = os.path.join(tmp, 'voice'); work = os.path.join(tmp, 'work')
    pl = voice.plan(d, OLD_TEXT, SETTINGS)
    check('plan: nennt die Kosten, sendet nichts', pl['would_spend'] == len(OLD_TEXT) == 698 and not calls, f'{pl["would_spend"]} Zeichen')
    try: voice.ensure(d, OLD_TEXT, SETTINGS, allow=False, work=work); refused = False
    except voice.Refused as e: refused = '698 Zeichen' in str(e)
    check('ensure ohne Freigabe: lehnt ab und sendet nichts', refused and not calls)
    try: voice.synthesize(OLD_TEXT, SETTINGS, os.path.join(d, 'x.response.json')); refused = False
    except voice.Refused: refused = True
    check('synthesize ohne Freigabe: lehnt selbst ab (zweite Sperre direkt vor dem Senden)', refused and not calls)
    r1 = voice.ensure(d, OLD_TEXT, SETTINGS, allow=True, work=work)
    url, body = calls[0]; k1 = r1['key']
    check('ensure mit Freigabe: genau ein Aufruf', len(calls) == 1 and r1['source'] == 'api' and r1['spent'] == 698)
    check('Aufruf: Adresse und Einstellungen wie im ersten Video, kein seed',
          url == 'https://api.elevenlabs.io/v1/text-to-speech/TX3LPaxmHKxFdv7VOQHJ/with-timestamps?output_format=mp3_44100_128'
          and body['model_id'] == 'eleven_multilingual_v2' and body['language_code'] == 'de'
          and body['voice_settings'] == {'stability': 0.35, 'similarity_boost': 0.75, 'style': 0.6, 'speed': 1.0} and 'previous_text' not in body and 'seed' not in body)
    with open(OLD_MP3, 'rb') as f: delivered = f.read()
    with open(os.path.join(d, k1 + '.mp3'), 'rb') as f: kept = f.read()
    check('Cache: genau die gelieferte .mp3, dazu Zeiten und meta - keine .wav, keine doppelte Antwort',
          kept == delivered and files(d) == [k1 + '.alignment.json', k1 + '.meta.json', k1 + '.mp3'], ', '.join(x.split('.', 1)[1] for x in files(d)))
    check('Mischung bekommt die gelieferte .mp3 selbst', r1['audio'] == os.path.join(d, k1 + '.mp3') and not files(work))
    r2 = voice.ensure(d, OLD_TEXT, SETTINGS, allow=True, work=work)
    check('zweiter Lauf: kommt aus dem Cache, kein Aufruf', len(calls) == 1 and r2['source'] == 'cache' and r2['spent'] == 0)

    # seed und Tempo in der Anfrage
    d5 = os.path.join(tmp, 'voice5'); n0 = len(calls)
    voice.ensure(d5, OLD_TEXT, voice.merge_settings({'seed': 3303}), allow=True, work=work)
    body = calls[-1][1]
    check('seed steht oben in der Anfrage, Tempo 1,05 in voice_settings', len(calls) == n0 + 1 and body['seed'] == 3303 and body['voice_settings']['speed'] == 1.05)

    # Satz-Austausch ueber den ganzen Weg - die Grundlage ist nur eine .mp3
    pl = voice.plan(d, NEW_TEXT, SETTINGS, splice=True)
    check('plan --splice: findet die Grundlage ohne .wav, nur der geänderte Satz kostet', pl['how'] == 'splice' and pl['would_spend'] == 19, f'{pl["would_spend"]} statt {len(NEW_TEXT)} Zeichen')
    n0 = len(calls)
    r3 = voice.ensure(d, NEW_TEXT, SETTINGS, allow=True, splice=True, work=work)
    url, body = calls[-1]; k3 = r3['key']
    check('--splice: ein Aufruf nur mit dem Satz, Umgebung als previous_text/next_text',
          len(calls) == n0 + 1 and body['text'] == 'Und das lohnt sich!' and body['previous_text'].endswith('in Ladennähe.') and body['next_text'].startswith('Bleiben dir pro Kaffee'))
    check('--splice: im Cache liegen nur der neue Satz und die Bauanleitung',
          [x for x in files(d) if x.startswith(k3)] == [k3 + '.alignment.json', k3 + '.clip.alignment.json', k3 + '.clip.mp3', k3 + '.meta.json'])
    got = voice.decode(r3['audio'])
    check('--splice: zusammengesetzter Ton bitgleich mit dem ersten Video, als .wav nur im Arbeitsordner',
          r3['audio'].startswith(work + os.sep) and hashlib.sha256((got * 32768).astype('<i2').tobytes()).hexdigest() == PINNED['voicePcmSha256'] and not any(x.endswith('.wav') for x in files(d)))
    check('--splice: Zeichen-Zeiten wie im ersten Video', voice.load_json(r3['alignment']) == NEW_AL)
    r4 = voice.ensure(d, NEW_TEXT, SETTINGS, allow=False, splice=True, work=work)
    check('--splice: zweiter Lauf kommt aus dem Cache', r4['source'] == 'cache' and len(calls) == n0 + 1)

    # --splice ohne passende Grundlage nimmt NICHT still den ganzen Text auf
    d6 = os.path.join(tmp, 'voice6'); n0 = len(calls)
    try: voice.ensure(d6, NEW_TEXT, SETTINGS, allow=True, splice=True, work=work); refused = False
    except voice.Refused as e: refused = '--splice' in str(e)
    check('--splice ohne passende Aufnahme: lehnt ab, statt den ganzen Text zu bezahlen', refused and len(calls) == n0)

    # vorhandene Aufnahmen ablegen (so kamen beide Referenzvideos in den Cache)
    d7 = os.path.join(tmp, 'voice7')
    s7 = voice.seed_splice(d7, NEW_TEXT, SETTINGS, OLD_MP3, fx('satz-austausch-vorher.alignment.json'), CLIP_MP3, fx('satz-austausch-neuer-satz.alignment.json'))
    check('seed-splice: Aufnahme davor + neuer Satz ergeben die Stimme des ersten Videos', s7['key'] == '7a2c3c949a5bda46' and voice.cached(d7, s7['key']) and pcm_sha(voice.audio_array(d7, s7['key'])) == PINNED['voicePcmSha256'])
    check('seed: lehnt eine Aufnahme ab, deren Zeichen nicht zum Text passen', 'passen nicht' in exits(lambda: voice.seed(d7, NEW_TEXT + ' Mehr.', SETTINGS, OLD_MP3, fx('satz-austausch-nachher.alignment.json'))))

    # Eine bezahlte Antwort darf nicht verloren gehen
    d2 = os.path.join(tmp, 'voice2'); n0 = len(calls)
    def broken_post(url, body):
        calls.append((url, body)); a = {**OLD_AL, 'characters': ['X'] + OLD_AL['characters'][1:]}
        with open(OLD_MP3, 'rb') as f: return 200, json.dumps({'audio_base64': base64.b64encode(f.read()).decode(), 'alignment': a})
    voice.http_post = broken_post
    try: voice.ensure(d2, OLD_TEXT, SETTINGS, allow=True, work=work); failed = False
    except RuntimeError: failed = True
    raw = os.path.join(d2, voice.cache_key(OLD_TEXT, SETTINGS) + '.response.json')
    try: voice.ensure(d2, OLD_TEXT, SETTINGS, allow=False, work=work)
    except RuntimeError: pass
    check('kaputte Antwort: wird gesichert, ein zweiter Lauf sendet nicht noch einmal', failed and os.path.exists(raw) and len(calls) == n0 + 1)

    # Aufruf ohne Antwort (Zeitueberschreitung): nicht von selbst noch einmal senden
    d3 = os.path.join(tmp, 'voice3'); n0 = len(calls)
    def timeout_post(url, body): calls.append((url, body)); raise voice.Unclear('curl (28): Operation timed out')
    voice.http_post = timeout_post
    try: voice.ensure(d3, OLD_TEXT, SETTINGS, allow=True, work=work); unclear = False
    except voice.Unclear: unclear = True
    voice.http_post = fake_post
    try: voice.ensure(d3, OLD_TEXT, SETTINGS, allow=True, work=work); blocked = False
    except voice.Refused as e: blocked = 'Unklarer Stand' in str(e)
    check('Aufruf ohne Antwort: der nächste Lauf sendet nicht von selbst noch einmal', unclear and blocked and len(calls) == n0 + 1, ', '.join(files(d3)))
    def nonet_post(url, body): calls.append((url, body)); raise RuntimeError('curl (7): Failed to connect')
    d4 = os.path.join(tmp, 'voice4'); voice.http_post = nonet_post
    try: voice.ensure(d4, OLD_TEXT, SETTINGS, allow=True, work=work)
    except RuntimeError: pass
    check('keine Verbindung: sicher nichts gesendet, also bleibt keine Sperre liegen', not any(x.endswith('.pending.json') for x in files(d4)))

    # Obergrenze je Aufruf
    voice.http_post = fake_post; n0 = len(calls)
    try: voice.ensure(os.path.join(tmp, 'voice8'), 'Wort. ' * 300, SETTINGS, allow=True, work=work); capped = False
    except voice.Refused as e: capped = 'Obergrenze' in str(e)
    check(f'mehr als {voice.MAX_CHARS} Zeichen in einem Aufruf werden auch mit Freigabe nicht gesendet', capped and len(calls) == n0)

    # ---------------------------------------------------------------- 4. Sperre
    voice.http_post = REAL_POST
    try: REAL_POST('https://api.elevenlabs.io/x', {}); blocked = False
    except voice.Refused: blocked = True
    check('STUDIO_VOICE_OFFLINE=1 sperrt die Schnittstelle vor dem Senden', blocked)
finally:
    shutil.rmtree(tmp)

bad = [r for r in results if not r[1]]
print(f'{len(results) - len(bad)} von {len(results)} Prüfungen bestanden')
sys.exit(1 if bad else 0)
