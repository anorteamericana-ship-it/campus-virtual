import fs from 'node:fs';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';

const BASE_SHA='37c79252deed11e4e2b7f4b868cb14fdff43ccd1';
const BASE_PRIMITIVES_BLOB='764a1583692de05fc5909b1939add71282605cde';
const EXPECTED_PRIMITIVES_BLOB='420908f5a9efbdbd6ff948e3ff93741ce543377e';
const BRANCH='fix/shared-error-state-console-only-cs21a210f';
const exactMode=process.argv.includes('--exact-import');
const must=(ok,label)=>{if(!ok)throw new Error(`CS21A210F FAIL: ${label}`)};
const read=p=>fs.readFileSync(p);
const text=p=>read(p).toString('utf8');
const gitBlobSha=buf=>crypto.createHash('sha1').update(`blob ${buf.length}\0`).update(buf).digest('hex');

const primitives=text('src/primitives.jsx');
const inheritedE=text('scripts/qa_student_shared_profile_safe_errors_current_tip_cs21a210e.mjs');

const oldBlock=`// ── ErrorState — usado cuando un endpoint falla ──────────────────────────\n// F96.5 UX-E: ningún estudiante/docente debe ver errores técnicos crudos\n// como "Cannot read properties...". El detalle queda disponible solo si el\n// usuario lo despliega para soporte.\nfunction normalizarMensajeErrorCampus(message) {\n  const raw = String(message || '').trim();\n  if (!raw) return { titulo:'No se pudo cargar la información.', detalle:'' };\n  const tecnico = /Cannot read|undefined|null|TypeError|ReferenceError|SyntaxError|stack|Exception|Failed to fetch|NetworkError|Unexpected token/i.test(raw);\n  if (tecnico) {\n    return {\n      titulo:'No se pudo cargar este módulo.',\n      detalle:raw,\n    };\n  }\n  return { titulo:raw, detalle:'' };\n}\n\nfunction ErrorState({ message, onRetry }) {\n  const err = normalizarMensajeErrorCampus(message);\n  const [showDetail, setShowDetail] = React.useState(false);\n  return (\n    <div style={{\n      padding:'24px', textAlign:'center',\n      background:'color-mix(in srgb, var(--danger) 6%, white)',\n      border:'1px solid color-mix(in srgb, var(--danger) 25%, white)',\n      borderRadius:'var(--r-md)', color:'var(--danger)',\n    }}>\n      <div style={{ fontWeight:800, marginBottom:4 }}>⚠ {err.titulo}</div>\n      <div style={{ fontSize:12, color:'var(--ink-2)', marginBottom:10, lineHeight:1.5 }}>\n        Intentá de nuevo. Si continúa, enviá una captura indicando tu nombre, grupo y la pantalla donde ocurrió.\n      </div>\n      <div style={{ display:'flex', gap:8, justifyContent:'center', flexWrap:'wrap' }}>\n        {onRetry && (\n          <button className="btn btn-ghost" onClick={onRetry}\n                  style={{ fontSize:12, padding:'6px 14px' }}>Reintentar</button>\n        )}\n        {err.detalle && (\n          <button className="btn btn-ghost" onClick={() => setShowDetail(!showDetail)}\n                  style={{ fontSize:12, padding:'6px 14px' }}>\n            {showDetail ? 'Ocultar detalle técnico' : 'Ver detalle para soporte'}\n          </button>\n        )}\n      </div>\n      {showDetail && err.detalle && (\n        <pre style={{ margin:'12px auto 0', maxWidth:680, whiteSpace:'pre-wrap', textAlign:'left', fontSize:11, lineHeight:1.45, color:'var(--ink-2)', background:'#fff', border:'1px solid var(--line)', borderRadius:10, padding:12 }}>\n          {err.detalle}\n        </pre>\n      )}\n    </div>\n  );\n}\n`;

const newBlock=`// ── ErrorState — usado cuando un endpoint falla ──────────────────────────\n// F96.5 UX-E: ningún estudiante/docente/admin debe ver errores técnicos crudos.\n// El detalle técnico queda exclusivamente en consola para diagnóstico.\nfunction normalizarMensajeErrorCampus(message) {\n  const raw = String(message || '').trim();\n  if (!raw) return { titulo:'No se pudo cargar la información.' };\n  const technicalCode = /^[a-z0-9.-]+(?:_[a-z0-9.-]+)+$/i.test(raw);\n  const tecnico = /apps?\\s*script|script\\.google|backend|endpoint|stack|exception|trace|typeerror|referenceerror|syntaxerror|rangeerror|networkerror|failed to fetch|network request failed|unexpected token|<html|\\bjson\\b|\\btoken\\b|unauthorized|forbidden|internal server|error interno|http\\s*\\d{3}|status\\s*\\d{3}|request_id|file_id|base64|sha-?256|\\bmime\\b|driveapp|spreadsheet|\\bsheet\\b|\\btabla\\b|\\bhoja\\b|cannot read|\\bundefined\\b|\\bnull\\b/i.test(raw);\n  if (technicalCode || tecnico) {\n    console.warn('[ErrorState] Detalle técnico oculto al usuario.', { error: raw });\n    return { titulo:'No se pudo cargar este módulo.' };\n  }\n  return { titulo:raw };\n}\n\nfunction ErrorState({ message, onRetry }) {\n  const err = normalizarMensajeErrorCampus(message);\n  return (\n    <div style={{\n      padding:'24px', textAlign:'center',\n      background:'color-mix(in srgb, var(--danger) 6%, white)',\n      border:'1px solid color-mix(in srgb, var(--danger) 25%, white)',\n      borderRadius:'var(--r-md)', color:'var(--danger)',\n    }}>\n      <div style={{ fontWeight:800, marginBottom:4 }}>⚠ {err.titulo}</div>\n      <div style={{ fontSize:12, color:'var(--ink-2)', marginBottom:10, lineHeight:1.5 }}>\n        Intentá de nuevo. Si continúa, enviá una captura indicando tu nombre, grupo y la pantalla donde ocurrió.\n      </div>\n      <div style={{ display:'flex', gap:8, justifyContent:'center', flexWrap:'wrap' }}>\n        {onRetry && (\n          <button className="btn btn-ghost" onClick={onRetry}\n                  style={{ fontSize:12, padding:'6px 14px' }}>Reintentar</button>\n        )}\n      </div>\n    </div>\n  );\n}\n`;

