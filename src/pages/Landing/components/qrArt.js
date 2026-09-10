/**
 * Zeichnerische QR-Geometrie, Version 1 (21 Module).
 *
 * Kein echter Code — reine Illustration fuer die Landing-Page. Die echten
 * QR-Codes in der App erzeugt weiterhin qrcode.react.
 *
 * Das Datenfeld kommt aus einem festen Startwert, damit das Muster auf jedem
 * Geraet und bei jedem Aufruf gleich aussieht.
 */
const N = 21

export function qrModules() {
  const m = Array.from({ length: N }, () => new Array(N).fill(0))

  const finder = (ox, oy) => {
    for (let y = 0; y < 7; y++) {
      for (let x = 0; x < 7; x++) {
        const ring = x === 0 || x === 6 || y === 0 || y === 6
        const core = x >= 2 && x <= 4 && y >= 2 && y <= 4
        m[oy + y][ox + x] = ring || core ? 1 : 0
      }
    }
  }
  finder(0, 0)
  finder(14, 0)
  finder(0, 14)

  for (let t = 8; t < 13; t++) {
    m[6][t] = t % 2 ? 0 : 1
    m[t][6] = t % 2 ? 0 : 1
  }

  const reserved = (x, y) =>
    (x < 9 && y < 9) || (x > 13 && y < 9) || (x < 9 && y > 13) || x === 6 || y === 6

  let seed = 20260910
  const rnd = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff
    return seed / 0x7fffffff
  }

  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      if (!reserved(x, y)) m[y][x] = rnd() < 0.47 ? 1 : 0
    }
  }

  return m
}

export const QR_SIZE = N
export const QR_QUIET = 2
