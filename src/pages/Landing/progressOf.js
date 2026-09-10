/**
 * Wie weit ist ein Element durch den Viewport gescrollt?
 *
 * @param {number} top    getBoundingClientRect().top
 * @param {number} height getBoundingClientRect().height
 * @param {number} viewportHeight window.innerHeight
 * @returns {number} 0 = Oberkante gerade am oberen Rand, 1 = Unterkante am unteren Rand.
 *                   Ist das Element nicht hoeher als der Viewport, gibt es keinen
 *                   Scrollweg — dann immer 0.
 */
export function progressOf(top, height, viewportHeight) {
  const span = height - viewportHeight
  if (span <= 0) return 0
  const p = -top / span
  // <= statt <: bei top === 0 ergibt -top/span die Zahl -0, und -0 < 0 ist false.
  // Ohne das rutscht -0 durch und stolpert ueber jeden strikten Vergleich.
  if (p <= 0) return 0
  if (p > 1) return 1
  return p
}
