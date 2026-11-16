#!/usr/bin/env python3
# voice.py - Sprecherstimme ueber ElevenLabs, mit Cache und Satz-Austausch.
#
#   voice.py plan   --dir <video>/voice --text-file t.txt [--settings s.json] [--splice]
#   voice.py ensure --dir <video>/voice --text-file t.txt [--settings s.json] [--work <ordner>] [--allow-voice-spend] [--splice]
#   voice.py seed   --dir <video>/voice --text-file t.txt --audio a.mp3 --alignment a.json [--settings s.json]
#   voice.py seed-splice --dir <video>/voice --text-file t.txt --audio vorher.mp3 --alignment vorher.json
#                        --clip-audio satz.mp3 --clip-alignment satz.json [--settings s.json]
#
# JEDER Aufruf der Schnittstelle kostet Geld (1 Zeichen = 1 Credit). Deshalb:
#   - Ohne --allow-voice-spend wird nie gesendet. "ensure" bricht dann mit
#     Code 3 ab und sagt, wie viele Zeichen es kosten wuerde. Die Sperre sitzt
#     in synthesize(), direkt vor der einzigen Stelle, die sendet.
#   - Jede Aufnahme liegt im Cache des Videos, Schluessel = Hash aus Text und
#     Einstellungen. Derselbe Text kostet nie zweimal.
#   - --splice nimmt nur EINEN geaenderten Satz neu auf und setzt ihn in die
#     vorhandene Aufnahme ein (so entstand im ersten Video "Und das lohnt sich!").
#     Findet sich keine passende Aufnahme, wird NICHT stillschweigend der ganze
#     Text aufgenommen, sondern abgelehnt.
#   - Mehr als MAX_CHARS Zeichen in einem Aufruf werden nie gesendet.
#   - Blieb ein frueherer Aufruf ohne Antwort (Zeitueberschreitung), wird nicht
#     von selbst noch einmal gesendet: er kann trotzdem berechnet worden sein.
#   - STUDIO_VOICE_OFFLINE=1 sperrt die Schnittstelle ganz (Tests, Proben).
#
# Was im Cache liegt (und mit dem Video ins Repo gehoert, rund 0,8 MB):
#   <schluessel>.mp3              genau die Datei, die der Anbieter geliefert hat
#   <schluessel>.alignment.json   Zeichen-Zeiten
#   <schluessel>.meta.json        Text, Einstellungen, Herkunft, Kosten
#   beim Satz-Austausch statt der .mp3: <schluessel>.clip.mp3 und
#   .clip.alignment.json (nur der neue Satz) plus der Verweis auf die Aufnahme
#   davor. Der fertige Ton wird daraus jedes Mal gleich neu zusammengesetzt.
#   Nur wenn tools/clip-in.py einen ausserhalb des Studios aufgenommenen Satz
#   eingesetzt hat: dieselbe Ablage mit "source": "extern", und daneben
#   <schluessel>.use.json. Der Text aendert sich dabei nicht, also auch nicht
#   sein Schluessel; der Verweis sagt, welche Fassung der Bau nehmen soll.
# Bewusst KEINE .wav im Cache: .wav ist von Git ausgenommen, ein frischer
# Checkout haette die Aufnahme nicht mehr und muesste sie neu bezahlen. Eine
# .wav entsteht nur noch als Zwischenergebnis im Arbeitsordner (out/work).
#
# Der Schluessel fuer ElevenLabs steht NICHT hier: der Proxy der Umgebung
# haengt ihn als Kopfzeile xi-api-key an. Deshalb laeuft der Aufruf ueber curl.
import argparse, base64, hashlib, json, os, re, shutil, subprocess, sys, time, wave
import numpy as np

