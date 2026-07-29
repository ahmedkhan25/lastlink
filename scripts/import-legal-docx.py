#!/usr/bin/env python3
"""Convert the counsel-supplied .docx policies into typed TS the marketing app renders.

Legal copy arrives from Allison as Word files and will keep arriving that way
(the July 2026 drafts still need an attorney pass). Rather than hand-transcribe
into JSX and re-transcribe on every revision, this reads the .docx directly and
emits `apps/marketing/src/legal/<name>.ts` as a structured block list.

Usage:
    python3 scripts/import-legal-docx.py \
        ~/Downloads/LastLink_Privacy_Policy.docx privacy \
        ~/Downloads/LastLink_Terms_of_Service_ARG.docx terms

Nothing here is Word-generic — it only understands the shapes these two
documents actually use (numbered headings, bullets, one summary table, a shaded
intro callout). Re-check the output when the structure changes.
"""

from __future__ import annotations

import html
import json
import re
import sys
import zipfile
from pathlib import Path

W = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"

REPO = Path(__file__).resolve().parent.parent
OUT_DIR = REPO / "apps" / "marketing" / "src" / "legal"

# "1.  Information We Collect" / "1.1  Information You Provide Directly"
H2_RE = re.compile(r"^(\d+)\.\s+(\S.*)$")
H3_RE = re.compile(r"^(\d+\.\d+)\s+(\S.*)$")


def runs_of(para: str) -> list[dict]:
    """Flatten a <w:p> into inline runs, preserving bold and dropping empties."""
    out: list[dict] = []
    for run in re.findall(r"<w:r(?: [^>]*)?>.*?</w:r>", para, re.S):
        text = "".join(re.findall(r"<w:t(?: [^>]*)?>(.*?)</w:t>", run, re.S))
        if not text:
            continue
        text = html.unescape(text)
        # <w:b/> sets bold; <w:b w:val="0"/> explicitly clears it.
        bold = bool(re.search(r'<w:b(?: w:val="(?:1|true|on)")?/>', run))
        if out and out[-1].get("b", False) == bold:
            out[-1]["t"] += text
        else:
            out.append({"t": text, "b": bold} if bold else {"t": text})
    return out


def runs_text(runs: list[dict]) -> str:
    return "".join(r["t"] for r in runs).strip()


def parse_table(tbl: str) -> list[list[str]]:
    rows: list[list[str]] = []
    for tr in re.findall(r"<w:tr(?: [^>]*)?>.*?</w:tr>", tbl, re.S):
        cells = [
            runs_text(runs_of(tc))
            for tc in re.findall(r"<w:tc(?: [^>]*)?>.*?</w:tc>", tr, re.S)
        ]
        if any(c for c in cells):
            rows.append(cells)
    return rows


def parse(xml: str) -> tuple[dict, list[dict]]:
    body = re.search(r"<w:body>(.*)</w:body>", xml, re.S)
    xml = body.group(1) if body else xml

    # Walk paragraphs and tables in document order.
    nodes = re.findall(r"<w:tbl>.*?</w:tbl>|<w:p(?: [^>]*)?>.*?</w:p>", xml, re.S)

    blocks: list[dict] = []
    for node in nodes:
        if node.startswith("<w:tbl"):
            rows = parse_table(node)
            if rows:
                blocks.append({"k": "table", "head": rows[0], "rows": rows[1:]})
            continue

        runs = runs_of(node)
        text = runs_text(runs)
        if not text:
            continue

        props = re.search(r"<w:pPr>.*?</w:pPr>", node, re.S)
        props = props.group(0) if props else ""
        is_list = "<w:numPr>" in props
        # The intro paragraph sits in a bordered, tinted box in Word.
        is_callout = "<w:pBdr>" in props and "F4F2F9" in props

        if is_list:
            blocks.append({"k": "li", "runs": runs})
        elif is_callout:
            blocks.append({"k": "callout", "runs": runs})
        elif (m := H3_RE.match(text)):
            blocks.append({"k": "h3", "n": m.group(1), "t": m.group(2)})
        elif (m := H2_RE.match(text)):
            blocks.append({"k": "h2", "n": m.group(1), "t": m.group(2)})
        else:
            blocks.append({"k": "p", "runs": runs})

    return split_front_matter(blocks)


def split_front_matter(blocks: list[dict]) -> tuple[dict, list[dict]]:
    """Peel the letterhead off the top and the colophon off the bottom.

    Both are re-rendered by the page chrome, so keeping them inline would
    duplicate the title and the patent line.
    """
    meta: dict = {}
    body = list(blocks)

    def text_of(b: dict) -> str:
        return b.get("t") or runs_text(b.get("runs", []))

    # Leading letterhead runs until the ALL-CAPS document title.
    for i, b in enumerate(body[:12]):
        t = text_of(b)
        if t.isupper() and len(t) > 5:
            meta["title"] = t.title().replace("Of", "of")
            body = body[i + 1 :]
            break

    # "Last updated: ..." / "Effective date: ..." immediately follow the title.
    while body:
        t = text_of(body[0])
        if m := re.match(r"^(Last updated|Effective date):\s*(.+)$", t):
            meta["updated" if m.group(1) == "Last updated" else "effective"] = m.group(2)
            body.pop(0)
        else:
            break

    # Trailing colophon: the "was last updated" line and the address/patent line.
    while body:
        t = text_of(body[-1])
        if re.search(r"was last updated on|Patent No\.", t):
            body.pop()
        else:
            break

    return meta, body


def emit(name: str, meta: dict, blocks: list[dict]) -> str:
    return (
        "// GENERATED by scripts/import-legal-docx.py — do not edit by hand.\n"
        "// Source: the counsel-supplied .docx. Re-run the script to update.\n"
        'import type { LegalDoc } from "./types.js";\n\n'
        f"export const {name}: LegalDoc = "
        + json.dumps({"meta": meta, "blocks": blocks}, indent=2, ensure_ascii=False)
        + ";\n"
    )


def main(argv: list[str]) -> int:
    if len(argv) < 2 or len(argv) % 2:
        print(__doc__)
        return 1

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for src, name in zip(argv[0::2], argv[1::2]):
        with zipfile.ZipFile(Path(src).expanduser()) as z:
            xml = z.read("word/document.xml").decode("utf-8")
        meta, blocks = parse(xml)
        (OUT_DIR / f"{name}.ts").write_text(emit(name, meta, blocks), encoding="utf-8")
        kinds: dict[str, int] = {}
        for b in blocks:
            kinds[b["k"]] = kinds.get(b["k"], 0) + 1
        print(f"{name}.ts  {meta.get('title')!r}  {len(blocks)} blocks  {kinds}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
