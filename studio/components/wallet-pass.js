// Handy mit geoeffneter Wallet: die Karte faellt hinein, der QR-Code wird
// gescannt, danach kommen Stempel dazu. Das Herzstueck: so sieht Stampit
// beim Kunden wirklich aus.
//
// "device": "android" (Gegenpruefung am Salon-Video, 17.11.2026): auf die Frage "Und Kundinnen
// ohne iPhone?" antwortete das Video mit demselben Handy samt Dynamic Island, nur die Ueberschrift
// hiess "Google Wallet". Das Bild widersprach der Frage. Jetzt gibt es ein Android-Handy: Kamera
// als Loch in der Mitte statt Insel, flachere Ecken, unten die Gestenleiste. Ohne Angabe bleibt
// alles beim iPhone wie in den veroeffentlichten Videos (regress.mjs vergleicht Bild fuer Bild).
import { QR } from '../engine/qr.js'
import { stampCols } from '../engine/parts.js'

// Tonhoehe der Stempel-Pops: jeder zwei Halbtoene hoeher als der davor
const PITCH = i => +(2 ** (i * 2 / 12)).toFixed(2)
// Woerter im dritten Text, auf denen im ersten Video die Stempel landen
const STAMP_WORDS = [1, 3, 4, 5, 6, 7, 8, 9]

