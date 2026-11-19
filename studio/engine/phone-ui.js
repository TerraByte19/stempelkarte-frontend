// phone-ui.js - flache Handy- und Fensterbilder, die sich ueber ein laufendes 3D-Bild legen (seit 19.11.2026, Fassung 2
// des Nachbaus "zwei Cafés"). Im Vorbild laeuft die 3D-Welt weiter, waehrend vorn ein schlichtes Handy oder Fenster zeigt,
// was beim Kunden oder beim Laden passiert. Unser phone-3d steht dagegen in einem eigenen Raum, und Fassung 1 sah damit
// "wie unsere alten Videos" aus. Deshalb hier HTML ueber der Leinwand des Bausteins: scharf, billig, und jede Bewegung
// ist eine angehaltene Web-Animation (ctx.key) oder wird in update(t) aus t gerechnet, haengt also nur an t.
//
//   const ui = await buildPhoneUi(ctx, { mode, shop, icon, accent, ..., t: { ... } })   ui.update(t, project) je Bild
//
// "wallet" (iso-shop): Scanner mit QR-Code (t.in), das Blatt mit der Karte und "Zu Apple Wallet hinzufügen" (t.add),
//   dann die Wallet mit der Karte (t.card); links ein durchgestrichenes Download-Zeichen (t.noApp, A2).
// "lock" (iso-street, C1): der Sperrbildschirm mit der Mitteilung der Karte im Wortlaut aus C1 ("Noch 2 Stempel bis:
//   Gratis-Kaffee"), t.in schiebt das Handy herein (Bildschirm noch schwarz), t.notify weckt ihn mit der Mitteilung.
//   Eine gestrichelte Linie fuehrt von einem leuchtenden Punkt auf der Strasse (dem Kunden, opts.dot, ein Weltpunkt)
//   zum Handy: so steht es im Vorbild, und es heisst "das ist sein Handy". Nie vom Laden aus (der Laden sieht nicht,
//   wo jemand ist, PRODUKT.md N2), nie "vibriert" (C1).
// "message" (iso-street, C3, seit 19.11.2026 Klasse 1): ein Fenster des Ladens ueber der abgedunkelten Strasse, die
//   Nachricht tippt sich (t.type bis t.send), "Senden" wird "Gesendet" (t.send), das Fenster geht (t.out), und ueber
//   Leuten auf der Strasse springen Mitteilungen der Karte mit derselben Nachricht auf (opts.spots, Weltpunkte).
//   Wortlaut nach PRODUKT.md C3: "Nachricht", nie "SMS" oder "WhatsApp" (N9), hoechstens 60 Zeichen.
//
// Lage: Handy rechts, x 548 bis 928 und y 730 bis 1530 (Vorbild: x 540 bis 930). Rechts bleibt es vor der Knopfspalte
// (ab x 950), unten ueber der Sperrzone (1536). Handy und Fenster tragen einen Pruefkasten, damit Knopfspalte und
// Sperrzonen sie sehen.
import { QR } from './qr.js'
import { ICONS } from './icons.js'

