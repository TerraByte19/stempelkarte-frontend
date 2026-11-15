#!/usr/bin/env node
// selftest.mjs - schnelle Selbstpruefung des Studios (rund eine halbe Minute,
// kein Netz, keine Kosten). Nach jeder Aenderung an engine/, components/ oder
// tools/ laufen lassen; fuer den Bild-fuer-Bild-Vergleich gibt es regress.mjs.
//
// Festgenagelt wird, was im ersten Video von Hand stimmen musste und jetzt
// aus dem Skript folgt:
//   - der gesprochene Text ergibt sich 1:1 aus den gezeigten Woertern
//   - die Wort-Zeiten aus der Aufnahme sind dieselben wie damals (times.js)
//   - die Toene kommen aus der Seite und sind dieselben 35 wie damals, fuer
//     Fassung 7 (laute Wischer, im Skript gesetzt) UND fuer die veroeffentlichte
//     Fassung 10 (leise Wischer = Vorgaben des Studios)
//   - die Stimmen beider Videos liegen ohne .wav im Repo und lassen sich ohne
//     Netz wiederherstellen (ein frischer Checkout scheiterte daran)
//   - die Pruefungen schlagen bei den typischen Fehlern wirklich an, auch bei
//     denen, die frueher durchrutschten: langer Ladenname in der Wallet-Karte,
//     Absender ueber "jetzt", Datum an der Ortsnadel, Gedankenstrich,
//     Tippfehler "parms", dreizeilige Schlussfrage
//   - voice.py sendet nie ohne Freigabe (tools/test_voice.py), und make.mjs
//     prueft den Entwurf, BEVOR es um eine Aufnahme geht
import { readFileSync, existsSync, mkdtempSync, writeFileSync, rmSync, readdirSync } from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { normalize, estimateTimes, timesFromAlignment, timeline, STAGE, MIX, SOUND } from '../engine/script.mjs'
import { openStudio, sampleMotion, run, STUDIO_ROOT } from '../engine/render.mjs'
import { runChecks } from '../engine/checks.mjs'
import { mixFilter } from '../engine/mix.mjs'
import { germanNumber } from '../components/calc-panel.js'
import { REFERENCES, ensureReferenceVoice, videoDir } from './reference-voice.mjs'

process.env.STUDIO_VOICE_OFFLINE = '1'
const results = []
const check = (name, ok, detail = '') => { results.push(ok); console.log(`${ok ? 'ok    ' : 'FEHLER'} ${name}${detail ? ' - ' + detail : ''}`) }
const throws = fn => { try { fn(); return null } catch (e) { return e.message } }
const fx = f => JSON.parse(readFileSync(path.join(STUDIO_ROOT, 'tools', 'fixtures', f), 'utf8'))
const load = dir => JSON.parse(readFileSync(path.join(dir, 'script.json'), 'utf8'))
const [REF7, REF10] = REFERENCES
const refDir = videoDir(REF7), finalDir = videoDir(REF10)
const script = load(refDir), norm = normalize(script)
const script10 = load(finalDir), norm10 = normalize(script10)
const tmp = mkdtempSync(path.join(os.tmpdir(), 'stampit-selftest-'))

// ---- Stimmen der Referenzvideos: im Repo, ohne .wav, ohne Netz wiederherstellbar
const v7 = await ensureReferenceVoice(REF7), v10 = await ensureReferenceVoice(REF10)
check('Stimmen beider Referenzvideos liegen im Cache', v7.ok && v10.ok, `${v7.key}${v7.restored ? ' (eben wiederhergestellt)' : ''}, ${v10.key}${v10.restored ? ' (eben wiederhergestellt)' : ''} ${v7.message || ''} ${v10.message || ''}`)
{
  const again = await ensureReferenceVoice(REF7, { into: tmp, force: true })
  const a = path.join(refDir, 'voice'), b = path.join(tmp, REF7.video, 'voice')
  const same = again.ok && readdirSync(a).sort().join() === readdirSync(b).sort().join() && readdirSync(a).every(f => readFileSync(path.join(a, f)).equals(readFileSync(path.join(b, f))))
  check('Stimme des ersten Videos: aus tools/fixtures neu gebaut = die Dateien im Repo, keine .wav dabei', same && !readdirSync(a).some(f => f.endsWith('.wav')), readdirSync(a).length + ' Dateien')
}
const meta = JSON.parse(readFileSync(path.join(refDir, 'voice', v7.key + '.meta.json'), 'utf8'))

