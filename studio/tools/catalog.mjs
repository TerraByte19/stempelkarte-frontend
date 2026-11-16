#!/usr/bin/env node
// catalog.mjs - baut den Baustein-Katalog aus den Bausteinen selbst:
//   docs/components/<name>.png   ein Standbild je Baustein (halbe Groesse)
//   PLAYBOOK.md                  Abschnitt zwischen <!-- KATALOG:ANFANG --> und <!-- KATALOG:ENDE -->
// Parameter, Vorgaben und Anker werden aus components/<name>.js gelesen, damit
// die Beschreibung nie von dem abweicht, was der Baustein wirklich tut.
// Nach jedem neuen oder geaenderten Baustein laufen lassen. Kein Netz, keine Kosten.
import { readFileSync, writeFileSync, readdirSync, mkdirSync, rmSync, mkdtempSync } from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { normalize, estimateTimes } from '../engine/script.mjs'
import { openStudio, still, run, STUDIO_ROOT } from '../engine/render.mjs'

// Reihenfolge wie im ersten Video; neue Bausteine folgen nach dem Alphabet
const ORDER = ['paper-card', 'cup-row', 'wallet-vanish', 'guest-ghost', 'wallet-pass', 'lock-notification', 'calc-panel', 'cta-comment']
const names = readdirSync(path.join(STUDIO_ROOT, 'components')).filter(f => f.endsWith('.js')).map(f => f.slice(0, -3))
  .sort((a, b) => (ORDER.indexOf(a) + 1 || 99) - (ORDER.indexOf(b) + 1 || 99) || a.localeCompare(b))
const docs = path.join(STUDIO_ROOT, 'docs', 'components'); mkdirSync(docs, { recursive: true })
const tmp = mkdtempSync(path.join(os.tmpdir(), 'stampit-katalog-'))
const code = v => '`' + JSON.stringify(v).replace(/\|/g, '\\|') + '`'
const anchorText = a => code(Object.fromEntries(Object.entries(a).filter(([k]) => k !== 'doc')))

let md = ''
for (const name of names) {
  const mod = (await import(path.join(STUDIO_ROOT, 'components', name + '.js'))).default
  if (!mod.demo) { console.error(`${name}: kein "demo" im Baustein, kein Standbild möglich`); process.exitCode = 1; continue }
  const script = { meta: { title: name, slug: name }, scenes: [{ component: name, params: mod.demo.params || {}, captions: mod.demo.captions }] }
  const norm = normalize(script), times = estimateTimes(norm)
  const pos = (i, n) => i < 0 ? i + n : i
  let at = times.at(-1).at(-1) + 1.2 // ohne Angabe: kurz nach dem letzten Wort, wenn alles steht
  if (mod.demo.at) { const d = mod.demo.at, row = times[pos(d.cap ?? 0, times.length)]; at = row[pos(d.word ?? 0, row.length)] + (d.offset || 0) }
  const studio = await openStudio({ script, times }), page = await studio.page(), state = await studio.state(page)
  if (state.errors.length || studio.problems.length) { console.error(`${name}: ${[...state.errors, ...studio.problems].join(' | ')}`); process.exitCode = 1; await studio.close(); continue }
  const full = path.join(tmp, name + '.png')
  await still(page, Math.min(at, state.duration - 0.05), full); await studio.close()
  const sc = await run('ffmpeg', ['-v', 'error', '-y', '-i', full, '-vf', 'scale=540:-1:flags=lanczos', path.join(docs, name + '.png')])
  if (sc.code !== 0) { console.error(sc.err); process.exitCode = 1 }
  rmSync(full, { force: true })

  const params = Object.fromEntries(Object.entries(mod.params || {}).map(([k, d]) => [k, d.default]))
  const anchors = typeof mod.anchors === 'function' ? mod.anchors(params, []) : (mod.anchors || {})
  const need = mod.captions || {}
  md += `### \`${name}\` - ${mod.title}\n\n`
  // Anfuehrungszeichen im Titel ("in der Nähe") haetten das alt-Attribut vorzeitig beendet
  md += `<img src="docs/components/${name}.png" width="270" alt="${mod.title.replace(/"/g, '&quot;')}">\n\n`
  md += `${mod.use}\n\n`
  md += `Textzeilen: mindestens ${need.min || 1}${need.roles ? `, davon eine mit \`"role": "${need.roles.join('", "')}"\`` : ''}. Datei: \`components/${name}.js\`\n\n`
  md += '| Parameter | Vorgabe | Bedeutung |\n|---|---|---|\n'
  for (const [k, d] of Object.entries(mod.params || {})) md += `| \`${k}\` | ${code(d.default)} | ${d.doc} |\n`
  md += '\n| Anker | Vorgabe | Wann |\n|---|---|---|\n'
  for (const [k, a] of Object.entries(anchors)) md += `| \`${k}\` | ${anchorText(a)} | ${a.doc || ''} |\n`
  md += '\n'
  console.log(`${name}: Standbild bei ${at.toFixed(2)} s, ${Object.keys(mod.params || {}).length} Parameter, ${Object.keys(anchors).length} Anker`)
}
rmSync(tmp, { recursive: true })

const pb = path.join(STUDIO_ROOT, 'PLAYBOOK.md'), A = '<!-- KATALOG:ANFANG -->', E = '<!-- KATALOG:ENDE -->'
let text = ''
try { text = readFileSync(pb, 'utf8') } catch { /* PLAYBOOK fehlt noch */ }
if (text.includes(A) && text.includes(E)) {
  writeFileSync(pb, text.slice(0, text.indexOf(A) + A.length) + '\n' + md + text.slice(text.indexOf(E)))
  console.log(`Katalog in PLAYBOOK.md erneuert (${names.length} Bausteine)`)
} else {
  writeFileSync(path.join(STUDIO_ROOT, 'docs', 'KATALOG.md'), md)
  console.log('PLAYBOOK.md hat keine KATALOG-Marken; Katalog steht in docs/KATALOG.md')
}
