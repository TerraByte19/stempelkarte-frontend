import { test } from 'node:test'
import assert from 'node:assert/strict'
import { punkteFuer, formatierePunkte, centsAusEingabe,
         kursAusAnzeige, anzeigeAusKurs } from './pointsOf.js'

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

// ── Kurs-Umrechnung im Anlege-Formular ──────────────────────────────────
//
// Diese Faelle gibt es, weil "N Euro pro Punkt" zuerst falsch gerechnet
// wurde (10000/N statt 100/N). Build, Lint und die uebrigen Tests waren
// gruen; aufgefallen ist es erst beim Klicken in der laufenden Oberflaeche.

test('X Punkte pro Euro', () => {
  assert.equal(kursAusAnzeige(1, true), 100)
  assert.equal(kursAusAnzeige(5, true), 500)
  assert.equal(kursAusAnzeige(1.5, true), 150)   // 3 Punkte pro 2 Euro
})

test('N Euro pro Punkt', () => {
  assert.equal(kursAusAnzeige(1, false), 100)    // dasselbe wie 1 Punkt pro Euro
  assert.equal(kursAusAnzeige(5, false), 20)     // 5 Euro = 1 Punkt
  assert.equal(kursAusAnzeige(2, false), 50)
})

test('Anzeige ist der Rueckweg', () => {
  assert.equal(anzeigeAusKurs(100, true), 1)
  assert.equal(anzeigeAusKurs(500, true), 5)
  assert.equal(anzeigeAusKurs(20, false), 5)
  assert.equal(anzeigeAusKurs(50, false), 2)
})

test('hin und zurueck aendert den Kurs nicht', () => {
  for (const [zahl, proEuro] of [[1, true], [5, true], [1.5, true], [5, false], [2, false]]) {
    const kurs = kursAusAnzeige(zahl, proEuro)
    assert.equal(anzeigeAusKurs(kurs, proEuro), zahl,
      `${zahl} (${proEuro ? 'pro Euro' : 'pro Punkt'}) kam als ${anzeigeAusKurs(kurs, proEuro)} zurueck`)
  }
})

test('der beworbene Fall stimmt: 5 Euro pro Punkt, 10 Euro Einkauf', () => {
  // Der Fall, an dem der Fehler aufgefallen ist. 10 Euro muessen 2 Punkte
  // ergeben, nicht 50.
  const kurs = kursAusAnzeige(5, false)
  assert.equal(formatierePunkte(punkteFuer(1000, kurs, 'GENAU')), '2')
})

test('unsinnige Eingabe gibt null statt eines kaputten Kurses', () => {
  assert.equal(kursAusAnzeige(0, true), null)
  assert.equal(kursAusAnzeige(-3, false), null)
  assert.equal(kursAusAnzeige(NaN, true), null)
})