// ---- Skript und gesprochener Text
check('Referenz: gesprochener Text = Text der Aufnahme', norm.spoken === meta.text && norm10.spoken === meta.text, `${norm.words} Wörter, ${norm.spoken.length} Zeichen`)
check('Marke wird "StampIt" gesprochen, "Stampit" gezeigt', norm.spoken.includes('Mit StampIt liegt') && norm.caps.some(c => c.words.includes('Stampit')))
const tiny = (lines, extra = {}) => normalize({ meta: { title: 't', slug: 't' }, scenes: [{ component: 'x', captions: [{ lines }], ...extra }] })
check('Schreibweise wort{gesprochen}', tiny(['sind 6.500{sechstausendfünfhundert} Euro']).spoken === 'sind sechstausendfünfhundert Euro')
check('Satzzeichen bleiben an der gesprochenen Marke', tiny(['Das ist Stampit.']).spoken === 'Das ist StampIt.')
check('Objekt-Form {show, say}', tiny([[{ show: 'KARTE,', say: 'Karte,' }, 'jetzt']]).spoken === 'Karte, jetzt')
check('gesprochene Form mit Leerzeichen wird abgelehnt', /genau ein Wort/.test(throws(() => tiny([[{ show: '2,50', say: 'zwei Euro fünfzig' }]])) || ''))
check('gesprochene Form mit Leerzeichen in Klammern wird abgelehnt', /geschweifte Klammer/.test(throws(() => tiny(['Kostet 28{acht und zwanzig} Euro'])) || ''))
check('Szene ohne Text wird abgelehnt', /mindestens eine Textzeile/.test(throws(() => normalize({ meta: { title: 't', slug: 't' }, scenes: [{ component: 'x', captions: [] }] })) || ''))
// Tippfehler in Schluesseln: frueher still ignoriert, die Szene fiel auf "Café Nordwind" zurueck
check('Tippfehler "parms" statt "params" wird abgelehnt', /"parms" gibt es nicht/.test(throws(() => tiny(['Ein Satz.'], { parms: { shop: 'X' } })) || ''), throws(() => tiny(['Ein Satz.'], { parms: {} })))
check('unbekannte Schlüssel oben, in Textzeilen und in "voice" werden abgelehnt, Hinweise mit "_" nicht',
  /"scences" gibt es nicht/.test(throws(() => normalize({ meta: { title: 't', slug: 't' }, scences: [], scenes: [{ component: 'x', captions: [{ lines: ['a'] }] }] })) || '') &&
  /"acent" gibt es nicht/.test(throws(() => normalize({ meta: { title: 't', slug: 't' }, scenes: [{ component: 'x', captions: [{ lines: ['a'], acent: 1 }] }] })) || '') &&
  /"sped" gibt es nicht/.test(throws(() => normalize({ meta: { title: 't', slug: 't' }, voice: { sped: 1 }, scenes: [{ component: 'x', captions: [{ lines: ['a'] }] }] })) || '') &&
  !throws(() => tiny(['Ein Satz.'], { _hinweis: 'frei' })))
check('Vorgaben für neue Videos: Wischer 0,35, Begrenzer 0,89 ohne Anhebung; die Referenzvideos setzen ihre Werte selbst',
  SOUND.sceneWhoosh === 0.35 && MIX.limit === 0.89 && MIX.level === false && tiny(['a']).mix.limit === 0.89 &&
  norm.sound.sceneWhoosh === 0.7 && norm.mix.limit === 0.95 && norm.mix.level === true && norm10.sound.sceneWhoosh === 0.35 && norm10.mix.limit === 0.95 && norm10.mix.level === true)
