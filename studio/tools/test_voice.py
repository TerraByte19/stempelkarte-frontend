#!/usr/bin/env python3
# test_voice.py - prueft voice.py, OHNE ElevenLabs zu erreichen.
#
# Was hier festgenagelt wird und warum:
#   1. Der Satz-Austausch (splice_merge) baut aus der alten Aufnahme und dem neu
#      aufgenommenen Satz genau die Datei, die im ersten Video verwendet wurde.
#      Dort war das ein einmaliger Handgriff ohne gespeichertes Skript; jetzt ist
#      das Verfahren festgehalten und gegen das damalige Ergebnis geprueft.
#   2. Ohne --allow-voice-spend wird nie gesendet, mit Cache wird nie zweimal
#      gesendet, und eine bezahlte Antwort geht nicht verloren, wenn danach etwas
#      scheitert. Das sind die drei Wege, auf denen sonst Geld verschwindet.
#   3. STUDIO_VOICE_OFFLINE=1 sperrt die Schnittstelle, bevor curl startet.
#
# Die Schnittstelle ist durch eine Attrappe ersetzt (voice.http_post). Zusaetzlich
# ist curl in diesem Prozess gesperrt: ein Test, der doch senden wollte, scheitert.
import base64, json, os, shutil, subprocess, sys, tempfile, wave
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
sys.dont_write_bytecode = True  # kein __pycache__ im Studio hinterlassen
os.environ['STUDIO_VOICE_OFFLINE'] = '1'
import voice  # noqa: E402
REAL_POST = voice.http_post

FIX = os.path.join(HERE, 'fixtures')
REF_DIR = os.path.join(HERE, '..', 'videos', '2026-11-14-kaffee-aufs-haus', 'voice')
OLD_MP3 = os.path.join(FIX, 'satz-austausch-vorher.mp3')
OLD_AL = json.load(open(os.path.join(FIX, 'satz-austausch-vorher.alignment.json'), encoding='utf-8'))
CLIP_MP3 = os.path.join(FIX, 'satz-austausch-neuer-satz.mp3')
SETTINGS = voice.merge_settings()

_real_run = subprocess.run
def _guard(cmd, *a, **k):
    if cmd and cmd[0] == 'curl': raise AssertionError('Test wollte curl starten: ' + ' '.join(cmd[:6]))
    return _real_run(cmd, *a, **k)
voice.subprocess.run = _guard

def ref_files():
    metas = [f for f in os.listdir(REF_DIR) if f.endswith('.meta.json')]
    for f in metas:
        m = json.load(open(os.path.join(REF_DIR, f), encoding='utf-8'))
        if m.get('source') == 'seed': return m, voice.paths(REF_DIR, m['key'])
    raise SystemExit('Referenz-Aufnahme fehlt in ' + REF_DIR)

def pcm(path):
    with wave.open(path, 'rb') as f: return np.frombuffer(f.readframes(f.getnframes()), dtype='<i2').astype(np.int64)

def clip_alignment(new_al, i0, i1):
    """Die Zeiten des neuen Satzes fuer sich: aus der fertigen Aufnahme zurueckgerechnet (Satzanfang = 0)."""
    t0 = new_al['character_start_times_seconds'][i0]
    return {'characters': new_al['characters'][i0:i1 + 1],
            'character_start_times_seconds': [round(x - t0, 3) for x in new_al['character_start_times_seconds'][i0:i1 + 1]],
            'character_end_times_seconds': [round(x - t0, 3) for x in new_al['character_end_times_seconds'][i0:i1 + 1]]}

print('Hinweis: Zeilen wie "ElevenLabs: ... Zeichen werden jetzt verbraucht" stammen hier von der Attrappe. Es wird nichts gesendet.')
results = []
def check(name, cond, detail=''):
    results.append((name, bool(cond), detail)); print(('ok     ' if cond else 'FEHLER ') + name + (' - ' + detail if detail else ''))

