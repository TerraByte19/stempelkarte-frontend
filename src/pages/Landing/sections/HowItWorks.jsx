import { useRef } from 'react'
import { useLang } from '../../../LangContext'
import { useScrollProgress } from '../useScrollProgress'
import StampCard from '../components/StampCard'
import LockScreen from '../components/LockScreen'

const TOTAL = 6

/** Anteil von p zwischen a und b, auf 0…1 begrenzt. */
function segment(p, a, b) {
  const v = (p - a) / (b - a)
  return v < 0 ? 0 : v > 1 ? 1 : v
}

/**
 * Die Buehne. Die Karte klebt in der Bildschirmmitte fest, der Text wechselt
 * in drei Schritten, die Karte fuellt sich auf sechs Stempel und uebergibt
 * am Ende an den Sperrbildschirm.
 *
 * Die Schwellenwerte stehen in der Spec und sind aufeinander abgestimmt:
 * die Karte ist bei 0,80 voll, genau wenn der letzte Text erscheint.
 */
export default function HowItWorks() {
  const { t } = useLang()
  const ref = useRef(null)
  const p = useScrollProgress(ref) / 100

  const stamps = Math.round(segment(p, 0.06, 0.80) * TOTAL)
  const step = p < 0.28 ? 1 : p < 0.55 ? 2 : p < 0.80 ? 3 : 4
  const out = segment(p, 0.84, 1)

  return (
    <section id="how" className="lp-stage" ref={ref}>
      <div className="lp-pin">
        <span className="lp-stage-label">{t('lp_how_eyebrow')}</span>

        <div className="lp-pin-in">
          <div className="lp-step" key={step}>
            <span className="lp-step-n">
              {step < 4 ? `${t('lp_how_step')} ${step} / 3` : t('lp_how_eyebrow')}
            </span>
            <h3>{t(`lp_how_${step}_t`)}</h3>
            <p>{t(`lp_how_${step}_b`)}</p>
          </div>

          <div className="lp-scene">
            <div
              className="lp-scene-layer"
              style={{ opacity: 1 - out, transform: `translateY(${-26 * out}px) scale(${1 - 0.12 * out})` }}
            >
              <StampCard
                stamps={stamps}
                shop={t('lp_card_shop')}
                reward={t('lp_card_reward')}
                chip={t('lp_card_chip')}
              />
            </div>
            <div
              className="lp-scene-layer"
              style={{ opacity: out, transform: `translateY(${30 * (1 - out)}px) scale(${0.94 + 0.06 * out})` }}
            >
              <LockScreen
                clock={t('lp_lock_clock')}
                date={t('lp_lock_date')}
                title={t('lp_lock_title')}
                body={t('lp_lock_body')}
              />
            </div>
          </div>
        </div>

        <span className="lp-stage-hint">{t('lp_how_scroll')}</span>
      </div>
    </section>
  )
}