// Der Filter der beiden Referenzvideos muss Zeichen fuer Zeichen der von damals bleiben
check('Mischung: Referenzvideos wie damals, neue Videos mit rund -1 dBFS (level=disabled, sonst hebt ffmpeg wieder auf 0 an)',
  mixFilter({ voiceIn: 1, sfxIn: 2, lead: 0.35, len: '49.8333', mix: norm.mix }) === '[1:a]adelay=350:all=1,volume=1.5[v];[2:a]volume=0.45[s];[v][s]amix=inputs=2:normalize=0:duration=longest,alimiter=limit=0.95,apad,atrim=0:49.8333,aformat=sample_rates=44100:channel_layouts=mono[a]' &&
  mixFilter({ voiceIn: null, sfxIn: 1, lead: 0.35, len: '40.0000', mix: MIX }) === '[1:a]volume=0.45,alimiter=limit=0.89:level=disabled,apad,atrim=0:40.0000,aformat=sample_rates=44100:channel_layouts=mono[a]')

// ---- Wort-Zeiten
const times = (dir, n, key, fixture) => {
  const al = JSON.parse(readFileSync(path.join(dir, 'voice', key + '.alignment.json'), 'utf8')), ref = fx(fixture)
  const vt = timesFromAlignment(n, al), tl = timeline(n, vt.times)
  return { al, vt, tl, same: JSON.stringify(vt.times) === JSON.stringify(ref.times) && vt.voiceEnd === ref.voiceEnd && tl.duration === ref.duration }
}
const t7 = times(refDir, norm, v7.key, 'referenz-times.json'), t10 = times(finalDir, norm10, v10.key, 'final-times.json')
check('Wort-Zeiten und Länge wie im ersten Video (Fassung 7)', t7.same, `Stimme endet bei ${t7.vt.voiceEnd} s, Länge ${t7.tl.duration} s`)
check('Wort-Zeiten und Länge wie im veröffentlichten Video (Fassung 10)', t10.same, `Stimme endet bei ${t10.vt.voiceEnd} s, Länge ${t10.tl.duration} s`)
const est = estimateTimes(norm).flat()
check('geschätzte Zeiten steigen und beginnen beim Vorlauf', est[0] === 0.35 && est.every((t, i) => i === 0 || t > est[i - 1]))
const wrong = JSON.parse(JSON.stringify(t7.al)); wrong.characters[4] = 'X'
check('Aufnahme mit anderem Wort wird abgelehnt', /laufen auseinander/.test(throws(() => timesFromAlignment(norm, wrong)) || ''))

// ---- Rechenprobe der Beispielrechnung
check('Zahlen in deutscher Schreibweise', germanNumber('2,50 €') === 2.5 && germanNumber('= 6.500 €') === 6500 && germanNumber('× 52') === 52 && germanNumber('1.250,5') === 1250.5)