const CSS = `
.pui { position: absolute; left: 548px; top: 730px; width: 380px; height: 800px; border-radius: 60px; background: #050507;
  border: 3px solid #2C2F3A; box-shadow: 0 40px 90px rgba(0,0,0,.75), 0 0 0 2px #000; padding: 12px; opacity: 0; }
.pui-scr { position: relative; width: 100%; height: 100%; border-radius: 48px; overflow: hidden; background: #000; font-family: 'Hanken Grotesk', sans-serif; color: #fff; }
.pui-isl { position: absolute; left: 50%; top: 14px; width: 104px; height: 30px; margin-left: -52px; border-radius: 15px; background: #000; z-index: 5; }
.pui-pane { position: absolute; inset: 0; opacity: 0; }
.pui-top { position: absolute; left: 26px; right: 26px; top: 62px; display: flex; justify-content: space-between; font: 600 19px/1 'Hanken Grotesk', sans-serif; }
.pui-cam { background: radial-gradient(ellipse 80% 60% at 50% 45%, #3A3F55 0%, #15171F 60%, #08090D 100%); }
.pui-qr { position: absolute; left: 70px; top: 230px; width: 216px; height: 216px; background: #fff; border-radius: 10px; padding: 12px; }
.pui-qr svg { width: 100%; height: 100%; display: block; }
.pui-br { position: absolute; width: 56px; height: 56px; border: 6px solid #fff; }
.pui-line { position: absolute; left: 62px; width: 232px; height: 4px; border-radius: 2px; background: #6F8BFF; box-shadow: 0 0 18px #3D63FF; top: 236px; }
.pui-hint { position: absolute; left: 0; right: 0; top: 520px; text-align: center; font: 600 22px/1.3 'Hanken Grotesk', sans-serif; color: rgba(255,255,255,.8); }
.pui-sheet { background: #1C1C1F; }
.pui-card { position: absolute; left: 24px; right: 24px; border-radius: 18px; padding: 16px 16px 14px; box-shadow: 0 10px 30px rgba(0,0,0,.45); }
.pui-head { display: flex; align-items: center; gap: 10px; font: 700 21px/1 'Hanken Grotesk', sans-serif; }
.pui-head .ic { width: 34px; height: 34px; border-radius: 9px; background: rgba(255,255,255,.95); display: grid; place-items: center; flex: none; }
.pui-head .ic svg { width: 22px; height: 22px; }
.pui-head .n { flex: 1; white-space: nowrap; overflow: hidden; }
.pui-head .c { font: 700 17px/1 'Hanken Grotesk', sans-serif; opacity: .9; }
.pui-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 9px; margin: 16px 2px 12px; }
.pui-grid i { aspect-ratio: 1; border-radius: 50%; border: 2.5px solid rgba(255,255,255,.55); display: grid; place-items: center; }
.pui-grid i.on { background: #fff; border-color: #fff; }
.pui-grid i svg { width: 62%; height: 62%; }
.pui-rew { font: 600 15px/1.2 'Hanken Grotesk', sans-serif; opacity: .9; white-space: nowrap; }
.pui-sq { position: absolute; left: 50%; width: 120px; height: 120px; margin-left: -60px; background: #fff; border-radius: 10px; padding: 9px; }
.pui-sq svg { width: 100%; height: 100%; display: block; }
.pui-name { position: absolute; left: 0; right: 0; text-align: center; font: 700 22px/1.25 'Hanken Grotesk', sans-serif; }
.pui-name small { display: block; font: 500 16px/1.3 'Hanken Grotesk', sans-serif; color: rgba(255,255,255,.6); }
.pui-btn { position: absolute; left: 26px; right: 26px; height: 56px; border-radius: 28px; background: #fff; color: #000; display: flex; align-items: center; justify-content: center; gap: 10px;
  font: 700 19px/1 'Hanken Grotesk', sans-serif; white-space: nowrap; }
.pui-btn b { width: 26px; height: 20px; border-radius: 4px; background: linear-gradient(180deg, #2E8BF0 0 25%, #34C759 25% 50%, #FFB000 50% 75%, #FF3B30 75%); flex: none; }
.pui-wal { background: #000; }
.pui-wtitle { position: absolute; left: 26px; top: 64px; font: 700 30px/1 'Hanken Grotesk', sans-serif; }
.pui-plus { position: absolute; right: 26px; top: 62px; width: 34px; height: 34px; border-radius: 50%; border: 2.5px solid #fff; display: grid; place-items: center; font: 600 24px/1 'Hanken Grotesk', sans-serif; }
.pui-stack { position: absolute; left: 24px; right: 24px; height: 46px; border-radius: 14px 14px 0 0; }
.pui-veil { position: absolute; inset: 0; background: #03040A; opacity: 0; pointer-events: none; }
.pui-noapp { position: absolute; left: 150px; top: 1060px; width: 170px; height: 170px; border-radius: 40px; background: rgba(40,42,52,.92); border: 2px solid rgba(255,255,255,.18);
  display: grid; place-items: center; opacity: 0; box-shadow: 0 24px 50px rgba(0,0,0,.6); }
.pui-noapp svg { width: 96px; height: 96px; }
/* "lock": Sperrbildschirm wie im Vorbild (dunkles Blau, grosse Uhr, Mitteilung unten) */
.pui-lock { background: radial-gradient(ellipse 120% 70% at 50% 18%, #2A3C78 0%, #121A3A 45%, #05070F 100%); }
.pui-date { position: absolute; left: 0; right: 0; top: 104px; text-align: center; font: 600 21px/1 'Hanken Grotesk', sans-serif; color: rgba(255,255,255,.82); }
.pui-clock { position: absolute; left: 0; right: 0; top: 132px; text-align: center; font: 300 104px/1 'Hanken Grotesk', sans-serif; letter-spacing: -.02em; color: #F2F5FF; }
.pui-note { position: absolute; left: 16px; right: 16px; top: 470px; border-radius: 24px; padding: 16px 16px 16px 82px; min-height: 76px; background: rgba(60,66,92,.72);
  box-shadow: 0 10px 30px rgba(0,0,0,.35); color: #fff; }
.pui-note .ic { position: absolute; left: 16px; top: 16px; width: 52px; height: 52px; border-radius: 13px; display: grid; place-items: center; }
.pui-note .ic svg { width: 32px; height: 32px; }
.pui-note .hd { display: flex; justify-content: space-between; font: 700 19px/1.2 'Hanken Grotesk', sans-serif; }
.pui-note .hd small { font: 500 15px/1.2 'Hanken Grotesk', sans-serif; color: rgba(255,255,255,.6); }
.pui-note .bd { margin-top: 6px; font: 500 19px/1.28 'Hanken Grotesk', sans-serif; color: rgba(255,255,255,.92); }
.pui-dark { position: absolute; inset: 0; background: #000; }
.pui-link { position: absolute; left: 0; top: 0; width: 1080px; height: 1920px; overflow: visible; pointer-events: none; opacity: 0; }
.pui-dot { position: absolute; left: 0; top: 0; width: 26px; height: 26px; margin: -13px 0 0 -13px; border-radius: 50%; background: #9DB4FF;
  box-shadow: 0 0 0 6px rgba(80,120,255,.35), 0 0 34px 10px rgba(60,100,255,.75); opacity: 0; }
/* "message": Fenster des Ladens (weiss, wie im Vorbild) und kleine Mitteilungen ueber der Strasse */
.pui-win { position: absolute; left: 96px; top: 780px; width: 850px; border-radius: 30px; background: #FBFBFD; color: #12131A; padding: 30px 32px 28px;
  box-shadow: 0 40px 90px rgba(0,0,0,.6); opacity: 0; font-family: 'Hanken Grotesk', sans-serif; }
.pui-win .top { display: flex; align-items: center; gap: 18px; }
.pui-win .ic { width: 78px; height: 78px; border-radius: 16px; display: grid; place-items: center; flex: none; border: 2px solid #D9DCE8; }
.pui-win .ic svg { width: 38px; height: 38px; }
.pui-win .t1 { font: 700 40px/1.1 'Hanken Grotesk', sans-serif; }
.pui-win .t2 { font: 500 26px/1.3 'Hanken Grotesk', sans-serif; color: #7A7E90; }
.pui-win .lb { margin: 28px 0 12px; font: 700 20px/1 'Hanken Grotesk', sans-serif; letter-spacing: .16em; color: #9A9EAE; }
.pui-win .in { border: 2px solid #E2E4EE; border-radius: 16px; padding: 20px 22px; min-height: 44px; font: 500 38px/1.25 'Hanken Grotesk', sans-serif; white-space: nowrap; }
.pui-win .in span { opacity: 0; }
.pui-win .in i { display: inline-block; width: 3px; height: 40px; background: #12131A; vertical-align: -5px; margin-left: 2px; }
.pui-win .row { display: flex; justify-content: flex-end; margin-top: 24px; }
.pui-win .send { position: relative; height: 70px; min-width: 220px; border-radius: 35px; background: #2446E8; color: #fff; font: 700 29px/70px 'Hanken Grotesk', sans-serif; text-align: center; }
.pui-win .send b { position: absolute; inset: 0; font-weight: 700; }
.pui-win .send b + b { opacity: 0; }
.pui-pop { position: absolute; left: 0; top: 0; width: 330px; border-radius: 20px; padding: 13px 16px 13px 70px; background: rgba(28,32,48,.9); border: 1.5px solid rgba(255,255,255,.12);
  color: #fff; box-shadow: 0 16px 40px rgba(0,0,0,.55); opacity: 0; transform-origin: 50% 100%; font-family: 'Hanken Grotesk', sans-serif; }
.pui-pop .ic { position: absolute; left: 14px; top: 14px; width: 44px; height: 44px; border-radius: 11px; display: grid; place-items: center; }
.pui-pop .ic svg { width: 28px; height: 28px; }
.pui-pop .hd { display: flex; justify-content: space-between; font: 700 18px/1.2 'Hanken Grotesk', sans-serif; }
.pui-pop .hd small { font: 500 14px/1.2 'Hanken Grotesk', sans-serif; color: rgba(255,255,255,.6); }
.pui-pop .bd { margin-top: 4px; font: 500 18px/1.25 'Hanken Grotesk', sans-serif; color: rgba(255,255,255,.9); white-space: nowrap; }
`

