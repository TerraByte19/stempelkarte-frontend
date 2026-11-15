#!/usr/bin/env python3
# voice.py - Sprecherstimme ueber ElevenLabs, mit Cache und Satz-Austausch.
#
#   voice.py plan   --dir <video>/voice --text-file t.txt [--settings s.json]
#   voice.py ensure --dir <video>/voice --text-file t.txt [--settings s.json] [--allow-voice-spend] [--splice]
#   voice.py seed   --dir <video>/voice --text-file t.txt --wav a.wav --alignment a.json [--settings s.json]
#
# JEDER Aufruf der Schnittstelle kostet Geld (1 Zeichen = 1 Credit). Deshalb:
#   - Ohne --allow-voice-spend wird nie gesendet. "ensure" bricht dann mit
#     Code 3 ab und sagt, wie viele Zeichen es kosten wuerde.
#   - Jede Aufnahme liegt im Cache des Videos, Schluessel = Hash aus Text und
#     Einstellungen. Derselbe Text kostet nie zweimal.
#   - --splice nimmt nur EINEN geaenderten Satz neu auf und setzt ihn in die
#     vorhandene Aufnahme ein (so entstand im ersten Video "Und das lohnt sich!").
#   - STUDIO_VOICE_OFFLINE=1 sperrt die Schnittstelle ganz (Tests, Proben).
#
# Der Schluessel fuer ElevenLabs steht NICHT hier: der Proxy der Umgebung
# haengt ihn als Kopfzeile xi-api-key an. Deshalb laeuft der Aufruf ueber curl.
import argparse, base64, hashlib, json, os, re, shutil, subprocess, sys, wave
import numpy as np

SR = 44100
API = 'https://api.elevenlabs.io/v1/text-to-speech/{voice_id}/with-timestamps?output_format={output_format}'
# Die im ersten Video gewaehlte Stimme: "Liam", lebhaft.
DEFAULTS = {
    'voice_id': 'TX3LPaxmHKxFdv7VOQHJ', 'model_id': 'eleven_multilingual_v2', 'language_code': 'de',
    'output_format': 'mp3_44100_128',
    'voice_settings': {'stability': 0.35, 'similarity_boost': 0.75, 'style': 0.6, 'speed': 1.0},
}
PAD = 0.04     # ein Satz wird 40 ms vor seinem ersten Laut geschnitten, mitten in der Atempause
FADE = 0.012   # 12 ms Blende an jeder Schnittkante, sonst knackt es
CONTEXT = 300  # so viele Zeichen Umgebung bekommt die Stimme beim Satz-Austausch mit


class Refused(Exception):
    """Es muesste Geld ausgegeben werden, das nicht freigegeben wurde."""


# ---------------------------------------------------------------- Einstellungen und Cache
def merge_settings(over=None):
    s = json.loads(json.dumps(DEFAULTS)); over = over or {}
    for k, v in over.items():
        if k == 'voice_settings': s['voice_settings'].update(v)
        elif k in s: s[k] = v
        elif k in s['voice_settings']: s['voice_settings'][k] = v   # Kurzform: "stability": 0.4
        else: raise SystemExit(f'voice: unbekannte Einstellung "{k}"')
    return s


def cache_key(text, settings):
    blob = json.dumps({'text': text, **settings}, sort_keys=True, ensure_ascii=False)
    return hashlib.sha256(blob.encode('utf-8')).hexdigest()[:16]


def paths(d, key):
    return {k: os.path.join(d, f'{key}.{ext}') for k, ext in
            [('wav', 'wav'), ('alignment', 'alignment.json'), ('meta', 'meta.json'), ('mp3', 'mp3')]}


def cached(d, key):
    p = paths(d, key)
    return os.path.exists(p['wav']) and os.path.exists(p['alignment'])


# ---------------------------------------------------------------- Ton lesen und schreiben
def decode(path):
    """mp3/wav -> float32 mono 44,1 kHz, ueber ffmpeg."""
    r = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-f', 'f32le', '-ar', str(SR), '-ac', '1', 'pipe:1'], capture_output=True)
    if r.returncode != 0: raise RuntimeError('ffmpeg: ' + r.stderr.decode('utf-8', 'replace')[:300])
    return np.frombuffer(r.stdout, dtype='<f4').copy()


def to_pcm(x):
    # bewusst wie im ersten Video: mal 32767 und abschneiden (nicht runden)
    return (x.astype(np.float32) * np.float32(32767)).astype('<i2')


def write_wav(path, x):
    with wave.open(path, 'wb') as f:
        f.setnchannels(1); f.setsampwidth(2); f.setframerate(SR); f.writeframes(to_pcm(x).tobytes())