SR = 44100
API = 'https://api.elevenlabs.io/v1/text-to-speech/{voice_id}/with-timestamps?output_format={output_format}'
# Die vom Nutzer gewaehlte Stimme: "Liam", lebhaft. Tempo 1,05: von drei
# Aufnahmen fuer das veroeffentlichte Video hat er die mit 1,05 genommen.
# seed: None = der Anbieter wuerfelt. Eine Zahl macht die Aufnahme wiederholbar
# (im veroeffentlichten Video 3303); sie gehoert dann zum Schluessel.
DEFAULTS = {
    'voice_id': 'TX3LPaxmHKxFdv7VOQHJ', 'model_id': 'eleven_multilingual_v2', 'language_code': 'de',
    'output_format': 'mp3_44100_128', 'seed': None,
    'voice_settings': {'stability': 0.35, 'similarity_boost': 0.75, 'style': 0.6, 'speed': 1.05},
}
VOICE_SETTINGS = ('stability', 'similarity_boost', 'style', 'speed', 'use_speaker_boost')
MAX_CHARS = 1500  # ein Video hat 500 bis 700 Zeichen; mehr in EINEM Aufruf ist ein Fehler im Skript, kein Auftrag
PAD = 0.04     # ein Satz wird 40 ms vor seinem ersten Laut geschnitten, mitten in der Atempause
FADE = 0.012   # 12 ms Blende an jeder Schnittkante, sonst knackt es
CONTEXT = 300  # so viele Zeichen Umgebung bekommt die Stimme beim Satz-Austausch mit
# Beide werden aus "Aufnahme davor + ein Satz" zusammengesetzt. "splice": der Satz kam ueber
# --splice vom Anbieter. "extern": der Satz wurde ausserhalb des Studios aufgenommen und mit
# tools/clip-in.py eingesetzt (anderes Modell, andere Betonung), der Text blieb derselbe.
SPLICED = ('splice', 'extern')
# curl-Ende-Codes, bei denen sicher nichts beim Anbieter ankam (Aufruf falsch,
# Name nicht aufloesbar, keine Verbindung, TLS scheitert). Alles andere ist unklar.
CURL_NOT_SENT = (2, 3, 5, 6, 7, 35, 60, 77)


class Refused(Exception):
    """Es muesste Geld ausgegeben werden, das nicht freigegeben wurde."""


class Unclear(RuntimeError):
    """Gesendet, aber keine Antwort: moeglicherweise trotzdem berechnet."""


# ---------------------------------------------------------------- Einstellungen und Cache
def canon(x):
    """
    Zahlen einheitlich schreiben: 1.0 wird 1. Node schreibt "speed": 1, Python
    1.0 - ohne diesen Schritt ergab derselbe Text mit denselben Einstellungen
    zwei Schluessel, und die Aufnahme waere zweimal bezahlt worden.
    """
    if isinstance(x, dict): return {k: canon(v) for k, v in x.items()}
    if isinstance(x, list): return [canon(v) for v in x]
    if isinstance(x, float) and x == int(x): return int(x)
    return x


def merge_settings(over=None):
    s = json.loads(json.dumps(DEFAULTS)); over = over or {}
    def setting(k, v):
        if k not in VOICE_SETTINGS: raise SystemExit(f'voice: unbekannte Einstellung "{k}" in voice_settings')
        s['voice_settings'][k] = v
    for k, v in over.items():
        if k.startswith('_'): continue  # Hinweise im Skript
        if k == 'voice_settings':
            for kk, vv in v.items(): setting(kk, vv)
        elif k in s: s[k] = v
        elif k in VOICE_SETTINGS: setting(k, v)   # Kurzform: "stability": 0.4
        else: raise SystemExit(f'voice: unbekannte Einstellung "{k}"')
    seed = s['seed']
    if seed is not None and (isinstance(seed, bool) or not isinstance(seed, (int, float)) or seed != int(seed) or not 0 <= seed <= 4294967295):
        raise SystemExit(f'voice: "seed" muss eine ganze Zahl zwischen 0 und 4294967295 sein (bekam {seed!r})')
    speed = s['voice_settings']['speed']
    if isinstance(speed, bool) or not isinstance(speed, (int, float)) or not 0.7 <= speed <= 1.2:
        raise SystemExit(f'voice: "speed" muss zwischen 0.7 und 1.2 liegen (bekam {speed!r})')
    return canon(s)


def cache_key(text, settings):
    s = canon(settings)
    # ohne seed bleibt der Schluessel so, wie er vor der Einfuehrung von seed war
    if s.get('seed') is None: s = {k: v for k, v in s.items() if k != 'seed'}
    blob = json.dumps({'text': text, **s}, sort_keys=True, ensure_ascii=False)
    return hashlib.sha256(blob.encode('utf-8')).hexdigest()[:16]


