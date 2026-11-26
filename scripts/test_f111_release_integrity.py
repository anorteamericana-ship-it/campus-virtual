import json
import tempfile
import unittest
from pathlib import Path
from f111_release_integrity import GateError, inventory, verify, load_manifest

class ReleaseGateTest(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory(); self.addCleanup(self.tmp.cleanup)
        self.root=Path(self.tmp.name); self.base=self.root/'base'; self.cand=self.root/'candidate'
        for folder in [self.base,self.cand]:
            folder.mkdir(); (folder/'appsscript.json').write_bytes(b'{}'); (folder/'Main.js').write_bytes(b'old'); (folder/'Other.js').write_bytes(b'unchanged')
        (self.cand/'Main.js').write_bytes(b'new')
        self.manifest={'base':1,'base_sha256':inventory(self.base),'candidate_sha256':inventory(self.cand)}
    def check(self,allow=None,count=3,version=1):
        return verify(self.manifest,self.base,self.cand,['Main.js'] if allow is None else allow,count,version)
    def test_valid(self): self.assertEqual(self.check()['deployment'],'NOT_PERFORMED')
    def test_tampered_candidate(self):
        (self.cand/'Main.js').write_bytes(b'wrong'); self.assertRaises(GateError,self.check)
    def test_tampered_base(self):
        (self.base/'Other.js').write_bytes(b'wrong'); self.assertRaises(GateError,self.check)
    def test_extra_file(self):
        (self.cand/'Unexpected.js').write_bytes(b'x'); self.assertRaises(GateError,self.check)
    def test_missing_file(self):
        (self.cand/'Other.js').unlink(); self.assertRaises(GateError,self.check)
    def test_authorized_delta_only(self):
        (self.cand/'Other.js').write_bytes(b'x'); self.manifest['candidate_sha256']=inventory(self.cand); self.assertRaises(GateError,self.check)
    def test_empty_allowlist(self): self.assertRaises(GateError,self.check,[])
    def test_wrong_version(self): self.assertRaises(GateError,self.check,version=2)
    def test_wrong_count(self): self.assertRaises(GateError,self.check,count=4)
    def test_wrong_allowlist(self): self.assertRaises(GateError,self.check,['Other.js'])
    def test_duplicate_allowlist(self): self.assertRaises(GateError,self.check,['Main.js','Main.js'])
    def test_manifest_change(self):
        (self.cand/'appsscript.json').write_bytes(b'{"changed":true}'); self.manifest['candidate_sha256']=inventory(self.cand); self.assertRaises(GateError,self.check,['Main.js','appsscript.json'])
    def test_secret_like_extra(self):
        (self.cand/'.clasp.json').write_bytes(b'{}'); self.assertRaises(GateError,self.check)
    def test_path_traversal(self):
        self.manifest['candidate_sha256']['../Main.js']='0'*64; self.assertRaises(GateError,self.check)
    def test_bad_hash(self):
        self.manifest['candidate_sha256']['Main.js']='bad'; self.assertRaises(GateError,self.check)
    def test_duplicate_json(self):
        f=self.root/'m.json'; f.write_text('{"core":1,"core":2}'); self.assertRaises(GateError,load_manifest,f)
    def test_same_snapshot(self): self.assertRaises(GateError,verify,self.manifest,self.base,self.base,['Main.js'],3,1)
    def test_manifest_addition(self):
        (self.cand/'Added.js').write_bytes(b'x'); self.manifest['candidate_sha256']=inventory(self.cand); self.assertRaises(GateError,self.check,['Main.js','Added.js'])
    def test_invalid_version(self):
        self.manifest['base']=True; self.assertRaises(GateError,self.check)
    def test_directory(self):
        (self.cand/'nested').mkdir(); self.assertRaises(GateError,self.check)
    def test_case_collision(self):
        self.manifest['candidate_sha256']['main.js']='0'*64; self.assertRaises(GateError,self.check)

if __name__=='__main__': unittest.main(verbosity=2)