export default {
  title: 'Handy mit Wallet-Karte',
  use: 'Zeigt das Produkt: Karte in der Wallet, einmal scannen, Stempel landen sofort auf dem Handy.',
  params: {
    shop: { default: 'Café Nordwind', doc: 'Name des Ladens auf der Karte. Neben einem Kürzel von 11 Zeichen passen höchstens etwa 22 Zeichen, ab etwa 18 wird der Name kleiner gesetzt (dann warnt der Bau). Ohne Kürzel etwa 35', same: 'Ladenname' },
    location: { default: 'HH-OTTENSEN', doc: 'Kürzel rechts oben auf der Karte (Stadt-Viertel), Großbuchstaben, höchstens etwa 14 Zeichen (je länger, desto kleiner wird der Ladenname). Leer lassen für keins' },
    reward: { default: '6 Stempel = 1 Kaffee gratis', doc: 'Belohnungszeile unter den Stempeln, muss in eine Zeile passen (höchstens etwa 32 Zeichen)' },
    stamps: { default: 6, doc: 'Felder auf der Karte, 4 bis 10', same: 'Stempelzahl' },
    before: { default: 2, doc: 'Stempel, die schon da sind, wenn die Karte erscheint' },
    after: { default: 5, doc: 'Stempel am Ende der Szene. Jeder neue Stempel braucht einen Anker (stamp1, stamp2, ...)' },
    icon: { default: 'cup', doc: 'Stempel-Symbol: cup, bread, scissors, star, heart, check', same: 'Symbol' },
    walletTitle: { default: 'Wallet', doc: 'Überschrift auf dem Handy' },
    device: { default: 'iphone', doc: '"iphone" (Insel oben, Apple Wallet) oder "android" (Kamera als Loch, Gestenleiste unten; für Google Wallet, dann "walletTitle": "Google Wallet")' },
    scan: { default: true, doc: 'Scan-Rahmen und Haken über dem QR-Code zeigen (false: nur Karte und Stempel)' },
    rise: { default: true, doc: 'Das Handy fährt von unten herein. false: es steht schon da (für einen kurzen Teil nach einem Schnitt)' },
    drop: { default: true, doc: 'Die Karte fällt auf den Anker "card" in die Wallet. false: sie liegt schon drin, ohne Ton und ohne Anker' }
  },
  captions: { min: 1 },
  anchors: p => {
    const a = {
      ...(p.drop ? { card: { cap: 0, word: 4, doc: 'Die Karte fällt in die Wallet (Ton: pop). Auf "Karte" o. ä.' } } : {}),
      ...(p.scan ? {
        scan: { cap: 1, word: 0, doc: 'Scan-Rahmen und Scan-Linie starten (Ton: scan). Auf "scannen"' },
        ok: { cap: 1, word: 2, doc: 'Haken am QR-Code (Ton: ok). Auf "kein Download" o. ä.' }
      } : {})
    }
    for (let i = 0; i < Math.max(0, p.after - p.before); i++) a['stamp' + (i + 1)] = { cap: 2, word: STAMP_WORDS[i] ?? 9, doc: `Stempel ${i + 1} landet (Ton: pop, jeder etwas höher)` }
    return a
  },
  demo: { captions: [{ lines: ['Mit Stampit liegt', 'die Karte in Apple', 'und Google Wallet.'], accent: 6 }, { lines: ['Einmal scannen,', 'kein Download.'], accent: 2 }, { lines: ['Jeder Besuch', 'ein Stempel,', 'sofort auf dem Handy.'], accent: 4 }], at: { cap: 2, word: 4, offset: 0.5 } },
  css: `
  .wtitle { position: absolute; left: 34px; top: 84px; font: 700 40px var(--display); }
  .peek { position: absolute; left: 26px; width: 460px; height: 130px; border-radius: 28px; padding: 22px 26px; }
  .peek u { display: block; height: 12px; border-radius: 6px; background: rgba(255,255,255,.22); }
  .scard { position: absolute; left: 26px; top: 244px; width: 460px; padding: 28px; border-radius: 32px;
    background: linear-gradient(163deg, var(--card-from), var(--card-to)); box-shadow: 0 -14px 40px rgba(0,0,0,.4), inset 0 0 0 1.5px rgba(255,255,255,.12); }
  .shead { display: flex; align-items: center; gap: 16px; }
  .smark { width: 56px; height: 56px; border-radius: 15px; background: #fff; color: var(--card-to); display: grid; place-items: center; }
  .smark svg { width: 34px; }
  .sshop { font: 600 30px var(--display); white-space: nowrap; }
  .sloc { margin-left: auto; font: 600 12px var(--body); letter-spacing: .14em; opacity: .7; white-space: nowrap; }
  .sgrid { display: grid; justify-content: space-between; row-gap: 20px; margin-top: 26px; }
  .sslot { width: 104px; height: 104px; border-radius: 50%; border: 3px dashed rgba(255,255,255,.38); position: relative;
    display: grid; place-items: center; color: rgba(255,255,255,.35); }
  .sslot > svg { width: 50px; }
  .son { position: absolute; inset: -3px; border-radius: 50%; background: #fff; color: var(--card-to); display: grid; place-items: center; }
  .son svg { width: 52px; }
  .ripple { position: absolute; inset: -3px; border-radius: 50%; border: 5px solid #fff; opacity: 0; }
  .sreward { margin-top: 24px; font: 500 23px var(--body); }
  .qrwrap { position: relative; width: 150px; margin: 20px auto 0; }
  .qr { width: 150px; height: 150px; border-radius: 16px; background: #fff; padding: 11px; }
  .qr svg { width: 100%; height: 100%; display: block; }
  .brk { position: absolute; inset: -16px; opacity: 0; }
  .brk s { position: absolute; width: 34px; height: 34px; border: 6px solid var(--lilac); }
  .brk s:nth-child(1) { left: 0; top: 0; border-right: 0; border-bottom: 0; border-radius: 12px 0 0 0; }
  .brk s:nth-child(2) { right: 0; top: 0; border-left: 0; border-bottom: 0; border-radius: 0 12px 0 0; }
  .brk s:nth-child(3) { left: 0; bottom: 0; border-right: 0; border-top: 0; border-radius: 0 0 0 12px; }
  .brk s:nth-child(4) { right: 0; bottom: 0; border-left: 0; border-top: 0; border-radius: 0 0 12px 0; }
  .scanline { position: absolute; left: -10px; right: -10px; top: 0; height: 8px; border-radius: 4px; opacity: 0;
    background: var(--lilac); box-shadow: 0 0 22px 6px rgba(185,176,255,.8); }
  .okwrap { position: absolute; right: -30px; bottom: -26px; width: 62px; height: 62px; }
  .okbadge { width: 62px; height: 62px; border-radius: 50%; background: var(--lilac);
    color: var(--night); display: grid; place-items: center; opacity: 0; box-shadow: 0 8px 22px rgba(0,0,0,.4); }
  .okbadge svg { width: 32px; fill: none; stroke: currentColor; stroke-width: 3.4; stroke-linecap: round; stroke-linejoin: round; }
  .phone.android { border-radius: 58px; }
  .phone.android .screen { border-radius: 44px; }
  .punch { position: absolute; top: 24px; left: 50%; margin-left: -17px; width: 34px; height: 34px; border-radius: 50%; background: #000; box-shadow: inset 0 0 0 6px #14112E; }
  .gbar { position: absolute; bottom: 16px; left: 50%; margin-left: -70px; width: 140px; height: 8px; border-radius: 4px; background: rgba(255,255,255,.55); }
  `,
  build(ctx) {
    const { p, key, pop, cue, el } = ctx, { BACK, OUT } = ctx.ease
    if (!Number.isInteger(p.stamps) || p.stamps < 4 || p.stamps > 10) ctx.fail('"stamps" muss zwischen 4 und 10 liegen')
    if (!(p.before >= 0 && p.before <= p.after && p.after <= p.stamps)) ctx.fail('es muss gelten: 0 <= before <= after <= stamps')
    if (!['iphone', 'android'].includes(p.device)) ctx.fail('"device" ist "iphone" oder "android"')
    const android = p.device === 'android'
    ctx.html(`
      <div class="abs glow4"></div>
      <div class="abs phone${android ? ' android' : ''}"><div class="screen">
        ${android ? '<div class="punch"></div><div class="gbar"></div>' : '<div class="island"></div>'}
        <div class="wtitle"></div>
        <div class="peek" style="top:150px;background:#2A2452"><u style="width:150px"></u></div>
        <div class="peek" style="top:196px;background:#352D68"><u style="width:110px"></u></div>
        <div class="scard" data-safe="Wallet-Karte">
          <div class="shead" data-fit="Kopf der Wallet-Karte (Ladenname und Kürzel)"><span class="smark">${ctx.icon(p.icon)}</span><span class="sshop"></span><span class="sloc"></span></div>
          <div class="sgrid"></div>
          <div class="sreward" data-oneline="Belohnungszeile"></div>
          <div class="qrwrap">
            <div class="qr"></div>
            <div class="brk"><s></s><s></s><s></s><s></s><div class="scanline"></div></div>
            <div class="okwrap"><div class="okbadge"><svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></div></div>
          </div>
        </div>
      </div></div>`)
    ctx.$('.wtitle').textContent = p.walletTitle
    ctx.$('.sshop').textContent = p.shop
    ctx.$('.sloc').textContent = p.location
    ctx.$('.sreward').textContent = p.reward
    // Langer Ladenname: Schrift verkleinern statt das Kuerzel aus der Karte zu schieben
    const shopSize = ctx.fit('.sshop', 404 - 56 - 16 - ctx.$('.sloc').offsetWidth - (p.location ? 14 : 0), 18)
    // Unter 22 px (Vorgabe 30) ist der Name auf dem Handy kaum noch zu lesen: sagen, statt still zu schrumpfen.
    // Passt er auch bei 18 px nicht, schiebt er das Kuerzel aus der Karte; das meldet die Pruefung "ueberlauf".
    if (shopSize < 22) ctx.warn(`der Ladenname "${p.shop}" steht nur noch in ${shopSize} px (sonst 30). Namen oder Kürzel kürzen.`)

    // derselbe gezeichnete QR-Code wie auf der Landing Page (kein echter Code)
    const { m, size, quiet } = QR, side = size + quiet * 2
    let r = ''
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) if (m[y][x]) r += `<rect x="${x + quiet}" y="${y + quiet}" width="1.02" height="1.02"/>`
    ctx.$('.qr').innerHTML = `<svg viewBox="0 0 ${side} ${side}" shape-rendering="crispEdges"><g fill="${ctx.B.ink}">${r}</g></svg>`

    // Stempelraster: 6 Felder = 3 Spalten zu 104 px wie im ersten Video, mehr Felder werden kleiner
    const grid = ctx.$('.sgrid'), cols = stampCols(p.stamps), cell = cols <= 3 ? 104 : Math.floor((404 - (cols - 1) * 14) / cols), slots = []
    grid.style.gridTemplateColumns = `repeat(${cols}, ${cell}px)`
    for (let i = 0; i < p.stamps; i++) {
      const s = el('div', 'sslot', ctx.icon(p.icon)); const on = el('div', 'son', ctx.icon(p.icon)), rp = el('div', 'ripple')
      if (cell !== 104) {
        s.style.width = s.style.height = cell + 'px'
        s.firstElementChild.style.width = Math.round(cell * 50 / 104) + 'px'; on.firstElementChild.style.width = Math.round(cell * 52 / 104) + 'px'
      }
      s.append(rp, on); grid.append(s); slots.push({ on, rp })
    }

    // Handy faehrt hoch, die Karte faellt in die Wallet
    const s0 = ctx.s
    if (p.rise) key('.phone', [[s0, { translate: '0px 520px' }, OUT], [s0 + 0.7, { translate: '0px 0px' }]])
    // "drop": false - die Karte liegt schon in der Wallet. Ein Anker in der Vergangenheit ginge
    // dafuer nicht: sein Pop waere im Teil davor zu hoeren.
    if (p.drop) {
      const tc = ctx.at('card') - 0.1
      key('.scard', [[tc, { opacity: 0, translate: '0px -160px', scale: 0.92 }, BACK], [tc + 0.5, { opacity: 1, translate: '0px 0px', scale: 1 }]])
      cue(ctx.at('card') - 0.05, 'pop', 0.9, 0.7)
    }

    // "Einmal scannen": Rahmen und Scan-Linie ueber dem QR-Code, dann der Haken
    if (p.scan) {
      const ts = ctx.at('scan'), tk = ctx.at('ok')
      key('.brk', [[ts, { opacity: 0, scale: 1.25 }, OUT], [ts + 0.3, { opacity: 1, scale: 1 }], [tk + 0.5, { opacity: 1, scale: 1 }], [tk + 0.8, { opacity: 0, scale: 1 }]])
      key('.scanline', [[ts + 0.1, { opacity: 0, top: '0px' }], [ts + 0.2, { opacity: 1, top: '0px' }, 'ease-in-out'], [ts + 0.58, { opacity: 1, top: '174px' }, 'ease-in-out'], [ts + 0.94, { opacity: 1, top: '0px' }], [ts + 1.0, { opacity: 0, top: '0px' }]])
      cue(ts + 0.2, 'scan', 0.7)
      pop('.okbadge', tk, 0.4)
      key('.okwrap', [[tk + 2.2, { opacity: 1 }], [tk + 2.5, { opacity: 0 }]])
      cue(tk, 'ok', 0.8)
    }

    // "Jeder Besuch ein Stempel": einige waren schon da, die neuen kommen auf ihr Wort
    slots.forEach(({ on, rp }, i) => {
      if (i < p.before) return
      if (i >= p.after) { on.style.opacity = 0; return }
      const k = i - p.before, t = ctx.at('stamp' + (k + 1))
      key(on, [[t, { opacity: 0, scale: 0.3 }, BACK], [t + 0.4, { opacity: 1, scale: 1.06 }]])
      key(rp, [[t - 0.01, { opacity: 0, scale: 1 }], [t, { opacity: 0.9, scale: 1 }, OUT], [t + 0.7, { opacity: 0, scale: 1.9 }]])
      cue(t, 'pop', 0.9, PITCH(k))
    })
  }
}
