// Sperrbildschirm: die Karte meldet sich von selbst, das Handy brummt, eine
// Ortsnadel zeigt "in Ladennaehe". Der Beweis-Moment des ersten Videos.
export default {
  title: 'Sperrbildschirm mit Benachrichtigung',
  use: 'Die Karte erinnert von selbst: Benachrichtigung auf dem Sperrbildschirm, in der Nähe des Ladens.',
  params: {
    clock: { default: '08:14', doc: 'Uhrzeit auf dem Sperrbildschirm' },
    date: { default: 'Donnerstag, 10. September', doc: 'Datumszeile über der Uhr: Wochentag, Tag und Monat, ohne Jahr (höchstens 25 Zeichen, das reicht für jedes Datum; mit Jahr stößt sie an die Ortsnadel)' },
    title: { default: 'Café Nordwind', doc: 'Absender der Benachrichtigung (Name des Ladens). Lange Namen werden kleiner gesetzt, höchstens etwa 24 Zeichen, sonst läuft er in die Zeitangabe', same: 'Ladenname' },
    body: { default: '6 von 6, dein Kaffee wartet', doc: 'Text der Benachrichtigung, höchstens zwei Zeilen, zusammen etwa 50 Zeichen' },
    when: { default: 'jetzt', doc: 'Zeitangabe rechts oben in der Benachrichtigung' },
    icon: { default: 'cup', doc: 'Symbol im Absender-Feld: cup, bread, scissors, star, heart, check', same: 'Symbol' },
    pin: { default: true, doc: 'Ortsnadel mit Wellen zeigen ("in Ladennähe")' }
  },
  captions: { min: 1 },
  anchors: p => ({
    notify: { cap: 0, word: 4, doc: 'Die Benachrichtigung fällt herein, das Handy brummt (Töne: ding, buzz). Auf "meldet"' },
    ...(p.pin ? { pin: { cap: 0, word: 9, doc: 'Die Ortsnadel erscheint (Ton: pop). Auf "in Ladennähe"' } } : {})
  }),
  demo: { captions: [{ lines: ['Ist die Karte voll,', 'meldet sie sich von', 'selbst, in Ladennähe.'], accent: 4 }] },
  css: `
  .lock { background: linear-gradient(165deg, #4338A0 0%, #1E1650 55%, #0B0822 100%); }
  .ldate { position: absolute; left: 0; right: 0; top: 108px; text-align: center; font: 500 27px var(--body); opacity: .9; }
  .lclock { position: absolute; left: 0; right: 0; top: 136px; text-align: center; font: 600 138px/1.1 var(--display); letter-spacing: -.02em; }
  .notif { position: absolute; left: 20px; right: 20px; top: 350px; padding: 20px; border-radius: 30px; background: rgba(255,255,255,.2);
    box-shadow: 0 18px 40px rgba(0,0,0,.35), inset 0 0 0 1.5px rgba(255,255,255,.22); display: flex; gap: 18px; align-items: center; opacity: 0; }
  .nsw { flex: none; width: 78px; height: 78px; border-radius: 19px; background: linear-gradient(163deg, var(--card-from), var(--card-to)); display: grid; place-items: center; }
  .nsw svg { width: 44px; }
  .notif b { display: block; font: 700 27px var(--body); }
  .notif i { display: block; font: 500 25px/1.25 var(--body); font-style: normal; opacity: .92; margin-top: 4px; }
  .notif em { position: absolute; right: 22px; top: 18px; font: 500 19px var(--body); font-style: normal; opacity: .6; }
  .pin { left: 770px; top: 600px; width: 150px; height: 150px; z-index: 6; }
  .pin svg { position: absolute; inset: 0; filter: drop-shadow(0 14px 20px rgba(0,0,0,.45)); }
  .pring { position: absolute; left: 75px; top: 132px; width: 0; height: 0; }
  .pring s { position: absolute; left: -110px; top: -40px; width: 220px; height: 80px; border-radius: 50%; border: 5px solid var(--lilac); opacity: 0; }
  `,
  build(ctx) {
    const { p, key, loop, cue } = ctx, { BACK, OUT } = ctx.ease
    ctx.html(`
      <div class="abs glow4"></div>
      <div class="abs phone"><div class="screen lock">
        <div class="island"></div>
        <div class="ldate" data-safe="Datum" data-oneline="Datum" data-apart="datum-nadel" data-label="Datum"></div>
        <div class="lclock" data-safe="Uhr"></div>
        <div class="notif" data-safe="Benachrichtigung"><span class="nsw">${ctx.icon(p.icon)}</span><span><b data-oneline="Absender der Benachrichtigung" data-apart="kopf" data-label="Absender"></b><i data-maxlines="Text der Benachrichtigung" data-max="2"></i></span><em data-apart="kopf" data-label="Zeitangabe"></em></div>
      </div></div>
      ${p.pin ? `<div class="abs pin"><div class="pring"><s data-apart="datum-nadel" data-label="Ortsnadel (Wellen)"></s><s></s></div>
        <svg viewBox="0 0 150 150"><path fill="${ctx.B.lilac}" d="M75 8 C47 8 26 29 26 56 C26 92 75 138 75 138 C75 138 124 92 124 56 C124 29 103 8 75 8 Z"/><circle cx="75" cy="56" r="20" fill="${ctx.B.night2}"/></svg>
      </div>` : ''}`)
    ctx.$('.ldate').textContent = p.date
    ctx.$('.lclock').textContent = p.clock
    ctx.$('.notif b').textContent = p.title
    ctx.$('.notif i').textContent = p.body
    ctx.$('.notif em').textContent = p.when
    // Langer Ladenname: Schrift verkleinern, statt in die Zeitangabe rechts oben zu laufen.
    // Reicht auch das nicht, meldet die Pruefung "ueberdeckung" den Rest.
    const b = ctx.$('.notif b'), em = ctx.$('.notif em')
    ctx.fit(b, em.offsetLeft - b.offsetLeft - 16, 20)

    const s0 = ctx.s, tn = ctx.at('notify') - 0.1
    key('.phone', [[s0, { translate: '0px 520px' }, OUT], [s0 + 0.7, { translate: '0px 0px' }]])
    key('.notif', [[tn, { opacity: 0, translate: '0px -150px', scale: 0.9 }, BACK], [tn + 0.5, { opacity: 1, translate: '0px 0px', scale: 1 }]])
    cue(ctx.at('notify') - 0.05, 'ding')
    // das Handy brummt kurz
    key('.phone', [[tn + 0.1, { rotate: '0deg' }], [tn + 0.17, { rotate: '-1.6deg' }], [tn + 0.24, { rotate: '1.6deg' }], [tn + 0.31, { rotate: '-1.1deg' }], [tn + 0.38, { rotate: '1.1deg' }], [tn + 0.46, { rotate: '0deg' }]])
    cue(ctx.at('notify') + 0.05, 'buzz', 0.6)
    if (p.pin) {
      const tp = ctx.at('pin') - 0.1
      key('.pin', [[tp, { opacity: 0, translate: '0px -90px' }, BACK], [tp + 0.5, { opacity: 1, translate: '0px 0px' }]])
      ctx.$$('.pring s').forEach((r, i) => loop(r, [{ opacity: 0.9, scale: 0.2 }, { opacity: 0, scale: 1.5 }], 1.6, i * 0.8))
      // Ringe erst zeigen, wenn die Nadel da ist
      key('.pring', [[tp + 0.3, { opacity: 0 }], [tp + 0.5, { opacity: 1 }]])
      cue(ctx.at('pin') - 0.05, 'pop', 0.8, 1.1)
    }
  }
}
