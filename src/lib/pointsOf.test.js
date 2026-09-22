import { test } from 'node:test'
import assert from 'node:assert/strict'
import { punkteFuer, formatierePunkte, centsAusEingabe } from './pointsOf.js'

// Dieselben Faelle wie PunkteRechnungTest im Backend. Weicht eine der
// beiden Seiten ab, zeigt der Scanner dem Personal eine andere Zahl an,
// als danach gebucht wird - und genau dieses Vertrauen soll die
// Live-Vorschau ja herstellen.

test('1 Euro = 1 Punkt, genau', () => {
  assert.equal(punkteFuer(520, 100, 'GENAU'), 520)
})

test('1 Euro = 5 Punkte, genau', () => {
  assert.equal(punkteFuer(520, 500, 'GENAU'), 2600)
})

test('5 Euro = 1 Punkt, genau', () => {
  assert.equal(punkteFuer(520, 20, 'GENAU'), 104)
})

test('2 Euro = 3 Punkte, genau', () => {
  assert.equal(punkteFuer(520, 150, 'GENAU'), 780)
})

test('abrunden schneidet auf ganze Punkte', () => {
  assert.equal(punkteFuer(570, 100, 'ABRUNDEN'), 500)
})

test('kaufmaennisch rundet ab der Haelfte auf', () => {
  assert.equal(punkteFuer(570, 100, 'KAUFMAENNISCH'), 600)
  assert.equal(punkteFuer(520, 100, 'KAUFMAENNISCH'), 500)
  assert.equal(punkteFuer(550, 100, 'KAUFMAENNISCH'), 600)
})

test('negativer Betrag rundet symmetrisch', () => {
  assert.equal(punkteFuer(-570, 100, 'KAUFMAENNISCH'), -600)
  assert.equal(punkteFuer(-570, 100, 'ABRUNDEN'), -500)
})

test('groesster erlaubter Fall bleibt exakt', () => {
  // 99 999,99 Euro mal 1000 Punkte pro Euro. In JavaScript sind das
  // 9 999 999 000 - weit unter Number.MAX_SAFE_INTEGER, also exakt.
  assert.equal(punkteFuer(9_999_999, 100_000, 'GENAU'), 9_999_999_000)
  assert.ok(9_999_999_000 < Number.MAX_SAFE_INTEGER)
})

test('Anzeige schneidet nachlaufende Nullen ab', () => {
  assert.equal(formatierePunkte(520), '5,2')
  assert.equal(formatierePunkte(2600), '26')
  assert.equal(formatierePunkte(104), '1,04')
  assert.equal(formatierePunkte(0), '0')
})

test('Eingabe mit Komma wird gelesen', () => {
  assert.equal(centsAusEingabe('145,50'), 14550)
  assert.equal(centsAusEingabe('145.50'), 14550)
  assert.equal(centsAusEingabe('145'), 14500)
  assert.equal(centsAusEingabe('0,05'), 5)
})

test('leere oder unsinnige Eingabe gibt null', () => {
  // null statt 0: das Personal soll den Buchen-Knopf nicht druecken
  // koennen, solange nichts Brauchbares im Feld steht.
  assert.equal(centsAusEingabe(''), null)
  assert.equal(centsAusEingabe('   '), null)
  assert.equal(centsAusEingabe('abc'), null)
  assert.equal(centsAusEingabe('-5'), null)
  assert.equal(centsAusEingabe('0'), null)
})

test('mehr als zwei Nachkommastellen werden abgeschnitten', () => {
  // 1,239 Euro sind 1,23 Euro, keine 1,24 - der Kassenbon rundet auch
  // nicht nach oben.
  assert.equal(centsAusEingabe('1,239'), 123)
})
