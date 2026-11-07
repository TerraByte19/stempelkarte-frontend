import { Link } from 'react-router-dom'
import RechtSeite, { UavTabelle } from './RechtSeite'
import { BETREIBER, KUNDENDATEN, NICHT_GESPEICHERT, SERVER_REGION, STAND } from './rechtliches'

/**
 * /vertrauen: die Seite fuer Laeden, die vor dem Kauf fragen "Was passiert
 * mit den Daten meiner Kunden?" Wo die Daten liegen, was gespeichert wird,
 * wer sonst beteiligt ist, wie Kunden ihre Rechte wahrnehmen, und der AVV.
 */
export default function Vertrauen() {
  return (
    <RechtSeite
      eyebrow="Für Läden"
      titel="Vertrauen und Datenschutz"
      beschreibung="Du gibst uns die Daten deiner Kunden in die Hand. Hier steht in einfachen Worten, wo sie liegen, was wir speichern, wer sonst beteiligt ist und wie Kunden ihre Rechte wahrnehmen.">

      <div className="lp-recht-karten">
        <div className="lp-recht-karte">
          <h3>Wo die Daten liegen</h3>
          <p>Server und Datenbank laufen bei Render{SERVER_REGION ? ` im Rechenzentrum ${SERVER_REGION}` : ''}. Die Website
            und die Oberfläche der App liefert Vercel aus. Jede Verbindung ist verschlüsselt (HTTPS).</p>
        </div>
        <div className="lp-recht-karte">
          <h3>Wer verantwortlich ist</h3>
          <p>Für die Daten deiner Kunden bist du verantwortlich, wir verarbeiten sie in deinem Auftrag. Dafür
            gibt es den <Link to="/avv">Auftragsverarbeitungsvertrag</Link>, kurz AVV. Du bekommst ihn mit dem Vertrag.</p>
        </div>
        <div className="lp-recht-karte">
          <h3>Was wir nicht tun</h3>
          <ul>
            {NICHT_GESPEICHERT.map(x => <li key={x}>{x}</li>)}
            <li>Keine Weitergabe an Dritte zu Werbezwecken, kein Verkauf von Daten</li>
          </ul>
        </div>
      </div>

      <h2>Was zu einem Kunden gespeichert wird</h2>
      <p>So wenig wie möglich, so viel wie für die Karte nötig:</p>
      <ul>
        {KUNDENDATEN.map(x => <li key={x}>{x}</li>)}
      </ul>
      <p>Zu dir als Laden speichern wir das Konto (E-Mail, Name, Passwort nur als Hash), deine Einstellungen,
        den Standort des Ladens für die Mitteilung in der Nähe, die Zugänge deines Teams und das Protokoll der
        Stempel. Scannt das Personal, prüft die App einmalig den Standort des Geräts, ob der Scan im Laden
        passiert; nur Abweichungen werden mit Entfernung protokolliert.</p>

      <h2>So kommen Kunden an ihre Karte, so werden sie wieder los</h2>
      <ul>
        <li><strong>Doppelte Bestätigung:</strong> Wer sich mit E-Mail anmeldet, bestätigt die Adresse per Link,
          erst dann wird die Karte aktiv. Bei „Mit Google anmelden“ oder „Mit Apple anmelden“ hat Google bzw.
          Apple die Adresse schon geprüft.</li>
        <li><strong>Lösch-Link in jeder Mail:</strong> Ein Klick, eine Bestätigung, und alle Daten des Kunden sind
          weg, unwiderruflich. Das geht ohne dich und ohne uns.</li>
        <li><strong>Newsletter nur mit Einwilligung:</strong> Werbung per Mail bekommt nur, wer den Haken gesetzt
          hat. Abmelden geht in jeder Mail.</li>
        <li><strong>Karte aus dem Wallet entfernen</strong> kann der Kunde jederzeit selbst. Mitteilungen enden damit.</li>
        <li><strong>Auskunft, Berichtigung, Löschung</strong> auf Wunsch über dich oder direkt bei uns:
          <a href={`mailto:${BETREIBER.email}`}> {BETREIBER.email}</a>.</li>
      </ul>

      <h2>Wer sonst Daten sieht</h2>
      <p>Ohne diese Dienste gäbe es keine Wallet-Karte und keine Mail. Jeder bekommt nur, was er für seine
        Aufgabe braucht.</p>
      <UavTabelle />
      <p className="lp-recht-meta">Dienste mit Sitz außerhalb der EU arbeiten auf Grundlage der
        EU-Standardvertragsklauseln bzw. des EU-US Data Privacy Framework. Details in der
        <Link to="/datenschutz"> Datenschutzerklärung</Link>.</p>

      <h2>Sicherheit</h2>
      <ul>
        <li>Verschlüsselte Übertragung überall (TLS), auch zwischen Server und Datenbank.</li>
        <li>Passwörter nur als Hash, API-Schlüssel ebenso. Niemand bei uns kann ein Passwort lesen.</li>
        <li>Zugänge für das Personal mit Rollen: Aushilfe, Mitarbeiter, Tablet. Jeder sieht nur, was er braucht.</li>
        <li>Prämien einlösen, Karten zurücksetzen und Nachrichten verschicken geht nur mit dem Konto des Ladens.</li>
        <li>Offene Endpunkte (Anmeldung, Formulare) sind gegen Massenanfragen gedrosselt.</li>
      </ul>

      <h2>Der Auftragsverarbeitungsvertrag (AVV)</h2>
      <div className="lp-recht-box">
        <p>Die DSGVO verlangt zwischen dir und uns einen schriftlichen Vertrag über die Verarbeitung der
          Kundendaten (Art. 28 DSGVO). Unser Muster kannst du jetzt lesen und drucken. Mit dem Vertrag bekommst
          du die unterschriebene Fassung.</p>
        <div className="lp-recht-aktionen">
          <Link className="lp-btn lp-btn--primary" to="/avv">AVV lesen</Link>
          <Link className="lp-btn lp-btn--ghost" to="/datenschutz">Datenschutzerklärung</Link>
        </div>
      </div>

      <h2>Fragen?</h2>
      <p>Schreib uns an <a href={`mailto:${BETREIBER.email}`}>{BETREIBER.email}</a>. Wir antworten innerhalb
        eines Werktags, auch an deinen Steuerberater oder Datenschutzbeauftragten.</p>
      <p className="lp-recht-meta">Stand: {STAND}</p>
    </RechtSeite>
  )
}
