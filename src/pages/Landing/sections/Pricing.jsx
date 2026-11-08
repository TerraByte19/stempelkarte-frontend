import { useState } from 'react'
import { useLang, localeTag } from '../../../LangContext'
import Reveal from '../components/Reveal'

// Basic: bis 100 Kunden (an der Grenze nur ein Hinweis, keine Sperre), Pro und
// Kette unbegrenzt.
// Monatspreise netto. Jaehrlich = elf Monatspreise (ein Monat gratis), auf der
// Karte als Monatsbetrag gezeigt. Pro: bis 4 Filialen, jede weitere 10 € billiger
// als die erste. Ab 5 Filialen gibt es Kette mit Preis nach Absprache.
const BEZAHLTE_MONATE = 11
const TARIFE = [
  { id: 'basic', name: 'Basic', monat: 29, kunden: 'lp_price_kunden_basic', punkte: ['typen', 'wallet', 'empfehlung', 'design', 'team', 'auto'] },
  { id: 'pro', name: 'Pro', monat: 49, filiale: 29, empfohlen: true, plus: 'pro', punkte: ['kampagnen', 'autonachr', 'angebot', 'api'] },
  // Basic und Pro sind Namen in jeder Sprache, Kette wird uebersetzt.
  { id: 'kette', nameKey: 'lp_price_kette_name', plus: 'kette', punkte: ['preis', 'setup', 'kontakt'] },
]

// Vergleichstabelle zum Aufklappen. Spalten: Basic, Pro, Kette.
// true = enthalten, false = nicht enthalten, Text = Wert.
// Nur Dinge, die es wirklich gibt: keine Geschenkkarte, keine Kassen-Anbindung.
const ALLE = [true, true, true]
const AB_PRO = [false, true, true]
const VERGLEICH = [
  { id: 'karten', zeilen: [
    ['typen', ALLE], ['wallet', ALLE], ['design', ALLE], ['willkommen', ALLE],
    ['stufen', ALLE], ['empfehlung', ALLE], ['aufkleber', ALLE],
  ] },
  { id: 'kunden', zeilen: [
    ['kunden', ['v_kunden_basic', 'v_kunden_alle', 'v_kunden_alle']], ['filialen', ['v_fil_basic', 'v_fil_pro', 'v_fil_kette']], ['scanner', ALLE],
    ['team', ALLE], ['liste', ALLE], ['gruppen', ALLE], ['statistik', ALLE], ['bewertung', ALLE],
  ] },
  { id: 'auto', zeilen: [['nah', ALLE], ['stempel', ALLE], ['rueckhol', ALLE]] },
  { id: 'marketing', zeilen: [
    ['kampagnen', AB_PRO], ['autonachr', AB_PRO], ['baukasten', AB_PRO],
    ['tagesangebot', AB_PRO], ['newsletter', AB_PRO], ['api', AB_PRO],
  ] },
  { id: 'service', zeilen: [['setup', [false, false, true]], ['kontakt', [false, false, true]]] },
]
const FRAGEN = [1, 5, 2, 3, 4]

// Der Kontakt-Abschnitt hoert darauf und schreibt den Tarif in die Nachricht.
export const TARIF_EVENT = 'lp:tarif'

