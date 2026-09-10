import { useLang } from '../../../LangContext'
import Reveal from '../components/Reveal'
import LockScreen from '../components/LockScreen'

export default function WalletFinale() {
  const { t } = useLang()
  return (
    <section id="wallet" className="lp-wallet">
      <div className="lp-wrap lp-wallet-in">
        <Reveal>
          <div className="lp-wallet-copy">
            <h2>{t('lp_wallet_title')}</h2>
            <p className="lp-lede">{t('lp_wallet_body')}</p>
          </div>
        </Reveal>
        <Reveal delay={120}>
          <LockScreen
            clock={t('lp_lock_clock')}
            date={t('lp_lock_date')}
            title={t('lp_lock_title')}
            body={t('lp_lock_body')}
          />
        </Reveal>
      </div>
    </section>
  )
}
