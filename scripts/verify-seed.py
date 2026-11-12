"""Verify supabase/seed.sql matches the fungsionaris spreadsheet.

Usage:
    python scripts/verify-seed.py "path/to/DATA FUNGSIONARIS.xlsx"
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

import openpyxl

WANTED = {
    "KEMENTERIAN LUAR NEGERI",
    "KEMENTERIAN DALAM NEGERI",
    "KEMENTERIAN KOMUNIKASI DAN INFORMASI",
    "KEMENTERIAN PEMBERDAYAAN MASYARAKAT DAN LINGKUNGAN",
    "KEMENTERIAN PEMBERDAYAAN SUMBER DAYA MAHASISWA",
}

MINISTRY_NAMES = {
    "KEMENTERIAN LUAR NEGERI": "Kementerian Luar Negeri",
    "KEMENTERIAN DALAM NEGERI": "Kementerian Dalam Negeri",
    "KEMENTERIAN KOMUNIKASI DAN INFORMASI": "Kementerian Komunikasi dan Informasi",
    "KEMENTERIAN PEMBERDAYAAN MASYARAKAT DAN LINGKUNGAN":
        "Kementerian Pemberdayaan Masyarakat dan Lingkungan",
    "KEMENTERIAN PEMBERDAYAAN SUMBER DAYA MAHASISWA":
        "Kementerian Pemberdayaan Sumber Daya Mahasiswa",
}


def read_spreadsheet(path: Path) -> set[tuple[str, str, str]]:
    ws = openpyxl.load_workbook(path, data_only=True).worksheets[0]
    rows = list(ws.iter_rows(values_only=True))
    current = None
    out: set[tuple[str, str, str]] = set()

    for row in rows:
        col_a = str(row[0]).strip() if row[0] else ""
        if col_a and not row[2]:
            current = col_a.upper()
            continue
        if current not in WANTED or not row[2]:
            continue
        name = str(row[2]).strip()
        if name.upper() == "NAMA" or name.startswith("#"):
            continue
        nim = str(row[1]).split(".")[0].strip()
        out.add((name, nim, MINISTRY_NAMES[current]))

    return out


def read_seed(path: Path) -> set[tuple[str, str, str]]:
    text = path.read_text(encoding="utf-8")
    pattern = re.compile(r"\('([^']+)', '(\d+)', '([^']+)'\)")
    return {(m.group(1), m.group(2), m.group(3)) for m in pattern.finditer(text)}


def main() -> int:
    if len(sys.argv) != 2:
        print(__doc__)
        return 2

    sheet = read_spreadsheet(Path(sys.argv[1]))
    seed = read_seed(Path("supabase/seed.sql"))

    missing = sorted(sheet - seed)
    extra = sorted(seed - sheet)

    print(f"spreadsheet: {len(sheet)} orang")
    print(f"seed.sql   : {len(seed)} orang")
    for item in missing:
        print("MISSING:", " | ".join(item))
    for item in extra:
        print("EXTRA  :", " | ".join(item))

    if missing or extra:
        return 1
    print("OK: seed identik dengan spreadsheet.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
