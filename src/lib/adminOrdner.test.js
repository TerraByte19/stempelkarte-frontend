import { test } from 'node:test'
import assert from 'node:assert/strict'
import { benutzteOrdner, auswahlOrdner, imOrdner, ALLE, OHNE } from './adminOrdner.js'

const shops = [
  { id: 1, ordner: 'Intern' },
  { id: 2, ordner: 'Kunde' },
  { id: 3, ordner: null },
  { id: 4, ordner: 'Zebra' },
  { id: 5, ordner: 'Apfel' },
  { id: 6, ordner: 'Kunde' },
]

test('benutzte Ordner: Vorschlaege zuerst, Rest alphabetisch', () => {
  assert.deepEqual(benutzteOrdner(shops), ['Kunde', 'Intern', 'Apfel', 'Zebra'])
})

test('Auswahl enthaelt alle Vorschlaege plus eigene', () => {
  assert.deepEqual(auswahlOrdner(shops), ['Kunde', 'Interessent', 'Intern', 'Pausiert', 'Apfel', 'Zebra'])
})

test('Filter', () => {
  assert.equal(imOrdner(shops, ALLE).length, 6)
  assert.deepEqual(imOrdner(shops, OHNE).map(s => s.id), [3])
  assert.deepEqual(imOrdner(shops, 'Kunde').map(s => s.id), [2, 6])
})
