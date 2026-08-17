import fs from 'node:fs';
import crypto from 'node:crypto';

const QA_DEPLOYMENT = 'AKfycbzzsmmHVRGlgltcUJf7Yi9R0z__vsu58Hw9Gq9rNn5pYVrgY5iZ0-xEEL-8wqL4uPVbaw';
const PROD_DEPLOYMENT = 'AKfycbx8O8dxCNhHQQLdRFd4vqOY_yIzE0KUG7ljk7vkieHf9hKWeund_WC0ZpuKU-Toj8sYHQ';
const required = [
  'QA_STAGING_APPS_SCRIPT_URL',
  'QA_STUDENT_USER','QA_STUDENT_PASS',
  'QA_TEACHER_USER','QA_TEACHER_PASS',
  'QA_SUPERADMIN_USER','QA_SUPERADMIN_PASS',
  'QA_STUDENT_CODE',
];
const missing = required.filter(k => !String(process.env[k] || '').trim());
if (missing.length) throw new Error(`Faltan secretos/variables QA: ${missing.join(', ')}`);

const stagingUrl = String(process.env.QA_STAGING_APPS_SCRIPT_URL).trim();
if (!stagingUrl.includes(QA_DEPLOYMENT)) throw new Error('BLOQUEADO: QA_STAGING_APPS_SCRIPT_URL no apunta a la deployment QA canónica.');
if (stagingUrl.includes(PROD_DEPLOYMENT)) throw new Error('BLOQUEADO: URL productiva detectada.');

const outDir = 'qa-output-sec002-runtime';
fs.mkdirSync(outDir, { recursive: true });

async function post(fn, payload = {}, token = '') {
  const url = new URL(stagingUrl);
  url.searchParams.set('fn', fn);
  const res = await fetch(url, {
    method:'POST',
    headers:{'Content-Type':'text/plain;charset=utf-8'},
    body:JSON.stringify({ fn, token, ...payload }),
    redirect:'follow',
  });
  const raw = await res.text();
  let data;
  try { data = JSON.parse(raw); }
  catch (_) { throw new Error(`${fn}: respuesta no JSON (${raw.slice(0,160)})`); }
  return { status:res.status, okHttp:res.ok, data };
}

function safeError(d) {
  return String(d?.error || d?.mensaje || (d?.ok === false ? 'rejected' : '') || '').slice(0,180);
}

function flattenObjects(root, max = 2000) {
  const out=[]; const seen=new Set(); const stack=[root];
  while (stack.length && out.length < max) {
    const v=stack.pop();
    if (!v || typeof v !== 'object' || seen.has(v)) continue;
    seen.add(v);
    if (!Array.isArray(v)) out.push(v);
    for (const child of Object.values(v)) {
      if (child && typeof child === 'object') stack.push(child);
    }
  }
  return out;
}

function normalizeBool(v) {
  if (v === true) return true;
  const s=String(v ?? '').trim().toLowerCase();
  return ['true','1','si','sí','yes','x'].includes(s);
}

function privatePayloadMeta(d, {version, maxBytes, mimeSet, requirePdfMagic=false}) {
  if (!d || d.ok !== true) return { ok:false, error:safeError(d) || 'not_ok' };
  const forbidden = ['url','file_id','folder_url','webViewLink','url_comprobante'].filter(k => String(d[k] ?? '').trim());
  if (forbidden.length) return { ok:false, error:`forbidden_fields:${forbidden.join(',')}` };
  if (d.private_delivery !== true) return { ok:false, error:'private_delivery_missing' };
  if (version && String(d.version || '') !== version) return { ok:false, error:`version:${String(d.version||'')}` };
  const mime=String(d.mime_type || '').trim().toLowerCase();
  if (mimeSet && !mimeSet.has(mime)) return { ok:false, error:`mime:${mime}` };
  const b64=String(d.data_base64 || '').replace(/\s+/g,'');
  if (!b64) return { ok:false, error:'base64_missing' };
  let bytes;
  try { bytes=Buffer.from(b64,'base64'); } catch (_) { return { ok:false,error:'base64_invalid' }; }
  if (!bytes.length) return { ok:false,error:'bytes_empty' };
  if (bytes.length > maxBytes) return { ok:false,error:`too_large:${bytes.length}` };
  const declared=Number(d.size_bytes || 0);
  if (!declared || declared !== bytes.length) return { ok:false,error:`size_mismatch:${declared}/${bytes.length}` };
  const hash=crypto.createHash('sha256').update(bytes).digest('hex');
  if (!/^[a-f0-9]{64}$/i.test(String(d.sha256 || '')) || hash !== String(d.sha256).toLowerCase()) return { ok:false,error:'sha256_mismatch' };
  if (requirePdfMagic && bytes.subarray(0,5).toString('ascii') !== '%PDF-') return { ok:false,error:'pdf_magic_invalid' };
  return { ok:true, version:d.version, mime, size_bytes:bytes.length, sha256_prefix:hash.slice(0,12), name_present:!!String(d.nombre||'').trim() };
}

