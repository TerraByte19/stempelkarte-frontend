import { useEffect } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import './Landing.css'
import './Branchen.css'
import { useLang } from '../../LangContext'
import { brancheText, branchenLabels, brancheNamen } from './branchen'
import Header from './sections/Header'
import HowItWorks from './sections/HowItWorks'
import Einrichten from './sections/Einrichten'
import Contact from './sections/Contact'
import Footer from './sections/Footer'
import StampCard from './components/StampCard'
import Reveal from './components/Reveal'

/**
 * Branchenseite (/branchen/cafe, /friseur, /doener, /eiscafe): dieselbe
 * Kopf- und Fusszeile wie die Startseite, dazwischen Ueberschrift,
 * Belohnungsideen, die Buehne "So funktioniert's", drei Gruende, Fragen,
 * "Wir richten deine Karte ein" und das Kontaktformular. Texte liegen in
 * branchen.json, Deutsch ist der Rueckfall.
 */
export default function Branche() {
  const { slug } = useParams()
  const { lang } = useLang()
  const b = brancheText(slug, lang)
  const l = branchenLabels(lang)

  useEffect(() => {
    if (!b) return
    const alt = document.title
    document.title = `${b.metaTitle} | Stampit`
    let meta = document.querySelector('meta[name="description"]')
    const eigenes = !meta
    if (!meta) {
      meta = document.createElement('meta')
      meta.name = 'description'
      document.head.appendChild(meta)
    }
    const altInhalt = meta.content
    meta.content = b.metaDesc
    window.scrollTo(0, 0)
    return () => {
      document.title = alt
      if (eigenes) meta.remove()
      else meta.content = altInhalt
    }
  }, [b])

  if (!b) return <Navigate to="/" replace />

  const andere = brancheNamen(lang).filter(x => x.slug !== slug)

  return (
    <div className="lp">
      <Header />
      <main>
        <section className="lp-hero lp-branche-hero">
          <div className="lp-wrap lp-hero-in">
            <div className="lp-hero-copy">
              <span className="lp-eyebrow">{l.eyebrow} · {b.name}</span>
              <h1>{b.title}</h1>
              <p className="lp-lede">{b.sub}</p>
              <div className="lp-hero-actions">
                <a className="lp-btn lp-btn--primary" href="#contact">{l.cta}</a>
                <Link className="lp-btn lp-btn--ghost" to="/demo">{l.demo}</Link>
              </div>
              <p className="lp-hero-note">{l.note}</p>
            </div>
            <div className="lp-hero-card">
              <div className="lp-bob">
                <StampCard stamps={4} shop={b.cardShop} reward={b.cardReward} chip={b.cardChip} />
              </div>
            </div>
          </div>
        </section>

        <section className="lp-ideas">
          <div className="lp-wrap">
            <Reveal><div className="lp-sec-head"><h2>{l.ideasTitle}</h2></div></Reveal>
            <div className="lp-branche-grid">
              {b.ideas.map((idee, i) => (
                <Reveal key={i} delay={i * 40}>
                  <article className="lp-feat"><h3>{idee.t}</h3><p>{idee.b}</p></article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <HowItWorks />

        <section className="lp-why">
          <div className="lp-wrap">
            <Reveal><div className="lp-sec-head"><h2>{l.whyTitle}</h2></div></Reveal>
            <div className="lp-branche-grid">
              {b.why.map((w, i) => (
                <Reveal key={i} delay={i * 40}>
                  <article className="lp-feat"><h3>{w.t}</h3><p>{w.b}</p></article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="lp-faq">
          <div className="lp-wrap">
            <Reveal><div className="lp-sec-head"><h2>{l.faqTitle}</h2></div></Reveal>
            <div className="lp-faq-list">
              {b.faq.map((f, i) => (
                <details key={i}>
                  <summary>{f.q}</summary>
                  <p>{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <Einrichten />
        <Contact />

        <section className="lp-other">
          <div className="lp-wrap">
            <div className="lp-sec-head"><h2>{l.otherTitle}</h2></div>
            <div className="lp-other-list">
              {andere.map(x => <Link key={x.slug} to={`/branchen/${x.slug}`}>{x.name}</Link>)}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
