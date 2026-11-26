"""Local review evidence only. Does not grant release approval or deploy."""
from __future__ import annotations
import argparse
import json
import sys
from pathlib import Path
from f111_release_integrity import GateError, require, digest, unique_object, validate_map


def parse(raw):
    return json.loads(raw.decode('utf-8-sig'), object_pairs_hook=unique_object)


def review_record(manifest_raw, reports_raw):
    manifest = parse(manifest_raw)
    require(isinstance(manifest, dict), 'invalid release manifest')
    require(set(reports_raw) == {'core', 'quiz'}, 'both engine reports required')
    fingerprint = digest(manifest_raw)
    engines = {}
    for name in sorted(reports_raw):
        require(name in manifest and isinstance(manifest[name], dict), 'engine missing')
        section = manifest[name]
        base = validate_map(section.get('base_sha256'))
        candidate = validate_map(section.get('candidate_sha256'))
        require(set(base) == set(candidate), 'snapshot inventory mismatch')
        changed = sorted(k for k in base if base[k] != candidate[k])
        require(bool(changed) and 'appsscript.json' not in changed, 'invalid change set')
        require(type(section.get('base')) is int and section['base'] > 0, 'invalid base version')
        report = parse(reports_raw[name])
        require(isinstance(report, dict), 'invalid integrity report')
        expected = {'engine':name.upper(), 'manifest_sha256':fingerprint,
            'baseline_version':section['base'], 'files_verified':len(base),
            'changed_count':len(changed), 'status':'PASS_LOCAL_INTEGRITY',
            'approval':'NOT_GRANTED', 'deployment':'NOT_PERFORMED', 'academic_writes':0}
        require(report == expected and all(type(report[k]) is type(v) for k,v in expected.items()), 'report does not match manifest or scope')
        engines[name] = {'baseline_version':section['base'], 'files_verified':len(base),
            'changed_count':len(changed), 'integrity_report_sha256':digest(reports_raw[name])}
    blocker = manifest.get('release_blocker')
    require(blocker is None or isinstance(blocker,str), 'invalid blocker field')
    return {'schema':'F111_RELEASE_REVIEW_RECORD_1', 'manifest_sha256':fingerprint,
        'engines':engines, 'evidence_status':'LOCAL_REPORTS_MATCH',
        'review_status':'BLOCKED' if blocker and blocker.strip() else 'AWAITING_INDEPENDENT_REVIEW',
        'approval':'NOT_GRANTED', 'deployment':'NOT_PERFORMED',
        'checks_outstanding':['independent_snapshot_provenance','functional_acceptance','security_and_release_authorization','post_release_verification'],
        'blocking_reason_present':bool(blocker and blocker.strip()),
        'notes':'Evidence consistency only; reports are not independently authenticated by this tool.'}


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--manifest',type=Path,required=True)
    parser.add_argument('--core-report',type=Path,required=True)
    parser.add_argument('--quiz-report',type=Path,required=True)
    parser.add_argument('--output',type=Path,required=True)
    args=parser.parse_args()
    try:
        require(not args.output.exists(), 'output already exists')
        record=review_record(args.manifest.read_bytes(), {'core':args.core_report.read_bytes(),'quiz':args.quiz_report.read_bytes()})
        with args.output.open('x',encoding='utf8') as f:
            json.dump(record,f,indent=2); f.write('\n')
        print(json.dumps({'evidence_status':record['evidence_status'],'review_status':record['review_status'],'approval':record['approval'],'deployment':record['deployment']},sort_keys=True))
        return 0
    except (GateError,OSError,ValueError,TypeError) as e:
        print('FAIL: '+(str(e) if isinstance(e,GateError) else type(e).__name__),file=sys.stderr); return 1

if __name__=='__main__':
    raise SystemExit(main())