const checks=[];
const fixtures={ certificates:[], docs_extra:[], payment_receipts:[], signed_enrollment:[] };
function record(area, name, ok, detail={}) { checks.push({area,name,ok,...detail}); }

async function login(role,user,pass) {
  const r=await post('iniciarSesion',{usuario:user,clave:pass});
  if (!r.okHttp || r.data?.ok !== true || !r.data?.token) throw new Error(`Login QA ${role} falló: ${safeError(r.data)}`);
  record('auth',`login_${role}`,true,{returned_role:String(r.data.rol||'')});
  return r.data;
}

const sessions={
  student:await login('student',process.env.QA_STUDENT_USER,process.env.QA_STUDENT_PASS),
  teacher:await login('teacher',process.env.QA_TEACHER_USER,process.env.QA_TEACHER_PASS),
  superadmin:await login('superadmin',process.env.QA_SUPERADMIN_USER,process.env.QA_SUPERADMIN_PASS),
};

// ---- Certificate: discover own available levels, then try at most four levels.
const certState=await post('getMisCertificadosEstado',{codigo:process.env.QA_STUDENT_CODE},sessions.student.token);
record('certificate','state_read',certState.data?.ok===true,{error:certState.data?.ok===true?'':safeError(certState.data)});
const certObjs=flattenObjects(certState.data);
const levelOrder=[];
for (const o of certObjs) {
  const level=String(o.nivel||o.NIVEL||'').trim().toUpperCase();
  if (!['B1','B2','I1','I2'].includes(level)) continue;
  const available = normalizeBool(o.disponible ?? o.existe ?? o.generado ?? o.certificado_disponible ?? o.ok);
  if (available && !levelOrder.includes(level)) levelOrder.push(level);
}
for (const level of ['B1','B2','I1','I2']) if (!levelOrder.includes(level)) levelOrder.push(level);
for (const level of levelOrder.slice(0,4)) {
  const r=await post('descargarMiCertificadoPrivado',{codigo:process.env.QA_STUDENT_CODE,nivel:level},sessions.student.token);
  if (r.data?.ok===true) {
    const meta=privatePayloadMeta(r.data,{version:'SEC002-CERT-PRIVATE-1',maxBytes:2*1024*1024,mimeSet:new Set(['application/pdf']),requirePdfMagic:true});
    fixtures.certificates.push({level,...meta});
    record('certificate',`student_own_${level}`,meta.ok,meta);
    if (meta.ok) break;
  } else {
    record('certificate',`student_own_${level}`,true,{fixture:false,error:safeError(r.data)});
  }
}
const certForeign=await post('descargarMiCertificadoPrivado',{codigo:`${process.env.QA_STUDENT_CODE}-FOREIGN`,nivel:'B1'},sessions.student.token);
record('certificate','student_foreign_code_denied',certForeign.data?.ok===false && /no_autorizado/i.test(safeError(certForeign.data)),{error:safeError(certForeign.data)});
const certTeacher=await post('descargarMiCertificadoPrivado',{codigo:process.env.QA_STUDENT_CODE,nivel:'B1'},sessions.teacher.token);
record('certificate','teacher_denied',certTeacher.data?.ok===false,{error:safeError(certTeacher.data)});

