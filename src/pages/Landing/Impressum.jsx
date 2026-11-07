import RechtSeite from './RechtSeite'
import { BETREIBER } from './rechtliches'

/** /impressum: Angaben nach § 5 DDG. Die Adresse kommt aus rechtliches.js. */
export default function Impressum() {
  return (
    <RechtSeite titel="Impressum" beschreibung="Angaben gemäß § 5 Digitale-Dienste-Gesetz (DDG).">
      <h2>Anbieter</h2>
      <p>
        {BETREIBER.marke}<br />
        Inhaber: {BETREIBER.inhaber}<br />
        {BETREIBER.strasse}<br />
        {BETREIBER.plzOrt}<br />
        {BETREIBER.land}
      </p>
      <h2>Kontakt</h2>
      <p>E-Mail: <a href={`mailto:${BETREIBER.email}`}>{BETREIBER.email}</a><br />
        Website: <a href={BETREIBER.website}>{BETREIBER.website}</a></p>
      {BETREIBER.ustId && (
        <>
          <h2>Umsatzsteuer</h2>
          <p>Umsatzsteuer-Identifikationsnummer gemäß § 27a UStG: {BETREIBER.ustId}</p>
        </>
      )}
      <h2>Verantwortlich für den Inhalt</h2>
      <p>{BETREIBER.inhaber}, Anschrift wie oben.</p>
      <h2>Streitbeilegung</h2>
      <p>Wir sind nicht bereit und nicht verpflichtet, an Streitbeilegungsverfahren vor einer
        Verbraucherschlichtungsstelle teilzunehmen.</p>
      <h2>Haftung für Inhalte und Links</h2>
      <p>Die Inhalte dieser Seiten wurden mit Sorgfalt erstellt. Für Richtigkeit, Vollständigkeit und Aktualität
        übernehmen wir dennoch keine Gewähr. Für Inhalte verlinkter Seiten ist der jeweilige Anbieter
        verantwortlich; zum Zeitpunkt der Verlinkung waren keine rechtswidrigen Inhalte erkennbar.</p>
      <h2>Marken</h2>
      <p>Apple Wallet ist eine Marke von Apple Inc., Google Wallet eine Marke von Google LLC. Stampit steht in
        keiner Verbindung zu diesen Unternehmen.</p>
    </RechtSeite>
  )
}
