import { test } from 'node:test'
import assert from 'node:assert/strict'
import { STIMMEN } from './stimmen.js'

/**
 * Die Stimmen auf der Startseite sind Werbeaussagen Dritter. Der Test haelt
 * die Form sauber und faengt Platzhalter ab, die aus Versehen live gehen
 * wuerden - mehr kann er nicht: ob ein Zitat echt und freigegeben ist, weiss
 * nur der Mensch, der es eintraegt.
 */

const PLATZHALTER = /lorem|ipsum|beispiel|placeholder|todo|xxx|test ?zitat|mustermann/i

test('jede Stimme hat Zitat, Laden und Ort', () => {
  assert.ok(Array.isArray(STIMMEN))
  for (const [i, s] of STIMMEN.entries()) {
    for (const feld of ['zitat', 'laden', 'ort']) {
      assert.ok(typeof s[feld] === 'string' && s[feld].trim() !== '',
        `Stimme ${i + 1}: ${feld} fehlt`)
    }
    if (s.person !== undefined) assert.ok(typeof s.person === 'string' && s.person.trim() !== '')
    if (s.sprache !== undefined) assert.match(s.sprache, /^[a-z]{2}$/)
  }
})

test('kein Zitat ist ein Platzhalter oder zu lang', () => {
  for (const [i, s] of STIMMEN.entries()) {
    const alles = [s.zitat, s.laden, s.ort, s.person ?? ''].join(' ')
    assert.doesNotMatch(alles, PLATZHALTER, `Stimme ${i + 1} sieht nach Platzhalter aus`)
    assert.ok(s.zitat.length <= 320, `Stimme ${i + 1}: Zitat laenger als 320 Zeichen`)
    // Anfuehrungszeichen setzt die Seite selbst.
    assert.ok(!/^["„“']|["“”']$/.test(s.zitat.trim()), `Stimme ${i + 1}: Zitat ohne eigene Anfuehrungszeichen eintragen`)
  }
})

test('hoechstens sechs Stimmen, sonst wird es eine Wand', () => {
  assert.ok(STIMMEN.length <= 6)
})
