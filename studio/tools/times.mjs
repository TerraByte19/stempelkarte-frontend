#!/usr/bin/env node
// times.mjs <video-ordner> [--text]
// Zeigt, was make.mjs aus dem Skript ableitet, ohne etwas zu bauen:
//   - den gesprochenen Text (genau das, was an die Stimme ginge) und seine Kosten
//   - je Textzeile die Wort-Zeiten: aus der Aufnahme im Cache, sonst geschaetzt
// Gedacht zum Nachsehen, auf welchem Wort (Index ab 0) ein Anker liegen soll.
// Sendet nichts und kostet nichts.
import { readFileSync, existsSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { normalize, estimateTimes, timesFromAlignment } from '../engine/script.mjs'
import { STUDIO_ROOT } from '../engine/render.mjs'

const target = process.argv[2]
const dir = target && [path.resolve(target), path.join(STUDIO_ROOT, 'videos', target)].find(d => existsSync(path.join(d, 'script.json')))
if (!dir) { console.error('Aufruf: node studio/tools/times.mjs <video-ordner> [--text]'); process.exit(2) }
const norm = normalize(JSON.parse(readFileSync(path.join(dir, 'script.json'), 'utf8')))
if (process.argv.includes('--text')) { process.stdout.write(norm.spoken); process.exit(0) } // ohne Zeilenende: genau der Text, der an die Stimme ginge

// Aufnahme suchen, deren Text genau der gesprochene Text ist (die Einstellungen prueft make.mjs ueber den Schluessel)
let times = estimateTimes(norm), source = 'geschätzt (0,36 s je Wort)'
const vdir = path.join(dir, 'voice')
// Hat tools/clip-in.py einen Satz von ausserhalb eingesetzt, liegen mehrere Fassungen mit demselben
// Text im Ordner. Es gilt die, auf die <schluessel>.use.json zeigt: nur ihre Zeiten sind die des Baus.
const used = existsSync(vdir) ? readdirSync(vdir).filter(f => f.endsWith('.use.json')).map(f => JSON.parse(readFileSync(path.join(vdir, f), 'utf8')).use) : []
if (existsSync(vdir)) for (const f of readdirSync(vdir).filter(f => f.endsWith('.meta.json')).sort((a, b) => used.includes(b.slice(0, -10)) - used.includes(a.slice(0, -10)))) {
  const meta = JSON.parse(readFileSync(path.join(vdir, f), 'utf8'))
  // eine abgelegte Fassung, auf die nichts zeigt, gilt nicht (nach "clip-in.py --original" bleibt sie liegen)
  if (meta.text !== norm.spoken || (meta.source === 'extern' && !used.includes(meta.key))) continue
  times = timesFromAlignment(norm, JSON.parse(readFileSync(path.join(vdir, meta.key + '.alignment.json'), 'utf8'))).times
  source = `Aufnahme ${meta.key}${meta.source === 'extern' ? ' (Fassung mit Sätzen von außerhalb, tools/clip-in.py)' : ''}`; break
}
console.log(`${norm.meta.title}: ${norm.words} Wörter, ${norm.spoken.length} Zeichen gesprochener Text. Zeiten: ${source}\n`)
// Mit "timing.maxGap" kuerzt der Bau die Pausen der Aufnahme: die Zeiten hier sind dann die der
// ungekuerzten Aufnahme und liegen spaeter als im Video. Wer danach Anker setzt, liegt daneben.
if (norm.timing.maxGap != null && source.startsWith('Aufnahme')) console.log('Achtung: dieses Skript kürzt die Pausen der Aufnahme ("timing.maxGap"). Die Zeiten unten gelten für die ungekürzte Aufnahme; die Zeiten des Videos stehen nach einem Bau in out/times.json und im Bericht unter "captions".\n')
norm.caps.forEach((c, i) => {
  console.log(`${c.id.padEnd(6)} ${c.role ? `[${c.role}] ` : ''}${c.words.join(' ')}`)
  console.log('       ' + c.words.map((w, k) => `${k}:${w}${c.say[k] !== w ? `{${c.say[k]}}` : ''}@${times[i][k].toFixed(2)}`).join('  '))
})
console.log(`\nGesprochen:\n${norm.spoken}`)