// ---- Seite: Toene und Pruefungen
async function page(scr, times, { motion = false, probe = null } = {}) {
  const n = normalize(scr), st = await openStudio({ script: scr, times: times || estimateTimes(n) })
  const rest = await st.page({ rest: true }), rs = await st.state(rest)
  const measured = rs.errors.length ? { caps: [], safe: [], lines: [] } : await rest.evaluate(() => window.STUDIO.measure())
  const main = await st.page(), state = await st.state(main)
  const mo = motion && state.duration ? await sampleMotion(main, state.duration, { band: STAGE.column }) : null
  const probed = probe && state.duration ? await main.evaluate(probe) : null
  await st.close()
  return { state, probed, res: state.duration ? runChecks({ state, measured, problems: st.problems, voice: null, motion: mo }) : { ok: false, errors: [...state.errors, ...st.problems], checks: [], warnings: [] } }
}
const sameCues = (cues, want) => cues.length === want.length && cues.every((c, i) => c.name === want[i].name && Math.abs(c.t - want[i].t) <= 0.002 && c.vol === want[i].vol && c.pitch === want[i].pitch)
const whoosh = cues => [...new Set(cues.filter(c => c.name === 'whoosh').map(c => c.vol))].sort().join(' / ')
const ref = await page(script, t7.vt.times, { motion: true }), cues = ref.state.cuesFile.events
check('Fassung 7: Töne aus der Seite = die 35 Töne des ersten Videos (laute Wischer aus dem Skript)', cues.length === 35 && sameCues(cues, fx('referenz-cues.json').events) && whoosh(cues) === '0.4 / 0.45 / 0.7', `${cues.length} Töne, Wischer ${whoosh(cues)}`)
const fin = await page(script10, t10.vt.times), cues10 = fin.state.cuesFile.events
check('Fassung 10: Töne aus der Seite = die 35 Töne des veröffentlichten Videos (leise Wischer sind die Vorgabe)', cues10.length === 35 && sameCues(cues10, fx('final-cues.json').events) && whoosh(cues10) === '0.2 / 0.22 / 0.35', `${cues10.length} Töne, Wischer ${whoosh(cues10)}`)
check('Referenzvideos bestehen alle Prüfungen', ref.res.ok && fin.res.ok, [...ref.res.errors, ...fin.res.errors].join(' | '))
check('Titelbild der Referenzvideos unverändert bei 3,29 s und 3,706 s', Math.abs(ref.state.poster - 3.29) < 0.0005 && Math.abs(fin.state.poster - 3.706) < 0.0005, `${ref.state.poster.toFixed(3)} s, ${fin.state.poster.toFixed(3)} s`)
check('Referenzvideo: jeder Anker steht im Bericht', ref.state.anchors.length >= 20 && ref.state.anchors.every(a => typeof a.t === 'number'), `${ref.state.anchors.length} Anker`)
{
  // TikTok: nur eine Warnung, und zwar die eine, die es im veroeffentlichten Video wirklich gibt
  const col = ref.res.checks.find(c => c.name === 'knopfspalte')
  check('Knopfspalte (TikTok) ist eine Warnung, kein Fehler: das Preisschild der Becherreihe steht kurz am rechten Rand', col && col.level === 'warn' && col.details.length === 1 && /Preisschild/.test(col.details[0]) && ref.res.ok, col ? col.details.join(' | ').slice(0, 150) : 'Prüfung fehlt')
}