// ---- Payments: find a request with a stored receipt and validate private delivery as superadmin.
const payments=await post('getSolicitudesPago',{},sessions.superadmin.token);
record('payment_receipt','list_read',payments.data?.ok===true,{error:payments.data?.ok===true?'':safeError(payments.data)});
const paymentCandidates=flattenObjects(payments.data).filter(o => {
  const id=String(o.id||o.ID||o.solicitud_id||'').trim();
  const has=normalizeBool(o.tiene_comprobante) || !!String(o.url_comprobante||'').trim();
  return id && has;
});
for (const c of paymentCandidates.slice(0,6)) {
  const id=String(c.id||c.ID||c.solicitud_id||'').trim();
  const r=await post('descargarComprobantePagoPrivado',{id},sessions.superadmin.token);
  if (r.data?.ok!==true) continue;
  const meta=privatePayloadMeta(r.data,{version:'SEC002-PAGO-PRIVATE-1',maxBytes:5*1024*1024,mimeSet:new Set(['image/jpeg','image/png','application/pdf']),requirePdfMagic:false});
  fixtures.payment_receipts.push({id_present:true,...meta});
  record('payment_receipt','superadmin_positive',meta.ok,meta);
  const denied=await post('descargarComprobantePagoPrivado',{id},sessions.student.token);
  record('payment_receipt','student_denied',denied.data?.ok===false,{error:safeError(denied.data)});
  break;
}
if (!fixtures.payment_receipts.length) record('payment_receipt','positive_fixture_available',true,{fixture:false,candidates:paymentCandidates.length});

// ---- Sales documents: superadmin discovers prospect detail and docs_extra file_id.
const dash=await post('getDashboardVentas',{asesor:''},sessions.superadmin.token);
record('docs_extra','dashboard_read',dash.data?.ok===true,{error:dash.data?.ok===true?'':safeError(dash.data)});
const prospectObjs=flattenObjects(dash.data).filter(o => String(o.cedula||o.CEDULA||'').replace(/\D/g,'').length>=7);
const seenCed=new Set();
const extraFound=[];
for (const p of prospectObjs) {
  if (extraFound.length>=3 || seenCed.size>=18) break;
  const ced=String(p.cedula||p.CEDULA||'').trim();
  const key=ced.replace(/\D/g,'');
  if (!key || seenCed.has(key)) continue;
  seenCed.add(key);
  const d=await post('getProspectoDetalle',{cedula:ced},sessions.superadmin.token);
  if (d.data?.ok!==true) continue;
  const objs=flattenObjects(d.data);
  const docs=objs.filter(o => String(o.file_id||'').trim() && (String(o.nombre_archivo||o.nombre||'').trim() || String(o.mime_type||'').trim()));
  for (const doc of docs) {
    const id=String(doc.file_id||'').trim();
    if (id && !extraFound.some(x=>x.id===id)) extraFound.push({ced,id});
    if (extraFound.length>=3) break;
  }
}
if (extraFound.length) {
  const first=extraFound[0];
  const r=await post('descargarDocumentoExtraPrivado',{cedula:first.ced,file_id:first.id},sessions.superadmin.token);
  const meta=privatePayloadMeta(r.data,{version:'SEC002-EXTRA-PRIVATE-1',maxBytes:5*1024*1024,mimeSet:null,requirePdfMagic:false});
  fixtures.docs_extra.push(meta);
  record('docs_extra','superadmin_positive',meta.ok,meta);
  const denied=await post('descargarDocumentoExtraPrivado',{cedula:first.ced,file_id:first.id},sessions.student.token);
  record('docs_extra','student_denied',denied.data?.ok===false,{error:safeError(denied.data)});
  if (extraFound.length>1 && extraFound[1].ced.replace(/\D/g,'')!==first.ced.replace(/\D/g,'')) {
    const cross=await post('descargarDocumentoExtraPrivado',{cedula:first.ced,file_id:extraFound[1].id},sessions.superadmin.token);
    record('docs_extra','cross_resource_mismatch_denied',cross.data?.ok===false && /documento_no_encontrado|no_autorizado/i.test(safeError(cross.data)),{error:safeError(cross.data)});
  }
} else record('docs_extra','positive_fixture_available',true,{fixture:false,prospects_scanned:seenCed.size});

