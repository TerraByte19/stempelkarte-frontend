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
//   - ein Satz von ausserhalb des Studios (tools/clip-in.py) kommt in die Aufnahme,
//     ohne dass sie angefasst oder etwas gesendet wird (tools/test_clip_in.py)
import { readFileSync, existsSync, mkdtempSync, writeFileSync, rmSync, readdirSync, cpSync, mkdirSync } from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { normalize, estimateTimes, timesFromAlignment, timeline, STAGE, MIX, SOUND } from '../engine/script.mjs'
import { openStudio, sampleMotion, run, STUDIO_ROOT } from '../engine/render.mjs'
import { runChecks } from '../engine/checks.mjs'
import { mixFilter, loudMix, silences } from '../engine/mix.mjs'
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

// ---- Seit dem zweiten Video (16.11.2026): Modus "wort", harter Schnitt, Kamera, Luecken kuerzen, laute Mischung.
// Alles davon muss im Skript eingeschaltet werden. Festgenagelt wird beides: dass es tut, was es
// soll, UND dass ein Skript ohne diese Angaben genau so gelesen wird wie vorher.
{
  const wort = (lines, extra = {}, top = {}) => normalize({ meta: { title: 't', slug: 't' }, captionStyle: { mode: 'wort' }, ...top, scenes: [{ component: 'x', captions: [{ lines, ...extra }] }] })
  const w = wort(['Dein *Handy meldet sich, genau wenn du es *nicht *erwartest.'])
  const c = w.caps[0], groups = c.groups.map(g => g.map(k => (c.key[k] ? '*' : '') + c.words[k]).join(' '))
  check('Modus "wort": * markiert Schlüsselwörter und wird weder gezeigt noch gesprochen; kurze Wörter teilen sich eine Tafel, nie über ein Komma hinweg',
    w.spoken === 'Dein Handy meldet sich, genau wenn du es nicht erwartest.' && groups.join(' | ') === 'Dein | *Handy | meldet | sich, | genau wenn | du es | *nicht *erwartest.', groups.join(' | '))
  const e = wort(['Einmal | gescannt, | *ohne *App, | in Apple']), ec = e.caps[0]
  check('Modus "wort": mit | gelten nur die Grenzen aus dem Skript, und | ist kein Wort', e.words === 6 && ec.groups.map(g => g.length).join() === '1,1,2,2' && e.spoken === 'Einmal gescannt, ohne App, in Apple')
  check('Ohne "captionStyle" bleiben * und | Zeichen wie jedes andere (ein altes Skript liest sich wie vorher)', tiny(['a *b | c']).caps[0].words.join(' ') === 'a *b | c' && tiny(['a']).caps[0].mode === 'zeile' && tiny(['a']).mix.lufs === null && tiny(['a']).timing.maxGap === null)
  // Eine Tafel, die nur 0,1 s stuende, haengt sich an die naechste
  const tl = timeline(w, [[1, 1.3, 1.4, 1.9, 2.4, 2.7, 3.0, 3.3, 3.6, 4.0]])
  check('Modus "wort": eine Tafel unter 0,16 s wird mit der folgenden zusammengelegt', tl.caps[0].chunks[1].words.length === 2 && tl.caps[0].chunks[1].merged === true, tl.caps[0].chunks.map(ch => ch.words.length).join(','))
  check('Modus "wort": "accent" und "keep" werden abgelehnt (dafür gibt es * und "mode": "zeile")',
    /"accent" gibt es im Modus "wort" nicht/.test(throws(() => wort(['a b'], { accent: 1 })) || '') && /"keep" gibt es im Modus "wort" nicht/.test(throws(() => wort(['a b'], { keep: true })) || '') && !throws(() => wort(['a b'], { keep: true, mode: 'zeile' })))
  const two = (p2, top = {}) => normalize({ meta: { title: 't', slug: 't' }, ...top, scenes: [{ parts: [{ component: 'x', captions: [{ lines: ['a'] }] }, { component: 'y', captions: [{ lines: ['b'] }], ...p2 }] }] })
  check('"enter" am ersten Teil, unbekannter Kamera-Schlüssel, "gapBefore" ohne "maxGap" und "mix.lufs" außerhalb des Bereichs werden abgelehnt',
    /"enter" gilt nur für Teile nach dem ersten/.test(throws(() => normalize({ meta: { title: 't', slug: 't' }, scenes: [{ component: 'x', enter: 'cut', captions: [{ lines: ['a'] }] }] })) || '') &&
    /"zom" gibt es nicht/.test(throws(() => two({ camera: [{ zom: 2 }] })) || '') &&
    /"gapBefore" gilt nur zusammen mit "timing.maxGap"/.test(throws(() => two({ captions: [{ lines: ['b'], gapBefore: 0.5 }] })) || '') &&
    /"mix.lufs"/.test(throws(() => two({}, { mix: { lufs: -3 } })) || '') && !throws(() => two({ enter: 'cut', camera: [{ zoom: 1.3, focus: [540, 900] }] })))
  // Ein Teil mit "cut" beginnt 0,1 s vor seinem Wort statt 0,3 s
  const tc = timeline(two({ enter: 'cut' }), [[1], [3]]), tf = timeline(two({}), [[1], [3]])
  check('Harter Schnitt sitzt 0,1 s vor dem ersten Wort des Teils, die Überblendung beginnt wie bisher 0,3 s davor', Math.abs(tc.scenes[0].parts[1].s - 2.9) < 1e-9 && Math.abs(tf.scenes[0].parts[1].s - 2.7) < 1e-9)
}
{
  // Das zweite Video ist das Muster fuer alles Neue: es muss mit geschaetzten Zeiten ohne Fehler und ohne Warnung durchlaufen
  const dir2 = path.join(STUDIO_ROOT, 'videos', '2026-11-16-ist-das-koscher')
  if (existsSync(path.join(dir2, 'script.json'))) {
    const s2 = load(dir2)
    const r = await page(s2, null, { motion: true, probe: () => { window.seek(0); const c = document.querySelector('#caps .capw .chunk'); return { opacity: +getComputedStyle(c).opacity, rows: c.children.length, keys: c.querySelectorAll('.w.key').length } } })
    check('Zweites Video (Modus "wort", Schnitte, Kamera): besteht alle Prüfungen ohne Warnung', r.res.ok && r.res.warnings.length === 0, r.res.errors.concat(r.res.warnings).join(' | ').slice(0, 200))
    check('Zweites Video: die Frage steht im allerersten Bild vollständig da (zwei Reihen, ein Schlüsselwort)', r.probed.opacity === 1 && r.probed.rows === 2 && r.probed.keys === 1, JSON.stringify(r.probed))
    const kinds = r.state.pictures.reduce((m, x) => { m[x.kind] = (m[x.kind] || 0) + 1; return m }, {})
    check('Zweites Video: Bildwechsel stehen im Zustand (Szenen, Teile, Kamera) und jede Tafel passt in die Breite', r.state.pictures.length >= 12 && kinds.szene === 6 && kinds.teil >= 6 && kinds.kamera >= 5 && r.state.capFit.every(f => f.width <= 940), `${r.state.pictures.length} Wechsel: ${JSON.stringify(kinds)}, breiteste Tafel ${Math.max(...r.state.capFit.map(f => f.width))} px`)
    // Fassung 2: wo das Video die Erinnerung zeigt, steht niemand mehr vor der Tuer. Satz 6 ist die Karte von oben.
    const comps = s2.scenes.flatMap(sc => (sc.parts || [sc])), maps = comps.filter(c => c.component === 'shop-map')
    const atDoor = comps.filter(c => c.component === 'shop-street' && c.params.notify !== false && c.params.walker !== false && c.params.view !== 'owner' && !c.params.across && !c.params.privacy)
    check('Zweites Video, Fassung 2: drei Bilder zeigen die Karte von oben (Auge, Kreis, Blick des Betreibers), und kein Bild lässt die Benachrichtigung mehr direkt vor der Ladenfront aufspringen',
      maps.length === 3 && maps.some(m => m.params.track) && maps.some(m => m.params.circle && m.params.view !== 'owner') && maps.some(m => m.params.view === 'owner') && atDoor.length === 0, `${maps.length} Karten, ${atDoor.length} Bilder mit Benachrichtigung vor der Tür`)
    // Fassung 3: auch im Bild zu "Der Laden schickt nichts" geht niemand mehr an der Ladentuer vorbei (bis Fassung 2 tat
    // die Figur das noch), und die Kamera auf der Karte mit Kreis laesst den ganzen Kreis im Bild.
    const walkers = comps.filter(c => c.component === 'shop-street' && c.params.walker !== false && c.params.view !== 'owner')
    const ring = maps.find(m => m.params.circle && m.params.view !== 'owner'), cam = (ring.camera || []).find(c => c.zoom > 1)
    const span = cam ? [cam.to[0] + cam.zoom * (560 - 400 - cam.focus[0]), cam.to[0] + cam.zoom * (560 + 400 - cam.focus[0])] : [160, 960]   // Kreis: Mitte x = 560, Halbmesser 400 (shop-map)
    check('Zweites Video, Fassung 3: jede Figur auf der Straße geht auf der anderen Straßenseite, und nach der Kamerafahrt liegt der ganze Kreis "in der Nähe" in der Bildbreite',
      walkers.length === 2 && walkers.every(c => c.params.across === true) && span[0] >= 0 && span[1] <= STAGE.w, `${walkers.length} Bilder mit Figur, Kreis von x = ${Math.round(span[0])} bis ${Math.round(span[1])}`)
    // Ein Schluesselwort, das auch verkleinert nicht lesbar bleibt, bricht den Bau ab
    const long = await page(variant(s => { s.scenes[0].parts[0].captions[1].lines = ['Dein | *Sperrbildschirmbenachrichtigungseinstellungen | meldet sich,'] }, s2))
    const hit = long.res.checks.find(c => c.name === 'wortgroesse' && !c.ok)
    check('Prüfung schlägt an: ein Schlüsselwort, das nur winzig in die Breite passt', !long.res.ok && !!hit, hit ? hit.details[0].slice(0, 120) : '')
    const slow = await page(variant(s => { s.pace = { maxStill: 1, minChanges: 99 } }, s2))
    const pw = slow.res.checks.find(c => c.name === 'bildwechsel')
    check('"pace" ist ein Richtwert: zu wenige Bildwechsel warnen, brechen aber nicht ab', slow.res.ok && pw && pw.level === 'warn' && pw.details.length >= 2, pw ? pw.details[pw.details.length - 1] : 'Prüfung fehlt')
    const bad = await page(variant(s => { s.scenes[4].params.phones = 7 }, s2))
    check('Prüfung schlägt an: Straße mit mehr Kunden, als vor die Ladenfront passen', !bad.res.ok && /"phones" muss zwischen 0 und 3/.test(bad.res.errors.join(' ')), String(bad.res.errors[0] || '').slice(0, 120))
  } else check('Zweites Video liegt im Repo (videos/2026-11-16-ist-das-koscher)', false)
}
// ---- Seit Fassung 2 des zweiten Videos (16.11.2026): Karte von oben (shop-map) und die andere Strassenseite
// ("across" in shop-street). Der Betreiber hatte die erste Fassung so gelesen, als muesse man vor dem Laden
// stehen. Festgenagelt wird deshalb nicht nur, dass die Bilder bauen, sondern die Aussage selbst: die
// Benachrichtigung kommt mit Abstand zur Ortsnadel, und kein Weg fuehrt an der Tuer vorbei.
{
  const cta = { component: 'cta-comment', captions: [{ lines: ['Klingt interessant?'], keep: true }, { role: 'cta', lines: ['Dann kommentiere jetzt KARTE,{Karte,}', 'und wir melden uns bei dir.'] }] }
  const mini = (...scenes) => ({ meta: { title: 't', slug: 't' }, scenes: [...scenes, cta] })
  const map = (params = {}, extra = {}) => mini({ component: 'shop-map', params: { note: '6 von 6, dein Kaffee wartet', ...params }, captions: [{ lines: ['Kommst du in die Nähe,', 'meldet sich dein Handy.'] }], ...extra })
  // sauber heisst hier: die Seite baut und kein Baustein meldet einen Hinweis (die Laenge so kurzer Skripte zaehlt nicht)
  const clean = r => r.state.duration > 0 && r.res.checks.filter(c => ['seite', 'sperrzonen', 'einzeiler', 'ueberdeckung', 'hinweise', 'knopfspalte'].includes(c.name)).every(c => c.ok)
  const why = r => r.res.checks.filter(c => !c.ok && c.name !== 'laenge').flatMap(c => c.details).concat(r.state.duration ? [] : r.res.errors).join(' | ').slice(0, 200)
  const rejects = async (scr, re) => { const r = await page(scr); return { ok: !r.res.ok && re.test(r.res.errors.join(' ')), msg: String(r.res.errors[0] || 'kein Fehler').slice(0, 130) } }
  // Geometrie im Bild messen, 0,7 s nach dem Brummen: dann steht die Karten-Benachrichtigung
  const mapProbe = () => {
    const a = window.STUDIO.anchors.find(x => x.component === 'shop-map' && x.name === 'buzz'); window.seek(a.t + 0.7)
    const b = s => document.querySelector(s).getBoundingClientRect(), mid = r => ({ x: (r.left + r.right) / 2, y: (r.top + r.bottom) / 2 })
    const hit = (p, q) => p.left < q.right && q.left < p.right && p.top < q.bottom && q.top < p.bottom
    const puck = mid(b('.sm-puck')), dot = mid(b('.sm-dot')), zone = document.querySelector('.sm-zone')
    return { dist: Math.round(Math.hypot(puck.x - dot.x, puck.y - dot.y)), radius: zone ? Math.round(zone.getBoundingClientRect().width / 2) : null, chip: +getComputedStyle(document.querySelector('.sm-chip')).opacity, covers: hit(b('.sm-chip'), b('.sm-pin')) || hit(b('.sm-chip'), b('.sm-label')), text: document.querySelector('.sm-map').textContent }
  }
  const a = await page(map(), null, { motion: true, probe: mapProbe })
  check('Karte von oben (shop-map): baut mit den Vorgaben ohne Fehler und ohne Hinweis', clean(a), why(a))
  check('Karte von oben: beim Brummen steht die Kundin im Kreis, aber mindestens ein Viertel der Bildbreite von der Ortsnadel entfernt, und ihre Benachrichtigung verdeckt weder Nadel noch Namensschild',
    !!a.probed && a.probed.chip === 1 && a.probed.dist >= 0.25 * STAGE.w && a.probed.dist < a.probed.radius && !a.probed.covers, JSON.stringify({ ...a.probed, text: undefined }))
  check('Karte von oben: keine Entfernung in Zahlen im Bild (kein "m", keine Meterangabe)', !!a.probed && !/\d\s*(m|Meter|km)\b/.test(a.probed.text) && /Café Nordwind/.test(a.probed.text), a.probed ? a.probed.text.replace(/\s+/g, ' ').trim().slice(0, 80) : '')
  const door = await rejects(map({ path: [[-0.75, 2], [2.5, 2]] }), /an der Ladentür vorbei/)
  check('Prüfung schlägt an: Karte, der Weg der Kundin führt an der Ladentür vorbei', door.ok, door.msg)
  const block = await rejects(map({ path: [[0, 1], [1, 2]] }), /quer durch einen Häuserblock/), inner = await rejects(map({ path: [[0, 1], [1.5, 1.5]] }), /mitten in einem Häuserblock/)
  check('Prüfung schlägt an: Karte, ein Weg quer durch einen Häuserblock oder mit einem Punkt mitten im Block', block.ok && inner.ok, block.msg)
  const far = await rejects(map({ path: [[-0.75, 0], [0, 0]] }), /kommt nie in die Nähe/), cover = await rejects(map({ path: [[-0.75, 3], [1.2, 3]] }), /verdeckt Ortsnadel oder Namensschild/)
  const high = await rejects(map({ path: [[1, -0.6], [1, 0.9]] }), /hinge im Textbereich/)
  check('Prüfung schlägt an: Karte, ein Weg, der nie in den Kreis kommt, einer, bei dem die Benachrichtigung die Nadel verdeckte, und einer, bei dem sie im Textbereich hinge', far.ok && cover.ok && high.ok, `${far.msg} | ${cover.msg} | ${high.msg}`.slice(0, 260))
  // Ein Weg um die Ecke: erst eine Querstrasse hoch, dann abbiegen. Die Kundin kommt an, die Figur dreht sich nicht falsch herum.
  const corner = await page(map({ path: [[0, 2.9], [0, 1], [0.55, 1]], circle: false }), null, { probe: mapProbe })
  check('Karte von oben: ein Weg über eine Ecke baut, und "via" liegt von selbst am Rand des Kreises, auch wenn der Kreis nicht gezeigt wird', clean(corner) && !!corner.probed && corner.probed.radius === null && corner.probed.dist >= 0.25 * STAGE.w && corner.probed.dist < 400, why(corner) || JSON.stringify({ ...corner.probed, text: undefined }))
  // Blick des Betreibers: mehrere Kunden rund um den Laden, alle im Kreis, keiner vor der Tuer
  const own = await page(mini({ component: 'shop-map', params: { view: 'owner', phones: 4 }, captions: [{ lines: ['Genau vor', 'deiner Tür.'] }] }), null, { motion: true, probe: () => {
    const mid = e => { const r = e.getBoundingClientRect(); return { x: (r.left + r.right) / 2, y: (r.top + r.bottom) / 2 } }
    // im Kreis stehen muessen sie schon, wenn das erste Handy aufleuchtet (die Kunden gehen noch ein Stueck), und am Ende
    // (der Kreis geht dann noch auf: gerechnet wird mit seinem vollen Halbmesser, im Massstab des Bildes in diesem Moment)
    const within = t => { window.seek(t); const d = document.querySelector('.sm-dot'), dot = mid(d), k = d.getBoundingClientRect().width / d.offsetWidth, R = document.querySelector('.sm-zone').offsetWidth / 2 * k; return [...document.querySelectorAll('.sm-puck')].every(p => Math.hypot(mid(p).x - dot.x, mid(p).y - dot.y) < R) }
    const early = within(window.STUDIO.anchors.find(x => x.name === 'phone1').t)
    window.seek(window.STUDIO.scenes[0].e - 0.05)
    const dot = mid(document.querySelector('.sm-dot')), label = document.querySelector('.sm-label').getBoundingClientRect(), R = document.querySelector('.sm-zone').getBoundingClientRect().width / 2
    return { n: document.querySelectorAll('.sm-cust').length, lit: [...document.querySelectorAll('.sm-mini')].filter(m => +getComputedStyle(m).opacity === 1).length,
      inside: early && [...document.querySelectorAll('.sm-puck')].every(p => Math.hypot(mid(p).x - dot.x, mid(p).y - dot.y) < R),
      nearest: Math.round(Math.min(...[...document.querySelectorAll('.sm-puck')].map(p => Math.hypot(mid(p).x - dot.x, mid(p).y - (label.top - 20))))) }
  } })
  check('Karte, Blick des Betreibers: vier Kunden rund um den Laden, alle im Kreis, alle Handys leuchten, keiner steht vor der Tür', clean(own) && !!own.probed && own.probed.n === 4 && own.probed.lit === 4 && own.probed.inside && own.probed.nearest >= 170, why(own) || JSON.stringify(own.probed))
  {
    // "spread" (Fassung 3 des zweiten Videos): die beiden unteren Kunden stehen weiter aussen, damit die vier nicht wie
    // "zwei oben, zwei am Namensschild" aussehen. Sie muessen trotzdem von Anfang an im Kreis stehen.
    const lower = () => { window.seek(window.STUDIO.scenes[0].e - 0.05); const dot = document.querySelector('.sm-dot').getBoundingClientRect(); return [...document.querySelectorAll('.sm-puck')].map(p => p.getBoundingClientRect()).filter(r => r.top > dot.bottom).map(r => Math.round(Math.abs((r.left + r.right) / 2 - (dot.left + dot.right) / 2))) }
    const inCircle = () => { const mid = e => { const r = e.getBoundingClientRect(); return { x: (r.left + r.right) / 2, y: (r.top + r.bottom) / 2 } }
      return [window.STUDIO.anchors.find(x => x.name === 'phone1').t, window.STUDIO.scenes[0].e - 0.05].every(t => { window.seek(t); const d = document.querySelector('.sm-dot'), dot = mid(d), k = d.getBoundingClientRect().width / d.offsetWidth, R = document.querySelector('.sm-zone').offsetWidth / 2 * k; return [...document.querySelectorAll('.sm-puck')].every(p => Math.hypot(mid(p).x - dot.x, mid(p).y - dot.y) < R) }) }
    const owner = spread => mini({ component: 'shop-map', params: { view: 'owner', phones: 4, ...(spread ? { spread: true } : {}) }, captions: [{ lines: ['Genau vor', 'deiner Tür.'] }] })
    const probe = `(() => { const lower = ${lower}, inCircle = ${inCircle}; return { inside: inCircle(), lower: lower() } })()`
    const narrow = await page(owner(false), null, { probe }), wide = await page(owner(true), null, { motion: true, probe })
    check('Karte, Blick des Betreibers mit "spread": die beiden unteren Kunden stehen mindestens 20 px weiter außen und trotzdem von Anfang an im Kreis',
      clean(wide) && wide.probed.inside && narrow.probed.inside && narrow.probed.lower.length === 2 && wide.probed.lower.length === 2 && wide.probed.lower.every((x, i) => x >= narrow.probed.lower[i] + 20), why(wide) || `ohne ${narrow.probed.lower.join(' und ')} px, mit ${wide.probed.lower.join(' und ')} px neben der Ortsnadel`)
  }
  const many = await rejects(mini({ component: 'shop-map', params: { view: 'owner', phones: 5 }, captions: [{ lines: ['Genau vor deiner Tür.'] }] }), /"phones" muss zwischen 0 und 4/)
  check('Prüfung schlägt an: Karte mit mehr Kunden, als in den Kreis passen', many.ok, many.msg)
  {
    // Ein langer Ladenname macht das Schild unter der Nadel breit: es stiesse an die Karten ueber den Kunden unten
    const r = await page(mini({ component: 'shop-map', params: { view: 'owner', phones: 4, shop: 'Bäckerei Sonnenkorn am Markt' }, captions: [{ lines: ['Genau vor', 'deiner Tür.'] }] })), hit = r.res.checks.find(c => c.name === 'ueberdeckung' && !c.ok)
    check('Prüfung schlägt an: Karte, Blick des Betreibers, das Schild eines langen Ladennamens stößt an die Karte über einem Kunden', !!hit && /Ladenname an der Ortsnadel/.test(hit.details[0]), hit ? hit.details[0].slice(0, 130) : 'kein Fehler')
  }

  // Die andere Strassenseite: der Laden klein im Hintergrund, die Fahrbahn dazwischen
  const across = (params = {}) => mini({ component: 'shop-street', params: { across: true, circle: false, note: '6 von 6', from: -0.05, via: 0.2, to: 0.29, ...params }, captions: [{ lines: ['Dein Handy meldet sich,', 'wenn du vorbeigehst.'] }] })
  const st = await page(across(), null, { motion: true, probe: () => {
    const a = window.STUDIO.anchors.find(x => x.name === 'buzz'); window.seek(a.t + 0.7)
    const b = s => document.querySelector(s).getBoundingClientRect(), shop = b('.ss-shop'), door = b('.ss-door'), w = b('.ss-walker'), chip = b('.ss-chip'), road = b('.ss-road')
    return { door: Math.round(door.height), walker: Math.round(w.height), down: Math.round(w.bottom - door.bottom), side: Math.round(Math.abs((w.left + w.right) / 2 - (door.left + door.right) / 2)),
      road: road.top >= door.bottom - 1 && road.bottom <= w.bottom, covers: chip.left < shop.right && shop.left < chip.right && chip.top < shop.bottom && shop.top < chip.bottom, chip: +getComputedStyle(document.querySelector('.ss-chip')).opacity }
  } })
  check('Straße, andere Seite ("across"): baut ohne Fehler und ohne Hinweis', clean(st), why(st))
  check('Straße, andere Seite: die Tür hinten ist höchstens 60 % so hoch wie die Figur vorn, die Fahrbahn liegt dazwischen, und die Benachrichtigung verdeckt den Laden nicht',
    !!st.probed && st.probed.chip === 1 && st.probed.door <= 0.6 * st.probed.walker && st.probed.road && st.probed.down >= 300 && st.probed.side >= 0.25 * STAGE.w && !st.probed.covers, JSON.stringify(st.probed))
  const under = await page(across({ via: 0.3, to: 0.62 }))
  check('Warnung: "across", die Benachrichtigung verdeckte den Laden, weil der Passant unter ihm durchgeht', under.res.warnings.some(w => /verdeckt/.test(w)), (under.res.warnings[0] || 'keine Warnung').slice(0, 130))
  const ring = await rejects(across({ circle: true }), /"across" zeigt nur den Passanten/)
  check('Prüfung schlägt an: "across" zusammen mit dem Kreis (dafür gibt es die Karte von oben)', ring.ok, ring.msg)
  {
    // Fassung 3 des zweiten Videos: "Der Laden schickt nichts. Und sieht nicht, wo du bist." Bis Fassung 2 ging die Figur
    // dabei direkt an der Ladentuer vorbei. Jetzt: andere Strassenseite, die zwei durchgestrichenen Zeichen neben dem Laden.
    const priv = (params = {}) => mini({ component: 'shop-street', params: { across: true, shopAt: 0.4, circle: false, notify: false, privacy: true, direction: 'left', from: 0.1, to: 0.9, ...params }, anchors: { nosend: { cap: 0, word: 3 }, nosee: { cap: 1, word: 2 } }, captions: [{ lines: ['Der Laden', 'schickt nichts.'] }, { lines: ['Und sieht nicht,', 'wo du bist.'] }] })
    const r = await page(priv(), null, { motion: true, probe: () => {
      window.seek(window.STUDIO.scenes[0].e - 0.05)
      const b = s => document.querySelector(s).getBoundingClientRect(), hit = (p, q) => p.left < q.right && q.left < p.right && p.top < q.bottom && q.top < p.bottom
      const send = b('.ss-send'), see = b('.ss-see'), shop = b('.ss-shop'), sign = b('.ss-sign'), w = b('.ss-walker'), door = b('.ss-door'), slash = s => new DOMMatrix(getComputedStyle(document.querySelector(s + ' .ss-slash')).scale === 'none' ? '' : 'scale(' + getComputedStyle(document.querySelector(s + ' .ss-slash')).scale.split(' ')[0] + ')').a
      return { shown: +getComputedStyle(document.querySelector('.ss-send')).opacity === 1 && +getComputedStyle(document.querySelector('.ss-see')).opacity === 1, struck: slash('.ss-send') === 1 && slash('.ss-see') === 1,
        beside: send.right <= shop.left && see.left >= shop.right, free: !hit(send, sign) && !hit(see, sign) && !hit(send, w) && !hit(see, w), inFrame: send.left >= 40 && see.right <= 1040 && send.top >= 580,
        size: Math.round(send.width), down: Math.round(w.bottom - door.bottom), door: Math.round(door.height), walker: Math.round(w.height) }
    } })
    check('Straße, andere Seite mit "privacy": beide durchgestrichenen Zeichen stehen neben dem kleinen Laden, im Bild und unter dem Textbereich, die Figur geht vorn auf der anderen Straßenseite',
      clean(r) && !!r.probed && r.probed.shown && r.probed.struck && r.probed.beside && r.probed.free && r.probed.inFrame && r.probed.size >= 110 && r.probed.down >= 300 && r.probed.door <= 0.6 * r.probed.walker, why(r) || JSON.stringify(r.probed))
    const edge = await rejects(priv({ shopAt: 0.68 }), /"across" mit "privacy": "shopAt"/)
    check('Prüfung schlägt an: "across" mit "privacy", der Laden steht so weit am Rand, dass ein Zeichen aus dem Bild ragte', edge.ok, edge.msg)
  }

  // Die Strasse von der Seite, wie Fassung 1 sie brauchte (Kreis, Auge, Betreiber mit drei Handys), wird von
  // keinem Video mehr benutzt. Damit sie nicht still kaputtgeht, baut sie hier weiter mit.
  const old = await page(mini(
    { component: 'shop-street', params: { note: '6 von 6', track: true }, anchors: { eye: { cap: 0, word: 0 }, no: { cap: 1, word: 0 }, buzz: { cap: 2, word: 1 } }, captions: [{ lines: ['Verfolgt dich das Café?'] }, { lines: ['Nein.'] }, { lines: ['Dein Handy meldet', 'sich ganz von selbst.'] }] },
    { component: 'shop-street', params: { view: 'owner', phones: 3 }, captions: [{ lines: ['Genau vor deiner Tür', 'stehen sie dann.'] }] }), null, { probe: () => {
    const eye = window.STUDIO.anchors.find(x => x.name === 'eye').t, q = t => { window.seek(t); return +getComputedStyle(document.querySelector('.ss-q')).opacity }
    return { before: q(eye - 0.05), after: q(eye + 0.8), guests: document.querySelectorAll('.ss-guest').length }
  } })
  check('Straße von der Seite wie in Fassung 1 (Kreis, Auge mit Blicklinie, Betreiber mit drei Handys) baut weiter; das Fragezeichen erscheint erst nach dem Auge', clean(old) && !!old.probed && old.probed.before === 0 && old.probed.after === 1 && old.probed.guests === 3, why(old) || JSON.stringify(old.probed))
}
{
  // Drei Teile in einer Szene: der mittlere darf nicht von Anfang an sichtbar sein. Frueher
  // ueberschrieben sich sein Ein- und sein Ausblenden; bei zwei Teilen fiel das nie auf.
  const s = variant(x => {
    const g = x.scenes[2].parts[1]
    x.scenes[2].parts = [x.scenes[2].parts[0], { component: 'guest-ghost', captions: [{ lines: ['Und das Café'] }], params: { chip: '' } }, { ...g, captions: [{ lines: ['merkt nie, wer fast', 'schon Stammgast war.'] }], anchors: { chip: { cap: 0, word: 2 } } }]
  })
  const n3 = normalize(s), t3 = timeline(n3, estimateTimes(n3)), early = t3.scenes[2].s + 0.6, mid = t3.scenes[2].parts[1].s + 0.6
  const r = await page(s, null, { probe: `(() => { const o = t => { window.seek(t); return [...document.querySelectorAll('#s3 .part')].map(p => +getComputedStyle(p).opacity) }; return { early: o(${early}), mid: o(${mid}) } })()` })
  check('Szene aus drei Teilen: am Anfang ist nur der erste zu sehen, in der Mitte nur der zweite', r.res.ok && r.probed.early.join() === '1,0,0' && r.probed.mid.join() === '0,1,0', JSON.stringify(r.probed))
}
{
  // Luecken kuerzen: 1 s Ton, 1,2 s Stille, 1 s Ton, 0,2 s Stille, 1 s Ton. Die lange Stille wird auf 0,4 s
  // gekuerzt, die kurze auf Wunsch auf 0,5 s verlaengert, und die Zeichen-Zeiten ziehen mit.
  const wav = path.join(tmp, 'luecken.wav'), al = path.join(tmp, 'luecken.json'), outW = path.join(tmp, 'kurz.wav'), outA = path.join(tmp, 'kurz.json')
  const mk = await run('ffmpeg', ['-v', 'error', '-y', '-f', 'lavfi', '-i', "aevalsrc='0.3*sin(2*PI*220*t)*(lt(t,1)+between(t,2.2,3.2)+gt(t,3.4))':s=44100:d=4.4", wav])
  writeFileSync(al, JSON.stringify({ characters: ['a', ' ', 'b', ' ', 'c'], character_start_times_seconds: [0, 1, 2.2, 3.2, 3.4], character_end_times_seconds: [1, 2.2, 3.2, 3.4, 4.4] }))
  const tg = await run('python3', [path.join(STUDIO_ROOT, 'tools', 'tighten.py'), wav, al, '0.4', outW, outA, '--set', '3.4=0.5'])
  let ok = false, detail = (mk.err || tg.err || '').slice(0, 160)
  if (mk.code === 0 && tg.code === 0) {
    const info = JSON.parse(tg.out.trim().split('\n').pop()), na = JSON.parse(readFileSync(outA, 'utf8')), gaps = await silences(outW, 0.3)
    const near = (x, y) => Math.abs(x - y) < 0.01
    ok = info.cuts.length === 1 && near(info.removed, 0.8) && info.inserts.length === 1 && near(info.added, 0.3) && near(info.secondsAfter, 3.9) &&
      near(na.character_start_times_seconds[2], 1.4) && near(na.character_start_times_seconds[4], 2.9) && gaps.length === 2 && near(gaps[0].seconds, 0.4) && near(gaps[1].seconds, 0.5)
    detail = `${info.secondsBefore} s -> ${info.secondsAfter} s, Wörter danach bei ${na.character_start_times_seconds[2]} und ${na.character_start_times_seconds[4]} s, Stille ${gaps.map(g => g.seconds).join(' und ')} s`
  }
  check('tools/tighten.py: lange Stille gekürzt, gewünschte Pause verlängert, Zeichen-Zeiten ziehen mit', ok, detail)
}
{
  // Laute Mischung an der Aufnahme des veroeffentlichten Videos (liegt im Repo, kostet nichts):
  // Ziel -14 LUFS, wahre Spitze hoechstens -1 dBTP, gemessen an der kodierten Datei
  const cuesFile = path.join(tmp, 'laut-cues.json'), sfx = path.join(tmp, 'laut-sfx.wav'), out = path.join(tmp, 'laut.m4a')
  writeFileSync(cuesFile, JSON.stringify(fin.state.cuesFile))
  const sx = await run('python3', [path.join(STUDIO_ROOT, 'tools', 'sfx.py'), cuesFile, sfx])
  const r = sx.code === 0 ? await loudMix({ voiceFile: path.join(finalDir, 'voice', v10.key + '.mp3'), sfxFile: sfx, lead: 0.35, len: '50.2667', mix: { ...MIX, lufs: -14, truePeak: -1 }, out, work: tmp }) : null
  check('Laute Mischung ("mix.lufs"): trifft -14 LUFS auf ein halbes LU und bleibt unter -1 dBTP', !!r && r.ok && Math.abs(r.lufs + 14) <= 0.5 && r.truePeak <= -1, r ? `${r.lufs} LUFS, wahre Spitze ${r.truePeak} dBTP, ${r.passes} Durchgänge (vorher ${r.before.lufs} LUFS)` : sx.err.slice(0, 120))
}