def read_wav(path):
    with wave.open(path, 'rb') as f:
        if f.getframerate() != SR or f.getnchannels() != 1 or f.getsampwidth() != 2:
            raise RuntimeError(f'{path}: erwartet 44,1 kHz mono 16 bit')
        i = np.frombuffer(f.readframes(f.getnframes()), dtype='<i2').astype(np.float64)
    # Ein Viertel-Schritt Abstand zur Null hin: to_pcm schneidet ab statt zu runden,
    # und ohne diesen Abstand kaeme aus 100 nach Lesen und Schreiben manchmal 99 zurueck.
    return ((i + 0.25 * np.sign(i)) / 32767.0).astype(np.float32)


# ---------------------------------------------------------------- Saetze
def sentences(text):
    """
    Zerlegt den Text in Saetze: [(start, ende, satz)], ende zeigt hinter das Satzzeichen.
    Auch Doppelpunkt und Strichpunkt trennen: dahinter macht die Stimme eine Pause,
    in der sich schneiden laesst. Im ersten Video wurde genau so ein Stueck ersetzt
    ("Und das lohnt sich:" -> "Und das lohnt sich!"). Kommas trennen nicht.
    """
    out = []
    for m in re.finditer(r'\S.*?(?:[.!?:;]+(?=\s|$)|$)', text, flags=re.S):
        if m.group().strip(): out.append((m.start(), m.end(), m.group()))
    return out


def one_sentence_diff(old_text, new_text):
    """Unterscheiden sich die Texte in genau einem Satz? -> Index, sonst None."""
    a, b = sentences(old_text), sentences(new_text)
    if len(a) != len(b): return None
    diff = [i for i, (x, y) in enumerate(zip(a, b)) if x[2] != y[2]]
    return diff[0] if len(diff) == 1 else None


# ---------------------------------------------------------------- Satz-Austausch (reine Funktion, getestet)
def splice_merge(old, old_al, i0, i1, clip, clip_al):
    """
    Ersetzt in der Aufnahme `old` die Zeichen i0..i1 (ein Satz, einschliesslich
    Satzzeichen) durch die neue Aufnahme `clip`. Gibt (ton, alignment) zurueck.

    So wurde im ersten Video "Und das lohnt sich!" eingesetzt:
      - Schnitt 40 ms vor dem ersten Laut des Satzes und 40 ms vor dem ersten
        Laut des naechsten Satzes, jeweils in der Atempause
      - der neue Satz wird auf die Lautstaerke (RMS) des alten gebracht
      - die Pause nach dem Satz bleibt so lang wie vorher (Stille)
      - 12 ms Blende an allen vier Kanten
      - alle Zeichen-Zeiten danach verschieben sich um den Laengenunterschied
    """
    old = np.asarray(old, dtype=np.float32); clip = np.asarray(clip, dtype=np.float32)
    ch, st, en = old_al['characters'], old_al['character_start_times_seconds'], old_al['character_end_times_seconds']
    a_t = max(0.0, st[i0] - PAD); b_t = en[i1]
    nxt = next((j for j in range(i1 + 1, len(ch)) if not ch[j].isspace()), None)
    c_t = max(b_t, st[nxt] - PAD) if nxt is not None else None
    a, b = int(a_t * SR), int(b_t * SR)
    old_rms = np.sqrt(np.mean(old[a:b] ** 2)); clip_rms = np.sqrt(np.mean(clip ** 2))
    gain = old_rms / clip_rms if clip_rms > 0 and old_rms > 0 else np.float32(1)
    n = int(FADE * SR); up = np.linspace(0, 1, n, dtype=np.float32); down = up[::-1]
    head = old[:a].copy()
    if len(head) >= n: head[-n:] *= down
    mid = clip * gain
    if len(mid) >= 2 * n: mid[:n] *= up; mid[-n:] *= down
    if c_t is None:
        gap = np.zeros(0, np.float32); tail = np.zeros(0, np.float32)
    else:
        gap = np.zeros(int((c_t - b_t) * SR), np.float32); tail = old[int(c_t * SR):].copy()
        if len(tail) >= n: tail[:n] *= up
    audio = np.concatenate([head, mid, gap, tail]).astype(np.float32)

    shift = a_t + clip_al['character_end_times_seconds'][-1] - b_t
    r3 = lambda x: round(x, 3)
    al = {
        'characters': ch[:i0] + clip_al['characters'] + ch[i1 + 1:],
        'character_start_times_seconds': st[:i0] + [r3(a_t + x) for x in clip_al['character_start_times_seconds']] + [r3(x + shift) for x in st[i1 + 1:]],
        'character_end_times_seconds': en[:i0] + [r3(a_t + x) for x in clip_al['character_end_times_seconds']] + [r3(x + shift) for x in en[i1 + 1:]],
    }
    return audio, al, {'gain': float(gain), 'shift': round(shift, 3), 'cut_from': round(a_t, 3), 'cut_to': round(b_t, 3)}


