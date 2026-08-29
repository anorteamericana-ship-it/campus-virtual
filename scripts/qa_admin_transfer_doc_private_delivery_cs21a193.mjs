import fs from 'node:fs';

const src=fs.readFileSync('src/admin_students.jsx','utf8');
function must(ok,label){if(!ok)throw new Error(`CS21A193 FAIL: ${label}`);}

must(src.includes('function abrirPdfBackend(payload)'), 'private PDF helper signature present');
must(src.includes("new Blob([bytes], { type: payload.pdf_mime || 'application/pdf' })"), 'Blob delivery preserved');
must(!src.includes("payload?.pdf_url || fallbackUrl"), 'helper no longer falls back to direct Drive URL');
must(!src.includes("window.open(e.pdf_traslado_url"), 'inline transfer no longer opens stored URL directly');
must(!src.includes("if(existingUrl){window.open(existingUrl"), 'history no longer opens stored URL directly');
must(!src.includes('include_base64:false'), 'sensitive admin transfer/CONAPE generation no longer requests URL-only delivery');
must(!src.includes("window.open(resp.pdf_url,'_blank'"), 'regenerated CONAPE letter no longer opens direct URL');

must(src.includes("postAdminStudents('generarConstanciaTraslado', { cambio_id:e.cambio_id, codigo, nivel:nivelKey, include_base64:true }"), 'inline transfer requests private bytes');
must(src.includes("postAdminStudents(simple?'generarConstanciaTraslado':'generarCartaIntegralConape',{cambio_id:r.CAMBIO_ID,include_base64:true}"), 'history requests private bytes');
must(src.includes("postAdminStudents('generarCartaIntegralConape',{cambio_id:r.CAMBIO_ID,regenerar:true,include_base64:true}"), 'regeneration requests private bytes');
must(src.includes('function adminStudentsSafeUserError'), 'CS21A191 safe errors preserved');

console.log('CS21A193 ADMIN TRANSFER DOC PRIVATE DELIVERY: PASS');
console.log('DIRECT_DRIVE_OPEN=REMOVED_FOR_TARGET_PATHS');
console.log('BASE64_SESSION_DELIVERY=REQUIRED_FOR_TARGET_PATHS');
console.log('DRIVE_ACL=UNCHANGED');
