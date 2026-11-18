import { test } from 'node:test'
import assert from 'node:assert/strict'
import { neueSperre, SPERRE_MS } from './scanSperre.js'

/**
 * Nagelt fest: nach "Naechster Kunde" / "Abbrechen" kommt der Code des
 * Kunden davor nicht sofort wieder durch - weder aus einem eingefrorenen
 * Kamerabild noch, weil der Kunde sein Handy noch hinhaelt. Vorher bekam
 * genau dieser Kunde dann den Stempel des naechsten (Meldung aus einem
 * Laden, 18.11.2026). Ein anderer Code geht sofort.
 */

const A = 'SK:CC-75F92881'
const B = 'SK:CC-6D58886B'

test('Code des Kunden davor wird direkt nach "Naechster Kunde" verworfen', () => {
  const s = neueSperre()
  s.setze(A, 1000)
  assert.equal(s.verwirft(A, 1005), true)
})

test('der naechste Kunde kommt sofort durch', () => {
  const s = neueSperre()
  s.setze(A, 1000)
  assert.equal(s.verwirft(B, 1005), false)
})

test('solange der alte Code im Bild bleibt, bleibt er gesperrt', () => {
  const s = neueSperre()
  s.setze(A, 0)
  for (let t = 100; t <= 10_000; t += 100) assert.equal(s.verwirft(A, t), true, `bei ${t} ms`)
})

test('war der Code lange genug aus dem Bild, geht er wieder (bewusst nochmal scannen)', () => {
  const s = neueSperre()
  s.setze(A, 0)
  assert.equal(s.verwirft(A, 500), true)
  assert.equal(s.verwirft(A, 500 + SPERRE_MS + 1), false)
})

test('ohne vorigen Kunden ist nichts gesperrt', () => {
  const s = neueSperre()
  assert.equal(s.verwirft(A, 0), false)
  s.setze(null, 0)
  assert.equal(s.verwirft(A, 1), false)
})