# ---------------------------------------------------------------- Schnittstelle
def http_post(url, body):
    """Einzige Stelle, die ElevenLabs erreicht. Tests ersetzen diese Funktion."""
    if os.environ.get('STUDIO_VOICE_OFFLINE') == '1':
        raise Refused('STUDIO_VOICE_OFFLINE=1: die Schnittstelle ist gesperrt')
    r = subprocess.run(['curl', '-sS', '-m', '180', '-X', 'POST', url, '-H', 'Content-Type: application/json',
                        '--data-binary', '@-', '-w', '\n%{http_code}'], input=json.dumps(body), capture_output=True, text=True)
    if r.returncode != 0: raise RuntimeError('curl: ' + r.stderr[:300])
    out, code = r.stdout.rsplit('\n', 1)
    return int(code), out


def synthesize(text, settings, raw_path, previous_text=None, next_text=None):
    """
    Holt eine Aufnahme. Die Antwort wird als Erstes unveraendert nach raw_path
    geschrieben und erst dann geprueft: scheitert danach irgendetwas, ist das
    bezahlte Ergebnis nicht verloren, und der naechste Lauf liest die Datei,
    statt noch einmal zu senden.
    """
    if os.path.exists(raw_path):
        out = open(raw_path, encoding='utf-8').read()
    else:
        body = {'text': text, 'model_id': settings['model_id'], 'language_code': settings['language_code'], 'voice_settings': settings['voice_settings']}
        if previous_text: body['previous_text'] = previous_text
        if next_text: body['next_text'] = next_text
        url = API.format(voice_id=settings['voice_id'], output_format=settings['output_format'])
        code, out = http_post(url, body)
        if code != 200: raise RuntimeError(f'ElevenLabs antwortet {code}: {out[:400]}')
        os.makedirs(os.path.dirname(raw_path), exist_ok=True)
        open(raw_path, 'w', encoding='utf-8').write(out)
    d = json.loads(out)
    al = d['alignment']
    if ''.join(al['characters']) != text:
        raise RuntimeError(f'ElevenLabs hat einen anderen Text zurückgegeben als gesendet; die Zeiten wären unbrauchbar. Die Antwort liegt in {raw_path}')
    return base64.b64decode(d['audio_base64']), al


# ---------------------------------------------------------------- Befehle
def info(d, key, text, settings, source, spent, extra=None):
    p = paths(d, key)
    with wave.open(p['wav'], 'rb') as f: length = f.getnframes() / f.getframerate()
    return {'key': key, 'wav': p['wav'], 'alignment': p['alignment'], 'source': source, 'chars': len(text), 'spent': spent,
            'seconds': round(length, 3), **(extra or {})}


def store(d, key, text, settings, audio, al, source, extra=None):
    os.makedirs(d, exist_ok=True); p = paths(d, key)
    if audio is not None: write_wav(p['wav'], audio)
    json.dump(al, open(p['alignment'], 'w', encoding='utf-8'), ensure_ascii=False)
    json.dump({'key': key, 'text': text, 'settings': settings, 'source': source, 'chars': len(text), **(extra or {})},
              open(p['meta'], 'w', encoding='utf-8'), ensure_ascii=False, indent=1)


def find_splice_base(d, text, settings):
    """Sucht im Cache eine Aufnahme mit gleichen Einstellungen, die sich in genau einem Satz unterscheidet."""
    if not os.path.isdir(d): return None
    for name in sorted(os.listdir(d)):
        if not name.endswith('.meta.json'): continue
        m = json.load(open(os.path.join(d, name), encoding='utf-8'))
        if m.get('settings') != settings or not cached(d, m['key']): continue
        i = one_sentence_diff(m['text'], text)
        if i is not None: return m, i
    return None


def plan(d, text, settings, splice=False):
    key = cache_key(text, settings)
    if cached(d, key): return {'key': key, 'cached': True, 'chars': len(text), 'would_spend': 0, 'how': 'cache'}
    if splice:
        base = find_splice_base(d, text, settings)
        if base:
            sent = sentences(text)[base[1]][2]
            return {'key': key, 'cached': False, 'chars': len(text), 'would_spend': len(sent), 'how': 'splice', 'sentence': sent, 'base': base[0]['key']}
    return {'key': key, 'cached': False, 'chars': len(text), 'would_spend': len(text), 'how': 'full'}


