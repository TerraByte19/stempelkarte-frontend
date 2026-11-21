// Gestrichelter Umriss eines Gastes an der Theke, dazu ein Schildchen
// ("5 von 6 Stempeln"): der Kunde, der fast Stammgast war und von dem der
// Laden nie erfahren hat. Im ersten Video der zweite Teil von Szene 3.
export default {
  title: 'Der Gast, der fast Stammgast war',
  use: 'Macht den unsichtbaren Verlust sichtbar: mit Papier weiß der Laden nicht, wer kurz vor der vollen Karte stand.',
  params: {
    chip: { default: '5 von 6 Stempeln', doc: 'Text auf dem Schildchen am Kopf. Leer lassen ("") für kein Schildchen' }
  },
  captions: { min: 1 },
  // ohne Schildchen gibt es auch keinen Anker dafuer - sonst warnt der Bau wegen eines Zeitpunkts, den niemand braucht
  anchors: p => (p.chip ? {
    chip: { cap: 0, word: 6, doc: 'Das Schildchen springt auf (Ton: pop). Auf das Wort legen, das den Fast-Stammgast nennt' }
  } : {}),
  demo: { captions: [{ lines: ['Und das Café', 'merkt nie, wer fast', 'schon Stammgast war.'], accent: 5 }] },
  css: `
  .gsil { left: 240px; top: 640px; width: 600px; fill: rgba(185,176,255,.06); stroke: rgba(185,176,255,.7); stroke-width: 7; stroke-dasharray: 22 18; stroke-linecap: round; }
  .chip3 { left: 600px; top: 700px; padding: 16px 30px; border-radius: 40px; background: var(--paper); color: var(--ink); font: 700 36px var(--body);
    rotate: 5deg; box-shadow: 0 16px 30px rgba(0,0,0,.45); opacity: 0; white-space: nowrap; }
  `,
  build(ctx) {
    const { p, loop, pop, cue } = ctx
    ctx.html(`
      <div class="abs glow" style="left:90px;top:440px;width:900px;height:900px"></div>
      <svg class="abs gsil" data-safe="Gast-Umriss" viewBox="0 0 600 560"><circle cx="300" cy="150" r="110"/><path d="M70 560 C70 390 180 310 300 310 C420 310 530 390 530 560"/></svg>
      <div class="abs counter" style="top:1190px"></div>
      ${p.chip ? '<div class="abs chip3" data-safe="Schildchen"></div>' : ''}`)
    loop('.gsil', [{ strokeDashoffset: 0 }, { strokeDashoffset: -80 }], 3)
    if (p.chip) {
      const chip = ctx.$('.chip3'); chip.textContent = p.chip
      // Lange Texte wachsen nach links, damit das Schildchen nicht aus dem Bild ragt
      const over = 600 + chip.offsetWidth - (ctx.STAGE.w - 40)
      if (over > 0) chip.style.left = 600 - over + 'px'
      const t = ctx.at('chip')
      pop(chip, t, 0.45)
      cue(t, 'pop', 0.8, 0.9)
    }
  }
}
