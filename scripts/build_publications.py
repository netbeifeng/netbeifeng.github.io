#!/usr/bin/env python3
"""Render publication cards from publications.toml into index.html and index-ja.html.

Usage:
    python3 scripts/build_publications.py          # rewrite both pages
    python3 scripts/build_publications.py --check  # exit 1 if a page is out of date

Only the block between the PUBLICATIONS:START / PUBLICATIONS:END markers in each
page is touched; everything else (news, bio, footer) stays hand-edited.
Needs Python 3.11+ (tomllib), no third-party packages.
"""
from __future__ import annotations

import html
import re
import sys
import tomllib
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "publications.toml"
PAGES = {"en": ROOT / "index.html", "ja": ROOT / "index-ja.html"}
START = "<!-- PUBLICATIONS:START"
END = "<!-- PUBLICATIONS:END -->"
BLOCK_RE = re.compile(rf"({re.escape(START)}[^\n]*\n)(.*?)(\n?{re.escape(END)})", re.DOTALL)
DEFAULT_WIDTH = 190


def localized(value, lang: str, what: str) -> str:
    """Return the text for `lang` from a plain string or an {en, ja} table."""
    if isinstance(value, dict):
        if lang in value:
            return str(value[lang])
        if "en" in value:
            return str(value["en"])
        sys.exit(f"publications.toml: {what} has no '{lang}' or 'en' text")
    return str(value)


def author_html(entry, people: dict, lang: str, card: str) -> str:
    equal = isinstance(entry, str) and entry.endswith("*")
    if isinstance(entry, str):
        key = entry.rstrip("*")
        if key not in people:
            sys.exit(f"publications.toml: card '{card}' uses unknown author '{key}' (add it under [people.{key}])")
        person = people[key]
    else:
        person = entry
    name = html.escape(localized(person["name"], lang, "author name")) + ("*" if equal else "")
    url = person.get("url")
    if url:
        name = f'<a href="{html.escape(localized(url, lang, "author url"), quote=True)}">{name}</a>'
    if person.get("bold"):
        name = f"<strong>{name}</strong>"
    return name


def card_html(pub: dict, cfg: dict, lang: str) -> str:
    title = localized(pub["title"], lang, "title")
    authors = ", ".join(author_html(a, cfg.get("people", {}), lang, title) for a in pub["authors"])
    venue = f"<em>{localized(pub['venue'], lang, f'venue of {title!r}')}</em>"
    if "year" in pub:
        venue += f", {pub['year']}" + ("年" if lang == "ja" else "")

    labels = cfg.get("link_labels", {})
    links = []
    for key, url in pub.get("links", {}).items():
        if key not in labels:
            sys.exit(f"publications.toml: card '{title}' uses unknown link '{key}' (add it under [link_labels])")
        label = html.escape(localized(labels[key], lang, f"link label '{key}'"))
        links.append(f'<a href="{html.escape(str(url), quote=True)}">{label}</a>')

    width = pub.get("image_width", DEFAULT_WIDTH)
    alt = html.escape(title.split(":")[0].strip(), quote=True)
    return "\n".join([
        "<tr>",
        '<td style="padding:20px;width:25%;vertical-align:middle;text-align:center;">',
        f'<img src="{html.escape(str(pub["image"]), quote=True)}" width="{width}" alt="{alt}" class="paper-thumb">',
        "</td>",
        '<td style="padding:20px;width:75%;vertical-align:middle">',
        f"<papertitle>{html.escape(title)}</papertitle>",
        "<br>",
        f"{authors} <br>",
        "<br>",
        f"{venue} &nbsp;",
        "<br>",
        " /\n".join(links),
        "<p></p>",
        "</td>",
        "</tr>",
    ])


def render(cfg: dict, lang: str) -> str:
    cards = [p for p in cfg.get("publications", []) if not p.get("hidden")]
    return "\n\n".join(card_html(p, cfg, lang) for p in cards)


def main() -> int:
    check = "--check" in sys.argv[1:]
    cfg = tomllib.loads(DATA.read_text(encoding="utf-8"))
    stale = []
    for lang, page in PAGES.items():
        original = page.read_text(encoding="utf-8")
        if not BLOCK_RE.search(original):
            sys.exit(f"{page.name}: PUBLICATIONS:START / PUBLICATIONS:END markers not found")
        block = render(cfg, lang)
        updated = BLOCK_RE.sub(lambda m: m.group(1) + block + "\n" + END, original, count=1)
        if updated == original:
            print(f"{page.name}: up to date")
            continue
        stale.append(page.name)
        if not check:
            page.write_text(updated, encoding="utf-8")
            print(f"{page.name}: regenerated")
    if check and stale:
        print(f"Out of date: {', '.join(stale)}. Run scripts/build_publications.py and commit.")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
