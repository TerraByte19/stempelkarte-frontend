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

test('benutzte Ordner alphabetisch, ohne Doppelte', () => {
  assert.deepEqual(benutzteOrdner(shops), ['Apfel', 'Intern', 'Kunde', 'Zebra'])
})

test('keine vorgegebenen Ordner', () => {
  assert.deepEqual(auswahlOrdner([{ id: 1, ordner: null }]), [])
  assert.deepEqual(auswahlOrdner(shops), ['Apfel', 'Intern', 'Kunde', 'Zebra'])
})

test('Filter', () => {
  assert.equal(imOrdner(shops, ALLE).length, 6)
  assert.deepEqual(imOrdner(shops, OHNE).map(s => s.id), [3])
  assert.deepEqual(imOrdner(shops, 'Kunde').map(s => s.id), [2, 6])
})
