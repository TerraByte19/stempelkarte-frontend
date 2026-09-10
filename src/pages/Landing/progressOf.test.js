import { test } from 'node:test'
import assert from 'node:assert/strict'
import { progressOf } from './progressOf.js'

test('0 solange das Element noch unter dem Viewport steht', () => {
  assert.equal(progressOf(800, 2400, 800), 0)
})

test('0 genau wenn die Oberkante den oberen Rand erreicht', () => {
  assert.equal(progressOf(0, 2400, 800), 0)
})

test('0,5 in der Mitte des Scrollwegs', () => {
  assert.equal(progressOf(-800, 2400, 800), 0.5)
})

test('1 am Ende des Scrollwegs', () => {
  assert.equal(progressOf(-1600, 2400, 800), 1)
})

test('bleibt bei 1, auch weit darueber hinaus', () => {
  assert.equal(progressOf(-9999, 2400, 800), 1)
})

test('0 wenn das Element kuerzer als der Viewport ist', () => {
  assert.equal(progressOf(-100, 400, 800), 0)
})

test('0 wenn Element und Viewport exakt gleich hoch sind', () => {
  assert.equal(progressOf(-100, 800, 800), 0)
})