const variant = (fn, base = script) => { const s = JSON.parse(JSON.stringify(base)); fn(s); return s }
const failsWith = async (name, fn, checkName) => {
  const r = await page(variant(fn)), hit = r.res.checks.find(c => c.name === checkName && !c.ok) || (checkName === 'seite' && r.res.errors.length)
  check(name, !r.res.ok && !!hit, hit && hit.details ? String(hit.details[0]).slice(0, 130) : String(r.res.errors[0] || '').slice(0, 130))
}
await failsWith('Prüfung schlägt an: zu breite Textzeile', s => { s.scenes[0].captions[0].lines = ['Der sechste Kaffee geht heute aufs Haus.', 'Warum eigentlich?'] }, 'textbreite')
await failsWith('Prüfung schlägt an: vier Zeilen', s => { s.scenes[0].captions[0].lines = ['Der sechste', 'Kaffee geht', 'aufs Haus.', 'Warum eigentlich?'] }, 'textzeilen')
await failsWith('Prüfung schlägt an: fünf Rechenzeilen plus Überlänge ragen in die Sperrzone', s => { const p = s.scenes[5].params = { check: false, rows: [1, 2, 3, 4, 5].map(i => ({ big: '× ' + i, label: 'Zeile', small: 'klein' })) }; p.result = { big: '= 120 €', label: 'mehr im Jahr und noch eine zweite Zeile die umbricht und umbricht' } }, 'sperrzonen')
await failsWith('Prüfung schlägt an: Belohnungszeile zu lang', s => { s.scenes[3].params = { reward: '6 Stempel = 1 Kaffee gratis und ein Stück Kuchen dazu' } }, 'einzeiler')
await failsWith('Prüfung schlägt an: Benachrichtigung mit fünf Zeilen (erlaubt sind zwei)', s => { s.scenes[4].params = { body: 'Zehn von zehn Stempeln sind voll, dein nächstes Brot geht aufs Haus, komm einfach vorbei und hol es dir ab, wir freuen uns' } }, 'einzeiler')
await failsWith('Prüfung schlägt an: langer Ladenname schiebt das Kürzel aus der Wallet-Karte', s => { s.scenes[3].params = { shop: 'Bäckerei & Café Sonnenkorn GmbH', location: 'M-HAIDHAUSEN' } }, 'ueberlauf')
await failsWith('Prüfung schlägt an: Absender der Benachrichtigung läuft in "jetzt"', s => { s.scenes[4].params = { title: 'Bäckerei Sonnenkorn am Markt' } }, 'ueberdeckung')
await failsWith('Prüfung schlägt an: Datum mit Jahr stößt an die Ortsnadel', s => { s.scenes[4].params = { date: 'Donnerstag, 24. September 2026' } }, 'ueberdeckung')
await failsWith('Prüfung schlägt an: dreizeilige Frage im Schlussbild sitzt auf der Zeile darunter', s => { s.scenes[6].captions[0].lines = ['Klingt das', 'für deinen Laden', 'interessant?'] }, 'textabstand')
await failsWith('Prüfung schlägt an: Gedankenstrich in einer Textzeile', s => { s.scenes[0].captions[0].lines = ['Der sechste Kaffee —', 'geht aufs Haus.', 'Warum eigentlich?'] }, 'schreibweise')
await failsWith('Prüfung schlägt an: Halbgeviertstrich in einem Parameter', s => { s.scenes[4].params = { body: '6 von 6 – dein Kaffee wartet' } }, 'schreibweise')
await failsWith('Prüfung schlägt an: Rechnung geht nicht auf', s => { s.scenes[5].params = { result: { big: '= 7.000 €', label: 'mehr im Jahr' } } }, 'seite')
await failsWith('Prüfung schlägt an: Baustein gibt es nicht (der Server darf dabei nicht abstürzen)', s => { s.scenes[1].component = 'gibt-es-nicht' }, 'seite')
await failsWith('Prüfung schlägt an: unbekannter Parameter (Tippfehler)', s => { s.scenes[0].params = { shopname: 'X' } }, 'seite')
await failsWith('Prüfung schlägt an: unbekanntes Symbol (fiel früher still auf die Tasse zurück)', s => { s.scenes[0].params = { icon: 'scissor' } }, 'seite')
await failsWith('Prüfung schlägt an: Anker im Skript zeigt auf ein Wort, das es nicht gibt', s => { s.scenes[0].anchors = { free: { cap: 0, word: 40 } } }, 'seite')
await failsWith('Prüfung schlägt an: Tippfehler in einem Anker ("wrod" statt "word")', s => { s.scenes[0].anchors = { free: { cap: 0, wrod: 5 } } }, 'seite')
await failsWith('Prüfung schlägt an: Video zu kurz', s => { s.scenes = [s.scenes[0], s.scenes[6]] }, 'laenge')
{
  // Zu schnell gelesen: Wort-Zeiten kuenstlich auf 0,1 s je Wort stauchen
  const fast = estimateTimes(norm).map(row => row.map(t => +(t * 0.28).toFixed(3)))
  const r = await page(script, fast), hit = r.res.checks.find(c => c.name === 'lesezeit' && !c.ok)
  check('Prüfung schlägt an: Text steht zu kurz', !!hit, hit ? hit.details[0].slice(0, 110) : '')
}
{
  // Eine Szene vergisst den Ladennamen und zeigt die Vorgabe: Warnung, kein Abbruch
  const r = await page(variant(s => { s.scenes[0].params = { shop: 'Bäckerei Sonnenkorn' }; s.scenes[3].params = { shop: 'Bäckerei Sonnenkorn' } }))
  const w = r.res.warnings.find(x => /Ladenname ist nicht in allen Szenen gleich/.test(x))
  check('Warnung: Ladenname nicht in allen Szenen gleich (eine Szene zeigt noch die Vorgabe)', r.res.ok && !!w && /Café Nordwind/.test(w) && /Vorgabe des Bausteins/.test(w), (w || '').slice(0, 150))
}
{
  // Neues Video ohne eigene Angaben: leise Wischer, Titelbild aus dem ERSTEN Teil der ersten Szene, erste Zeile ab Bild 0
  const s = variant(x => {
    delete x.sound; delete x.mix; delete x.voice
    for (const sc of x.scenes) for (const p of sc.parts || [sc]) delete p.params
    x.scenes = [x.scenes[2], ...x.scenes.slice(3)]              // beginnt mit der Szene aus zwei Teilen
    x.scenes[0].parts[0].captions[0].instant = true
  })
  const r = await page(s, null, { probe: () => { window.seek(0); return [...document.querySelectorAll('#caps .cap')[0].querySelectorAll('.w')].map(w => +getComputedStyle(w).opacity) } })
  const first = r.state.scenes[0].parts[0], vol = whoosh(r.state.cuesFile.events)
  check('Neues Video: Wischer leise (0,35 Szenenwechsel, 0,22 Portemonnaie)', r.res.ok && vol === '0.22 / 0.35', 'Wischer ' + vol)
  const hook = r.state.caps[0]
  check('Titelbild zeigt die erste Textzeile vollständig, im ersten Teil der ersten Szene und vor der Überblendung', r.state.poster > hook.last && r.state.poster < hook.end && r.state.poster < first.e, `Titelbild bei ${r.state.poster.toFixed(2)} s, erste Textzeile steht von ${hook.last} bis ${hook.end} s, erster Teil endet bei ${first.e} s`)
  check('"instant": die erste Textzeile steht schon im ersten Bild vollständig da', r.probed.length === 6 && r.probed.every(o => o === 1), r.probed.join(' '))
}
{
  // "mug": false nimmt die ganze Café-Kulisse weg (im Friseur-Beispiel blieb das Becherregal stehen)
  const r = await page(variant(s => { s.scenes[0].params = { mug: false } }), null, { probe: () => ({ mug: document.querySelectorAll('#s1 .mug').length, shelf: document.querySelectorAll('#s1 .shelf').length }) })
  check('"mug": false entfernt Tasse UND Becherregal', r.probed.mug === 0 && r.probed.shelf === 0)
}
{
  // Vorlage und Beispiel sind das, was eine unbeaufsichtigte Sitzung kopiert. Aendert jemand eine
  // Pruefung oder einen Baustein, duerfen ausgerechnet sie nicht still kaputtgehen.
  const vd = path.join(STUDIO_ROOT, 'videos'), tpl = load(path.join(vd, '_vorlage'))
  const ex = load(path.join(vd, 'beispiel-friseur'))
  const a = await page(tpl, null, { motion: true }), b = await page(ex, null, { motion: true })
  const first = s => (s.scenes[0].parts || [s.scenes[0]])[0].captions[0]
  check('Vorlage besteht alle Prüfungen (einzige Warnung: Preisschild in der Knopfspalte) und setzt "instant" an der ersten Textzeile',
    a.res.ok && a.res.warnings.length === 1 && /knopfspalte/.test(a.res.warnings[0]) && first(tpl).instant === true, a.res.errors.concat(a.res.warnings).join(' | ').slice(0, 160))
  check('Beispiel Friseur besteht alle Prüfungen ohne Warnung und setzt "instant" an der ersten Textzeile', b.res.ok && b.res.warnings.length === 0 && first(ex).instant === true, b.res.errors.concat(b.res.warnings).join(' | ').slice(0, 160))
}

