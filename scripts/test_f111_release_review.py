import json
import unittest
from f111_release_integrity import GateError,digest
from f111_release_review import review_record

def raw(obj): return json.dumps(obj,sort_keys=True).encode()

class ReviewRecordTest(unittest.TestCase):
    def setUp(self):
        self.manifest={name:{'base':ver,'base_sha256':{'appsscript.json':'a'*64,'Main.js':'b'*64},'candidate_sha256':{'appsscript.json':'a'*64,'Main.js':'c'*64}} for name,ver in [('core',1),('quiz',2)]}
    def reports(self):
        return {name:{'engine':name.upper(),'manifest_sha256':digest(raw(self.manifest)),'baseline_version':self.manifest[name]['base'],'files_verified':2,'changed_count':1,'status':'PASS_LOCAL_INTEGRITY','approval':'NOT_GRANTED','deployment':'NOT_PERFORMED','academic_writes':0} for name in ['core','quiz']}
    def check(self,reports=None): return review_record(raw(self.manifest),{k:raw(v) for k,v in (self.reports() if reports is None else reports).items()})
    def test_matching_evidence(self): self.assertEqual(self.check()['evidence_status'],'LOCAL_REPORTS_MATCH')
    def test_no_approval(self): self.assertEqual(self.check()['approval'],'NOT_GRANTED')
    def test_no_deploy(self): self.assertEqual(self.check()['deployment'],'NOT_PERFORMED')
    def test_blocker_preserved(self):
        self.manifest['release_blocker']='test restriction'; self.assertEqual(self.check()['review_status'],'BLOCKED')
    def test_no_blocker_not_approval(self): self.assertEqual(self.check()['review_status'],'AWAITING_INDEPENDENT_REVIEW')
    def test_stale_report(self):
        reports=self.reports(); self.manifest['release_blocker']='new'; self.assertRaises(GateError,self.check,reports)
    def test_swapped_reports(self):
        reports=self.reports(); reports['core'],reports['quiz']=reports['quiz'],reports['core']; self.assertRaises(GateError,self.check,reports)
    def test_wrong_count(self):
        reports=self.reports(); reports['core']['files_verified']=3; self.assertRaises(GateError,self.check,reports)
    def test_false_approval(self):
        reports=self.reports(); reports['core']['approval']='GRANTED'; self.assertRaises(GateError,self.check,reports)
    def test_wrong_base(self):
        reports=self.reports(); reports['quiz']['baseline_version']=99; self.assertRaises(GateError,self.check,reports)
    def test_missing_engine(self):
        reports=self.reports(); del reports['quiz']; self.assertRaises(GateError,self.check,reports)
    def test_boolean_count(self):
        reports=self.reports(); reports['core']['changed_count']=True; self.assertRaises(GateError,self.check,reports)
    def test_bad_blocker(self):
        self.manifest['release_blocker']=False; self.assertRaises(GateError,self.check)
    def test_source_manifest_change(self):
        self.manifest['core']['candidate_sha256']['appsscript.json']='d'*64; self.assertRaises(GateError,self.check)
    def test_unexpected_report_field(self):
        reports=self.reports(); reports['core']['approval_note']='ignore'; self.assertRaises(GateError,self.check,reports)

if __name__=='__main__': unittest.main(verbosity=2)
