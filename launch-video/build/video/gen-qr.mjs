// Erzeugt qr.js aus der QR-Zeichnung der Landing Page, damit das Video dasselbe Muster zeigt.
import { qrModules, QR_SIZE, QR_QUIET } from '../../../src/pages/Landing/components/qrArt.js'
import { writeFileSync } from 'node:fs'
writeFileSync(new URL('./qr.js', import.meta.url), `window.QR=${JSON.stringify({ m: qrModules(), size: QR_SIZE, quiet: QR_QUIET })};\n`)
