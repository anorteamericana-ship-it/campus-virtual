import { execFileSync, spawnSync } from 'node:child_process';

const MAIN='53df524d0a9eab867d3b307b3e633f366af92a63';
const BASE='7ceca9c5374416ddc16a293ab6cbabedd8fa3713';
const BLOCKED_BE='add6aacb063d9647321e80655eb747ba7b590ced';
const BLOCKED_CS202='127dc3ca4c23cc3590af8c91ffd33dd350601080';
const green=[
  ['CS21A210AT','#248','c9f3047a66e05b6cea60dda5017917979b3f586f'],
  ['CS21A210AX','#250','ed458ff9715338cb2fcd75f9896f2753d8d019b9'],
  ['CS21A210AY','#251','328afb1b98b29be31cd536b2d60e8dffcf7b6a1b'],
  ['CS21A210BA','#253','eb397cff1a72c98c39c28479ee973e2e038e999e'],
  ['CS21A210BC','#255','c018e5c3f6d0a48605c5de5dce4427604e9e8c21'],
  ['CS21A210BD','#256','ddd243a73e74c109420fc8a3e9a82e7c2bf31349'],
  ['CS21A210BF','#258','ecaa2b58122e15043bde86a050fe9534d8d2618c'],
  ['CS21A210BG','#259','564a341445cdfba90fd40ded9198c48b09785e54'],
  ['CS21A210BH','#260','848b5ada270137732662851bf14b7549bdbe42bc'],
  ['CS21A210BI','#261','36f542fda4c7c55df9d07d980f986ecb4b166296'],
  ['CS21A210BJ','#262',BASE],
];
const must=(ok,msg)=>{ if(!ok) throw new Error(msg); };
const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim();
const isAncestor=(a,b)=>spawnSync('git',['merge-base','--is-ancestor',a,b],{stdio:'ignore'}).status===0;

must(git('rev-parse','refs/remotes/origin/main')===MAIN,'main moved or fetch mismatch');
must(git('rev-parse','refs/remotes/origin/pr70')===BLOCKED_CS202,'PR #70 head changed or fetch mismatch');
must(git('rev-parse','refs/remotes/origin/pr257')===BLOCKED_BE,'PR #257 head changed or fetch mismatch');
must(isAncestor(MAIN,BASE),'main is not an ancestor of #262 base');

for(const [label,pr,sha] of green){
  must(isAncestor(sha,BASE),`${label} ${pr} ${sha} is missing from green spine`);
}
for(let i=0;i<green.length-1;i++){
  must(isAncestor(green[i][2],green[i+1][2]),`green order broken between ${green[i][0]} and ${green[i+1][0]}`);
}
must(!isAncestor(BLOCKED_BE,BASE),'BLOCKED PR #257 leaked into green spine');
must(!isAncestor(BLOCKED_CS202,BASE),'BLOCKED CS21A202/#70 leaked into green spine');

const ahead=Number(git('rev-list','--count',`${MAIN}..${BASE}`));
const files=git('diff','--name-only',`${MAIN}..${BASE}`).split('\n').filter(Boolean);
const src=files.filter(f=>f.startsWith('src/')).length;
const workflows=files.filter(f=>f.startsWith('.github/workflows/')).length;
const docs=files.filter(f=>f.startsWith('00_DOCUMENTACION/')).length;
const scripts=files.filter(f=>f.startsWith('scripts/')).length;
const entrypoints=files.filter(f=>['campus.html','ventas.html','inscripcion.html','login.html'].includes(f)).length;
const functional=files.filter(f=>f.startsWith('src/')||['campus.html','ventas.html','inscripcion.html','login.html'].includes(f)).length;

must(ahead>0,'expected #262 to be ahead of main');
must(files.length>0,'expected accumulated delta from main');

const metrics=`COMMITS_AHEAD=${ahead};FILES_CHANGED=${files.length};FUNCTIONAL_SURFACES=${functional};SRC=${src};ENTRYPOINTS=${entrypoints};WORKFLOWS=${workflows};SCRIPTS=${scripts};DOCS=${docs}`;
console.log('CS21A210BK CONSOLIDATION SPINE PASS');
console.log(`MAIN=${MAIN}`);
console.log(`BASE_262=${BASE}`);
console.log('BLOCKED_257_ANCESTOR=NO');
console.log('BLOCKED_CS21A202_70_ANCESTOR=NO');
console.log(metrics);
if(process.env.GITHUB_ACTIONS==='true') console.log(`::notice title=CS21A210BK drift metrics::${metrics}`);