// ---- Stimme (Python)
const py = await run('python3', [path.join(STUDIO_ROOT, 'tools', 'test_voice.py')], { env: { ...process.env, STUDIO_VOICE_OFFLINE: '1' } })
process.stdout.write(py.out.split('\n').filter(l => l.startsWith('ok') || l.startsWith('FEHLER')).map(l => '  [voice] ' + l).join('\n') + '\n')
check('tools/test_voice.py', py.code === 0, py.out.trim().split('\n').pop() + (py.code ? ' ' + py.err.trim().split('\n').pop() : ''))

// ---- make.mjs: erst der Entwurf, dann die Frage nach der Aufnahme (eigene Ordner, damit nichts im Cache liegt)
{
  const make = async (name, scr, ...flags) => {
    const d = path.join(tmp, name); rmSync(d, { recursive: true, force: true }); await import('node:fs').then(fs => fs.mkdirSync(d, { recursive: true }))
    writeFileSync(path.join(d, 'script.json'), JSON.stringify(scr))
    return { d, ...(await run('node', [path.join(STUDIO_ROOT, 'make.mjs'), d, ...flags], { env: { ...process.env, STUDIO_VOICE_OFFLINE: '1' } })) }
  }
  const a = await make('ohne-freigabe', script, '--check')
  check('make.mjs ohne --allow-voice-spend: Ende-Code 3 und nennt die Zeichenzahl', a.code === 3 && /698 Zeichen/.test(a.err) && !existsSync(path.join(a.d, 'voice')), (a.err.split('\n').find(l => /Zeichen/.test(l)) || a.err).slice(0, 120))
  // Fehler im Entwurf + keine Aufnahme: Ende-Code 1, nicht 3. Das zeigt die Reihenfolge - geprueft wird, bevor es um Geld geht.
  const b = await make('fehler-vor-stimme', variant(s => { s.scenes[5].params = { result: { big: '= 7.000 €', label: 'mehr im Jahr' } } }))
  check('make.mjs prüft den Entwurf VOR der Aufnahme: Fehler im Skript endet mit Code 1, es wird nichts gesendet', b.code === 1 && /Rechnung geht nicht auf/.test(b.err) && /nichts gesendet/.test(b.err) && !existsSync(path.join(b.d, 'voice')), (b.err.split('\n')[0] || '').slice(0, 120))
  const c = await make('splice-ohne-grundlage', script, '--splice', '--check')
  check('make.mjs --splice ohne passende Aufnahme: Ende-Code 3, kein stilles Ausweichen auf den ganzen Text', c.code === 3 && /--splice geht hier nicht/.test(c.err), (c.err.split('\n').find(l => /splice/.test(l)) || '').slice(0, 120))
  // Ein gescheiterter voller Bau laesst kein aelteres video.mp4 neben einem Bericht mit "ok": false liegen
  const d = path.join(tmp, 'alt'); await import('node:fs').then(fs => fs.mkdirSync(path.join(d, 'out'), { recursive: true }))
  for (const f of ['video.mp4', 'poster.png', 'sheet.png']) writeFileSync(path.join(d, 'out', f), 'alt')
  writeFileSync(path.join(d, 'script.json'), JSON.stringify(variant(s => { s.scenes[0].captions[0].lines = ['Der sechste Kaffee geht heute aufs Haus.', 'Warum eigentlich?'] })))
  const e = await run('node', [path.join(STUDIO_ROOT, 'make.mjs'), d, '--no-voice'], { env: { ...process.env, STUDIO_VOICE_OFFLINE: '1' } })
  const rep = existsSync(path.join(d, 'out', 'report.json')) ? JSON.parse(readFileSync(path.join(d, 'out', 'report.json'), 'utf8')) : {}
  check('gescheiterter Bau: altes video.mp4 ist weg, report.json sagt "ok": false und nennt den Fingerabdruck des Skripts', e.code === 1 && rep.ok === false && !existsSync(path.join(d, 'out', 'video.mp4')) && !existsSync(path.join(d, 'out', 'poster.png')) && /^[0-9a-f]{64}$/.test((rep.script || {}).sha256 || ''))
}
rmSync(tmp, { recursive: true })

const bad = results.filter(x => !x).length
console.log(`${results.length - bad} von ${results.length} Prüfungen bestanden`)
process.exit(bad ? 1 : 0)
