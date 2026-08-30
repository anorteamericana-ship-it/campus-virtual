import fs from 'node:fs';

const wa=fs.readFileSync('src/admin_master_conape_wa_cs21a96.jsx','utf8');
const review=fs.readFileSync('src/admin_master_conape_review_state_cs21a96.jsx','utf8');

const requiredWa=[
  'masterConapeSafeUserError',
  "masterConapeSafeUserError(e?.message||String(e),'No se pudo preparar WhatsApp. Intentá de nuevo.','preparar_whatsapp')",
  "post('getEstudiante',{codigo:code})",
  'https://wa.me/${wa}?text=',
];
for(const needle of requiredWa){if(!wa.includes(needle))throw new Error(`CS21A197R2 WA contract missing: ${needle}`)}

const requiredReview=[
  'masterConapeSafeUserError',
  "if(clean(error?.message).toLowerCase().includes('cerrado'))",
  "masterConapeSafeUserError(error?.message||String(error),'No se pudo guardar la revisión. Intentá de nuevo.','guardar_revision')",
  "post('setConapeRevisionSemaforo',{movimiento_id:id,paso:next})",
];
for(const needle of requiredReview){if(!review.includes(needle))throw new Error(`CS21A197R2 review contract missing: ${needle}`)}

const forbidden=[
  "alert('No se pudo preparar WhatsApp: '+(e?.message||e))",
  'setMsg(error?.message||String(error))',
];
for(const needle of forbidden){if((wa+'\n'+review).includes(needle))throw new Error(`CS21A197R2 raw error UI remains: ${needle}`)}

console.log('CS21A197R2 ADMIN MASTER CONAPE ACTION SAFE ERRORS: PASS');
console.log('WHATSAPP_VISIBLE_ERROR=SANITIZED');
console.log('REVIEW_SAVE_VISIBLE_ERROR=SANITIZED');
console.log('CLOSED_STATE_INTERNAL_ERROR_INSPECTION=PRESERVED');
console.log('ENDPOINTS_AND_PAYLOADS=UNCHANGED');
