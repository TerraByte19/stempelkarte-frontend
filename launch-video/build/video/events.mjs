// Liest den Zeitplan und gibt aus, wann welcher Ton spielt. Haengt an denselben
// Wort-Zeiten wie die Bilder - verschiebt sich die Stimme, wandern die Toene mit.
import { readFileSync } from 'node:fs'
globalThis.window = {}
new Function(readFileSync(new URL('./times.js', import.meta.url), 'utf8'))()
new Function(readFileSync(new URL('./timeline.js', import.meta.url), 'utf8'))()
const TL = window.TL, S = TL.scenes, w = TL.w
const c7 = TL.caps.find(c => c.id === 'c7')
const ev = []
const add = (t, name, vol = 1, pitch = 1) => ev.push({ t: +t.toFixed(3), name, vol, pitch })
add(0.5, 'thud')
add(w('c1', 5), 'chime', 0.8)
for (let n = 2; n <= 7; n++) add(S[n].s - 0.05, 'whoosh', 0.7)
add(S[2].s + 0.5, 'pop', 0.8, 0.8)
add(w('c2a', 4) - 0.05, 'pop', 0.9, 1.3)
const tb = w('c2b', 3) - 0.2
add(tb, 'whoosh', 0.4)
for (let i = 0; i < 3; i++) add(tb + 0.35 + i * 0.2, 'pop', 0.8, 1 + i * 0.15)
add(w('c3b', 0), 'crumple')
add(w('c3b', 1) - 0.2, 'whoosh', 0.45)
add(w('c3b', 2) - 0.05, 'drop', 0.9)
add(w('c3c', 6), 'pop', 0.8, 0.9)
add(w('c4a', 4) - 0.05, 'pop', 0.9, 0.7)
add(w('c4b', 0) + 0.2, 'scan', 0.7)
add(w('c4b', 2), 'ok', 0.8)
for (const [k, p] of [[1, 1], [3, 1.12], [4, 1.26]]) add(w('c4c', k), 'pop', 0.9, p)
add(w('c5', 4) - 0.05, 'ding')
add(w('c5', 4) + 0.05, 'buzz', 0.6)
add(w('c5', 9) - 0.05, 'pop', 0.8, 1.1)
add(w('c6a', 0) + 0.05, 'pop', 0.9, 0.75)
for (const t of [w('c6b', 1), w('c6c', 1), w('c6c', 4), w('c6d', 0) - 0.45]) add(t, 'tick', 0.8)
add(w('c6d', 2), 'kaching')
add(c7.t[3], 'pop', 1, 0.6)
add(c7.last + 0.55, 'chime', 0.7)
console.log(JSON.stringify({ duration: TL.duration, events: ev.sort((a, b) => a.t - b.t) }))
