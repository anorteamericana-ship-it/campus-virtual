#!/usr/bin/env python3
"""Apply the SEC-002 ordered unified-diff hunks exactly across a modular clasp clone.

Safety properties:
- no fuzzy matching;
- every hunk preimage must match exactly once across SERVER_JS files;
- patch order comes from qa/sec002_private_delivery_bundle_manifest.json;
- only the expected core modules may change;
- English LAB / Memory Match modules are forbidden targets;
- emits a machine-readable report with before/after SHA-256 values.

This helper edits only the local clasp clone. It never calls clasp and never writes remote state.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

ALLOWED_CHANGED_BASENAMES = {
    "01_Router",
    "14_Notas_Cierre_Certificados",
    "20_Inscripcion_Ventas_Matricula",
    "21_Pagos_Banco_CONAPE",
}
FORBIDDEN_NAME_MARKERS = ("ENGLISH_LAB", "MEMORY_MATCH")
PRIVATE_ENDPOINTS = (
    "descargarMiCertificadoPrivado",
    "descargarDocumentoExtraPrivado",
    "descargarComprobantePagoPrivado",
    "descargarMatriculaFirmadaPrivada",
)


@dataclass
class Hunk:
    patch_path: str
    index: int
    header: str
    old_lines: list[str]
    new_lines: list[str]


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def sha256_path(path: Path) -> str:
    return sha256_bytes(path.read_bytes())


def normalize_newlines(text: str) -> str:
    return text.replace("\r\n", "\n").replace("\r", "\n")


def detect_newline(raw: bytes) -> str:
    return "\r\n" if raw.count(b"\r\n") > raw.count(b"\n") // 2 else "\n"


def source_files(apps_dir: Path) -> list[Path]:
    files: list[Path] = []
    for path in apps_dir.rglob("*"):
        if not path.is_file():
            continue
        if path.suffix.lower() not in {".js", ".gs"}:
            continue
        files.append(path)
    return sorted(files)


def parse_patch(path: Path, display_path: str) -> list[Hunk]:
    lines = normalize_newlines(path.read_text(encoding="utf-8")).split("\n")
    hunks: list[Hunk] = []
    i = 0
    hidx = 0
    while i < len(lines):
        if not lines[i].startswith("@@ "):
            i += 1
            continue
        header = lines[i]
        i += 1
        old_lines: list[str] = []
        new_lines: list[str] = []
        while i < len(lines) and not lines[i].startswith("@@ "):
            line = lines[i]
            if line.startswith("--- ") or line.startswith("+++ "):
                break
            if line.startswith("\\ No newline at end of file"):
                i += 1
                continue
            if not line:
                # A truly empty unified-diff content line still has a prefix.
                # A bare empty line here is the split artifact at EOF/outside hunk.
                i += 1
                continue
            prefix, body = line[0], line[1:]
            if prefix == " ":
                old_lines.append(body)
                new_lines.append(body)
            elif prefix == "-":
                old_lines.append(body)
            elif prefix == "+":
                new_lines.append(body)
            else:
                break
            i += 1
        hidx += 1
        if not old_lines:
            raise RuntimeError(f"Hunk without preimage is not allowed: {display_path} {header}")
        hunks.append(Hunk(display_path, hidx, header, old_lines, new_lines))
    return hunks


def count_occurrences(text: str, needle: str) -> int:
    if not needle:
        return 0
    count = 0
    start = 0
    while True:
        pos = text.find(needle, start)
        if pos < 0:
            return count
        count += 1
        start = pos + 1


def useful_anchor(lines: Iterable[str]) -> str:
    candidates = [line for line in lines if line.strip() and len(line.strip()) >= 12]
    if not candidates:
        return ""
    candidates.sort(key=lambda s: (len(s.strip()), s), reverse=True)
    return candidates[0].strip()


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--apps-dir", required=True)
    ap.add_argument("--repo-root", required=True)
    ap.add_argument("--report", required=True)
    args = ap.parse_args()

    apps_dir = Path(args.apps_dir).resolve()
    repo_root = Path(args.repo_root).resolve()
    report_path = Path(args.report).resolve()
    manifest_path = repo_root / "qa" / "sec002_private_delivery_bundle_manifest.json"

    if not apps_dir.is_dir():
        raise RuntimeError(f"apps-dir does not exist: {apps_dir}")
    if not manifest_path.is_file():
        raise RuntimeError(f"manifest missing: {manifest_path}")

    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    ordered = sorted(manifest["ordered_deltas"], key=lambda item: int(item["order"]))

    files = source_files(apps_dir)
    if not files:
        raise RuntimeError("No .js/.gs server files found in clasp clone")

    original_bytes = {p: p.read_bytes() for p in files}
    texts = {p: normalize_newlines(original_bytes[p].decode("utf-8-sig")) for p in files}
    newline_by_file = {p: detect_newline(original_bytes[p]) for p in files}

    total_expected_hunks = sum(int(item["expected_hunks"]) for item in ordered)
    applied: list[dict] = []
    failures: list[dict] = []

    for item in ordered:
        rel_patch = str(item["path"])
        patch_path = repo_root / rel_patch
        hunks = parse_patch(patch_path, rel_patch)
        if len(hunks) != int(item["expected_hunks"]):
            raise RuntimeError(
                f"Hunk contract mismatch for {rel_patch}: expected={item['expected_hunks']} parsed={len(hunks)}"
            )

        for hunk in hunks:
            old_text = "\n".join(hunk.old_lines)
            new_text = "\n".join(hunk.new_lines)
            matches: list[tuple[Path, int]] = []
            for path, text in texts.items():
                occurrences = count_occurrences(text, old_text)
                if occurrences:
                    matches.append((path, occurrences))

            exact_total = sum(n for _, n in matches)
            if exact_total != 1:
                anchor = useful_anchor(hunk.old_lines)
                anchor_hits = []
                if anchor:
                    for path, text in texts.items():
                        n = count_occurrences(text, anchor)
                        if n:
                            anchor_hits.append({"file": str(path.relative_to(apps_dir)), "count": n})
                failures.append(
                    {
                        "patch": hunk.patch_path,
                        "hunk": hunk.index,
                        "header": hunk.header,
                        "exact_match_count": exact_total,
                        "exact_match_files": [
                            {"file": str(p.relative_to(apps_dir)), "count": n} for p, n in matches
                        ],
                        "anchor": anchor,
                        "anchor_hits": anchor_hits,
                    }
                )
                break

            target = next(p for p, n in matches if n == 1)
            base = target.stem
            upper_name = target.name.upper()
            if base not in ALLOWED_CHANGED_BASENAMES:
                failures.append(
                    {
                        "patch": hunk.patch_path,
                        "hunk": hunk.index,
                        "header": hunk.header,
                        "error": "unexpected_target_module",
                        "file": str(target.relative_to(apps_dir)),
                        "allowed": sorted(ALLOWED_CHANGED_BASENAMES),
                    }
                )
                break
            if any(marker in upper_name for marker in FORBIDDEN_NAME_MARKERS):
                failures.append(
                    {
                        "patch": hunk.patch_path,
                        "hunk": hunk.index,
                        "header": hunk.header,
                        "error": "forbidden_lab_memory_target",
                        "file": str(target.relative_to(apps_dir)),
                    }
                )
                break

            texts[target] = texts[target].replace(old_text, new_text, 1)
            applied.append(
                {
                    "patch": hunk.patch_path,
                    "hunk": hunk.index,
                    "header": hunk.header,
                    "file": str(target.relative_to(apps_dir)),
                }
            )
        if failures:
            break

    changed_files: list[Path] = []
    before_sha: dict[str, str] = {}
    after_sha: dict[str, str] = {}

    if not failures and len(applied) != total_expected_hunks:
        failures.append(
            {
                "error": "applied_hunk_total_mismatch",
                "expected": total_expected_hunks,
                "observed": len(applied),
            }
        )

    if not failures:
        for path in files:
            original_text = normalize_newlines(original_bytes[path].decode("utf-8-sig"))
            if texts[path] == original_text:
                continue
            changed_files.append(path)

        changed_bases = {p.stem for p in changed_files}
        if not changed_bases.issubset(ALLOWED_CHANGED_BASENAMES):
            failures.append(
                {
                    "error": "changed_file_allowlist_violation",
                    "observed": sorted(changed_bases),
                    "allowed": sorted(ALLOWED_CHANGED_BASENAMES),
                }
            )

    if not failures:
        combined = "\n".join(texts[p] for p in files)
        endpoint_counts = {
            endpoint: len(re.findall(rf"function\s+{re.escape(endpoint)}\s*\(", combined))
            for endpoint in PRIVATE_ENDPOINTS
        }
        bad_endpoint_counts = {k: v for k, v in endpoint_counts.items() if v != 1}
        if bad_endpoint_counts:
            failures.append(
                {
                    "error": "private_endpoint_definition_count",
                    "counts": endpoint_counts,
                }
            )
    else:
        endpoint_counts = {}

    if not failures:
        for path in changed_files:
            rel = str(path.relative_to(apps_dir)).replace("\\", "/")
            before_sha[rel] = sha256_bytes(original_bytes[path])
            newline = newline_by_file[path]
            out = texts[path].replace("\n", newline)
            path.write_text(out, encoding="utf-8", newline="")
            after_sha[rel] = sha256_path(path)

    report = {
        "ok": not failures,
        "mode": "SEC002_MODULAR_EXACT_REBASE_V1",
        "apps_dir": str(apps_dir),
        "manifest": str(manifest_path),
        "total_expected_hunks": total_expected_hunks,
        "applied_hunks": len(applied),
        "applied": applied,
        "changed_files": [str(p.relative_to(apps_dir)).replace("\\", "/") for p in changed_files],
        "before_sha256": before_sha,
        "after_sha256": after_sha,
        "endpoint_definition_counts": endpoint_counts,
        "failures": failures,
    }
    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding="utf-8")

    if failures:
        print("SEC002_MODULAR_REBASE_STOP")
        print(json.dumps(failures[0], ensure_ascii=False))
        print(f"REPORT={report_path}")
        return 2

    print("SEC002_MODULAR_REBASE_PASS")
    print(f"APPLIED_HUNKS={len(applied)}")
    print("CHANGED_FILES=" + ",".join(report["changed_files"]))
    for rel in report["changed_files"]:
        print(f"SHA {rel} before={before_sha[rel]} after={after_sha[rel]}")
    print(f"REPORT={report_path}")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"SEC002_MODULAR_REBASE_FATAL: {exc}", file=sys.stderr)
        raise