const svgIcon = (name, color, sw = 2) => `<svg viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${ICONS[name]}</svg>`
const qrSvg = () => {
  const n = QR.size
  let r = ''
  QR.m.forEach((row, y) => row.forEach((v, x) => { if (v) r += `<rect x="${x}" y="${y}" width="1.02" height="1.02"/>` }))
  return `<svg viewBox="0 0 ${n} ${n}" shape-rendering="crispEdges" fill="#111"><g>${r}</g></svg>`
}

// Gedankenstriche (Geviert und Halbgeviert) sind in Texten fuer Nutzer nicht erlaubt (Hausregel, wie checks.mjs)
const DASH = /[\u2012-\u2015]/
export const MODES = ['wallet', 'lock', 'message']

// host (seit 20.11.2026, Fassung 3 des Nachbaus): ein eigenes Element, in das dieses Bild kommt und in dem es seine Teile
// sucht. Warum: in Fassung 3 laufen Wallet, Sperrbildschirm und Fenster in EINEM Teil (eine durchgehende Kamerafahrt
// statt sechs Ueberblendungen); ohne host faende ctx.$('.pui') beim zweiten Handy das erste. Ohne host wie vorher.
// tones: false laesst die eigenen Toene weg (whoosh, scan, pop, ding, ok). Das Vorbild hat ausser der Stimme nur drei
// leise Effekte, Fassung 2 hatte mit diesen Toenen ueber zwanzig (Review 20.11.2026).
export async function buildPhoneUi(ctx, { mode = 'wallet', shop, icon, accent, stamps = 10, have = 3, reward = 'Gratis-Kaffee', left = 2, clock = '19:12', date = '', message = '', dot = null, spots = [], t, host = null, tones = true, veil = 0.55 }) {
  if (!MODES.includes(mode)) ctx.fail(`flaches Handy: "${mode}" gibt es nicht. Erlaubt: ${MODES.join(', ')}`)
  if (!document.getElementById('phone-ui-css')) { const st = document.createElement('style'); st.id = 'phone-ui-css'; st.textContent = CSS; document.head.append(st) }
  const D = host ? { html: h => host.insertAdjacentHTML('beforeend', h), $: q => host.querySelector(q), $$: q => [...host.querySelectorAll(q)] } : { html: ctx.html, $: ctx.$, $$: ctx.$$ }
  const cue = (...a) => { if (tones) ctx.cue(...a) }
  if (mode === 'lock') return lock(ctx, D, cue, { shop, icon, accent, reward, left, clock, date, dot, t })
  if (mode === 'message') return messageUi(ctx, D, cue, { shop, icon, accent, message, spots, t, veil })
  if (!(t.add > t.in + 0.3 && t.card > t.add + 0.3)) ctx.fail(`flaches Handy: Anker "ui", "uiAdd", "uiCard" brauchen je mindestens 0,3 s Abstand (jetzt ${t.in.toFixed(2)}, ${t.add.toFixed(2)}, ${t.card.toFixed(2)} s)`)
  if (/[‒-―]/.test(shop + reward)) ctx.fail('flaches Handy: Ladenname oder Belohnung enthält einen Gedankenstrich. Normalen Bindestrich nehmen.')
  const E = ctx.ease
  // Farbe der Karte: die Ladenfarbe, nach unten etwas dunkler (wie eine Wallet-Karte)
  const cardBg = `linear-gradient(180deg, ${accent} 0%, color-mix(in srgb, ${accent} 78%, #000) 100%)`
  const grid = on => Array.from({ length: stamps }, (_, i) => `<i class="${i < on ? 'on' : ''}">${i < on ? svgIcon(icon, accent, 2.4) : ''}</i>`).join('')
  const card = (top, on, qr) => `<div class="pui-card" style="top:${top}px;background:${cardBg}" data-card>
      <div class="pui-head"><span class="ic">${svgIcon(icon, accent, 2.2)}</span><span class="n">${shop}</span><span class="c">${on}/${stamps}</span></div>
      <div class="pui-grid">${grid(on)}</div><div class="pui-rew">${stamps} Stempel = 1 ${reward}</div>${qr ? '' : ''}</div>`
  const br = (x, y, sides) => `<div class="pui-br" style="left:${x}px;top:${y}px;${sides}"></div>`
  D.html(`<div class="abs pui" data-safe="Handy"><div class="pui-scr"><div class="pui-isl"></div>
    <div class="pui-pane pui-cam" data-pane="scan">
      <div class="pui-top"><span>Abbrechen</span><span></span></div>
      <div class="pui-qr">${qrSvg()}</div>
      ${br(52, 212, 'border-right:0;border-bottom:0;border-top-left-radius:14px')}${br(248, 212, 'border-left:0;border-bottom:0;border-top-right-radius:14px')}
      ${br(52, 408, 'border-right:0;border-top:0;border-bottom-left-radius:14px')}${br(248, 408, 'border-left:0;border-top:0;border-bottom-right-radius:14px')}
      <div class="pui-line"></div>
      <div class="pui-hint">QR-Code scannen</div>
    </div>
    <div class="pui-pane pui-sheet" data-pane="add">
      <div class="pui-top"><span style="color:rgba(255,255,255,.7)">Abbrechen</span><span style="color:#5C8DFF">Hinzufügen</span></div>
      ${card(110, 0)}
      <div class="pui-sq" style="top:400px">${qrSvg()}</div>
      <div class="pui-name" style="top:545px">${shop}<small>Stempelkarte</small></div>
      <div class="pui-btn" style="top:650px"><b></b>Zu Apple Wallet hinzufügen</div>
    </div>
    <div class="pui-pane pui-wal" data-pane="card">
      <div class="pui-wtitle">Wallet</div><div class="pui-plus">+</div>
      <div class="pui-stack" style="top:128px;background:#3A4A40"></div><div class="pui-stack" style="top:162px;background:#5A2A3A"></div>
      <div data-drop>${card(196, have)}</div>
    </div>
  </div></div>
  <div class="abs pui-noapp" data-safe="Kein Download">${'<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v10"/><path d="M8 10l4 4 4-4"/><path d="M5 19h14"/><path d="M4 3l16 18" stroke="#fff" stroke-width="2.4"/></svg>'}</div>`)
  const pui = D.$('.pui'), pane = n => D.$(`[data-pane="${n}"]`)
  // Hereinschieben von rechts mit leichtem Ueberschwingen, wie im Vorbild (rund 0,45 s)
  // t.out (seit 20.11.2026, Fassung 3): Handy und Download-Zeichen blenden bis t.out aus (0,3 s), wenn die Kamera im selben
  // Teil zurueck auf die Strasse faehrt (im Vorbild 15,5 s). Ohne t.out bleiben sie bis zum Ende des Teils, wie vorher.
  if (t.out != null && !(t.out > t.card + 0.3 && (t.noApp == null || t.out > t.noApp + 0.3))) ctx.fail(`flaches Handy: "out" mindestens 0,3 s nach "uiCard" und "uiNoApp" (jetzt ${t.out.toFixed(2)} s)`)
  const outFr = t.out != null ? [[t.out - 0.3, { opacity: 1, translate: '0px 0px' }], [t.out, { opacity: 0, translate: '0px 0px' }]] : []
  ctx.key(pui, [[t.in - 0.05, { opacity: 0, translate: '420px 0px' }, E.OUT], [t.in + 0.4, { opacity: 1, translate: '0px 0px' }], ...outFr])
  ctx.key(pane('scan'), [[t.in - 0.05, { opacity: 1 }], [t.add - 0.08, { opacity: 1 }], [t.add + 0.08, { opacity: 0 }]])
  ctx.key(D.$('.pui-line'), [[t.in + 0.2, { translate: '0px 0px' }], [t.in + 0.2 + (t.add - t.in) * 0.55, { translate: '0px 200px' }], [t.add, { translate: '0px 40px' }]])
  ctx.key(pane('add'), [[t.add - 0.08, { opacity: 0 }], [t.add + 0.08, { opacity: 1 }], [t.card - 0.08, { opacity: 1 }], [t.card + 0.08, { opacity: 0 }]])
  // Knopf wird kurz gedrueckt, kurz bevor die Wallet kommt
  ctx.key(D.$('.pui-btn'), [[t.card - 0.3, { scale: 1 }], [t.card - 0.18, { scale: 0.94 }], [t.card - 0.04, { scale: 1 }]])
  ctx.key(pane('card'), [[t.card - 0.08, { opacity: 0 }], [t.card + 0.08, { opacity: 1 }]])
  ctx.key(D.$('[data-drop]'), [[t.card, { translate: '0px -150px', opacity: 0 }, E.OUT], [t.card + 0.45, { translate: '0px 0px', opacity: 1 }]])
  cue(t.in + 0.05, 'whoosh', 0.3); cue(t.add, 'scan', 0.5); cue(t.card + 0.3, 'pop', 0.7)
  if (t.noApp != null) {
    ctx.key(D.$('.pui-noapp'), [[t.noApp - 0.03, { opacity: 0, scale: 0.4 }, E.BACK], [t.noApp + 0.35, { opacity: 1, scale: 1 }], ...(t.out != null ? [[t.out - 0.3, { opacity: 1, scale: 1 }], [t.out, { opacity: 0, scale: 1 }]] : [])])
    cue(t.noApp, 'pop', 0.5, 0.8)
  }
  return { update() {} }
}