export default function Pricing() {
  const { t, lang } = useLang()
  const [jaehrlich, setJaehrlich] = useState(false)

  // Ganze Betraege ohne Nachkommastellen, sonst zwei (35,75 €).
  const euro = betrag => {
    const stellen = Number.isInteger(betrag) ? 0 : 2
    return new Intl.NumberFormat(localeTag(lang), {
      style: 'currency', currency: 'EUR',
      minimumFractionDigits: stellen, maximumFractionDigits: stellen,
    }).format(betrag)
  }
  // Monatsbetrag fuer die gewaehlte Zahlweise, auf Cent gerundet.
  const name = tarif => tarif.nameKey ? t(tarif.nameKey) : tarif.name
  const proMonat = monat => jaehrlich ? Math.round(monat * BEZAHLTE_MONATE / 12 * 100) / 100 : monat

  function waehlen(tarif) {
    const nachricht = tarif.monat
        ? t('lp_price_msg', { tarif: tarif.name, zahlweise: t(jaehrlich ? 'lp_price_yearly' : 'lp_price_monthly') })
        : t('lp_price_msg_kette')
    window.dispatchEvent(new CustomEvent(TARIF_EVENT, { detail: nachricht }))
  }

  function empfohlen() {
    window.dispatchEvent(new CustomEvent(TARIF_EVENT, { detail: t('lp_price_ref_msg') }))
  }

  function zelle(wert) {
    if (wert === true) return <span className="lp-cmp-ja" aria-label={t('lp_price_cmp_yes')} role="img" />
    if (wert === false) return <span className="lp-cmp-nein" aria-label={t('lp_price_cmp_no')} role="img" />
    return t(`lp_price_${wert}`)
  }

  return (
    <section id="pricing" className="lp-pricing">
      <div className="lp-wrap">
        <Reveal>
          <div className="lp-price-head">
            <div className="lp-sec-head">
              <h2>{t('lp_price_title')}</h2>
              <p className="lp-lede">{t('lp_price_body')}</p>
              <ul className="lp-price-trust">
                {[1, 2, 3].map(n => <li key={n}>{t(`lp_price_trust_${n}`)}</li>)}
              </ul>
            </div>
            <div className="lp-price-switch" role="group" aria-label={t('lp_price_billing')}>
              <button type="button" aria-pressed={!jaehrlich} onClick={() => setJaehrlich(false)}>
                {t('lp_price_monthly')}
              </button>
              <button type="button" aria-pressed={jaehrlich} onClick={() => setJaehrlich(true)}>
                {t('lp_price_yearly')}
                <span className="lp-price-save">{t('lp_price_save')}</span>
              </button>
            </div>
          </div>
        </Reveal>

        <div className="lp-price-grid">
          {TARIFE.map((tarif, i) => (
            <Reveal key={tarif.id} delay={i * 60}>
              <article className={`lp-tier lp-tier--${tarif.id}`}>
                <div className="lp-tier-top">
                  <h3>
                    {name(tarif)}
                    {tarif.empfohlen && <span className="lp-tier-badge">{t('lp_price_badge')}</span>}
                  </h3>
                  <p className="lp-tier-sub">{t(`lp_price_${tarif.id}_sub`)}</p>
                </div>

                <div className="lp-tier-preis">
                  {tarif.monat ? (
                      <>
                        <p className="lp-tier-amount">
                          <span dir="ltr">{euro(proMonat(tarif.monat))}</span>
                          <small>{t('lp_price_per_month')}</small>
                        </p>
                        <p className="lp-tier-hint">
                          {jaehrlich
                              ? t('lp_price_year_hint', { summe: euro(tarif.monat * BEZAHLTE_MONATE) })
                              : t('lp_price_vat')}
                        </p>
                      </>
                  ) : (
                      <>
                        <p className="lp-tier-amount"><span>{t('lp_price_ask')}</span></p>
                        <p className="lp-tier-hint">{t('lp_price_ask_hint')}</p>
                      </>
                  )}
                </div>

                <a className="lp-btn lp-tier-btn" href="#contact" onClick={() => waehlen(tarif)}>
                  {t(tarif.monat ? 'lp_price_cta' : 'lp_price_cta_kette')}
                </a>

                <p className="lp-tier-loc">
                  {tarif.filiale
                      ? t('lp_price_loc_pro', { preis: euro(proMonat(tarif.filiale)) })
                      : t(`lp_price_loc_${tarif.id}`)}
                </p>

                <ul className="lp-tier-list">
                  <li className="is-strong">{t(tarif.kunden || 'lp_price_unlimited')}</li>
                  {tarif.plus && <li className="is-lead">{t(`lp_price_plus_${tarif.plus}`)}</li>}
                  {tarif.punkte.map(p => <li key={p}>{t(`lp_price_c_${p}`)}</li>)}
                </ul>
              </article>
            </Reveal>
          ))}
        </div>

        {/* Laden wirbt Laden: wer empfohlen wurde, sagt es im Kontaktformular.
            Den Gratismonat fuer beide traegt der Betreiber von Hand ein. */}
        <Reveal>
          <div className="lp-ref">
            <div className="lp-ref-copy">
              <h3>{t('lp_price_ref_title')}</h3>
              <p>{t('lp_price_ref_body')}</p>
            </div>
            <a className="lp-btn lp-btn--ghost" href="#contact" onClick={empfohlen}>{t('lp_price_ref_cta')}</a>
          </div>
        </Reveal>

        <details className="lp-cmp">
          <summary>{t('lp_price_cmp_open')}</summary>
          <div className="lp-cmp-scroll">
            <table>
              <thead>
                <tr>
                  <th scope="col"><span className="lp-sr">{t('lp_price_cmp_feature')}</span></th>
                  {TARIFE.map(tarif => <th key={tarif.id} scope="col">{name(tarif)}</th>)}
                </tr>
              </thead>
              {VERGLEICH.map(gruppe => (
                  <tbody key={gruppe.id}>
                    <tr className="lp-cmp-gruppe">
                      <th scope="colgroup" colSpan={4}>{t(`lp_price_g_${gruppe.id}`)}</th>
                    </tr>
                    {gruppe.zeilen.map(([id, werte]) => (
                        <tr key={id}>
                          <th scope="row">{t(`lp_price_f_${id}`)}</th>
                          {werte.map((w, n) => <td key={n}>{zelle(w)}</td>)}
                        </tr>
                    ))}
                  </tbody>
              ))}
            </table>
          </div>
        </details>

        <div className="lp-faq">
          <h3>{t('lp_price_faq_title')}</h3>
          {FRAGEN.map(n => (
              <details key={n}>
                <summary>{t(`lp_price_faq_${n}_q`)}</summary>
                <p>{t(`lp_price_faq_${n}_a`)}</p>
              </details>
          ))}
        </div>

        <p className="lp-price-foot">{t('lp_price_foot')}</p>
      </div>
    </section>
  )
}
