// render.mjs still <out-prefix> <t1> <t2> ...   -> Standbilder
// render.mjs video <out.mp4> [fps]              -> ganzes Video (ohne Ton)
import { createRequire } from 'node:module'
import http from 'node:http'
import { readFile } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
const require = createRequire(import.meta.url)
const { chromium } = require('playwright')
const root = path.dirname(fileURLToPath(import.meta.url))
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.png': 'image/png', '.svg': 'image/svg+xml' }
// Eigener kleiner Server: file:// laedt lokale Schriften nicht zuverlaessig.
const server = http.createServer(async (req, res) => {
  try {
    const p = path.join(root, decodeURIComponent(req.url.split('?')[0] === '/' ? '/index.html' : req.url.split('?')[0]))
    res.writeHead(200, { 'content-type': types[path.extname(p)] || 'application/octet-stream' }); res.end(await readFile(p))
  } catch { res.writeHead(404); res.end() }
}).listen(0)
const port = server.address().port
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 })
page.on('pageerror', e => { console.error('PAGE ERROR', e.message); process.exitCode = 1 })
page.on('console', m => { if (m.type() === 'error') console.error('CONSOLE', m.text()) })
await page.goto(`http://127.0.0.1:${port}/`)
await page.evaluate(() => document.fonts.ready)
const dur = await page.evaluate(() => window.TL.duration)
const [mode, out, ...rest] = process.argv.slice(2)
if (mode === 'still') {
  for (const t of rest.map(Number)) {
    await page.evaluate(t => window.seek(t), t)
    await page.screenshot({ path: `${out}-${t.toFixed(2)}.png` })
  }
} else if (mode === 'video') {
  const fps = Number(rest[0] || 30), n = Math.round(dur * fps)
  const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', String(fps), '-i', '-', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '16', '-preset', 'medium', out], { stdio: ['pipe', 'inherit', 'inherit'] })
  for (let i = 0; i < n; i++) {
    await page.evaluate(t => window.seek(t), i / fps)
    const buf = await page.screenshot({ type: 'jpeg', quality: 95 })
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r))
    if (i % 150 === 0) console.log(`frame ${i}/${n}`)
  }
  ff.stdin.end(); await new Promise(r => ff.on('close', r))
}
console.log('duration', dur)
await browser.close(); server.close()
