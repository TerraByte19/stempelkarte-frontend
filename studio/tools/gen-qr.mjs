#!/usr/bin/env node
// gen-qr.mjs - erzeugt engine/qr.js neu aus der QR-Zeichnung der Landing Page
// (src/pages/Landing/components/qrArt.js), damit das Video dasselbe Muster zeigt.
// Nur noetig, wenn sich die Zeichnung dort aendert. Das Muster ist kein echter
// QR-Code, sondern reine Illustration.
import { qrModules, QR_SIZE, QR_QUIET } from '../../src/pages/Landing/components/qrArt.js'
import { writeFileSync } from 'node:fs'
writeFileSync(new URL('../engine/qr.js', import.meta.url), `export const QR = ${JSON.stringify({ m: qrModules(), size: QR_SIZE, quiet: QR_QUIET })};\n`)
console.log('engine/qr.js geschrieben')
