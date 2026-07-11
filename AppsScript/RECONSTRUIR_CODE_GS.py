#!/usr/bin/env python3
"""Reconstruye el Code.gs canónico desde sus partes Base85/XZ."""
from pathlib import Path
import base64
import hashlib
import lzma

ROOT = Path(__file__).resolve().parent
PARTS = sorted((ROOT / "archivo_canonico").glob("Code.gs.xz.b85.part*"))
EXPECTED_PARTS = 18
EXPECTED_SHA256 = "007f26c35e5c42015c40a238fbc9523eacf7444a45323853427111f96adc83cc"

if len(PARTS) != EXPECTED_PARTS:
    raise SystemExit(f"Se esperaban {EXPECTED_PARTS} partes y se encontraron {len(PARTS)}.")

encoded = "".join(p.read_text(encoding="ascii").strip() for p in PARTS)
compressed = base64.b85decode(encoded.encode("ascii"))
source = lzma.decompress(compressed)
sha = hashlib.sha256(source).hexdigest()

if sha != EXPECTED_SHA256:
    raise SystemExit(f"SHA-256 inválido: {sha}")

output = ROOT / "Code.gs"
output.write_bytes(source)
print(f"Creado {output} · {len(source)} bytes · SHA-256 {sha}")
