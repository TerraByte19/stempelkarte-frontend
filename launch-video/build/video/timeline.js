// Zeitplan des Videos. Alles haengt an den Wort-Zeiten der Sprecherstimme:
// solange es noch keine Stimme gibt, werden die Zeiten geschaetzt (STEP pro
// Wort). Spaeter kommt pro Zeile ein `times`-Feld aus der echten Aufnahme
// dazu, und alle Bilder verschieben sich von selbst mit.
window.TL = (() => {
  const STEP = 0.36 // geschaetzte Sekunden pro Wort
  const caps = [
    { id: 'c1', sc: 1, s: 0.2, a: 6, lines: [['Der', 'sechste', 'Kaffee'], ['geht', 'aufs', 'Haus.'], ['Warum', 'eigentlich?']] },
    { id: 'c2a', sc: 2, s: 3.2, a: 3, lines: [['Weil', 'der', 'Gratis-Kaffee'], ['vielleicht', 'einen'], ['Euro', 'kostet.']] },
    { id: 'c2b', sc: 2, s: 6.2, a: 3, lines: [['Und', 'du', 'dafür'], ['wiederkommst.']] },
    { id: 'c3a', sc: 3, s: 8.6, a: 3, lines: [['Nur', 'die', 'Papierkarte'], ['macht', 'nicht', 'mit.']] },
    { id: 'c3b', sc: 3, s: 11.0, a: 2, lines: [['Zerknickt,'], ['vergessen,'], ['verloren.']] },
    { id: 'c3c', sc: 3, s: 13.4, a: 5, lines: [['Und', 'das', 'Café'], ['merkt', 'nie,', 'wer', 'fast'], ['schon', 'Stammgast', 'war.']] },
    { id: 'c4a', sc: 4, s: 17.6, a: 6, lines: [['Mit', 'Stampit', 'liegt'], ['die', 'Karte', 'in', 'Apple'], ['und', 'Google', 'Wallet.']] },
    { id: 'c4b', sc: 4, s: 21.6, a: 2, lines: [['Einmal', 'scannen,'], ['kein', 'Download.']] },
    { id: 'c4c', sc: 4, s: 24.0, a: 4, lines: [['Jeder', 'Besuch'], ['ein', 'Stempel,'], ['sofort', 'auf', 'dem', 'Handy.']] },
    { id: 'c5', sc: 5, s: 27.6, a: 4, lines: [['Ist', 'die', 'Karte', 'voll,'], ['meldet', 'sie', 'sich', 'von'], ['selbst,', 'in', 'Ladennähe.']] },
    { id: 'c6a', sc: 6, s: 32.6, a: 99, lines: [['Und', 'das', 'lohnt', 'sich!']] },
    { id: 'c6b', sc: 6, s: 34.2, a: 4, lines: [['Bleiben', 'dir', 'pro', 'Kaffee'], ['zwei', 'Euro', 'fünfzig,']] },
    { id: 'c6c', sc: 6, s: 37.2, a: 3, lines: [['und', 'fünfzig'], ['Stammkunden', 'kommen'], ['einmal', 'mehr', 'pro', 'Woche,']] },
    { id: 'c6d', sc: 6, s: 40.6, a: 2, lines: [['sind', 'das', '6.500', 'Euro'], ['mehr', 'im', 'Jahr.']] },
    // Der Schluss hat ein eigenes Bild statt einer Textzeile oben.
    { id: 'c7a', sc: 7, s: 43.8, a: 1, keep: true, lines: [['Klingt', 'interessant?']] },
    { id: 'c7', sc: 7, s: 44.8, a: 3, custom: true, lines: [['Dann', 'kommentiere', 'jetzt', 'KARTE,'], ['und', 'wir', 'melden', 'uns'], ['bei', 'dir.']] },
  ]
  const HOLD = 3.2 // Schlussbild bleibt stehen
  caps.forEach((c, i) => {
    c.words = c.lines.flat()
    c.t = (window.TIMES && window.TIMES[c.id]) || c.times || c.words.map((_, k) => +(c.s + k * STEP).toFixed(3))
    c.last = c.t[c.t.length - 1]
  })
  caps.forEach((c, i) => { c.e = i + 1 < caps.length ? caps[i + 1].t[0] - 0.12 : c.last + HOLD })
  const scenes = {}
  for (let n = 1; n <= 7; n++) {
    const first = caps.find(c => c.sc === n)
    scenes[n] = { s: n === 1 ? 0 : first.t[0] - 0.3 }
  }
  for (let n = 1; n <= 7; n++) scenes[n].e = n < 7 ? scenes[n + 1].s : caps[caps.length - 1].e
  const byId = Object.fromEntries(caps.map(c => [c.id, c]))
  return { caps, scenes, duration: +scenes[7].e.toFixed(3), w: (id, k) => byId[id].t[k] }
})()
