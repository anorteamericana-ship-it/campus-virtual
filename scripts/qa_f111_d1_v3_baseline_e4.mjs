// F111 E4: scanner against pinned main without hiding any existing finding.
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const BASE='de49c25fa3de9f6a606a3d8d48832ebc296971cc';
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'f111-v3-'));
const script='scripts/audit_raw_user_error_surface_v3_cs21a210s.mjs';
const git=(...args)=>execFileSync('git',args,{encoding:'utf8',maxBuffer:5*1024*1024});
const run=(cwd)=>execFileSync(process.execPath,[script],{cwd,encoding:'utf8',maxBuffer:15*1024*1024});
const counts=s=>({findings:Number(s.match(/DIRECT_RAW_SINK_FINDINGS=(\d+)/)?.[1]??-1),files:Number(s.match(/FILES_WITH_FINDINGS=(\d+)/)?.[1]??-1)});
try{
 git('worktree','add','--detach',dir,BASE);
 const b=counts(run(dir)),c=counts(run(process.cwd()));
 console.log('V3_PINNED_MAIN='+JSON.stringify(b));
 console.log('V3_PR_D1='+JSON.stringify(c));
 if(b.findings<0||b.files<0||c.findings<0||c.files<0)throw Error('V3 incomplete evidence');
 if(c.findings>b.findings||c.files>b.files)throw Error('V3 findings increased relative to immutable main');
 console.log('F111 E4 V3 NO-REGRESSION PASS; unresolved prior findings are not erased.');
}finally{
 try{git('worktree','remove','--force',dir)}catch(_){}
 fs.rmSync(dir,{recursive:true,force:true});
}
