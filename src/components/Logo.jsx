/**
 * Stampit-Zeichen: ein Stempel im abgerundeten Quadrat, dasselbe Motiv wie
 * das App-Symbol auf dem Homescreen. Ersetzt das alte "SK"-Kaestchen.
 *
 * hell: fuer dunkle Flaechen (Seitenleiste) - weisses Quadrat, lila Stempel.
 * wortmarke: "Stampit" daneben, in der Schrift der Landingpage.
 */
export const MARKE = 'Stampit'

export function LogoZeichen({ size = 40, hell = false }) {
  const grund = hell ? '#FFFFFF' : '#3C3489'
  const stempel = hell ? '#3C3489' : '#FFFFFF'
  return (
      <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={{ display: 'block', flexShrink: 0 }}>
        <rect width="24" height="24" rx="6" fill={grund} />
        <circle cx="12" cy="8" r="3.2" fill={stempel} />
        <rect x="10.7" y="10.4" width="2.6" height="3.4" fill={stempel} />
        <rect x="6.6" y="13.4" width="10.8" height="2.8" rx="1" fill={stempel} />
        <rect x="7.6" y="18" width="8.8" height="1.3" rx="0.65" fill={stempel} opacity="0.8" />
      </svg>
  )
}

export default function Logo({ size = 40, hell = false, wortmarke = true, schrift = 20 }) {
  return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: Math.round(size / 4) }}>
        <LogoZeichen size={size} hell={hell} />
        {wortmarke && (
            <span style={{
              fontFamily: 'var(--sk-display)', fontWeight: 700, fontSize: schrift,
              letterSpacing: '-0.01em', color: hell ? '#FFFFFF' : 'var(--sk-ink)',
            }}>
              {MARKE}
            </span>
        )}
      </span>
  )
}
