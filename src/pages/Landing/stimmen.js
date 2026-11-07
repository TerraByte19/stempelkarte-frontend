/**
 * Stimmen von Laeden auf der Startseite (Abschnitt "Stimmen").
 *
 * NUR echte Zitate, die der Laden so freigegeben hat. Erfundene oder
 * "frisierte" Kundenstimmen sind in Deutschland abmahnfaehig (UWG, Anhang
 * Nr. 23b) und ruinieren das Vertrauen, auf dem der ganze Abschnitt steht.
 * Deshalb liegt hier keine Vorlage mit Beispieltext: solange die Liste leer
 * ist, zeigt die Startseite den Abschnitt gar nicht.
 *
 * Felder je Eintrag:
 * - zitat   Wortlaut des Ladens, 1 bis 3 Saetze, ohne Anfuehrungszeichen
 * - laden   Name des Ladens, wie er selbst geschrieben wird
 * - ort     Stadt oder Stadtteil
 * - person  optional: Vorname und Rolle, z. B. "Ayşe, Inhaberin"
 * - sprache optional: Sprache des Zitats (ISO, Standard "de"); Zitate werden
 *           nicht uebersetzt, sondern stehen in allen Sprachen im Original
 *
 * Beispiel (NICHT verwenden, nur die Form):
 *   { zitat: '…', laden: 'Café Nord', ort: 'Berlin-Wedding', person: 'Mo, Inhaber' }
 */
export const STIMMEN = []
