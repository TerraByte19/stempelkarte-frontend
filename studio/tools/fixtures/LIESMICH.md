# Prüfdaten

Kopien aus dem ersten Video (`launch-video/build`, Fassung 7, und
`launch-video/final-build`, Fassung 10), damit `tools/selftest.mjs` auch ohne
diesen Ordner läuft. Nicht ändern.

| Datei | Herkunft | Wozu |
|---|---|---|
| `satz-austausch-vorher.mp3` + `.alignment.json` | `build/voice/liam-v6.mp3`, `alignment-v6.json` | Aufnahme vor dem Satz-Austausch ("Und das lohnt sich:") |
| `satz-austausch-neuer-satz.mp3` | `build/voice/clip.mp3` | der neu aufgenommene Satz ("Und das lohnt sich!") |
| `satz-austausch-neuer-satz.alignment.json` | zurückgerechnet aus `satz-austausch-nachher.alignment.json` | Zeichen-Zeiten des neuen Satzes für sich. Die Antwort des Anbieters für diesen Satz wurde damals nicht aufgehoben; die Zeiten sind deshalb die des fertigen Videos, bezogen auf den Schnittpunkt (30,25 s) |
| `satz-austausch-nachher.alignment.json` | `build/voice/alignment.json` | Zeichen-Zeiten der fertigen Aufnahme von Fassung 7 |
| `referenz-times.json`, `referenz-cues.json` | `build/video/times.js`, `build/events.json` | Wort-Zeiten und die 35 Töne von Fassung 7 |
| `final-times.json`, `final-cues.json` | `final-build/video/times.js`, `final-build/events.json` | Wort-Zeiten und die 35 Töne von Fassung 10 (veröffentlicht) |
| `referenz-ton.json` | gemessen am 15.11.2026 | Fingerabdrücke des Tons beider Fassungen: die Abtastwerte von `build/voice/liam.wav`, die Datei `final-build/voice/liam.mp3` und der dekodierte Ton der beiden `.mp4`. Die `.wav` und die `.mp4` liegen nicht im Repo; mit den Fingerabdrücken lässt sich trotzdem prüfen, dass das Studio denselben Ton baut |

Aus den drei Dateien `satz-austausch-vorher.*` und `satz-austausch-neuer-satz.*`
baut `tools/reference-voice.mjs` die Stimme von Fassung 7 in
`videos/2026-11-14-kaffee-aufs-haus/voice/` neu. `tools/selftest.mjs` prüft,
dass das Ergebnis mit den Dateien dort übereinstimmt und dass der
zusammengesetzte Ton den Fingerabdruck der damaligen `liam.wav` hat.