// Wortlaut der Mitteilung auf dem Sperrbildschirm, genau wie C1 (Backend: ApplePassService), Stempel Einzahl wie Mehrzahl
export const lockText = (left, reward) => left > 0 ? `Noch ${left} Stempel bis: ${reward}` : `${reward} wartet auf dich`

// Punkt in der Welt -> Stelle im Bild, oder null, wenn er hinter der Kamera liegt
const at = (project, p) => { const r = project(p); return r && Number.isFinite(r[0]) && Number.isFinite(r[1]) ? r : null }

// "lock" (C1): Handy rechts, Bildschirm erst schwarz, auf t.notify der Sperrbildschirm mit der Mitteilung der Karte
function lock(ctx, D, cue, { shop, icon, accent, reward, left, clock, date, dot, t }) {
  if (!(t.notify > t.in + 0.3)) ctx.fail(`flaches Handy "lock": Anker "uiNotify" mindestens 0,3 s nach "ui" (jetzt ${t.in.toFixed(2)} und ${t.notify.toFixed(2)} s)`)
  const msg = lockText(left, reward)
  if (DASH.test(shop + msg + clock + date)) ctx.fail('flaches Handy: Ladenname, Belohnung oder Datum enthält einen Gedankenstrich. Normalen Bindestrich nehmen.')
  if (/vibrier|brumm|summ/i.test(msg)) ctx.fail('Die Mitteilung sagt nie, dass das Handy vibriert (PRODUKT.md, C1)')
  const E = ctx.ease
  D.html(`<svg class="pui-link" viewBox="0 0 1080 1920"><path d="" fill="none" stroke="#8FA8FF" stroke-width="3.5" stroke-dasharray="10 12" stroke-linecap="round"/></svg>
    <div class="pui-dot"></div>
    <div class="abs pui" data-safe="Handy"><div class="pui-scr"><div class="pui-isl"></div>
    <div class="pui-pane pui-lock" style="opacity:1">
      <div class="pui-date">${date}</div><div class="pui-clock">${clock}</div>
      <div class="pui-note" data-note><span class="ic" style="background:${accent}">${svgIcon(icon, '#FFFFFF', 2.2)}</span>
        <div class="hd"><span>${shop}</span><small>Wallet</small></div><div class="bd">${msg}</div></div>
    </div>
    <div class="pui-dark" data-dark></div>
  </div></div>`)
  const pui = D.$('.pui')
  // t.out (seit 20.11.2026, Fassung 3): das Handy blendet bis t.out aus (0,25 s), mit Punkt und Linie. Warum: in Fassung 2
  // schien das Handy samt Uhr durch das weisse Fenster der Nachricht, das gleich danach einblendet (Doppelbild bei
  // 20,3 s). Ohne t.out bleibt das Handy bis zum Ende des Teils stehen, wie vorher.
  if (t.out != null && !(t.out > t.notify + 0.3)) ctx.fail(`flaches Handy "lock": "out" mindestens 0,3 s nach "uiNotify" (jetzt ${t.notify.toFixed(2)} und ${t.out.toFixed(2)} s)`)
  const outK = tt => t.out == null ? 1 : Math.max(0, Math.min(1, (t.out - tt) / 0.25))
  ctx.key(pui, [[t.in - 0.05, { opacity: 0, translate: '420px 0px' }, E.OUT], [t.in + 0.4, { opacity: 1, translate: '0px 0px' }], ...(t.out != null ? [[t.out - 0.25, { opacity: 1, translate: '0px 0px' }], [t.out, { opacity: 0, translate: '0px 0px' }]] : [])])
  // Der Bildschirm wacht mit der Mitteilung auf (im Vorbild: erst schwarz, dann 9:41 mit der Mitteilung)
  ctx.key(D.$('[data-dark]'), [[t.notify - 0.02, { opacity: 1 }], [t.notify + 0.25, { opacity: 0 }]])
  ctx.key(D.$('[data-note]'), [[t.notify + 0.1, { opacity: 0, translate: '0px 30px' }, E.OUT], [t.notify + 0.45, { opacity: 1, translate: '0px 0px' }]])
  cue(t.in + 0.05, 'whoosh', 0.3); cue(t.notify + 0.12, 'ding', 0.6)
  const path = D.$('.pui-link path'), link = D.$('.pui-link'), dotEl = D.$('.pui-dot')
  // Ende der Linie: linke Kante der Mitteilung im Handy (Handy x 548, Mitteilung ab y 730 + 12 + 470)
  const END = [560, 1250]
  return {
    update(tt, project) {
      if (!dot || !project) return
      const k = Math.max(0, Math.min(1, (tt - t.notify + 0.35) / 0.3)), q = at(project, dot)
      dotEl.style.opacity = q ? String(Math.min(1, Math.max(0, (tt - t.in) / 0.4)) * outK(tt)) : '0'
      link.style.opacity = q ? (k * outK(tt)).toFixed(3) : '0'
      if (!q) return
      dotEl.style.transform = `translate(${q[0].toFixed(1)}px, ${q[1].toFixed(1)}px)`
      // Linie waechst vom Punkt zum Handy, leicht gebogen
      const ex = q[0] + (END[0] - q[0]) * k, ey = q[1] + (END[1] - q[1]) * k, mx = (q[0] + ex) / 2, my = Math.min(q[1], ey) - 60
      path.setAttribute('d', `M${q[0].toFixed(1)} ${q[1].toFixed(1)} Q${mx.toFixed(1)} ${my.toFixed(1)} ${ex.toFixed(1)} ${ey.toFixed(1)}`)
    }
  }
}

