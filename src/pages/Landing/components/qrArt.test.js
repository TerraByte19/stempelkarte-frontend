import { test } from 'node:test'
import assert from 'node:assert/strict'
import { qrModules } from './qrArt.js'

const m = qrModules()

test('21x21 Module', () => {
  assert.equal(m.length, 21)
  assert.ok(m.every(row => row.length === 21))
})

test('Finder-Ecke oben links: Rahmen an, Ring aus, Kern an', () => {
  assert.equal(m[0][0], 1)
  assert.equal(m[1][1], 0)
  assert.equal(m[3][3], 1)
})

test('Finder-Ecken auch oben rechts und unten links', () => {
  assert.equal(m[0][14], 1)
  assert.equal(m[14][0], 1)
})

test('unten rechts steht kein viertes Finder-Muster', () => {
  // Eine einzelne Zelle taugt nicht als Probe — unten rechts liegt das
  // Datenfeld, dort darf zufaellig alles stehen. Gepruefft wird der ganze
  // 7x7-Block gegen den Block oben links.
  const topLeft = m.slice(0, 7).map(row => row.slice(0, 7))
  const bottomRight = m.slice(14, 21).map(row => row.slice(14, 21))
  assert.notDeepEqual(bottomRight, topLeft)
})

test('Timing-Spur wechselt sich ab', () => {
  assert.equal(m[6][8], 1)
  assert.equal(m[6][9], 0)
  assert.equal(m[6][10], 1)
})

test('reproduzierbar — zwei Aufrufe geben dasselbe Muster', () => {
  assert.deepEqual(qrModules(), m)
})
