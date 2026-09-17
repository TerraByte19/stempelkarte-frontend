/**
 * iPhone-Sperrbildschirm mit Wallet-Meldung. Zeigt, was der Kunde spaeter
 * wirklich sieht: die volle Karte meldet sich von selbst, in Ladennaehe.
 */
export default function LockScreen({ clock, date, title, body }) {
  return (
    <div className="lp-phone">
      <div className="lp-phone-screen">
        <div className="lp-phone-notch" />
        <div className="lp-phone-clock">{clock}</div>
        <div className="lp-phone-date">{date}</div>
        <div className="lp-notif">
          <span className="lp-notif-swatch">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 8h12v6a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V8Z" />
              <path d="M16 9.5h2a2.5 2.5 0 0 1 0 5h-2" />
            </svg>
          </span>
          <span className="lp-notif-text">
            <span className="lp-notif-title">{title}</span>
            <span className="lp-notif-body">{body}</span>
          </span>
        </div>
      </div>
    </div>
  )
}
