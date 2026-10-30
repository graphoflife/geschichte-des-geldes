# Die Geschichte des Geldes – Von Muscheln bis Bitcoin

Eine animierte Erklärseite im Stil von 3Blue1Brown: Kapitel für Kapitel durch die Geschichte des Geldes – Tauschhandel, Kieselsteine, Muscheln und Glasperlen, Rai-Steine, Salz, Silber und Gold, Banken und Goldstandard, die Entstehung des Fiatgeldes, 1971, Inflation und Cantillon-Effekt – bis zu Bitcoin mit Double-Spend-Problem, byzantinischen Generälen, Hashfunktionen, Proof of Work, Blockchain, Schlüsseln, Geldpolitik und Philosophie.

Die Seite ist rein statisch (HTML, CSS, JavaScript) und läuft direkt auf GitHub Pages.

## Aufbau

```
index.html            ← generiert, nicht direkt bearbeiten
build.py              ← setzt index.html zusammen
src/template.html     ← Seitengerüst (Kopfzeile, Skripte)
src/chapters/*.html   ← ein File pro Kapitel (Reihenfolge = Dateiname)
css/style.css         ← Gestaltung
js/engine.js          ← kleine Canvas-Animations-Engine (Stage, Zeichenhelfer, Icons)
js/scenes-geld.js     ← Animationen Teil I und II
js/scenes-bitcoin.js  ← Animationen und Demos Teil III
js/sha256.js          ← SHA-256 im Browser (für Hash-, Mining- und Blockchain-Demo)
js/app.js             ← Navigation, Inhaltsverzeichnis, Fortschritt
```

Eine Animation wird im Kapitel mit `<figure class="scene" data-scene="name">…</figure>` eingebunden und in `js/scenes-*.js` mit `Scenes.define('name', { … })` definiert.

## Lokal ansehen

```bash
python3 build.py
python3 -m http.server 8000
```

Dann <http://localhost:8000> öffnen.

## Veröffentlichen (GitHub Pages)

Nach jeder Änderung an `src/` einmal `python3 build.py` ausführen und `index.html` mit committen. In den Repository-Einstellungen unter *Pages* die Quelle «Deploy from a branch», Branch `main`, Ordner `/ (root)` wählen.

## Quellen und Dank

Inhaltlich stützt sich die Seite vor allem auf Saifedean Ammous (*The Bitcoin Standard*), Lyn Alden (*Broken Money*), Nik Bhatia (*Layered Money*), Gigi (*21 Lessons*, *Bitcoin Is Time*), Nick Szabo (*Shelling Out*) und Satoshi Nakamotos Whitepaper. Der visuelle Stil ist eine Hommage an Grant Sanderson / 3Blue1Brown, die Blockchain-Demo ist inspiriert von Anders Brownworth. Die vollständige Quellenliste steht im Kapitel «Quellen & Dank».

Keine Anlageberatung.
