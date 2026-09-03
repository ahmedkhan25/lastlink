#!/usr/bin/env python3
"""Convert counsel-supplied legal PDFs into the typed data rendered by marketing.

The source PDFs are exported from the styled LastLink Google Docs. This importer
uses their text positions, font emphasis, bullets, and ruled tables so the live
pages can be updated without hand-transcribing legal copy.

Run with the bundled Codex document runtime (it includes pdfplumber):

    ~/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 \
      scripts/import-legal-pdf.py --date "September 3, 2026" \
      ~/Downloads/LastLink_Privacy_Policy_v2.docx.pdf privacy \
      "~/Downloads/LastLink_Terms_of_Service_v3_Use this one.docx.pdf" terms

The optional --date override intentionally updates both "Last updated" and
"Effective" metadata without altering the source PDFs.
"""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

import pdfplumber


REPO = Path(__file__).resolve().parent.parent
OUT_DIR = REPO / "apps" / "marketing" / "src" / "legal"
H2_RE = re.compile(r"^(\d+)\.\s+(.+)$")
H3_RE = re.compile(r"^(\d+\.\d+)\s+(.+)$")


def clean(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def line_runs(line: dict) -> list[dict]:
    """Preserve the bold spans carried by the PDF's embedded fonts."""
    runs: list[dict] = []
    for word in line["_words"]:
        bold = "Bold" in word["fontname"]
        if runs and runs[-1].get("b", False) == bold:
            runs[-1]["t"] += " " + word["text"]
        else:
            run = {"t": (" " if runs else "") + word["text"]}
            if bold:
                run["b"] = True
            runs.append(run)
    return runs


def append_runs(target: list[dict], extra: list[dict]) -> None:
    if not extra:
        return
    if target:
        target[-1]["t"] += " "
        if target[-1].get("b", False) == extra[0].get("b", False):
            target[-1]["t"] += extra[0]["t"]
            extra = extra[1:]
    target.extend(extra)


def table_block(data: list[list[str | None]]) -> dict:
    rows = [[clean(cell or "") for cell in row] for row in data]
    return {"k": "table", "head": rows[0], "rows": rows[1:]}


def within_table(line: dict, tables: list) -> bool:
    x = (line["x0"] + line["x1"]) / 2
    y = (line["top"] + line["bottom"]) / 2
    return any(
        left - 1 <= x <= right + 1 and top - 1 <= y <= bottom + 1
        for left, top, right, bottom in (table.bbox for table in tables)
    )


def parse(source: Path, name: str, date_override: str | None) -> tuple[dict, list[dict]]:
    meta: dict[str, str] = {}
    blocks: list[dict] = []

    with pdfplumber.open(source) as pdf:
        for page_number, page in enumerate(pdf.pages):
            tables = page.find_tables()
            words = page.extract_words(extra_attrs=["fontname"])
            entries: list[tuple[float, str, object]] = []

            for table in tables:
                data = table.extract()
                if not data:
                    continue
                if len(data[0]) == 1:
                    text = clean(" ".join(cell or "" for row in data for cell in row))
                    runs = [{"t": text}]
                    if name == "terms":
                        runs[0]["b"] = True
                    entries.append((table.bbox[1], "callout", {"k": "callout", "runs": runs}))
                else:
                    entries.append((table.bbox[1], "table", table_block(data)))

            for line in page.extract_text_lines(return_chars=True):
                if not within_table(line, tables) and clean(line["text"]):
                    line["_words"] = [
                        word
                        for word in words
                        if abs(word["top"] - line["top"]) <= 1
                        and line["x0"] - 1 <= word["x0"] <= line["x1"] + 1
                    ]
                    entries.append((line["top"], "line", line))

            for top, kind, entry in sorted(entries, key=lambda item: item[0]):
                if kind == "callout":
                    blocks.append(entry)
                    continue

                if kind == "table":
                    block = entry
                    # Both long tables continue at the top of the next PDF page.
                    if (
                        blocks
                        and blocks[-1]["k"] == "table"
                        and block["head"][0] in {"Section 10", "Withdraw consent"}
                    ):
                        blocks[-1]["rows"].append(block["head"])
                        blocks[-1]["rows"].extend(block["rows"])
                    else:
                        blocks.append(block)
                    continue

                line = entry
                text = clean(line["text"])

                # Document letterhead, title metadata, and the source colophon are
                # rendered by LegalPage rather than duplicated in the article.
                if text in {"LastLink, Inc.", "Your final message. Delivered with certainty."}:
                    continue
                if text.startswith("Houston, Texas |"):
                    continue
                if text in {"PRIVACY POLICY", "TERMS OF SERVICE"}:
                    meta["title"] = text.title().replace("Of", "of")
                    continue
                if match := re.match(r"^(Last updated|Effective date):\s*(.+)$", text):
                    key = "updated" if match.group(1) == "Last updated" else "effective"
                    meta[key] = date_override or match.group(2)
                    continue
                if text.startswith((
                    "This Privacy Policy was last updated",
                    "These Terms of Service were last updated",
                    "LastLink, Inc. | lastlink.care |",
                )):
                    continue

                if match := H2_RE.match(text):
                    blocks.append({"k": "h2", "n": match.group(1), "t": match.group(2)})
                    continue
                if match := H3_RE.match(text):
                    blocks.append({"k": "h3", "n": match.group(1), "t": match.group(2)})
                    continue

                if text.startswith("•"):
                    blocks.append({
                        "k": "li",
                        "runs": [{"t": text[1:].lstrip()}],
                        "_page": page_number,
                        "_top": top,
                    })
                    continue

                runs = line_runs(line)
                previous = blocks[-1] if blocks else None
                joins_previous = False
                if previous and previous["k"] in {"p", "li"}:
                    if previous.get("_page") == page_number:
                        tight_leading = top - previous.get("_top", top) <= 18.5
                        previous_bold = all(run.get("b", False) for run in previous["runs"])
                        current_bold = all(run.get("b", False) for run in runs)
                        repeated_bold_lead = (
                            previous["k"] == "p"
                            and previous["runs"][0].get("b", False)
                            and runs[0].get("b", False)
                            and not (previous_bold and current_bold)
                        )
                        joins_previous = tight_leading and (
                            previous["k"] == "p" or line["x0"] >= 90
                        ) and previous_bold == current_bold and not repeated_bold_lead
                    elif previous.get("_page") == page_number - 1 and top < 90:
                        repeated_bold_lead = (
                            previous["k"] == "p"
                            and previous["runs"][0].get("b", False)
                            and runs[0].get("b", False)
                        )
                        joins_previous = (
                            (previous["k"] == "p" or line["x0"] >= 90)
                            and not repeated_bold_lead
                        )

                if joins_previous:
                    append_runs(previous["runs"], runs)
                    previous["_page"] = page_number
                    previous["_top"] = top
                else:
                    blocks.append({
                        "k": "p",
                        "runs": runs,
                        "_page": page_number,
                        "_top": top,
                    })

    for block in blocks:
        block.pop("_page", None)
        block.pop("_top", None)
    return meta, blocks


def emit(name: str, source: Path, meta: dict, blocks: list[dict]) -> str:
    document = {"meta": meta, "blocks": blocks}
    return (
        "// GENERATED by scripts/import-legal-pdf.py — do not edit by hand.\n"
        f"// Source: {source.name}\n"
        'import type { LegalDoc } from "./types.js";\n\n'
        f"export const {name}: LegalDoc = "
        + json.dumps(document, indent=2, ensure_ascii=False)
        + ";\n"
    )


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--date", help="Override both Last updated and Effective date")
    parser.add_argument("documents", nargs="+", help="SOURCE.pdf NAME pairs")
    args = parser.parse_args()
    if len(args.documents) % 2:
        parser.error("documents must be supplied as SOURCE.pdf NAME pairs")

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for source_arg, name in zip(args.documents[0::2], args.documents[1::2]):
        source = Path(source_arg).expanduser().resolve()
        meta, blocks = parse(source, name, args.date)
        output = OUT_DIR / f"{name}.ts"
        output.write_text(emit(name, source, meta, blocks), encoding="utf-8")
        kinds: dict[str, int] = {}
        for block in blocks:
            kinds[block["k"]] = kinds.get(block["k"], 0) + 1
        print(f"{output.relative_to(REPO)}  {len(blocks)} blocks  {kinds}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
