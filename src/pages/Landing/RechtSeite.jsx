import { useEffect } from 'react'
import './Landing.css'
import './Rechtliches.css'
import Header from './sections/Header'
import Footer from './sections/Footer'
import { UNTERAUFTRAGSVERARBEITER } from './rechtliches'

/**
 * Rahmen fuer die Textseiten Impressum, Datenschutz, Vertrauen und AVV:
 * dieselbe Kopf- und Fusszeile wie die Startseite, dazwischen ein schmaler
 * Lesetext. Die Texte sind Deutsch (Rechtstexte, Sitz Berlin), deshalb
 * lang="de" unabhaengig von der gewaehlten Seitensprache.
 */
export default function RechtSeite({ titel, eyebrow, beschreibung, breit = false, children }) {
  useEffect(() => {
    const alt = document.title
    document.title = `${titel} | Stampit`
    let meta = document.querySelector('meta[name="description"]')
    const eigenes = !meta
    if (!meta) {
      meta = document.createElement('meta')
      meta.name = 'description'
      document.head.appendChild(meta)
    }
    const altInhalt = meta.content
    if (beschreibung) meta.content = beschreibung
    window.scrollTo(0, 0)
    return () => {
      document.title = alt
      if (eigenes) meta.remove()
      else meta.content = altInhalt
    }
  }, [titel, beschreibung])

  return (
    <div className="lp">
      <Header />
      <main>
        <article className={breit ? 'lp-recht lp-recht--breit' : 'lp-recht'} lang="de">
          <div className="lp-wrap lp-recht-in">
            <header className="lp-recht-head">
              {eyebrow && <span className="lp-eyebrow">{eyebrow}</span>}
              <h1>{titel}</h1>
              {beschreibung && <p className="lp-lede">{beschreibung}</p>}
            </header>
            {children}
          </div>
        </article>
      </main>
      <Footer />
    </div>
  )
}

/** Tabelle der Unterauftragsverarbeiter, auf Vertrauensseite, Datenschutz und AVV identisch. */
export function UavTabelle() {
  return (
    <table className="lp-recht-tabelle">
      <thead>
        <tr><th>Dienst</th><th>Sitz</th><th>Wofür</th></tr>
      </thead>
      <tbody>
        {UNTERAUFTRAGSVERARBEITER.map(u => (
          <tr key={u.name}>
            <td data-l="Dienst">{u.name}</td>
            <td data-l="Sitz">{u.sitz}</td>
            <td data-l="Wofür">{u.zweck}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
