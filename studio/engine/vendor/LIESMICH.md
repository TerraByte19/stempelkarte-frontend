# Fremder Code im Studio

Liegt hier, weil der Bau kein Netz braucht (engine/render.mjs liefert nur
`engine/` und `components/` aus) und weil ein Video in drei Monaten noch genauso
aussehen soll: eine neue Version von three.js zeichnet Licht und Schatten anders.

| Datei | Herkunft | Lizenz |
|---|---|---|
| `three.module.min.js` | npm `three@0.170.0`, `build/three.module.min.js`, unverändert | MIT, `three.LICENSE` |
| `RoundedBoxGeometry.js` | npm `three@0.170.0`, `examples/jsm/geometries/RoundedBoxGeometry.js`; nur der Import zeigt auf `./three.module.min.js` | MIT, `three.LICENSE` |

Geholt am 17.11.2026 von `https://registry.npmjs.org/three/-/three-0.170.0.tgz`,
Prüfsumme des Pakets wie im Register:
`sha512-FQK+LEpYc0fBD+J8g6oSEyyNzjp+Q7Ks1C568WWaoMRLW+TkNNWmenWeGgJjV105Gd+p/2ql1ZcjYvNiPZBhuQ==`.

SHA-256 der Dateien hier (zum Vergleich nach einem Update):

```
08fd7545d13d2c7fb65ab691530a802dafefd638596501854f267d0fb13c39e7  three.module.min.js
```

Nicht "mal eben" auf eine neuere Version heben: danach `node studio/tools/test_3d.mjs`
laufen lassen und die Standbilder von `videos/_probe-3d` neu ansehen.