# ---------------------------------------------------------------- 1. Saetze und Satz-Austausch
meta, ref = ref_files()
NEW_TEXT = meta['text']; NEW_AL = json.load(open(ref['alignment'], encoding='utf-8'))
OLD_TEXT = ''.join(OLD_AL['characters'])
i = voice.one_sentence_diff(OLD_TEXT, NEW_TEXT)
s_old = voice.sentences(OLD_TEXT)[i]; s_new = voice.sentences(NEW_TEXT)[i]
check('Texte unterscheiden sich in genau einem Satz', (s_old[2], s_new[2]) == ('Und das lohnt sich:', 'Und das lohnt sich!') or s_new[2] == 'Und das lohnt sich!', f'{s_old[2]!r} -> {s_new[2]!r}, Zeichen {s_new[0]}..{s_new[1] - 1}')
i0, i1 = s_new[0], s_new[1] - 1
CLIP_AL = clip_alignment(NEW_AL, i0, i1)
audio, al, how = voice.splice_merge(voice.decode(OLD_MP3), OLD_AL, i0, i1, voice.decode(CLIP_MP3), CLIP_AL)
got, want = voice.to_pcm(audio).astype(np.int64), pcm(ref['wav'])
same_len = len(got) == len(want)
diff = np.abs(got - want) if same_len else np.array([99])
check('Satz-Austausch: Länge wie im ersten Video', same_len, f'{len(got)} gegen {len(want)} Abtastwerte')
check('Satz-Austausch: Ton wie im ersten Video (höchstens 1 Stufe von 32767 Abstand)', same_len and diff.max() <= 1,
      f'größter Abstand {int(diff.max())}, abweichende Abtastwerte {int(np.count_nonzero(diff))} von {len(want)}, Verstärkung {how["gain"]:.6f}, Verschiebung {how["shift"]} s')
al_ok = al['characters'] == NEW_AL['characters'] and all(
    max(abs(a - b) for a, b in zip(al[k], NEW_AL[k])) < 1e-9 for k in ('character_start_times_seconds', 'character_end_times_seconds'))
check('Satz-Austausch: Zeichen-Zeiten wie im ersten Video', al_ok, f'{len(al["characters"])} Zeichen')

# ---------------------------------------------------------------- 2. Cache, Freigabe, Attrappe
calls = []
def fake_post(url, body):
    calls.append((url, body))
    if body['text'] == OLD_TEXT: mp3, a = OLD_MP3, OLD_AL
    elif body['text'] == 'Und das lohnt sich!': mp3, a = CLIP_MP3, CLIP_AL
    else: return 400, json.dumps({'detail': 'unbekannter Text in der Attrappe'})
    return 200, json.dumps({'audio_base64': base64.b64encode(open(mp3, 'rb').read()).decode(), 'alignment': a, 'normalized_alignment': a})
voice.http_post = fake_post