// "message" (C3): Fenster des Ladens, die Nachricht tippt sich, Senden, dann Mitteilungen ueber der Strasse
function messageUi(ctx, D, cue, { shop, icon, accent, message, spots, t, veil = 0.55 }) {
  if (!message || message.length > 60) ctx.fail('flaches Fenster "message": "message" braucht einen kurzen Text (1 bis 60 Zeichen), z. B. "Frischer Kuchen ist da!"')
  if (DASH.test(shop + message)) ctx.fail('flaches Fenster: Ladenname oder Nachricht enthält einen Gedankenstrich. Normalen Bindestrich nehmen.')
  if (/\b(sms|whatsapp)\b/i.test(message)) ctx.fail('Die Nachricht heißt nie SMS oder WhatsApp (PRODUKT.md N9)')
  if (/vibrier|brumm|summ/i.test(message)) ctx.fail('Die Nachricht sagt nie, dass das Handy vibriert (PRODUKT.md, C1)')
  if (!(t.type >= t.in && t.send > t.type + 0.4 && t.out > t.send + 0.2)) ctx.fail(`flaches Fenster "message": Anker "ui", "uiType", "uiSend", "uiOut" in dieser Reihenfolge, Tippen mindestens 0,4 s (jetzt ${[t.in, t.type, t.send, t.out].map(x => x.toFixed(2)).join(', ')} s)`)
  const E = ctx.ease
  const chars = [...message].map(c => `<span>${c === ' ' ? '&nbsp;' : c.replace(/[<&>]/g, '')}</span>`).join('')
  D.html(`<div class="pui-veil"></div><div class="abs pui-win" data-safe="Nachricht">
      <div class="top"><span class="ic">${svgIcon(icon, accent, 2.2)}</span><div><div class="t1">${shop}</div><div class="t2">Nachricht an deine Kunden</div></div></div>
      <div class="lb">NEUE NACHRICHT</div>
      <div class="in">${chars}<i></i></div>
      <div class="row"><div class="send"><b>Senden</b><b>Gesendet \u2713</b></div></div>
    </div>`)
  const win = D.$('.pui-win')
  // Weiche Blende wie im Vorbild (19,7 s): Strasse dunkelt ab, Fenster blendet ein und wird dabei scharf
  // veil: wie stark die Strasse abdunkelt (Vorgabe 0,55 wie bisher). iso-street "reise" nimmt weniger: dort war die Strasse hinter
  // dem Fenster fast schwarz, im Vorbild bleibt sie gedimmt lesbar (Review Fassung 3, Runde 1)
  ctx.key(D.$('.pui-veil'), [[t.in - 0.1, { opacity: 0 }], [t.in + 0.3, { opacity: veil }], [t.out, { opacity: veil }], [t.out + 0.35, { opacity: 0 }]])
  ctx.key(win, [[t.in, { opacity: 0, scale: 0.94, filter: 'blur(8px)' }, E.OUT], [t.in + 0.35, { opacity: 1, scale: 1, filter: 'blur(0px)' }], [t.out, { opacity: 1, scale: 1, filter: 'blur(0px)' }], [t.out + 0.3, { opacity: 0, scale: 0.97, filter: 'blur(6px)' }]])
  // Tippen: Zeichen fuer Zeichen gleichmaessig zwischen "uiType" und kurz vor "uiSend"
  const spans = D.$$('.pui-win .in span'), dt = (t.send - 0.25 - t.type) / spans.length
  spans.forEach((sp, i) => ctx.key(sp, [[t.type + i * dt, { opacity: 0 }], [t.type + i * dt + 0.01, { opacity: 1 }]]))
  // Schreibmarke blinkt, bis gesendet ist
  const caret = D.$('.pui-win .in i'), cf = []
  for (let x = t.in, on = 1; x < t.send; x += 0.27, on = 1 - on) cf.push([x, { opacity: on }])
  cf.push([t.send, { opacity: 0 }]); ctx.key(caret, cf)
  const [b1, b2] = D.$$('.pui-win .send b')
  ctx.key(D.$('.pui-win .send'), [[t.send - 0.12, { scale: 1 }], [t.send - 0.04, { scale: 0.93 }], [t.send + 0.08, { scale: 1 }]])
  ctx.key(b1, [[t.send, { opacity: 1 }], [t.send + 0.12, { opacity: 0 }]])
  ctx.key(b2, [[t.send, { opacity: 0 }], [t.send + 0.12, { opacity: 1 }]])
  cue(t.in + 0.05, 'whoosh', 0.25); cue(t.send, 'ok', 0.55)
  // Mitteilungen ueber Leuten auf der Strasse: springen nacheinander auf, kurz nachdem das Fenster weg ist
  const pops = spots.map((p, i) => {
    const e = ctx.el('div', 'pui-pop')
    e.innerHTML = `<span class="ic" style="background:${accent}">${svgIcon(icon, '#FFFFFF', 2.2)}</span><div class="hd"><span>${shop}</span><small>jetzt</small></div><div class="bd"></div>`
    e.querySelector('.bd').textContent = message
    D.$('.pui-win').parentNode.append(e)
    return { e, p, t0: t.out + 0.35 + i * 0.14 }
  })
  pops.forEach((x, i) => { if (i < 3) cue(x.t0, 'pop', 0.45, 1 + i * 0.12) })
  const back = x => { x = Math.max(0, Math.min(1, x)); const u = x - 1; return 1 + 2.7 * u * u * u + 1.7 * u * u }
  return {
    update(tt, project) {
      // t.popOut (seit 20.11.2026, Fassung 3): die Mitteilungen gehen wieder (0,3 s), wenn die Kamera im selben Teil weiterfaehrt.
      // In Fassung 3 standen sie sonst bis zum Schluss ueber dem leeren Café und dem Namen. Ohne popOut bleiben sie wie vorher.
      const gone = t.popOut == null ? 1 : Math.max(0, 1 - (tt - t.popOut) / 0.3)
      for (const x of pops) {
        const k = back((tt - x.t0) / 0.32) * (gone < 1 ? gone * gone * (3 - 2 * gone) : 1), q = project ? at(project, x.p) : null
        if (!(k > 0.01) || !q) { x.e.style.opacity = '0'; continue }
        x.e.style.opacity = Math.min(1, k).toFixed(3)
        // Im Bild halten: die Mitteilung schwebt ueber dem Menschen, darf aber nicht aus dem Bild ragen (sie ist 330 px
        // breit; ohne das ragte die am Rand halb hinaus)
        const half = 165 * Math.min(1.15, k), px = Math.min(1060 - half, Math.max(20 + half, q[0])), py = Math.max(380, q[1])
        x.e.style.transform = `translate(${px.toFixed(1)}px, ${py.toFixed(1)}px) translate(-50%, -100%) scale(${Math.min(1.15, k).toFixed(3)})`
      }
    }
  }
}