def paths(d, key):
    return {k: os.path.join(d, f'{key}.{ext}') for k, ext in [
        ('alignment', 'alignment.json'), ('meta', 'meta.json'), ('mp3', 'mp3'),
        ('clip', 'clip.mp3'), ('clip_alignment', 'clip.alignment.json'),
        ('response', 'response.json'), ('clip_response', 'clip.response.json'), ('use', 'use.json')]}


def load_json(path):
    with open(path, encoding='utf-8') as f: return json.load(f)


def load_meta(d, key):
    try: return load_json(paths(d, key)['meta'])
    except (OSError, ValueError): return None


def cached(d, key, seen=()):
    """Liegt alles da, um den Ton dieser Aufnahme ohne Netz herzustellen?"""
    m = load_meta(d, key); p = paths(d, key)
    if not m or not os.path.exists(p['alignment']): return False
    if m.get('source') in SPLICED:
        return (key not in seen and os.path.exists(p['clip']) and os.path.exists(p['clip_alignment'])
                and cached(d, m.get('base', ''), seen + (key,)))
    return os.path.exists(os.path.join(d, m.get('audio') or f'{key}.mp3'))


# ---------------------------------------------------------------- Ton lesen und schreiben
def decode(path):
    """mp3/flac/wav -> float32 mono 44,1 kHz, ueber ffmpeg."""
    r = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-f', 'f32le', '-ar', str(SR), '-ac', '1', 'pipe:1'], capture_output=True)
    if r.returncode != 0: raise RuntimeError('ffmpeg: ' + r.stderr.decode('utf-8', 'replace')[:300])
    return np.frombuffer(r.stdout, dtype='<f4').copy()


def to_pcm(x):
    # bewusst wie im ersten Video: mal 32767 und abschneiden (nicht runden)
    return (x.astype(np.float32) * np.float32(32767)).astype('<i2')


def write_wav(path, x):
    with wave.open(path, 'wb') as f:
        f.setnchannels(1); f.setsampwidth(2); f.setframerate(SR); f.writeframes(to_pcm(x).tobytes())


