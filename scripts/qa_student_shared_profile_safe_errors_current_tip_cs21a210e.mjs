import fs from 'node:fs';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';

const BASE_SHA='a815c05306bc946383f1e19d0fb099f85c1667da';
const BASE_PRIMITIVES_BLOB='e322131d81fb828c78995400dcf4dc4be5da9eb8';
const EXPECTED_PRIMITIVES_BLOB='764a1583692de05fc5909b1939add71282605cde';
const BRANCH='fix/student-shared-profile-safe-errors-cs21a210e';
const exactMode=process.argv.includes('--exact-import');
const must=(ok,label)=>{if(!ok)throw new Error(`CS21A210E FAIL: ${label}`)};
const read=p=>fs.readFileSync(p);
const text=p=>read(p).toString('utf8');
const gitBlobSha=buf=>crypto.createHash('sha1').update(`blob ${buf.length}\0`).update(buf).digest('hex');

const primitives=text('src/primitives.jsx');
const modules=text('src/student_modules.jsx');
const historical=text('scripts/qa_student_shared_profile_safe_errors_cs21a200j.mjs');

const helper=`function studentSharedProfileSafeUserError(raw, fallback, context = '') {\n  const msg = String(raw == null ? '' : raw).trim();\n  if (!msg) return fallback;\n  const technicalCode = /^[a-z0-9.-]+(?:_[a-z0-9.-]+)+$/i.test(msg);\n  const technicalText = /apps?\\s*script|script\\.google|backend|endpoint|stack|exception|trace|typeerror|referenceerror|syntaxerror|rangeerror|networkerror|failed to fetch|network request failed|<html|\\bjson\\b|\\btoken\\b|unauthorized|forbidden|internal server|error interno|http\\s*\\d{3}|status\\s*\\d{3}|getestudiante|request_id|file_id|base64|sha-?256|\\bmime\\b|driveapp|spreadsheet|\\bsheet\\b|\\btabla\\b|\\bhoja\\b/i.test(msg);\n  if (technicalCode || technicalText) {\n    console.warn('[StudentSharedProfile] Detalle técnico oculto al estudiante.', { context, error: msg });\n    return fallback;\n  }\n  return msg;\n}\n\n`;
const oldSet="setError((d && d.error) || 'No se pudo cargar la información del estudiante');";
const newSet="setError(studentSharedProfileSafeUserError(d && d.error, 'No pudimos cargar tu información. Intentá de nuevo.', 'get_estudiante'));";

must(primitives.includes("function studentSharedProfileSafeUserError(raw, fallback, context = '')"),'shared student safe-error helper exists');
must(primitives.includes("console.warn('[StudentSharedProfile] Detalle técnico oculto al estudiante.'"),'technical detail remains console-only');
must(primitives.includes('request_id|file_id|base64|sha-?256'),'technical identifiers are filtered');
must(primitives.includes(newSet),'getEstudiante ok:false uses safe boundary');
must(!primitives.includes(oldSet),'raw backend error is no longer assigned to shared visible state');

// Transport/cache/reload/network behavior remains exact.
must(primitives.includes("postPrimitives('getEstudiante', { codigo })"),'getEstudiante endpoint preserved');
must(primitives.includes("const token = window.getSessionToken ? window.getSessionToken() : '';"),'session token body behavior preserved');
must(primitives.includes('const STUDENT_PROFILE_CACHE_TTL_MS = 90 * 1000;'),'90-second cache TTL preserved');
must(primitives.includes('studentProfileCacheGet(codigo)'),'cache read preserved');
must(primitives.includes('studentProfileCachePut(codigo, d);'),'cache write preserved');
must(primitives.includes("sessionStorage.removeItem(studentProfileCacheKey(codigo))"),'reload cache clear preserved');
must(primitives.includes(".catch(() => { if (!cancelled) setError('Error de conexión'); })"),'stable network copy preserved');

