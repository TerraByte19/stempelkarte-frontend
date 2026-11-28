// Macht aus den Zeichen-Zeiten der Aufnahme Wort-Zeiten je Textzeile (times.js).
import { readFileSync, writeFileSync } from 'node:fs'
const LEAD = 0.35 // die Stimme setzt kurz nach dem ersten Bild ein
const al = JSON.parse(readFileSync(new URL('./alignment.json', import.meta.url)))
const words = []; let cur = null
al.characters.forEach((ch, i) => {
  if (/\s/.test(ch)) { cur = null; return }
  if (!cur) { cur = { w: '', s: al.character_start_times_seconds[i] }; words.push(cur) }
  cur.w += ch; cur.e = al.character_end_times_seconds[i]
})
globalThis.window = {}
new Function(readFileSync(new URL('../video/timeline.js', import.meta.url), 'utf8'))()
const caps = window.TL.caps; let k = 0; const out = {}
for (const c of caps) {
  out[c.id] = c.words.map(() => { const x = words[k++]; return +(x.s + LEAD).toFixed(3) })
  console.log(c.id.padEnd(4), out[c.id][0].toFixed(2), c.words.join(' '), '|', words.slice(k - c.words.length, k).map(x => x.w).join(' '))
}
if (k !== words.length) throw new Error(`Wortzahl passt nicht: Text ${k}, Aufnahme ${words.length}`)
writeFileSync(new URL('../video/times.js', import.meta.url), `window.TIMES=${JSON.stringify(out)};window.VOICE_LEAD=${LEAD};window.VOICE_END=${(words.at(-1).e + LEAD).toFixed(3)};\n`)
