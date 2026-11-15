#!/usr/bin/env node
// selftest.mjs - schnelle Selbstpruefung des Studios (unter einer halben Minute,
// kein Netz, keine Kosten). Nach jeder Aenderung an engine/, components/ oder
// tools/ laufen lassen; fuer den Bild-fuer-Bild-Vergleich gibt es regress.mjs.
//
// Festgenagelt wird, was im ersten Video von Hand stimmen musste und jetzt
// aus dem Skript folgt:
//   - der gesprochene Text ergibt sich 1:1 aus den gezeigten Woertern
//   - die Wort-Zeiten aus der Aufnahme sind dieselben wie damals (times.js)
//   - die Toene kommen aus der Seite und sind dieselben 35 wie damals (events.json)
//   - die Pruefungen schlagen bei den typischen Fehlern wirklich an
//   - voice.py sendet nie ohne Freigabe (tools/test_voice.py)
import { readFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import { normalize, estimateTimes, timesFromAlignment, timeline } from '../engine/script.mjs'
import { openStudio, run, STUDIO_ROOT } from '../engine/render.mjs'
import { runChecks } from '../engine/checks.mjs'
import { germanNumber } from '../components/calc-panel.js'

process.env.STUDIO_VOICE_OFFLINE = '1'
const results = []
const check = (name, ok, detail = '') => { results.push(ok); console.log(`${ok ? 'ok    ' : 'FEHLER'} ${name}${detail ? ' - ' + detail : ''}`) }
const throws = fn => { try { fn(); return null } catch (e) { return e.message } }
const fx = f => JSON.parse(readFileSync(path.join(STUDIO_ROOT, 'tools', 'fixtures', f), 'utf8'))
const refDir = path.join(STUDIO_ROOT, 'videos', '2026-11-14-kaffee-aufs-haus')
const script = JSON.parse(readFileSync(path.join(refDir, 'script.json'), 'utf8')), norm = normalize(script)

// ---- Skript und gesprochener Text
const meta = JSON.parse(readFileSync(path.join(refDir, 'voice', '7a2c3c949a5bda46.meta.json'), 'utf8'))
check('Referenz: gesprochener Text = Text der Aufnahme', norm.spoken === meta.text, `${norm.words} Wörter, ${norm.spoken.length} Zeichen`)
check('Marke wird "StampIt" gesprochen, "Stampit" gezeigt', norm.spoken.includes('Mit StampIt liegt') && norm.caps.some(c => c.words.includes('Stampit')))
const tiny = lines => normalize({ meta: { title: 't', slug: 't' }, scenes: [{ component: 'x', captions: [{ lines }] }] })
check('Schreibweise wort{gesprochen}', tiny(['sind 6.500{sechstausendfünfhundert} Euro']).spoken === 'sind sechstausendfünfhundert Euro')
check('Satzzeichen bleiben an der gesprochenen Marke', tiny(['Das ist Stampit.']).spoken === 'Das ist StampIt.')
check('Objekt-Form {show, say}', tiny([[{ show: 'KARTE,', say: 'Karte,' }, 'jetzt']]).spoken === 'Karte, jetzt')
check('gesprochene Form mit Leerzeichen wird abgelehnt', /genau ein Wort/.test(throws(() => tiny([[{ show: '2,50', say: 'zwei Euro fünfzig' }]])) || ''))
check('gesprochene Form mit Leerzeichen in Klammern wird abgelehnt', /geschweifte Klammer/.test(throws(() => tiny(['Kostet 28{acht und zwanzig} Euro'])) || ''))
check('Szene ohne Text wird abgelehnt', /mindestens eine Textzeile/.test(throws(() => normalize({ meta: { title: 't', slug: 't' }, scenes: [{ component: 'x', captions: [] }] })) || ''))

// ---- Wort-Zeiten
const refT = fx('referenz-times.json')
const al = JSON.parse(readFileSync(path.join(refDir, 'voice', '7a2c3c949a5bda46.alignment.json'), 'utf8'))
const vt = timesFromAlignment(norm, al), tl = timeline(norm, vt.times)
check('Wort-Zeiten aus der Aufnahme wie im ersten Video', JSON.stringify(vt.times) === JSON.stringify(refT.times) && vt.voiceEnd === refT.voiceEnd, `Stimme endet bei ${vt.voiceEnd} s`)
check('Länge wie im ersten Video', tl.duration === refT.duration, tl.duration + ' s')
const est = estimateTimes(norm).flat()
check('geschätzte Zeiten steigen und beginnen beim Vorlauf', est[0] === 0.35 && est.every((t, i) => i === 0 || t > est[i - 1]))
const wrong = JSON.parse(JSON.stringify(al)); wrong.characters[4] = 'X'
check('Aufnahme mit anderem Wort wird abgelehnt', /laufen auseinander/.test(throws(() => timesFromAlignment(norm, wrong)) || ''))

// ---- Rechenprobe der Beispielrechnung
check('Zahlen in deutscher Schreibweise', germanNumber('2,50 €') === 2.5 && germanNumber('= 6.500 €') === 6500 && germanNumber('× 52') === 52 && germanNumber('1.250,5') === 1250.5)

// ---- Seite: Toene und Pruefungen
async function page(scr, times) {
  const n = normalize(scr), st = await openStudio({ script: scr, times: times || estimateTimes(n) })
  const rest = await st.page({ rest: true }), rs = await st.state(rest)
  const measured = rs.errors.length ? { caps: [], safe: [], lines: [] } : await rest.evaluate(() => window.STUDIO.measure())
  const main = await st.page(), state = await st.state(main)
  await st.close()
  return { state, res: state.duration ? runChecks({ state, measured, problems: st.problems, voice: null }) : { ok: false, errors: [...state.errors, ...st.problems], checks: [] } }
}
const ref = await page(script, vt.times), cues = ref.state.cuesFile.events, want = fx('referenz-cues.json').events
check('Töne aus der Seite = die 35 Töne des ersten Videos', cues.length === 35 && cues.every((c, i) => c.name === want[i].name && Math.abs(c.t - want[i].t) <= 0.002 && c.vol === want[i].vol && c.pitch === want[i].pitch), `${cues.length} Töne`)
check('Referenzvideo besteht alle Prüfungen', ref.res.ok, ref.res.errors.join(' | '))
check('Referenzvideo: jeder Anker steht im Bericht', ref.state.anchors.length >= 20 && ref.state.anchors.every(a => typeof a.t === 'number'), `${ref.state.anchors.length} Anker`)

const variant = fn => { const s = JSON.parse(JSON.stringify(script)); fn(s); return s }
const failsWith = async (name, fn, checkName) => {
  const r = await page(variant(fn)), hit = r.res.checks.find(c => c.name === checkName && !c.ok) || (checkName === 'seite' && r.res.errors.length)
  check(name, !r.res.ok && !!hit, hit && hit.details ? String(hit.details[0]).slice(0, 110) : String(r.res.errors[0] || '').slice(0, 110))
}
await failsWith('Prüfung schlägt an: zu breite Textzeile', s => { s.scenes[0].captions[0].lines = ['Der sechste Kaffee geht heute aufs Haus.', 'Warum eigentlich?'] }, 'textbreite')
await failsWith('Prüfung schlägt an: vier Zeilen', s => { s.scenes[0].captions[0].lines = ['Der sechste', 'Kaffee geht', 'aufs Haus.', 'Warum eigentlich?'] }, 'textzeilen')
await failsWith('Prüfung schlägt an: fünf Rechenzeilen plus Überlänge ragen in die Sperrzone', s => { const p = s.scenes[5].params = { check: false, rows: [1, 2, 3, 4, 5].map(i => ({ big: '× ' + i, label: 'Zeile', small: 'klein' })) }; p.result = { big: '= 120 €', label: 'mehr im Jahr und noch eine zweite Zeile die umbricht und umbricht' } }, 'sperrzonen')
await failsWith('Prüfung schlägt an: Belohnungszeile zu lang', s => { s.scenes[3].params = { reward: '6 Stempel = 1 Kaffee gratis und ein Stück Kuchen dazu' } }, 'einzeiler')
await failsWith('Prüfung schlägt an: Rechnung geht nicht auf', s => { s.scenes[5].params = { result: { big: '= 7.000 €', label: 'mehr im Jahr' } } }, 'seite')
await failsWith('Prüfung schlägt an: Baustein gibt es nicht (der Server darf dabei nicht abstürzen)', s => { s.scenes[1].component = 'gibt-es-nicht' }, 'seite')
await failsWith('Prüfung schlägt an: unbekannter Parameter (Tippfehler)', s => { s.scenes[0].params = { shopname: 'X' } }, 'seite')
await failsWith('Prüfung schlägt an: Anker im Skript zeigt auf ein Wort, das es nicht gibt', s => { s.scenes[0].anchors = { free: { cap: 0, word: 40 } } }, 'seite')
await failsWith('Prüfung schlägt an: Video zu kurz', s => { s.scenes = [s.scenes[0], s.scenes[6]] }, 'laenge')
{
  // Zu schnell gelesen: Wort-Zeiten kuenstlich auf 0,1 s je Wort stauchen
  const fast = estimateTimes(norm).map(row => row.map(t => +(t * 0.28).toFixed(3)))
  const r = await page(script, fast), hit = r.res.checks.find(c => c.name === 'lesezeit' && !c.ok)
  check('Prüfung schlägt an: Text steht zu kurz', !!hit, hit ? hit.details[0].slice(0, 110) : '')
}

// ---- Stimme (Python)
const py = await run('python3', [path.join(STUDIO_ROOT, 'tools', 'test_voice.py')], { env: { ...process.env, STUDIO_VOICE_OFFLINE: '1' } })
process.stdout.write(py.out.split('\n').filter(l => l.startsWith('ok') || l.startsWith('FEHLER')).map(l => '  [voice] ' + l).join('\n') + '\n')
check('tools/test_voice.py', py.code === 0, py.out.trim().split('\n').pop())

// ---- make.mjs verweigert die Stimme ohne Freigabe (eigener Ordner, damit nichts im Cache liegt)
{
  const os = await import('node:os'), fs = await import('node:fs')
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'stampit-selftest-'))
  fs.writeFileSync(path.join(tmp, 'script.json'), JSON.stringify(script))
  const r = await run('node', [path.join(STUDIO_ROOT, 'make.mjs'), tmp, '--check'], { env: { ...process.env, STUDIO_VOICE_OFFLINE: '1' } })
  check('make.mjs ohne --allow-voice-spend: Ende-Code 3 und nennt die Zeichenzahl', r.code === 3 && /698 Zeichen/.test(r.err) && !existsSync(path.join(tmp, 'voice')), (r.err.split('\n')[0] || '').slice(0, 120))
  fs.rmSync(tmp, { recursive: true })
}

const bad = results.filter(x => !x).length
console.log(`${results.length - bad} von ${results.length} Prüfungen bestanden`)
process.exit(bad ? 1 : 0)
