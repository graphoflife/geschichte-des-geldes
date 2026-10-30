#!/usr/bin/env python3
"""Setzt index.html aus src/template.html und den Kapiteln in src/chapters/ zusammen.

Aufruf:  python3 build.py
Die Kapitel werden in alphabetischer Reihenfolge der Dateinamen eingefügt
(daher die Nummern-Präfixe 00-, 01-, …).
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SRC = ROOT / "src"


def main() -> None:
    template = (SRC / "template.html").read_text(encoding="utf-8")
    chapters = sorted((SRC / "chapters").glob("*.html"))
    body = "\n".join(p.read_text(encoding="utf-8").strip() for p in chapters)
    out = template.replace("<!-- CHAPTERS -->", body)
    (ROOT / "index.html").write_text(out, encoding="utf-8")
    print(f"index.html geschrieben – {len(chapters)} Kapitel, {len(out) // 1024} KB")


if __name__ == "__main__":
    main()
