// Wochenleiste: ein kleiner Kalender, Woche fuer Woche, und an den Tagen, an denen
// der Stammkunde da war, ein Stempel. In einer Woche geht er stattdessen gegenueber:
// dort landet ein fremder Stempel in der Farbe des anderen Ladens, die eigenen Tage
// bleiben leer.
// Entstanden fuer das Doener-Video ("Zweimal die Woche war er bei dir. Dann hat er
// einmal gegenueber probiert."). Macht aus "Stammkunde" etwas Zaehlbares, bevor die
// Rechnung kommt.
//
// Die Farbe des Ladens gegenueber ist dieselbe wie in shop-duel (Orange): der Zuschauer
// soll den fremden Stempel dem Laden zuordnen, den er eben gesehen hat.
// Alle Klassen beginnen mit "wk-".
const DAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']
const PITCH = i => +(2 ** (i * 2 / 12)).toFixed(2)
const RIVAL = '#E58A45'

export default {
  title: 'Wochenleiste: Besuche des Stammkunden, eine Woche gegenüber',
  use: 'Zeigt, wie oft der Stammkunde kommt (Stempel an seinen Tagen, Woche für Woche) und die eine Woche, in der er stattdessen gegenüber war. Für "Zweimal die Woche war er bei dir".',
  params: {
    shop: { default: 'Café Nordwind', doc: 'Name des eigenen Ladens im Kopf der Leiste (höchstens etwa 24 Zeichen)', same: 'Ladenname' },
    icon: { default: 'cup', doc: 'Symbol in den eigenen Stempeln: cup, bread, scissors, star, heart, check, kebab', same: 'Symbol' },
    rivalIcon: { default: 'cup', doc: 'Symbol im fremden Stempel (Laden gegenüber)' },
    weeks: { default: 4, doc: 'Wochen untereinander, 3 bis 5' },
    days: { default: [1, 4], doc: 'Tage seiner Besuche je Woche (0 = Montag ... 6 = Sonntag), 1 bis 3 Tage' },
    filled: { default: 3, doc: 'So viele Wochen (von oben) tragen seine Stempel. Jede braucht einen Anker (week1, week2, ...)' },
    rivalWeek: { default: 4, doc: 'In dieser Woche (1 = oberste) war er gegenüber: dort landet der fremde Stempel, seine Tage bleiben leer. 0 = keine solche Woche' },
    rivalDay: { default: 2, doc: 'Tag des Besuchs gegenüber (0 = Montag)' },
    tones: { default: true, doc: 'Eigene Töne (pop je Stempel). false, wenn das Skript Klänge aus der Bibliothek setzt' }
  },
  captions: { min: 1 },
  anchors: p => {
    const a = {}
    for (let i = 0; i < p.filled; i++) a['week' + (i + 1)] = { cap: 0, word: i, doc: `Woche ${i + 1}: seine Stempel landen (Ton: pop)` }
    if (p.rivalWeek) a.rival = { cap: -1, word: -2, doc: 'Der fremde Stempel landet in der Woche gegenüber (Ton: pop, tiefer). Auf "gegenüber"' }
    return a
  },
  demo: {
    params: { shop: 'Döner Nordwind', icon: 'kebab', rivalIcon: 'kebab' },
    captions: [{ lines: ['Zweimal die Woche', 'war er bei dir.'], accent: 4 }, { lines: ['Dann hat er einmal', 'gegenüber probiert.'], accent: 4 }],
    at: { cap: -1, word: -1, offset: 0.6 }
  },
  css: `
  .wk { left: 90px; top: 600px; width: 760px; padding: 26px 13px 24px; border-radius: 36px; background: rgba(255,255,255,.06); border: 1.5px solid rgba(185,176,255,.3); }
  .wk-head { display: flex; align-items: center; gap: 16px; padding: 0 14px 18px; border-bottom: 1.5px solid rgba(255,255,255,.12); }
  .wk-head span { flex: none; width: 66px; height: 66px; border-radius: 17px; background: var(--brand); color: #fff; display: grid; place-items: center; }
  .wk-head span svg { width: 42px; }
  .wk-head b { font: 700 44px var(--display); letter-spacing: -.01em; white-space: nowrap; }
  .wk-row { display: grid; grid-template-columns: 160px repeat(7, 82px); align-items: center; height: 136px; border-radius: 22px; position: relative; }
  .wk-row.wk-days { height: 56px; margin-top: 10px; }
  .wk-row.wk-days i { font: 600 26px var(--body); font-style: normal; text-align: center; opacity: .6; }
  .wk-row > b { font: 600 30px var(--body); opacity: .75; padding-left: 14px; white-space: nowrap; }
  .wk-hl { position: absolute; inset: 6px 0; border-radius: 22px; background: rgba(229,138,69,.16); border: 2px solid rgba(229,138,69,.55); opacity: 0; }
  .wk-cell { width: 72px; height: 72px; margin: 0 auto; border-radius: 50%; position: relative; display: grid; place-items: center; }
  .wk-cell.day::before { content: ''; width: 12px; height: 12px; border-radius: 50%; background: rgba(255,255,255,.16); }
  .wk-cell.slot { border: 4px dashed rgba(185,176,255,.4); }
  .wk-st { position: absolute; inset: -4px; border-radius: 50%; background: var(--lilac); color: var(--night); display: grid; place-items: center; opacity: 0; box-shadow: 0 8px 18px rgba(0,0,0,.35); }
  .wk-st svg { width: 44px; }
  .wk-st.rv { background: ${RIVAL}; color: #fff; }
  .wk-rp { position: absolute; inset: -4px; border-radius: 50%; border: 5px solid #fff; opacity: 0; }
  `,
  build(ctx) {
    const { p, key, pop, cue, el } = ctx, { BACK, OUT } = ctx.ease
    if (!Number.isInteger(p.weeks) || p.weeks < 3 || p.weeks > 5) ctx.fail('"weeks" muss zwischen 3 und 5 liegen, mehr passen nicht zwischen Text und untere Sperrzone')
    if (!Array.isArray(p.days) || p.days.length < 1 || p.days.length > 3 || p.days.some(d => !Number.isInteger(d) || d < 0 || d > 6)) ctx.fail('"days" braucht 1 bis 3 Tage zwischen 0 (Montag) und 6 (Sonntag)')
    if (!Number.isInteger(p.filled) || p.filled < 0 || p.filled > p.weeks) ctx.fail(`"filled" muss zwischen 0 und ${p.weeks} liegen`)
    if (!Number.isInteger(p.rivalWeek) || p.rivalWeek < 0 || p.rivalWeek > p.weeks) ctx.fail(`"rivalWeek" muss zwischen 0 und ${p.weeks} liegen`)
    if (p.rivalWeek && p.rivalWeek <= p.filled) ctx.fail('"rivalWeek" muss nach den gefüllten Wochen liegen: in einer Woche mit seinen Stempeln war er ja bei dir')
    if (p.rivalWeek && (!Number.isInteger(p.rivalDay) || p.rivalDay < 0 || p.rivalDay > 6)) ctx.fail('"rivalDay" muss zwischen 0 und 6 liegen')

    ctx.html(`<div class="abs wk" data-safe="Wochenleiste"><div class="wk-head"><span>${ctx.icon(p.icon)}</span><b data-oneline="Ladenname in der Wochenleiste"></b></div>
      <div class="wk-row wk-days"><b></b>${DAYS.map(d => `<i>${d}</i>`).join('')}</div></div>`)
    const box = ctx.$('.wk'), name = ctx.$('.wk-head b')
    name.textContent = p.shop
    ctx.fit(name, 620, 26)
    const rows = []
    for (let w = 0; w < p.weeks; w++) {
      const row = el('div', 'wk-row'), label = el('b'); label.textContent = 'Woche ' + (w + 1)
      row.append(el('i', 'wk-hl'), label)
      const cells = []
      for (let d = 0; d < 7; d++) {
        const visit = p.days.includes(d), rv = w + 1 === p.rivalWeek && d === p.rivalDay
        const c = el('div', 'wk-cell ' + (visit ? 'slot' : rv ? '' : 'day'))
        if (visit && w < p.filled) c.append(el('div', 'wk-rp'), el('div', 'wk-st', ctx.icon(p.icon)))
        if (rv) c.append(el('div', 'wk-rp'), el('div', 'wk-st rv', ctx.icon(p.rivalIcon)))
        row.append(c); cells.push(c)
      }
      box.append(row); rows.push({ row, cells })
    }

    const land = (cell, t, k, pitch) => {
      const st = cell.querySelector('.wk-st'), rp = cell.querySelector('.wk-rp')
      key(st, [[t, { opacity: 0, scale: 1.7 }, BACK], [t + 0.3, { opacity: 1, scale: 1 }]])
      key(rp, [[t + 0.08, { opacity: 0, scale: 1 }], [t + 0.12, { opacity: 0.9, scale: 1 }, OUT], [t + 0.7, { opacity: 0, scale: 1.8 }]])
      if (p.tones) cue(t + 0.05, 'pop', 0.85, pitch)
    }
    // Seine Wochen: beide Stempel einer Woche kurz nacheinander, jede Woche einen Ton hoeher
    for (let w = 0; w < p.filled; w++) {
      const t = ctx.at('week' + (w + 1))
      p.days.forEach((d, i) => land(rows[w].cells[d], t + i * 0.14, w, PITCH(w + i)))
    }
    // Die Woche gegenueber: Zeile leuchtet in der fremden Farbe, der fremde Stempel faellt, seine Tage bleiben leer
    if (p.rivalWeek) {
      const t = ctx.at('rival'), r = rows[p.rivalWeek - 1]
      key(r.row.querySelector('.wk-hl'), [[t - 0.1, { opacity: 0 }, OUT], [t + 0.25, { opacity: 1 }]])
      land(r.cells[p.rivalDay], t, 0, 0.7)
      p.days.forEach(d => key(r.cells[d], [[t + 0.15, { opacity: 1 }], [t + 0.4, { opacity: 0.45 }]]))
    }
  }
}
