# Geplantes Video: Benachrichtigung in Ladennähe

Vom Betreiber am 16.11.2026 so freigegeben. Noch nicht gebaut.

## Gesprochener Text

1. Ist das koscher?
2. Dein Handy meldet sich, genau wenn du an deinem Lieblingscafé vorbeigehst.
3. Verfolgt dich das Café? Nein. Dein Handy sendet die Benachrichtigung selbst.
4. Natürlich ist das koscher!
5. Du hast die Stempelkarte selbst gespeichert. Einmal gescannt, ohne App, in Apple oder Google Wallet.
6. In der Karte steht, wo der Laden ist. Ist die Karte voll und du kommst in die Nähe, zeigt dein Handy sie von selbst an.
7. Der Laden schickt nichts. Und sieht nicht, wo du bist.
8. Und wenn es dein Laden ist? Dann stehst du auf dem Sperrbildschirm deiner Stammkunden. Genau vor deiner Tür.
9. Klingt interessant? Dann kommentiere jetzt KARTE, und wir melden uns bei dir.

## Vorgaben

- Der Spruch "Ist das koscher? Natürlich ist das koscher!" ist ein bekanntes Meme.
  Die Frage ist der allererste Satz des Videos, die Antwort kommt direkt nach der kurzen Erklärung (Satz 3), danach folgen die Einzelheiten. Beide Sätze
  spricht Liam selbst, fröhlich betont. Die Originalaufnahme wird nicht verwendet.
- Es heißt überall "Handy", nicht "iPhone".
- Machart nach dem Vorbild taggt_ (siehe PLAYBOOK.md): ein Wort auf einmal,
  Schlüsselwörter groß in Lila, etwa alle 3,5 Sekunden ein neues Bild, kaum
  Pausen, lauter abgemischt (etwa -14 LUFS).
- Neue Szene nötig: Straße mit Laden, jemand geht vorbei, das Handy vibriert.
- Belegt im Code: `stempelkarte-backend`, `model/Shop.java`, Abschnitt
  "Sperrbildschirm-Erinnerung" (die volle Karte meldet sich in Ladennähe von
  selbst, das Handy erledigt es, es wird keine Benachrichtigung verschickt).

## Stil-Entscheidung des Betreibers

Variante C: mit 2D nach dem Muster von taggt_ starten und nebenher einen
3D-Baukasten aufbauen (Figuren, Café, Straße). Umstellen, wenn er gut genug ist.
Meme-Muster dürfen als eigene Themen vorkommen, immer mit eigenem Text und
eigener Stimme, nie mit fremden Tonaufnahmen.