must(primitives.includes(newBlock),'new console-only ErrorState block exists exactly once');
must((primitives.split(newBlock).length-1)===1,'new ErrorState block unique');
must(!primitives.includes('Ver detalle para soporte'),'support-detail button removed');
must(!primitives.includes('Ocultar detalle técnico'),'technical-detail toggle removed');
must(!primitives.includes('showDetail'),'technical-detail state removed');
must(!/\{err\.detalle\}|<pre[^>]*>\s*\{err\.detalle\}/m.test(primitives),'raw detail rendering removed');
must(primitives.includes("console.warn('[ErrorState] Detalle técnico oculto al usuario.'"),'technical diagnostic preserved in console');
must(primitives.includes("return { titulo:'No se pudo cargar este módulo.' };"),'stable technical fallback preserved');
must(primitives.includes("return { titulo:raw };"),'human business messages preserved');
must(primitives.includes('request_id|file_id|base64|sha-?256'),'sensitive technical markers filtered');
must(primitives.includes('>Reintentar</button>'),'retry action preserved');
must(primitives.includes('Intentá de nuevo. Si continúa, enviá una captura indicando tu nombre, grupo y la pantalla donde ocurrió.'),'support guidance preserved');

// Exact preimage/import proof belongs only to CS21A210F itself; descendants are checked semantically.
if(exactMode){
  const reconstructed=primitives.replace(newBlock,oldBlock);
  must(gitBlobSha(Buffer.from(reconstructed,'utf8'))===BASE_PRIMITIVES_BLOB,'reversing CS21A210F returns exact #223 primitives blob');
  must(gitBlobSha(read('src/primitives.jsx'))===EXPECTED_PRIMITIVES_BLOB,`candidate primitives matches expected blob ${EXPECTED_PRIMITIVES_BLOB}`);
}

// Regress the immediately previous shared-profile boundary in the same file.
must(primitives.includes('function studentSharedProfileSafeUserError('),'CS21A210E helper preserved');
must(primitives.includes("setError(studentSharedProfileSafeUserError(d && d.error, 'No pudimos cargar tu información. Intentá de nuevo.', 'get_estudiante'));"),'CS21A210E safe boundary preserved');

// The inherited E guard must be descendant-safe: exact blob/preimage checks only under --exact-import.
must(inheritedE.includes("if(exactMode){\n  const reconstructed=primitives.replace(helper,'').replace(newSet,oldSet);"),'CS21A210E exact preimage proof gated to exact mode');
must(inheritedE.includes("PRIMITIVES_PREIMAGE_RECONSTRUCTION=${exactMode?'EXACT':'SKIPPED_FOR_DESCENDANT'}"),'CS21A210E reports descendant-safe mode');

must(!/setSharing\s*\(|DriveApp\.Access\.ANYONE|ANYONE_WITH_LINK|setPermission\s*\(/i.test(primitives),'no Drive ACL mutation');

if(exactMode){
  const allowed=new Set([
    'src/primitives.jsx',
    'scripts/qa_student_shared_profile_safe_errors_current_tip_cs21a210e.mjs',
    'scripts/qa_shared_error_state_console_only_cs21a210f.mjs',
    '.github/workflows/qa-shared-error-state-console-only-cs21a210f.yml',
    '00_DOCUMENTACION/SHARED_ERROR_STATE_CONSOLE_ONLY_CS21A210F_2026-08-31.md'
  ]);
  const changed=execFileSync('git',['diff','--name-only',`${BASE_SHA}...HEAD`],{encoding:'utf8'}).trim().split(/\r?\n/).filter(Boolean);
  for(const path of changed)must(allowed.has(path),`unexpected stacked path: ${path}`);
  for(const path of allowed)must(changed.includes(path),`expected stacked path missing: ${path}`);
  const statuses=execFileSync('git',['diff','--name-status',`${BASE_SHA}...HEAD`],{encoding:'utf8'});
  must(!/^D\s/m.test(statuses),'no deletion in CS21A210F');
  must(!changed.some(path=>(/(^|\/)(AppsScript|apps_script_patches)(\/|$)|\.gs$/i).test(path)),'no Apps Script source change');
}

console.log('CS21A210F SHARED ERRORSTATE CONSOLE ONLY: PASS');
console.log(`BASE=${BASE_SHA}`);
console.log(`BRANCH=${BRANCH}`);
console.log('TECHNICAL_DETAIL_RENDERED=NO');
console.log('RETRY_PRESERVED=YES');
console.log(`PRIMITIVES_PREIMAGE_RECONSTRUCTION=${exactMode?'EXACT':'SKIPPED_FOR_DESCENDANT'}`);
console.log(`EXACT_IMPORT=${exactMode?'VERIFIED':'SKIPPED_FOR_DESCENDANT'}`);
console.log('EVIDENCE=E0_E1_SOURCE_ONLY');
console.log('APPS_SCRIPT_WRITE=NO');
console.log('DRIVE_ACL_CHANGE=NO');
console.log('PROD=NOT_TOUCHED');
