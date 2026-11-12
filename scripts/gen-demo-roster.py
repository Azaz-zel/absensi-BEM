"""Generate lib/demo-roster.ts from supabase/seed.sql.

Keeps demo mode identical to the real roster without hand-copying names.
Usage: python scripts/gen-demo-roster.py
"""

from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SEED = ROOT / "supabase" / "seed.sql"
OUT = ROOT / "lib" / "demo-roster.ts"

PATTERN = re.compile(r"\('([^']+)', '(\d+)', '([^']+)'\)")
MINISTRY_ORDER = re.compile(r"\('(Kementerian [^']+)',\s*\d+\)")


def main() -> int:
    text = SEED.read_text(encoding="utf-8")
    rows = PATTERN.findall(text)

    # Keep the same sort_order as supabase/seed.sql.
    order_block = text.split("insert into public.ministries", 1)[1]
    ministries = [
        m.group(1) for m in MINISTRY_ORDER.finditer(order_block.split(";", 1)[0])
    ]
    if not ministries:
        ministries = sorted({m for _, _, m in rows})
    ministry_index = {name: i + 1 for i, name in enumerate(ministries)}

    lines = [
        "// Dibuat otomatis oleh scripts/gen-demo-roster.py dari supabase/seed.sql.",
        "// Jangan diedit manual: jalankan ulang skrip kalau seed berubah.",
        'import type { Ministry, Person } from "@/lib/types";',
        "",
        "export const DEMO_MINISTRIES: Ministry[] = [",
    ]

    for name in ministries:
        idx = ministry_index[name]
        lines.append("  {")
        lines.append(f'    id: "demo-ministry-{idx}",')
        lines.append(f'    name: "{name}",')
        lines.append(f"    sort_order: {idx},")
        lines.append("    is_active: true,")
        lines.append("  },")

    lines.append("];")
    lines.append("")
    lines.append("export const DEMO_PEOPLE: Person[] = [")

    # Same order the real roster query uses (order by full_name).
    for i, (name, nim, ministry) in enumerate(
        sorted(rows, key=lambda row: row[0].lower()), start=1
    ):
        lines.append("  {")
        lines.append(f'    id: "demo-person-{i}",')
        lines.append(f'    full_name: "{name}",')
        lines.append(f'    nim: "{nim}",')
        lines.append(f'    ministry_id: "demo-ministry-{ministry_index[ministry]}",')
        lines.append('    source: "seed",')
        lines.append("    is_active: true,")
        lines.append("  },")

    lines.append("];")
    lines.append("")

    OUT.write_text("\n".join(lines), encoding="utf-8")
    print(f"{OUT.name}: {len(rows)} orang, {len(ministries)} kementerian")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
