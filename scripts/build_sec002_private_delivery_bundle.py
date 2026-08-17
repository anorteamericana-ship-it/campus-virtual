#!/usr/bin/env python3
import argparse
import hashlib
import json
import shutil
import subprocess
import sys
from pathlib import Path

MANIFEST_PATH = Path('qa/sec002_private_delivery_bundle_manifest.json')


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open('rb') as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b''):
            h.update(chunk)
    return h.hexdigest()


def count_token(path: Path, token: bytes) -> int:
    return path.read_bytes().count(token)


def main() -> int:
    ap = argparse.ArgumentParser(description='Construye el bundle SEC-002 solo sobre el Code.gs canónico exacto.')
    ap.add_argument('code_gs', help='Ruta a un respaldo actual de Code.gs QA')
    ap.add_argument('--output', default='Code.SEC002_PRIVATE_DELIVERY_QA_CANDIDATE.gs')
    args = ap.parse_args()

    source = Path(args.code_gs)
    output = Path(args.output)
    if not source.is_file():
        print(f'FAIL source missing: {source}', file=sys.stderr)
        return 2
    if not MANIFEST_PATH.is_file():
        print(f'FAIL manifest missing: {MANIFEST_PATH}', file=sys.stderr)
        return 2

    manifest = json.loads(MANIFEST_PATH.read_text(encoding='utf-8'))
    canonical_sha = manifest['canonical_code_sha256']
    observed_sha = sha256_file(source)
    if observed_sha != canonical_sha:
        print('STOP_AND_RECONCILE_CURRENT_QA_CODE', file=sys.stderr)
        print(f'expected={canonical_sha}', file=sys.stderr)
        print(f'observed={observed_sha}', file=sys.stderr)
        return 3

    if shutil.which('patch') is None:
        print('FAIL GNU/POSIX patch command is required', file=sys.stderr)
        return 4

    shutil.copyfile(source, output)
    try:
        for item in manifest['ordered_deltas']:
            patch_path = Path(item['path'])
            if not patch_path.is_file():
                raise RuntimeError(f'missing patch: {patch_path}')
            hunk_count = sum(1 for line in patch_path.read_text(encoding='utf-8').splitlines() if line.startswith('@@ '))
            if hunk_count != int(item['expected_hunks']):
                raise RuntimeError(f'unexpected hunk count for {patch_path}: {hunk_count}')

            reconciled_base_sha = str(item.get('reconciled_base_sha256') or '').strip()
            if reconciled_base_sha:
                current_sha = sha256_file(output)
                if current_sha != reconciled_base_sha:
                    raise RuntimeError(
                        f'reconciled base SHA mismatch before {patch_path}: '
                        f'expected={reconciled_base_sha} observed={current_sha}'
                    )

            proc = subprocess.run(
                ['patch', '--batch', '--forward', '--fuzz=0', str(output)],
                stdin=patch_path.open('rb'),
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                check=False,
            )
            if proc.returncode != 0:
                raise RuntimeError(f'patch failed with fuzz=0: {patch_path}\n{proc.stdout.decode(errors="replace")}')

        expected = manifest['canonical_bundle']
        final_sha = sha256_file(output)
        if final_sha != expected['expected_sha256']:
            raise RuntimeError(f'final SHA mismatch expected={expected["expected_sha256"]} observed={final_sha}')
        if output.stat().st_size != int(expected['expected_size_bytes']):
            raise RuntimeError(f'final size mismatch expected={expected["expected_size_bytes"]} observed={output.stat().st_size}')
        if count_token(output, b'DriveApp.Access.ANYONE_WITH_LINK') != int(expected['expected_anyone_with_link_calls']):
            raise RuntimeError('ANYONE_WITH_LINK transition count changed unexpectedly')
        for fn, count in expected['expected_private_endpoint_definitions'].items():
            observed = count_token(output, f'function {fn}'.encode())
            if observed != int(count):
                raise RuntimeError(f'{fn} definition count expected={count} observed={observed}')
    except Exception as exc:
        try:
            output.unlink(missing_ok=True)
        except Exception:
            pass
        print(f'FAIL {exc}', file=sys.stderr)
        return 5

    print('PASS SEC002 PRIVATE DELIVERY BUNDLE')
    print(f'input_sha256={observed_sha}')
    print(f'output_sha256={sha256_file(output)}')
    print(f'output_size_bytes={output.stat().st_size}')
    print(f'output={output}')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
