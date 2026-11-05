import daten from './branchen.json'

/**
 * Branchenseiten (/branchen/cafe usw.): Texte je Sprache aus branchen.json.
 * Fehlt eine Sprache, gilt Deutsch - wie bei t() in der App.
 */
export const BRANCHEN = daten.branchen.map(b => b.slug)

function mitRueckfall(obj, lang) {
  return obj[lang] || obj.de
}

export function branchenLabels(lang) {
  return mitRueckfall(daten.labels, lang)
}

/** null, wenn es die Branche nicht gibt. */
export function brancheText(slug, lang) {
  const b = daten.branchen.find(x => x.slug === slug)
  return b ? mitRueckfall(b, lang) : null
}

/** Name jeder Branche fuer Menue und Fuss. */
export function brancheNamen(lang) {
  return daten.branchen.map(b => ({ slug: b.slug, name: mitRueckfall(b, lang).name }))
}
