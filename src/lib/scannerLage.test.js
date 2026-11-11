import { test } from 'node:test'
import assert from 'node:assert/strict'
import { lageAus, neueFlaeche, passeLeseflaecheAn } from './scannerLage.js'

test('Lage kommt vom Bildschirm, sonst vom Fenster', () => {
  assert.equal(lageAus('landscape-primary', 400, 800), 'quer')
  assert.equal(lageAus('landscape-secondary', 400, 800), 'quer')
  assert.equal(lageAus('portrait-primary', 800, 400), 'hoch')
  assert.equal(lageAus(undefined, 1180, 820), 'quer')
  assert.equal(lageAus(undefined, 820, 1180), 'hoch')
  assert.equal(lageAus(undefined, 0, 0), null)
})

test('Leseflaeche folgt dem Kamerafenster', () => {
  const hoch = { x: 0, y: 0, width: 800, height: 520 }
  assert.deepEqual(neueFlaeche(hoch, 1150.4, 520), { x: 0, y: 0, width: 1150, height: 520 })
})

test('nichts zu tun: unveraendert, unsichtbar oder kein Leser', () => {
  const f = { x: 0, y: 0, width: 800, height: 520 }
  assert.equal(neueFlaeche(f, 800, 520), null)
  assert.equal(neueFlaeche(f, 0, 0), null)        // Kamerafenster ausgeblendet
  assert.equal(neueFlaeche(f, undefined, 520), null)
  assert.equal(neueFlaeche(null, 800, 520), null)
})

test('ein eigener Rahmen (qrbox) wird nicht angefasst', () => {
  assert.equal(neueFlaeche({ x: 100, y: 50, width: 250, height: 250 }, 1150, 520), null)
})

test('Leser bekommt neue Flaeche und passende Zeichenflaeche', () => {
  const leser = { qrRegion: { x: 0, y: 0, width: 800, height: 520 }, canvasElement: { width: 800, height: 520 } }
  assert.equal(passeLeseflaecheAn(leser, { clientWidth: 1150, clientHeight: 520 }), true)
  assert.deepEqual(leser.qrRegion, { x: 0, y: 0, width: 1150, height: 520 })
  assert.equal(leser.canvasElement.width, 1150)
  assert.equal(passeLeseflaecheAn(leser, { clientWidth: 1150, clientHeight: 520 }), false)
})

test('fehlende Innereien (andere Version des Lesers) schaden nicht', () => {
  assert.equal(passeLeseflaecheAn({}, { clientWidth: 1150, clientHeight: 520 }), false)
  assert.equal(passeLeseflaecheAn(null, null), false)
})
