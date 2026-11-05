import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  leererStand, rundeHinzu, entscheide, auswerten, naechsterGegner, messenJetzt, statusText,
  MINDESTENS, PRUEF_TAKT, lade, speichere,
} from './scannerWahl.js'

function runden(stand, gegner, n, altMs, gegnerMs) {
  let s = stand
  for (let i = 0; i < n; i++) s = rundeHinzu(s, { t: i, gegner, alt: altMs, gegnerMs })
  return s
}

test('vor 30 Runden wird nicht gewechselt, auch wenn der Neue immer gewinnt', () => {
  const s = runden(leererStand(), 'neu', MINDESTENS - 1, 900, 300)
  assert.equal(s.aktiv, null)
  assert.equal(auswerten(s.runden).neu.n, MINDESTENS - 1)
})

test('ab 30 Runden mit 80 % zuerst und 150 ms Vorsprung wechselt das Geraet', () => {
  let s = runden(leererStand(), 'neu', 24, 900, 300)   // 24 x neu zuerst
  s = runden(s, 'neu', 6, 300, 900)                    // 6 x alt zuerst -> 80 %
  assert.equal(s.aktiv, 'neu')
  assert.ok(s.gewechseltAm)
})

test('knapp unter 80 % oder zu wenig Vorsprung: kein Wechsel', () => {
  let s = runden(leererStand(), 'neu', 23, 900, 300)
  s = runden(s, 'neu', 7, 300, 900)                    // 76 %
  assert.equal(s.aktiv, null)
  let t = runden(leererStand(), 'neu', 30, 500, 420)   // 100 % zuerst, aber nur 80 ms
  assert.equal(t.aktiv, null)
})

test('nicht getroffen zaehlt gegen den Herausforderer', () => {
  let s = runden(leererStand(), 'nimiq', 25, 900, 300)
  s = runden(s, 'nimiq', 5, 900, null)                 // 5 x verfehlt
  assert.equal(auswerten(s.runden).nimiq.verfehlt, 5)
  assert.equal(s.aktiv, 'nimiq')                       // 83 % zuerst, Median-Vorsprung 600
  let t = runden(leererStand(), 'nimiq', 20, 900, 300)
  t = runden(t, 'nimiq', 10, 900, null)                // 66 %
  assert.equal(t.aktiv, null)
})

test('der beste von mehreren Herausforderern gewinnt', () => {
  let s = runden(leererStand(), 'neu', 30, 900, 500)   // 400 ms Vorsprung
  s = runden(s, 'nimiq', 30, 900, 200)                 // 700 ms Vorsprung
  assert.equal(s.aktiv, 'nimiq')
})

test('zurueck, wenn der Gewinner spaeter verliert', () => {
  let s = runden(leererStand(), 'neu', 30, 900, 300)
  assert.equal(s.aktiv, 'neu')
  s = runden(s, 'neu', 60, 300, 900)                   // 60 Runden alt zuerst, alte 30 fallen raus
  assert.equal(s.aktiv, null)
})

test('Herausforderer wechseln sich ab, nur verfuegbare', () => {
  let s = leererStand()
  assert.equal(naechsterGegner(s, ['neu', 'nimiq']), 'neu')
  s = rundeHinzu(s, { gegner: 'neu', alt: 500, gegnerMs: 400 })
  assert.equal(naechsterGegner(s, ['neu', 'nimiq']), 'nimiq')
  s = rundeHinzu(s, { gegner: 'nimiq', alt: 500, gegnerMs: 400 })
  assert.equal(naechsterGegner(s, ['neu', 'nimiq', 'handy']), 'handy')
  assert.equal(naechsterGegner(s, []), null)
})

test('nach dem Wechsel nur jede fuenfte Runde messen, manuell nie', () => {
  let s = runden(leererStand(), 'neu', 30, 900, 300)
  assert.equal(s.aktiv, 'neu')
  assert.equal(messenJetzt(s), s.runden.length % PRUEF_TAKT === 0)
  assert.equal(messenJetzt({ ...s, runden: [...s.runden, {}] }), (s.runden.length + 1) % PRUEF_TAKT === 0)
  assert.equal(messenJetzt(leererStand()), true)
  assert.equal(messenJetzt({ ...leererStand(), manuell: 'alt' }), false)
  assert.equal(entscheide({ ...s, manuell: 'nimiq' }).aktiv, 'neu')   // manuell: nichts anfassen
})

test('Statustext und Speicher', () => {
  const s = runden(leererStand(), 'neu', 12, 900, 300)
  assert.match(statusText(s), /^B 12\/30 · C 0\/30 · D 0\/30$/)
  const g = runden(leererStand(), 'neu', 30, 900, 300)
  assert.equal(statusText(g), 'B aktiv (100 %)')
  const speicher = new Map()
  const fake = { getItem: k => speicher.get(k) ?? null, setItem: (k, v) => speicher.set(k, v) }
  speichere(fake, g)
  assert.equal(lade(fake).aktiv, 'neu')
  assert.equal(lade({ getItem: () => 'kaputt', setItem: () => {} }).aktiv, null)
})
