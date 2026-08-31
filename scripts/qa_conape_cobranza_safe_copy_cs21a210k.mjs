import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const BASE='ed69a64aeedd9a858cce129f84c0eec9a9d25b3d';
const BRANCH='fix/conape-cobranza-safe-copy-cs21a210k';
const exactScope=process.argv.includes('--exact-scope');
const must=(ok,label)=>{if(!ok)throw new Error(`CS21A210K FAIL: ${label}`)};
const src=fs.readFileSync('src/conape_cobranza.jsx','utf8');

must(src.includes("function ccSafeUserError(raw, fallback, context = '')"),'safe-error helper exists');
must(src.includes("console.warn('[ConapeCobranza] Detalle técnico oculto al operador.'"),'technical diagnostics stay console-only');
must(src.includes("function ccStatusLabel(value, fallback = '—')"),'friendly status formatter exists');

must(!src.includes('.catch(e => setError(e.message || String(e)))'),'load raw exception sink removed');
must(!src.includes('setError(e.message || String(e));'),'sync raw exception sink removed');
must(src.includes("ccSafeUserError(e?.message || String(e), 'No se pudo cargar CONAPE y Cobranza. Intentá de nuevo.', 'cargar_panel')"),'load safe boundary present');
must(src.includes("ccSafeUserError(e?.message || String(e), 'No se pudo sincronizar CONAPE. Intentá de nuevo.', 'sincronizar_conape')"),'sync safe boundary present');
must(src.includes("ccSafeUserError(r?.mensaje, 'CONAPE sincronizado correctamente.', 'sincronizar_conape_exito')"),'success message cannot expose technical detail');

for(const hidden of ['WS CONAPE:',"p.ws_novedad || 'WS sin novedad'",'Estudiantes en DATOS con convenio CONAPE.']) must(!src.includes(hidden),`internal visible copy removed: ${hidden}`);
must(src.includes('Última sincronización CONAPE:'),'friendly synchronization copy present');
must(src.includes('Estudiantes activos con convenio CONAPE.'),'friendly active-CONAPE copy present');
must(src.includes("ccStatusLabel(p.etapa, 'Sin etapa')"),'prospect stage rendered friendly');
must(src.includes("ccStatusLabel(p.ws_novedad, 'Sin novedad CONAPE')"),'CONAPE novelty rendered friendly');
must(src.includes("APROBADO_SIN_DESEMBOLSO:'Aprobado · pendiente de desembolso'"),'known approval code mapped');
must(src.includes("CONAPE_SOLICITUD:'Solicitud CONAPE'"),'known request code mapped');
must(src.includes("CONAPE_DOCUMENTOS:'Documentos CONAPE'"),'known docs code mapped');
must(src.includes("CON_DESEMBOLSO:'Con desembolso'"),'known disbursement code mapped');

must(src.includes("'Tipo','Prioridad','Cédula','Código','Nombre','Teléfono','Asesor','Grupo','Nivel','Etapa','Estado de cuenta','Novedad CONAPE','Último desembolso','Acción sugerida'"),'CSV headers are operator-facing');
must(src.includes("ccStatusLabel(p.estado_cuenta, '')"),'CSV account status friendly');
must(src.includes("ccStatusLabel(p.ws_novedad, '')"),'CSV CONAPE novelty friendly');
must(src.includes("ccStatusLabel(p.etapa, '—')"),'copied follow-up stage friendly');

// Preserve transport, endpoints and filtering semantics exactly where they matter.
must(src.includes("const token = window.getSessionToken ? window.getSessionToken() : '';"),'session token preserved');
must(src.includes("body: JSON.stringify({ fn, token, ...payload })"),'POST body preserved');
must(src.includes("postConapeCobranza('getPanelConapeCobranza', { detalle: true })"),'panel endpoint preserved');
must(src.includes("postConapeCobranza('sincronizarCONAPE', {})"),'sync endpoint preserved');
must(src.includes("ccUpper(p.ws_novedad) === 'CON_DESEMBOLSO'"),'disbursement filter contract preserved');
must(src.includes("ccUpper(p.ws_novedad) === 'APROBADO_SIN_DESEMBOLSO'"),'approval filter contract preserved');
must(src.includes("['CONAPE_SOLICITUD','CONAPE_DOCUMENTOS'].includes(ccUpper(p.etapa))"),'documents filter contract preserved');
must(src.includes("ccDownloadCsv('conape_cobranza_'"),'CSV export preserved');
must(src.includes("onNavigate('calendario_grupo', { grupo })"),'group navigation preserved');

if(exactScope){
  const changed=execFileSync('git',['diff','--name-only',`${BASE}...HEAD`],{encoding:'utf8'}).trim().split(/\r?\n/).filter(Boolean).sort();
  const allowed=[
    '.github/workflows/qa-conape-cobranza-safe-copy-cs21a210k.yml',
    '00_DOCUMENTACION/CONAPE_COBRANZA_SAFE_COPY_CS21A210K_2026-08-31.md',
    'scripts/qa_conape_cobranza_safe_copy_cs21a210k.mjs',
    'src/conape_cobranza.jsx',
  ].sort();
  must(JSON.stringify(changed)===JSON.stringify(allowed),`exact scope mismatch: ${changed.join(', ')}`);
}

console.log('CS21A210K CONAPE COBRANZA SAFE COPY: PASS');
console.log(`BASE=${BASE}`);
console.log(`BRANCH=${BRANCH}`);
console.log('RAW_VISIBLE_EXCEPTION_SINKS=REMOVED');
console.log('INTERNAL_SHEET_COPY=REMOVED');
console.log('RAW_CONAPE_CODES_RENDERED=NO_FOR_GUARDED_SURFACES');
console.log('FILTER_AND_SYNC_CONTRACTS=PRESERVED');
console.log(`EXACT_SCOPE=${exactScope?'VERIFIED':'SKIPPED_BOOTSTRAP'}`);
console.log('EVIDENCE=E0_E1_SOURCE_ONLY');
console.log('APPS_SCRIPT_WRITE=NO');
console.log('DRIVE_ACL_CHANGE=NO');
console.log('PROD=NOT_TOUCHED');
