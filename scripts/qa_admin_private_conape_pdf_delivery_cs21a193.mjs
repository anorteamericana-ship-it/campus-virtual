import fs from 'node:fs';

const src = fs.readFileSync('src/admin_students.jsx', 'utf8');
const contract = JSON.parse(fs.readFileSync('security/admin_private_conape_pdf_delivery_cs21a193.json', 'utf8'));

const requireText = (needle, label) => {
  if (!src.includes(needle)) throw new Error(`CS21A193 missing: ${label}`);
};
const forbidText = (needle, label) => {
  if (src.includes(needle)) throw new Error(`CS21A193 forbidden: ${label}`);
};

requireText('function abrirPdfPrivadoAdmin(payload)', 'private admin PDF helper');
requireText("const b64 = String(payload?.pdf_base64 || '').trim();", 'base64-only source');
requireText("if (mime !== 'application/pdf') throw new Error('mime_pdf_invalido');", 'PDF MIME validation');
requireText("if (b64.length > 28000000) throw new Error('pdf_demasiado_grande');", 'bounded payload');
requireText("if (bin.length < 5 || bin.slice(0, 5) !== '%PDF-') throw new Error('firma_pdf_invalida');", 'PDF magic validation');
requireText("console.warn('[AdminStudents] PDF privado rechazado.'", 'internal diagnostic');

requireText("postAdminStudents('generarConstanciaTraslado', { cambio_id:e.cambio_id, codigo, nivel:nivelKey, include_base64:true }, 70000)", 'transfer detail requests base64');
requireText("postAdminStudents(simple?'generarConstanciaTraslado':'generarCartaIntegralConape',{cambio_id:r.CAMBIO_ID,include_base64:true},80000)", 'history document requests base64');
requireText("postAdminStudents('generarCartaIntegralConape',{cambio_id:r.CAMBIO_ID,regenerar:true,include_base64:true},80000)", 'regenerated letter requests base64');

requireText("if (!abrirPdfPrivadoAdmin(r)) alert('La constancia está disponible, pero no pudimos abrirla de forma segura. Intentá de nuevo.');", 'transfer private open');
requireText("if(!abrirPdfPrivadoAdmin(resp))alert('El documento está disponible, pero no pudimos abrirlo de forma segura. Intentá de nuevo.');", 'history private open');
requireText("if(!abrirPdfPrivadoAdmin(resp))alert('La carta está disponible, pero no pudimos abrirla de forma segura. Intentá de nuevo.');", 'regenerated letter private open');

forbidText("if (e.pdf_traslado_url) { window.open(e.pdf_traslado_url", 'direct transfer Drive URL open');
forbidText("if(existingUrl){window.open(existingUrl", 'direct historical Drive URL open');
forbidText("include_base64:false", 'base64 explicitly disabled in guarded source');
forbidText("if(resp?.pdf_url)window.open(resp.pdf_url", 'regenerated CONAPE Drive URL open');

if (contract?.status !== 'SOURCE_CANDIDATE_E2_REQUIRED') throw new Error('CS21A193 contract must remain E2-gated');
if (contract?.backend_capability_evidence?.current_modular_qa_runtime !== 'UNPROVEN_UNTIL_E2') throw new Error('CS21A193 must not claim current runtime proof');
if (contract?.drive_acl_evidence?.acl_changes_in_this_cut !== false) throw new Error('CS21A193 must not alter ACL');
if (contract?.frontend_policy?.direct_drive_url_fallback_for_guarded_paths !== false) throw new Error('CS21A193 guarded paths must fail closed');

console.log('CS21A193 ADMIN PRIVATE CONAPE PDF DELIVERY: PASS');
console.log('DIRECT_DRIVE_URL_FALLBACK=NO_FOR_GUARDED_PATHS');
console.log('PDF_INTEGRITY=MIME_SIZE_MAGIC');
console.log('CURRENT_MODULAR_RUNTIME=E2_REQUIRED');