// ---- Signed enrollment: first student own; if missing, scan prospect candidates as superadmin without file_id.
const signedStudent=await post('descargarMatriculaFirmadaPrivada',{},sessions.student.token);
if (signedStudent.data?.ok===true) {
  const meta=privatePayloadMeta(signedStudent.data,{version:'SEC002-MATF-PRIVATE-1',maxBytes:9*1024*1024,mimeSet:new Set(['application/pdf']),requirePdfMagic:true});
  fixtures.signed_enrollment.push({actor:'student',...meta});
  record('signed_enrollment','student_own_positive',meta.ok,meta);
  const supplied=await post('descargarMatriculaFirmadaPrivada',{cedula:'0-0000-0000',file_id:'FOREIGN_FILE_ID'},sessions.student.token);
  if (supplied.data?.ok===true) {
    const meta2=privatePayloadMeta(supplied.data,{version:'SEC002-MATF-PRIVATE-1',maxBytes:9*1024*1024,mimeSet:new Set(['application/pdf']),requirePdfMagic:true});
    record('signed_enrollment','student_client_identity_ignored',meta2.ok && meta2.sha256_prefix===meta.sha256_prefix,{same_payload_hash:meta2.sha256_prefix===meta.sha256_prefix});
  } else record('signed_enrollment','student_client_identity_ignored',false,{error:safeError(supplied.data)});
} else {
  record('signed_enrollment','student_own_positive',true,{fixture:false,error:safeError(signedStudent.data)});
  for (const p of prospectObjs.slice(0,25)) {
    const ced=String(p.cedula||p.CEDULA||'').trim();
    const codigo=String(p.codigo||p.codigo_estudiante||p.CODIGO_ESTUDIANTE||'').trim();
    if (!ced) continue;
    const r=await post('descargarMatriculaFirmadaPrivada',{cedula:ced,codigo},sessions.superadmin.token);
    if (r.data?.ok!==true) continue;
    const meta=privatePayloadMeta(r.data,{version:'SEC002-MATF-PRIVATE-1',maxBytes:9*1024*1024,mimeSet:new Set(['application/pdf']),requirePdfMagic:true});
    fixtures.signed_enrollment.push({actor:'superadmin',...meta});
    record('signed_enrollment','superadmin_positive',meta.ok,meta);
    break;
  }
}
const signedTeacher=await post('descargarMatriculaFirmadaPrivada',{},sessions.teacher.token);
record('signed_enrollment','teacher_denied',signedTeacher.data?.ok===false,{error:safeError(signedTeacher.data)});

const hardFailures=checks.filter(c=>c.ok===false);
const report={
  version:'SEC002-RUNTIME-DISCOVERY-1',
  generated_at:new Date().toISOString(),
  qa_deployment:QA_DEPLOYMENT,
  checks,
  fixture_summary:{
    certificate_positive:fixtures.certificates.some(x=>x.ok),
    docs_extra_positive:fixtures.docs_extra.some(x=>x.ok),
    payment_receipt_positive:fixtures.payment_receipts.some(x=>x.ok),
    signed_enrollment_positive:fixtures.signed_enrollment.some(x=>x.ok),
    ventas_credentials_available:false,
  },
  fixtures,
  hard_failures:hardFailures,
  note:'Read-only discovery. No ACL changes, no uploads, no payment/status mutations. Secrets/tokens/base64/full cédulas are not written to this report.',
};
fs.writeFileSync(`${outDir}/runtime-discovery.json`,JSON.stringify(report,null,2));
console.log('SEC002_RUNTIME_DISCOVERY',JSON.stringify(report.fixture_summary));
for (const c of checks) console.log(`${c.ok?'PASS':'FAIL'} ${c.area} :: ${c.name}${c.fixture===false?' :: NO_FIXTURE':''}${c.error?` :: ${c.error}`:''}`);
if (hardFailures.length) process.exit(1);
