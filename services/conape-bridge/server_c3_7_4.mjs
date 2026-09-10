import fs from 'node:fs/promises';

/* C3.7.4 · hotfix de contrato de contacto
   Regla de negocio: si CONAPE ya devuelve un correo, Campus nunca lo modifica.
   El correo Campus distinto queda como dato alterno de comparación; solo se llena
   P2_PRS_EMAIL cuando CONAPE lo devuelve vacío.
   Conserva además el timeout Campus ampliado introducido en C3.7.3.
*/
const configured = Number(process.env.CAMPUS_REQUEST_TIMEOUT_MS || 70000);
const campusTimeoutMs = Number.isFinite(configured) ? Math.max(30000, configured) : 70000;
const nativeTimeout = AbortSignal.timeout.bind(AbortSignal);
AbortSignal.timeout = function campusAwareTimeout(ms) {
  return nativeTimeout(Number(ms) === 30000 ? campusTimeoutMs : ms);
};

const sourceUrl = new URL('./server_c3_7.mjs', import.meta.url);
const runtimeUrl = new URL('./server_c3_7_4_runtime.mjs', import.meta.url);
let source = await fs.readFile(sourceUrl, 'utf8');

const oldPlan = "function contactPlan(campus,conape){ const phone=campusPhone(campus),mail=campusEmail(campus),conapePhone=digits(conape?.telefono).slice(-8),conapeMail=email(conape?.correo); if(phone&&phone.length!==8)throw new AppError('CONTACT_VALIDATION_FAILED','El WhatsApp del Campus no tiene 8 dígitos.',422); if(!validEmail(mail))throw new AppError('CONTACT_VALIDATION_FAILED','El correo del Campus no es válido.',422); return {telefono:phone||conapePhone,correo:mail||conapeMail,update_telefono:!!phone&&phone!==conapePhone,update_correo:!!mail&&mail!==conapeMail}; }";
const newPlan = "function contactPlan(campus,conape){ const phone=campusPhone(campus),mail=campusEmail(campus),conapePhone=digits(conape?.telefono).slice(-8),conapeMail=email(conape?.correo); if(phone&&phone.length!==8)throw new AppError('CONTACT_VALIDATION_FAILED','El WhatsApp del Campus no tiene 8 dígitos.',422); if(!validEmail(mail))throw new AppError('CONTACT_VALIDATION_FAILED','El correo del Campus no es válido.',422); const correoAlterno=conapeMail&&mail&&mail!==conapeMail?mail:''; return {telefono:phone||conapePhone,correo:conapeMail||mail,correo_campus_alterno:correoAlterno,update_telefono:!!phone&&phone!==conapePhone,update_correo:!conapeMail&&!!mail,preserve_correo_conape:!!conapeMail}; }";

if (!source.includes(oldPlan)) {
  throw new Error('C3_7_4_SOURCE_CONTRACT_MISMATCH');
}
source = source.replace(oldPlan, newPlan).replaceAll("version:'C3.7'", "version:'C3.7.4'");
await fs.writeFile(runtimeUrl, source, 'utf8');

console.log(JSON.stringify({
  event:'bridge_runtime_patch',
  version:'C3.7.4',
  campus_timeout_ms:campusTimeoutMs,
  preserve_existing_conape_email:true,
  pii:false,
}));

await import(`${runtimeUrl.href}?v=${Date.now()}`);