// Current wiring: the three effective views use the session wrapper, which itself calls useEstudiante(codigo).
must(modules.includes('function useEstudianteDeSesion()'),'shared session wrapper exists');
must(modules.includes('const r = useEstudiante(codigo);'),'shared wrapper still bridges to useEstudiante(codigo)');
const consumerNames=['NotasView','PagosView','PerfilView'];
let consumerCount=0;
for(const name of consumerNames){
  const start=modules.indexOf(`function ${name}`);
  must(start>=0,`${name} consumer preserved`);
  const next=modules.indexOf('\nfunction ',start+1);
  const body=modules.slice(start,next<0?modules.length:next);
  must(body.includes('useEstudianteDeSesion()'),`${name} remains wired through shared session hook`);
  consumerCount+=1;
}

// Reconstruct the exact base blob: this proves primitives changed only by the helper + one boundary replacement.
const helperCount=primitives.split(helper).length-1;
must(helperCount===1,`expected helper block exactly once, found ${helperCount}`);
let reconstructed=primitives.replace(helper,'').replace(newSet,oldSet);
must(gitBlobSha(Buffer.from(reconstructed,'utf8'))===BASE_PRIMITIVES_BLOB,'reversing CS21A210E returns exact #222 primitives blob');
must(gitBlobSha(read('src/primitives.jsx'))===EXPECTED_PRIMITIVES_BLOB,`candidate primitives matches expected blob ${EXPECTED_PRIMITIVES_BLOB}`);

// Historical J contract is preserved, with only descendant-safe consumer detection repaired.
must(historical.includes('studentSharedProfileSafeUserError'),'historical CS21A200J guard imported');
must(historical.includes('CACHE_RELOAD_AND_TOKEN=PRESERVED'),'historical invariant set preserved');
must(historical.includes('useEstudianteDeSesion()'),'historical guard follows current effective consumer wiring');
must(!historical.includes('window\\.useEstudiante'),'obsolete direct-window consumer assumption removed');

must(!/setSharing\s*\(|DriveApp\.Access\.ANYONE|ANYONE_WITH_LINK|setPermission\s*\(/i.test(primitives),'no Drive ACL mutation');

if(exactMode){
  const allowed=new Set([
    'src/primitives.jsx',
    'scripts/qa_student_shared_profile_safe_errors_cs21a200j.mjs',
    'scripts/qa_student_shared_profile_safe_errors_current_tip_cs21a210e.mjs',
    '.github/workflows/qa-student-shared-profile-safe-errors-cs21a210e.yml',
    '00_DOCUMENTACION/STUDENT_SHARED_PROFILE_SAFE_ERRORS_CURRENT_TIP_CS21A210E_2026-08-31.md'
  ]);
  const changed=execFileSync('git',['diff','--name-only',`${BASE_SHA}...HEAD`],{encoding:'utf8'}).trim().split(/\r?\n/).filter(Boolean);
  for(const path of changed)must(allowed.has(path),`unexpected stacked path: ${path}`);
  for(const path of allowed)must(changed.includes(path),`expected stacked path missing: ${path}`);
  const statuses=execFileSync('git',['diff','--name-status',`${BASE_SHA}...HEAD`],{encoding:'utf8'});
  must(!/^D\s/m.test(statuses),'no deletion in CS21A210E');
  must(!changed.some(path=>(/(^|\/)(AppsScript|apps_script_patches)(\/|$)|\.gs$/i).test(path)),'no Apps Script source change');
}

console.log('CS21A210E STUDENT SHARED PROFILE SAFE ERRORS CURRENT TIP: PASS');
console.log(`BASE=${BASE_SHA}`);
console.log(`BRANCH=${BRANCH}`);
console.log(`SHARED_CONSUMERS=${consumerCount}`);
console.log('PRIMITIVES_PREIMAGE_RECONSTRUCTION=EXACT');
console.log(`EXACT_IMPORT=${exactMode?'VERIFIED':'SKIPPED_FOR_DESCENDANT'}`);
console.log('EVIDENCE=E0_E1_SOURCE_ONLY');
console.log('APPS_SCRIPT_WRITE=NO');
console.log('DRIVE_ACL_CHANGE=NO');
console.log('PROD=NOT_TOUCHED');
