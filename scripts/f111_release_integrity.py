from __future__ import annotations
import argparse
import hashlib
import json
import re
import sys
from pathlib import Path

SHA = re.compile(r'[a-f0-9]{64}\Z')
NAME = re.compile(r'[A-Za-z0-9_][A-Za-z0-9_.-]*\.(?:js|gs|html|json)\Z')

class GateError(ValueError):
    pass

def require(condition, message):
    if not condition:
        raise GateError(message)

def digest(data):
    return hashlib.sha256(data).hexdigest()

def unique_object(pairs):
    obj = {}
    for k, v in pairs:
        require(k not in obj, 'duplicate JSON key')
        obj[k] = v
    return obj

def load_manifest(path):
    return json.loads(path.read_text(encoding='utf-8-sig'), object_pairs_hook=unique_object)

def valid_name(name):
    return isinstance(name, str) and bool(NAME.fullmatch(name)) and '..' not in name and (not name.endswith('.json') or name == 'appsscript.json') and name.split('.')[0].upper() not in {'CON','PRN','AUX','NUL',*[f'COM{i}' for i in range(1,10)],*[f'LPT{i}' for i in range(1,10)]}

def validate_map(mapping):
    require(isinstance(mapping, dict) and bool(mapping), 'empty or invalid hash map')
    require(all(valid_name(k) and isinstance(v,str) and SHA.fullmatch(v) for k,v in mapping.items()), 'invalid source name or SHA256')
    require(len({k.casefold() for k in mapping}) == len(mapping), 'case-colliding source names')
    require('appsscript.json' in mapping, 'appsscript.json missing')
    return mapping

def inventory(root):
    require(root.is_dir() and not root.is_symlink(), 'snapshot directory missing or symlink')
    result = {}
    for item in root.iterdir():
        require(not item.is_symlink() and item.is_file() and valid_name(item.name), 'unexpected entry in snapshot; use clean exact export')
        result[item.name] = digest(item.read_bytes())
    return validate_map(result)

def verify(manifest, base, candidate, allow, expected_count, expected_version):
    require(isinstance(manifest, dict), 'invalid manifest')
    version = manifest.get('base')
    require(type(version) is int and version > 0, 'invalid numeric baseline version')
    require(type(expected_version) is int and expected_version == version, 'baseline version does not match independent expectation')
    old = validate_map(manifest.get('base_sha256'))
    new = validate_map(manifest.get('candidate_sha256'))
    require(type(expected_count) is int and expected_count > 0 and len(old) == expected_count, 'unexpected baseline file count')
    require(set(old) == set(new), 'file additions or deletions forbidden in v1')
    require(base.resolve() != candidate.resolve(), 'baseline and candidate must be independent directories')
    require(inventory(base) == old, 'baseline bytes differ from manifest')
    require(inventory(candidate) == new, 'candidate bytes differ from manifest')
    require(bool(allow) and all(valid_name(k) for k in allow) and len(allow) == len(set(allow)), 'invalid independent change allowlist')
    require('appsscript.json' not in allow, 'manifest changes require separate security review')
    changed = sorted(k for k in old if old[k] != new[k])
    require(set(changed) == set(allow), 'changed files do not match exact allowlist')
    require(bool(changed), 'empty release')
    return {'status':'PASS_LOCAL_INTEGRITY','baseline_version':version,'files_verified':len(old),'changed_count':len(changed),'approval':'NOT_GRANTED','deployment':'NOT_PERFORMED','academic_writes':0}

def main():
    p=argparse.ArgumentParser(description='Offline Apps Script snapshot integrity gate; no deployment or credentials.')
    p.add_argument('--manifest', type=Path, required=True)
    p.add_argument('--engine', choices=['core','quiz'], required=True)
    p.add_argument('--base',type=Path,required=True)
    p.add_argument('--candidate',type=Path,required=True)
    p.add_argument('--expected-count',type=int,required=True)
    p.add_argument('--expected-version',type=int,required=True)
    p.add_argument('--allow',action='append',required=True)
    p.add_argument('--report',type=Path,required=True)
    a=p.parse_args()
    try:
        require(not a.report.exists(), 'report already exists; use a new path')
        require(a.base.resolve() not in a.report.resolve().parents and a.candidate.resolve() not in a.report.resolve().parents, 'report must stay outside snapshots')
        raw=load_manifest(a.manifest)
        require(isinstance(raw,dict) and a.engine in raw,'engine missing')
        result=verify(raw[a.engine],a.base,a.candidate,a.allow,a.expected_count,a.expected_version)
        result['engine']=a.engine.upper()
        result['manifest_sha256']=digest(a.manifest.read_bytes())
        with a.report.open('x',encoding='utf-8') as f:
            json.dump(result,f,indent=2); f.write('\n')
        print(json.dumps(result,sort_keys=True))
    except (GateError, OSError, ValueError, TypeError) as e:
        print('FAIL: '+(str(e) if isinstance(e,GateError) else type(e).__name__),file=sys.stderr)
        return 1
    return 0

if __name__=='__main__':
    raise SystemExit(main())