tmp = tempfile.mkdtemp(prefix='stampit-voice-test-')
try:
    d = os.path.join(tmp, 'voice')
    pl = voice.plan(d, OLD_TEXT, SETTINGS)
    check('plan: nennt die Kosten, sendet nichts', pl['would_spend'] == len(OLD_TEXT) == 698 and not calls, f'{pl["would_spend"]} Zeichen')
    try: voice.ensure(d, OLD_TEXT, SETTINGS, allow=False); refused = False
    except voice.Refused as e: refused = '698 Zeichen' in str(e)
    check('ensure ohne Freigabe: lehnt ab und sendet nichts', refused and not calls)
    r1 = voice.ensure(d, OLD_TEXT, SETTINGS, allow=True)
    url, body = calls[0]
    check('ensure mit Freigabe: genau ein Aufruf', len(calls) == 1 and r1['source'] == 'api' and r1['spent'] == 698)
    check('Aufruf: Adresse und Einstellungen wie im ersten Video',
          url == 'https://api.elevenlabs.io/v1/text-to-speech/TX3LPaxmHKxFdv7VOQHJ/with-timestamps?output_format=mp3_44100_128'
          and body['model_id'] == 'eleven_multilingual_v2' and body['language_code'] == 'de'
          and body['voice_settings'] == {'stability': 0.35, 'similarity_boost': 0.75, 'style': 0.6, 'speed': 1.0} and 'previous_text' not in body)
    r2 = voice.ensure(d, OLD_TEXT, SETTINGS, allow=True)
    check('zweiter Lauf: kommt aus dem Cache, kein Aufruf', len(calls) == 1 and r2['source'] == 'cache' and r2['spent'] == 0)
    other = voice.merge_settings({'stability': 0.5})
    check('andere Einstellung = anderer Schlüssel', voice.cache_key(OLD_TEXT, other) != voice.cache_key(OLD_TEXT, SETTINGS))

    # Satz-Austausch ueber den ganzen Weg
    pl = voice.plan(d, NEW_TEXT, SETTINGS, splice=True)
    check('plan --splice: nur der geänderte Satz kostet', pl['how'] == 'splice' and pl['would_spend'] == 19, f'{pl["would_spend"]} statt {len(NEW_TEXT)} Zeichen')
    r3 = voice.ensure(d, NEW_TEXT, SETTINGS, allow=True, splice=True)
    url, body = calls[-1]
    check('--splice: ein Aufruf nur mit dem Satz, Umgebung als previous_text/next_text',
          len(calls) == 2 and body['text'] == 'Und das lohnt sich!' and body['previous_text'].endswith('in Ladennähe.') and body['next_text'].startswith('Bleiben dir pro Kaffee'))
    got, want = pcm(r3['wav']), pcm(ref['wav'])
    dd = np.abs(got - want) if len(got) == len(want) else np.array([99])
    check('--splice aus dem Cache: Ergebnis wie im ersten Video (höchstens 2 Stufen Abstand)', dd.max() <= 2, f'größter Abstand {int(dd.max())}, abweichend {int(np.count_nonzero(dd))} von {len(want)}')
    check('--splice: Zeichen-Zeiten wie im ersten Video', json.load(open(r3['alignment'], encoding='utf-8')) == NEW_AL)

    # Eine bezahlte Antwort darf nicht verloren gehen
    d2 = os.path.join(tmp, 'voice2'); n0 = len(calls)
    def broken_post(url, body):
        calls.append((url, body)); a = dict(OLD_AL); a = {**a, 'characters': ['X'] + a['characters'][1:]}
        return 200, json.dumps({'audio_base64': base64.b64encode(open(OLD_MP3, 'rb').read()).decode(), 'alignment': a})
    voice.http_post = broken_post
    try: voice.ensure(d2, OLD_TEXT, SETTINGS, allow=True); failed = False
    except RuntimeError: failed = True
    raw = os.path.join(d2, voice.cache_key(OLD_TEXT, SETTINGS) + '.response.json')
    try: voice.ensure(d2, OLD_TEXT, SETTINGS, allow=True)
    except RuntimeError: pass
    check('kaputte Antwort: wird gesichert, ein zweiter Lauf sendet nicht noch einmal', failed and os.path.exists(raw) and len(calls) == n0 + 1)

    # ---------------------------------------------------------------- 3. Sperre
    voice.http_post = REAL_POST
    try: REAL_POST('https://api.elevenlabs.io/x', {}); blocked = False
    except voice.Refused: blocked = True
    check('STUDIO_VOICE_OFFLINE=1 sperrt die Schnittstelle vor dem Senden', blocked)
finally:
    shutil.rmtree(tmp)

bad = [r for r in results if not r[1]]
print(f'{len(results) - len(bad)} von {len(results)} Prüfungen bestanden')
sys.exit(1 if bad else 0)