def ensure(d, text, settings, allow=False, splice=False):
    pl = plan(d, text, settings, splice); key = pl['key']
    if pl['cached']: return info(d, key, text, settings, 'cache', 0)
    if not allow:
        raise Refused(f"Keine Aufnahme im Cache. Eine neue Aufnahme kostet {pl['would_spend']} Zeichen bei ElevenLabs "
                      f"({'nur der geänderte Satz' if pl['how'] == 'splice' else 'der ganze Text'}). "
                      f"Erst wenn der Entwurf stimmt: noch einmal mit --allow-voice-spend aufrufen.")
    raw = os.path.join(d, f"{key}.clip.response.json" if pl['how'] == 'splice' else f'{key}.response.json')
    if os.path.exists(raw): print(f'ElevenLabs: Antwort liegt schon vor ({os.path.basename(raw)}), es wird nichts gesendet.', file=sys.stderr)
    else: print(f"ElevenLabs: {pl['would_spend']} Zeichen werden jetzt verbraucht ({pl['how']}).", file=sys.stderr)
    os.makedirs(d, exist_ok=True); p = paths(d, key)
    if pl['how'] == 'splice':
        base, i = find_splice_base(d, text, settings)
        old_text = base['text']; s_old = sentences(old_text)[i]; s_new = sentences(text)[i]
        bp = paths(d, base['key'])
        old = read_wav(bp['wav']); old_al = json.load(open(bp['alignment'], encoding='utf-8'))
        mp3, clip_al = synthesize(s_new[2], settings, os.path.join(d, f'{key}.clip.response.json'),
                                  previous_text=text[:s_new[0]][-CONTEXT:].strip() or None, next_text=text[s_new[1]:][:CONTEXT].strip() or None)
        clip_mp3 = os.path.join(d, f'{key}.clip.mp3'); open(clip_mp3, 'wb').write(mp3)
        audio, al, how = splice_merge(old, old_al, s_old[0], s_old[1] - 1, decode(clip_mp3), clip_al)
        if ''.join(al['characters']) != text: raise RuntimeError('Satz-Austausch: zusammengesetzter Text stimmt nicht mit dem Skript überein')
        store(d, key, text, settings, audio, al, 'splice', {'base': base['key'], 'sentence': s_new[2], 'spent': len(s_new[2]), **how})
        return info(d, key, text, settings, 'splice', len(s_new[2]), how)
    mp3, al = synthesize(text, settings, os.path.join(d, f'{key}.response.json'))
    open(p['mp3'], 'wb').write(mp3)
    store(d, key, text, settings, decode(p['mp3']), al, 'api', {'spent': len(text)})
    return info(d, key, text, settings, 'api', len(text))


def seed(d, text, settings, wav, alignment):
    """Legt eine vorhandene Aufnahme in den Cache (z. B. die des ersten Videos). Kostet nichts."""
    al = json.load(open(alignment, encoding='utf-8'))
    if ''.join(al['characters']) != text:
        raise SystemExit('seed: die Zeichen der Aufnahme passen nicht zum gesprochenen Text des Skripts - falsche Datei?')
    read_wav(wav)  # prueft nur das Format
    key = cache_key(text, settings); os.makedirs(d, exist_ok=True)
    shutil.copyfile(wav, paths(d, key)['wav'])  # unveraendert kopieren, nicht neu schreiben
    store(d, key, text, settings, None, al, 'seed', {'from': os.path.basename(wav), 'spent': 0})
    return info(d, key, text, settings, 'seed', 0)


def main(argv=None):
    ap = argparse.ArgumentParser(description='Sprecherstimme mit Cache. Sendet nur mit --allow-voice-spend.')
    ap.add_argument('cmd', choices=['plan', 'ensure', 'seed'])
    ap.add_argument('--dir', required=True); ap.add_argument('--text-file', required=True); ap.add_argument('--settings')
    ap.add_argument('--allow-voice-spend', action='store_true'); ap.add_argument('--splice', action='store_true')
    ap.add_argument('--wav'); ap.add_argument('--alignment')
    a = ap.parse_args(argv)
    text = open(a.text_file, encoding='utf-8').read()
    settings = merge_settings(json.load(open(a.settings, encoding='utf-8')) if a.settings else None)
    try:
        if a.cmd == 'plan': out = plan(a.dir, text, settings, a.splice)
        elif a.cmd == 'seed':
            if not (a.wav and a.alignment): raise SystemExit('seed braucht --wav und --alignment')
            out = seed(a.dir, text, settings, a.wav, a.alignment)
        else: out = ensure(a.dir, text, settings, a.allow_voice_spend, a.splice)
    except Refused as e:
        print(json.dumps({'refused': True, 'message': str(e), **plan(a.dir, text, settings, a.splice)}, ensure_ascii=False)); return 3
    print(json.dumps(out, ensure_ascii=False)); return 0


if __name__ == '__main__':
    sys.exit(main())