// ---- Stimme (Python)
const py = await run('python3', [path.join(STUDIO_ROOT, 'tools', 'test_voice.py')], { env: { ...process.env, STUDIO_VOICE_OFFLINE: '1' } })
process.stdout.write(py.out.split('\n').filter(l => l.startsWith('ok') || l.startsWith('FEHLER')).map(l => '  [voice] ' + l).join('\n') + '\n')
check('tools/test_voice.py', py.code === 0, py.out.trim().split('\n').pop() + (py.code ? ' ' + py.err.trim().split('\n').pop() : ''))

// ---- Satz von ausserhalb des Studios (tools/clip-in.py): kuenstlicher Clip, kein Netz
const pc = await run('python3', [path.join(STUDIO_ROOT, 'tools', 'test_clip_in.py')], { env: { ...process.env, STUDIO_VOICE_OFFLINE: '1' } })
process.stdout.write(pc.out.split('\n').filter(l => l.startsWith('ok') || l.startsWith('FEHLER')).map(l => '  [clip-in] ' + l).join('\n') + '\n')
check('tools/test_clip_in.py', pc.code === 0, pc.out.trim().split('\n').pop() + (pc.code ? ' ' + pc.err.trim().split('\n').pop() : ''))
{
  // Der ganze Weg an echter Sprache, in einer Kopie des ersten Videos: der damals neu aufgenommene Satz
  // "Und das lohnt sich!" (liegt als .mp3 in tools/fixtures) kommt als Clip von ausserhalb in die Aufnahme.
  // Danach muss make.mjs die Fassung nehmen, 0 Zeichen ausgeben und die Aufnahme darf sich nicht geaendert haben.
  const d = path.join(tmp, 'clip-in-video'), fxd = path.join(STUDIO_ROOT, 'tools', 'fixtures'), clip = path.join(tmp, 'neuer-satz.mp3')
  mkdirSync(d, { recursive: true }); cpSync(path.join(refDir, 'script.json'), path.join(d, 'script.json')); cpSync(path.join(refDir, 'voice'), path.join(d, 'voice'), { recursive: true })
  cpSync(path.join(fxd, 'satz-austausch-neuer-satz.mp3'), clip); cpSync(path.join(fxd, 'satz-austausch-neuer-satz.alignment.json'), path.join(tmp, 'neuer-satz.alignment.json'))
  const sums = () => readdirSync(path.join(refDir, 'voice')).map(f => f + ':' + readFileSync(path.join(d, 'voice', f)).equals(readFileSync(path.join(refDir, 'voice', f)))).join()
  const tool = (...a) => run('python3', [path.join(STUDIO_ROOT, 'tools', 'clip-in.py'), d, ...a], { env: { ...process.env, STUDIO_VOICE_OFFLINE: '1' } })
  const put = await tool('Und das lohnt sich!', clip), info = put.code === 0 ? JSON.parse(put.out.trim().split('\n').pop()) : null
  const words = info ? info.words.map(w => w.how).join(' ') : ''
  check('clip-in.py an echter Sprache: Satz erkannt, Wortanfänge aus dem Vergleich mit der Aufnahme, 0 Zeichen, die Aufnahme bleibt Byte für Byte',
    !!info && info.written && info.spent === 0 && info.root === v7.key && info.sentence === 'Und das lohnt sich!' && info.words.length === 4 && info.words.slice(1).every(w => /^vergleich\+einsatz/.test(w.how)) && !sums().includes('false') && info.warnings.length === 0,
    info ? `Satz ${info.number}, Fassung ${info.key}, ${words}, Lautstärke ${info.loudness.gain_db} dB` : (put.err || put.out).trim().split('\n').pop().slice(0, 160))
  const mk = await run('node', [path.join(STUDIO_ROOT, 'make.mjs'), d, '--check'], { env: { ...process.env, STUDIO_VOICE_OFFLINE: '1' } })
  const rep = existsSync(path.join(d, 'out', 'check.json')) ? JSON.parse(readFileSync(path.join(d, 'out', 'check.json'), 'utf8')) : {}
  // Der Clip ist derselbe Satz, der schon in der Aufnahme steckt: das Video muss praktisch gleich lang bleiben. Vor dem
  // Ausgleich der Pause (clip_pad) war es 0,9 s kuerzer, und "Und das lohnt sich!" stand zu kurz im Bild (Pruefung lesezeit).
  check('make.mjs nimmt die Fassung mit dem Satz von außerhalb: aus dem Cache, 0 Zeichen, alle Prüfungen bestanden, die Pause nach dem Satz ist geblieben (Länge wie vorher auf 0,15 s)',
    mk.code === 0 && !!info && rep.ok === true && rep.elevenLabs.key === info.key && rep.elevenLabs.takeOf === v7.key && rep.elevenLabs.cached === true && rep.elevenLabs.spent === 0 && /von außerhalb des Studios/.test(mk.out) && Math.abs(rep.duration - t7.tl.duration) < 0.15 && info.silence_added > 0.5,
    `Länge ${rep.duration} s statt ${t7.tl.duration} s, ${info ? info.silence_added : '?'} s Stille nach dem Clip; ` + ((mk.err || mk.out).trim().split('\n').filter(l => /^Stimme|FEHLER/.test(l)).pop() || '').slice(0, 120))
  const back = await tool('--original'), mk2 = await run('node', [path.join(STUDIO_ROOT, 'make.mjs'), d, '--check'], { env: { ...process.env, STUDIO_VOICE_OFFLINE: '1' } })
  const rep2 = existsSync(path.join(d, 'out', 'check.json')) ? JSON.parse(readFileSync(path.join(d, 'out', 'check.json'), 'utf8')) : {}
  check('clip-in.py --original: make.mjs nimmt wieder die Aufnahme, ohne Hinweis auf eine Fassung', back.code === 0 && mk2.code === 0 && rep2.elevenLabs.key === v7.key && rep2.elevenLabs.takeOf === undefined && !sums().includes('false'))
}

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
