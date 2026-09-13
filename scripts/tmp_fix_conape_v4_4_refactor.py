from pathlib import Path

path = Path('scripts/tmp_conape_v4_4_refactor.py')
src = path.read_text(encoding='utf-8')
old = r"`${ts}\\n${nonce}\\n${payload_json}`"
new = r"`${ts}\n${nonce}\n${payload_json}`"
count = src.count(old)
if count != 1:
    raise SystemExit(f'HMAC canonical fixer expected 1 occurrence, got {count}')
path.write_text(src.replace(old, new, 1), encoding='utf-8')