def sha256_file(path):
    h = hashlib.sha256()
    with open(path, 'rb') as f:
        for chunk in iter(lambda: f.read(1 << 20), b''): h.update(chunk)
    return h.hexdigest()


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
def splice_merge(old, old_al, i0, i1, clip, clip_al, gain=None):
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

    gain: fester Faktor statt des Angleichs an den alten Satz. Den setzt nur tools/clip-in.py:
    ein gedehnter Satz mit langen Vokalen hat ein anderes Verhaeltnis von Laut zu Pause als der
    alte, der Vergleich ueber den ganzen Abschnitt laege daneben. Dort wird an den gesprochenen
    Stellen der Saetze davor und danach gemessen.
    """
    old = np.asarray(old, dtype=np.float32); clip = np.asarray(clip, dtype=np.float32)
    ch, st, en = old_al['characters'], old_al['character_start_times_seconds'], old_al['character_end_times_seconds']
    a_t = max(0.0, st[i0] - PAD); b_t = en[i1]
    nxt = next((j for j in range(i1 + 1, len(ch)) if not ch[j].isspace()), None)
    c_t = max(b_t, st[nxt] - PAD) if nxt is not None else None
    a, b = int(a_t * SR), int(b_t * SR)
    if gain is None:
        old_rms = np.sqrt(np.mean(old[a:b] ** 2)); clip_rms = np.sqrt(np.mean(clip ** 2))
        gain = old_rms / clip_rms if clip_rms > 0 and old_rms > 0 else np.float32(1)
    else: gain = np.float32(gain)
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


def clip_array(d, key, m):
    """
    Der eingesetzte Satz als Zahlenreihe. "clip_cut" in der meta (nur bei "extern") nennt den
    Ausschnitt der Datei, der gilt: ein Clip von ausserhalb hat Stille am Anfang und am Ende,
    liegt aber unveraendert im Cache, damit sein sha256 der der gelieferten Datei bleibt.
    """
    x = decode(paths(d, key)['clip']); cut = m.get('clip_cut'); pad = int(m.get('clip_pad') or 0)
    if cut: x = x[cut[0]:cut[1]]
    if pad > 0:
        # "clip_pad": so viele stille Abtastwerte folgen dem Ausschnitt, damit die Pause nach dem Satz so lang
        # bleibt, wie sie in der Aufnahme war. Die Blende von splice_merge laege dann in dieser Stille, also
        # wird das Ende des Ausschnitts hier ausgeblendet.
        x = x.copy(); n = int(FADE * SR)
        if len(x) >= n: x[-n:] *= np.linspace(1, 0, n, dtype=np.float32)
        x = np.concatenate([x, np.zeros(pad, np.float32)])
    return x


def audio_array(d, key):
    """Der Ton einer Aufnahme als Zahlenreihe. Ein Satz-Austausch wird hier aus seinen Teilen zusammengesetzt."""
    m = load_meta(d, key); p = paths(d, key)
    if m.get('source') in SPLICED:
        i0, i1 = m['cut']
        return splice_merge(audio_array(d, m['base']), load_json(paths(d, m['base'])['alignment']), i0, i1,
                            clip_array(d, key, m), load_json(p['clip_alignment']), m.get('clip_gain'))[0]
    return decode(os.path.join(d, m.get('audio') or f'{key}.mp3'))


def materialize(d, key, work):
    """
    Gibt die Tondatei zurueck, die ffmpeg in die Mischung nimmt.
    Eine gelieferte Aufnahme geht unveraendert hinein (so wurde auch das
    veroeffentlichte Video gemischt: direkt aus der .mp3). Nur der Satz-Austausch
    braucht eine zusammengesetzte .wav; die liegt im Arbeitsordner, nie im Cache.
    """
    m = load_meta(d, key)
    if m.get('source') not in SPLICED: return os.path.join(d, m.get('audio') or f'{key}.mp3')
    os.makedirs(work, exist_ok=True); out = os.path.join(work, f'voice-{key}.wav')
    write_wav(out, audio_array(d, key))
    return out


# ---------------------------------------------------------------- Schnittstelle
def http_post(url, body):
    """Einzige Stelle, die ElevenLabs erreicht. Tests ersetzen diese Funktion."""
    if os.environ.get('STUDIO_VOICE_OFFLINE') == '1':
        raise Refused('STUDIO_VOICE_OFFLINE=1: die Schnittstelle ist gesperrt')
    r = subprocess.run(['curl', '-sS', '-m', '180', '-X', 'POST', url, '-H', 'Content-Type: application/json',
                        '--data-binary', '@-', '-w', '\n%{http_code}'], input=json.dumps(body), capture_output=True, text=True)
    if r.returncode in CURL_NOT_SENT: raise RuntimeError(f'curl ({r.returncode}): ' + r.stderr[:300])
    if r.returncode != 0: raise Unclear(f'curl ({r.returncode}): ' + r.stderr[:300])
    out, code = r.stdout.rsplit('\n', 1)
    return int(code), out


def synthesize(text, settings, raw_path, allow=False, previous_text=None, next_text=None):
    """
    Holt eine Aufnahme. Die Antwort wird als Erstes unveraendert nach raw_path
    geschrieben und erst dann geprueft: scheitert danach irgendetwas, ist das
    bezahlte Ergebnis nicht verloren, und der naechste Lauf liest die Datei,
    statt noch einmal zu senden.
    """
    if os.path.exists(raw_path):
        print(f'ElevenLabs: die Antwort liegt schon vor ({os.path.basename(raw_path)}), es wird nichts gesendet.', file=sys.stderr)
        with open(raw_path, encoding='utf-8') as f: out = f.read()
    else:
        # Die Sperre steht bewusst HIER und nicht nur beim Aufrufer: kein Weg fuehrt ohne Freigabe zu http_post.
        if not allow: raise Refused(f'Nicht freigegeben: {len(text)} Zeichen würden bei ElevenLabs verbraucht (--allow-voice-spend fehlt).')
        if len(text) > MAX_CHARS: raise Refused(f'{len(text)} Zeichen in einem Aufruf sind mehr als die Obergrenze von {MAX_CHARS}. Es wurde nichts gesendet.')
        pending = raw_path[:-len('response.json')] + 'pending.json'
        if os.path.exists(pending):
            raise Refused(f'Unklarer Stand: ein früherer Aufruf wurde gesendet und blieb ohne Antwort ({os.path.basename(pending)}). '
                          'Er kann trotzdem berechnet worden sein. Nicht noch einmal senden, bevor der Nutzer das geklärt hat '
                          '(Verlauf bei ElevenLabs). Erst danach diese Datei löschen.')
        body = {'text': text, 'model_id': settings['model_id'], 'language_code': settings['language_code'], 'voice_settings': settings['voice_settings']}
        if settings.get('seed') is not None: body['seed'] = int(settings['seed'])
        if previous_text: body['previous_text'] = previous_text
        if next_text: body['next_text'] = next_text
        url = API.format(voice_id=settings['voice_id'], output_format=settings['output_format'])
        os.makedirs(os.path.dirname(raw_path), exist_ok=True)
        with open(pending, 'w', encoding='utf-8') as f:
            json.dump({'started': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()), 'chars': len(text)}, f)
        print(f'ElevenLabs: {len(text)} Zeichen werden jetzt gesendet.', file=sys.stderr)
        try:
            code, out = http_post(url, body)
        except Unclear as e:
            # pending bleibt liegen: der naechste Lauf sendet nicht von selbst noch einmal
            raise Unclear(f'{e} - unklar, ob ElevenLabs den Aufruf berechnet hat. {os.path.basename(pending)} bleibt als Sperre liegen.')
        except (Refused, RuntimeError):
            os.remove(pending); raise   # sicher nichts gesendet (Sperre, keine Verbindung)
        if code != 200:
            os.remove(pending)          # abgelehnte Aufrufe werden nicht berechnet
            raise RuntimeError(f'ElevenLabs antwortet {code}: {out[:400]}')
        with open(raw_path, 'w', encoding='utf-8') as f: f.write(out)
        os.remove(pending)
    d = json.loads(out)
    al = d['alignment']
    if ''.join(al['characters']) != text:
        raise RuntimeError(f'ElevenLabs hat einen anderen Text zurückgegeben als gesendet; die Zeiten wären unbrauchbar. Die Antwort liegt in {raw_path}')
    return base64.b64decode(d['audio_base64']), al


# ---------------------------------------------------------------- Befehle
def extern_spans(d, key, al):
    """
    Welche Abschnitte dieser Fassung von ausserhalb des Studios stammen: [{from, to, sentence, file}],
    Zeiten in Sekunden der zusammengesetzten Aufnahme. Leer bei jeder Aufnahme ohne fremde Saetze.
    make.mjs gibt sie an tighten.py weiter: eine Pause IN so einem Satz ("Ist das ... koscher?")
    gehoert zu dem Vortrag, den der Nutzer ausgesucht hat, und wird nicht gekuerzt.
    """
    out = []; m = load_meta(d, key); st, en = al['character_start_times_seconds'], al['character_end_times_seconds']
    while m and m.get('source') == 'extern':
        i0, i1 = m['cut']; out.append({'from': st[i0], 'to': en[i1], 'sentence': m.get('sentence'), 'file': m.get('from')})
        m = load_meta(d, m.get('base', ''))
    return sorted(out, key=lambda x: x['from'])


def info(d, key, text, source, spent, work=None, extra=None):
    p = paths(d, key); al = load_json(p['alignment'])
    out = {'key': key, 'alignment': p['alignment'], 'source': source, 'chars': len(text), 'spent': spent,
           'seconds': round(al['character_end_times_seconds'][-1], 3), **(extra or {})}
    ext = extern_spans(d, key, al)
    if ext: out['extern'] = ext
    if work: out['audio'] = materialize(d, key, work)
    return out


def store(d, key, text, settings, al, source, extra=None):
    os.makedirs(d, exist_ok=True); p = paths(d, key)
    with open(p['alignment'], 'w', encoding='utf-8') as f: json.dump(al, f, ensure_ascii=False)
    # meta zuletzt: erst mit ihr gilt die Aufnahme als "im Cache"
    with open(p['meta'], 'w', encoding='utf-8') as f:
        json.dump({'key': key, 'text': text, 'settings': canon(settings), 'source': source, 'chars': len(text), **(extra or {})}, f, ensure_ascii=False, indent=1)


def store_splice(d, key, text, settings, base_key, i, clip_al, extra, source='splice'):
    """
    Legt den Satz-Austausch als Bauanleitung ab: Aufnahme davor + neuer Satz. Prueft, dass das Ergebnis zum Text passt.
    source "extern" (tools/clip-in.py): extra traegt dann "clip_cut" (Ausschnitt der Datei), "clip_pad" (Stille danach) und "clip_gain" (fester Faktor).
    """
    base = load_meta(d, base_key); p = paths(d, key)
    s_old = sentences(base['text'])[i]; s_new = sentences(text)[i]
    if ''.join(clip_al['characters']) != s_new[2]:
        raise RuntimeError(f'Satz-Austausch: die Zeichen des neuen Satzes passen nicht zu "{s_new[2]}"')
    cut = [s_old[0], s_old[1] - 1]
    _, al, how = splice_merge(audio_array(d, base_key), load_json(paths(d, base_key)['alignment']), cut[0], cut[1], clip_array(d, key, extra), clip_al, extra.get('clip_gain'))
    if ''.join(al['characters']) != text: raise RuntimeError('Satz-Austausch: zusammengesetzter Text stimmt nicht mit dem Skript überein')
    with open(p['clip_alignment'], 'w', encoding='utf-8') as f: json.dump(clip_al, f, ensure_ascii=False)
    store(d, key, text, settings, al, source, {'base': base_key, 'cut': cut, 'sentence': s_new[2], 'clip': os.path.basename(p['clip']),
                                                 'clip_sha256': sha256_file(p['clip']), **how, **extra})
    return how


def find_splice_base(d, text, settings):
    """Sucht im Cache eine Aufnahme mit gleichen Einstellungen, die sich in genau einem Satz unterscheidet."""
    if not os.path.isdir(d): return None
    want = canon(settings); found = []
    for name in sorted(os.listdir(d)):
        if not name.endswith('.meta.json'): continue
        try: m = load_json(os.path.join(d, name))
        except ValueError: continue
        if canon(m.get('settings')) != want or not cached(d, m['key']): continue
        i = one_sentence_diff(m['text'], text)
        if i is not None: found.append((m, i))
    if len(found) < 2: return found[0] if found else None
    # Mehrere passen nur, wenn tools/clip-in.py Fassungen desselben Textes daneben gelegt hat. Dann gilt die,
    # auf die ein Verweis zeigt (sie hat der Nutzer zuletzt gehoert); eine Fassung ohne Verweis zuletzt.
    used = set()
    for name in os.listdir(d):
        if name.endswith('.use.json'):
            try: used.add(load_json(os.path.join(d, name)).get('use'))
            except ValueError: pass
    return min(found, key=lambda f: 0 if f[0]['key'] in used else 2 if f[0].get('source') == 'extern' else 1)


def active_key(d, text, settings):
    """
    Welche Aufnahme der Bau fuer diesen Text nimmt: (schluessel, schluessel_des_textes oder None).
    Normalerweise der Schluessel aus Text und Einstellungen. Liegt daneben <schluessel>.use.json
    (tools/clip-in.py legt sie an), gilt die dort genannte Fassung: dieselbe Aufnahme mit einzelnen
    Saetzen von ausserhalb. Ohne diese Datei aendert sich nichts.
    Zeigt der Verweis ins Leere, wird abgebrochen und nicht still die Aufnahme genommen: sonst
    kaeme ein Video mit der alten Betonung heraus, und niemand merkte es.
    """
    key = cache_key(text, settings); p = paths(d, key)['use']
    if not os.path.exists(p): return key, None
    try: use = load_json(p).get('use')
    except ValueError: use = None
    m = load_meta(d, use) if use else None
    if not m or m.get('text') != text or canon(m.get('settings')) != canon(settings) or not cached(d, use):
        raise SystemExit(f'voice: {os.path.basename(p)} verweist auf die Fassung "{use}", aber die liegt nicht vollständig im Ordner voice/ oder gehört zu einem anderen Text. '
                         'Es wurde nichts gesendet. Entweder die Fassung neu ablegen (tools/clip-in.py) oder die Datei löschen: dann gilt wieder die Aufnahme ohne fremde Sätze.')
    return use, key


def plan(d, text, settings, splice=False):
    key, own = active_key(d, text, settings); p = paths(d, key)
    if cached(d, key): return {'key': key, 'cached': True, 'chars': len(text), 'would_spend': 0, 'how': 'cache', **({'take_of': own} if own else {})}
    out = {'key': key, 'cached': False, 'chars': len(text)}
    if splice:
        base = find_splice_base(d, text, settings)
        if not base: return {**out, 'would_spend': len(text), 'how': 'full', 'splice_possible': False}
        sent = sentences(text)[base[1]][2]
        # liegt die bezahlte Antwort schon da (Abbruch nach dem Empfang), kostet der naechste Lauf nichts
        return {**out, 'would_spend': 0 if os.path.exists(p['clip_response']) else len(sent), 'how': 'splice', 'sentence': sent, 'base': base[0]['key'], 'splice_possible': True}
    return {**out, 'would_spend': 0 if os.path.exists(p['response']) else len(text), 'how': 'full'}


def ensure(d, text, settings, allow=False, splice=False, work=None):
    pl = plan(d, text, settings, splice); key = pl['key']
    if pl['cached']: return info(d, key, text, 'cache', 0, work)
    if splice and pl['how'] != 'splice':
        raise Refused(f'--splice: im Cache liegt keine Aufnahme mit denselben Einstellungen, die sich in genau einem Satz unterscheidet. '
                      f'Es wurde nichts gesendet. Der ganze Text ({len(text)} Zeichen) wird nur ohne --splice neu aufgenommen.')
    if pl['would_spend'] > 0 and not allow:
        raise Refused(f"Keine Aufnahme im Cache. Eine neue Aufnahme kostet {pl['would_spend']} Zeichen bei ElevenLabs "
                      f"({'nur der geänderte Satz' if pl['how'] == 'splice' else 'der ganze Text'}). "
                      f"Erst wenn der Entwurf stimmt: noch einmal mit --allow-voice-spend aufrufen.")
    os.makedirs(d, exist_ok=True); p = paths(d, key)
    if pl['how'] == 'splice':
        base, i = find_splice_base(d, text, settings)
        s_new = sentences(text)[i]
        mp3, clip_al = synthesize(s_new[2], settings, p['clip_response'], allow,
                                  previous_text=text[:s_new[0]][-CONTEXT:].strip() or None, next_text=text[s_new[1]:][:CONTEXT].strip() or None)
        with open(p['clip'], 'wb') as f: f.write(mp3)
        how = store_splice(d, key, text, settings, base['key'], i, clip_al, {'spent': len(s_new[2])})
        os.remove(p['clip_response'])   # .clip.mp3 und Zeiten liegen jetzt einzeln da; die Antwort waere dasselbe noch einmal
        return info(d, key, text, 'splice', pl['would_spend'], work, how)
    mp3, al = synthesize(text, settings, p['response'], allow)
    with open(p['mp3'], 'wb') as f: f.write(mp3)
    store(d, key, text, settings, al, 'api', {'audio': os.path.basename(p['mp3']), 'audio_sha256': sha256_file(p['mp3']), 'spent': len(text)})
    os.remove(p['response'])
    return info(d, key, text, 'api', pl['would_spend'], work)


def seed(d, text, settings, audio, alignment):
    """Legt eine vorhandene Aufnahme unveraendert in den Cache (z. B. die des veroeffentlichten Videos). Kostet nichts."""
    al = load_json(alignment)
    if ''.join(al['characters']) != text:
        raise SystemExit('seed: die Zeichen der Aufnahme passen nicht zum gesprochenen Text des Skripts - falsche Datei?')
    ext = os.path.splitext(audio)[1].lower().lstrip('.')
    if ext not in ('mp3', 'flac', 'wav'): raise SystemExit('seed: die Aufnahme muss .mp3, .flac oder .wav sein')
    if ext == 'wav':
        print('seed: Achtung, .wav ist von Git ausgenommen. Diese Aufnahme überlebt keinen frischen Checkout. '
              'Besser verlustfrei umwandeln und die .flac ablegen: ffmpeg -i aufnahme.wav aufnahme.flac', file=sys.stderr)
    length = len(decode(audio)) / SR; end = al['character_end_times_seconds'][-1]
    if not end - 0.5 <= length <= end + 5:
        raise SystemExit(f'seed: die Aufnahme ist {length:.2f} s lang, ihre Zeichen-Zeiten enden bei {end:.2f} s - falsche Datei?')
    key = cache_key(text, settings); os.makedirs(d, exist_ok=True); name = f'{key}.{ext}'
    shutil.copyfile(audio, os.path.join(d, name))   # unveraendert kopieren, nicht neu schreiben
    store(d, key, text, settings, al, 'seed', {'audio': name, 'audio_sha256': sha256_file(audio), 'from': os.path.basename(audio), 'spent': 0})
    return info(d, key, text, 'seed', 0)


def seed_splice(d, text, settings, audio, alignment, clip_audio, clip_alignment):
    """
    Legt einen frueher von Hand gemachten Satz-Austausch in den Cache: die Aufnahme
    davor und den neu aufgenommenen Satz. So liegt die Stimme des ersten Videos
    im Repo, ohne dass eine .wav gebraucht wird. Kostet nichts.
    """
    base_al = load_json(alignment); base_text = ''.join(base_al['characters'])
    base = seed(d, base_text, settings, audio, alignment)
    i = one_sentence_diff(base_text, text)
    if i is None: raise SystemExit('seed-splice: die beiden Texte unterscheiden sich nicht in genau einem Satz')
    key = cache_key(text, settings); p = paths(d, key)
    shutil.copyfile(clip_audio, p['clip'])
    how = store_splice(d, key, text, settings, base['key'], i, load_json(clip_alignment), {'from': os.path.basename(clip_audio), 'spent': 0})
    return info(d, key, text, 'splice', 0, None, {'base': base['key'], **how})


def main(argv=None):
    ap = argparse.ArgumentParser(description='Sprecherstimme mit Cache. Sendet nur mit --allow-voice-spend.')
    ap.add_argument('cmd', choices=['plan', 'ensure', 'seed', 'seed-splice'])
    ap.add_argument('--dir', required=True); ap.add_argument('--text-file', required=True); ap.add_argument('--settings')
    ap.add_argument('--allow-voice-spend', action='store_true'); ap.add_argument('--splice', action='store_true')
    ap.add_argument('--work'); ap.add_argument('--audio'); ap.add_argument('--alignment')
    ap.add_argument('--clip-audio'); ap.add_argument('--clip-alignment')
    a = ap.parse_args(argv)
    with open(a.text_file, encoding='utf-8') as f: text = f.read()
    settings = merge_settings(load_json(a.settings) if a.settings else None)
    try:
        if a.cmd == 'plan': out = plan(a.dir, text, settings, a.splice)
        elif a.cmd == 'seed':
            if not (a.audio and a.alignment): raise SystemExit('seed braucht --audio und --alignment')
            out = seed(a.dir, text, settings, a.audio, a.alignment)
        elif a.cmd == 'seed-splice':
            if not (a.audio and a.alignment and a.clip_audio and a.clip_alignment): raise SystemExit('seed-splice braucht --audio, --alignment, --clip-audio und --clip-alignment')
            out = seed_splice(a.dir, text, settings, a.audio, a.alignment, a.clip_audio, a.clip_alignment)
        else:
            # ohne --work liegt die zusammengesetzte .wav dort, wo make.mjs sie auch ablegt: im (von Git ausgenommenen) out-Ordner
            out = ensure(a.dir, text, settings, a.allow_voice_spend, a.splice, a.work or os.path.join(a.dir, '..', 'out', 'work'))
    except Refused as e:
        print(json.dumps({'refused': True, 'message': str(e), **plan(a.dir, text, settings, a.splice)}, ensure_ascii=False)); return 3
    print(json.dumps(out, ensure_ascii=False)); return 0


if __name__ == '__main__':
    sys.exit(main())
