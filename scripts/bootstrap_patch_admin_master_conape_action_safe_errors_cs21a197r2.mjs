import fs from 'node:fs';

function patch(path,label,from,to){
  let src=fs.readFileSync(path,'utf8');
  const count=src.split(from).length-1;
  if(count!==1)throw new Error(`${label}: expected exactly 1 preimage, found ${count}`);
  src=src.replace(from,to);
  fs.writeFileSync(path,src);
  console.log(`${label}: replaced 1`);
}

patch(
  'src/admin_master_conape_wa_cs21a96.jsx',
  'WA import safe helper',
  'const {WA_TEMPLATES,clean,phone,levelId,periodKind,post,pendingAmount,waText}=N;',
  'const {WA_TEMPLATES,clean,phone,levelId,periodKind,post,masterConapeSafeUserError,pendingAmount,waText}=N;'
);
patch(
  'src/admin_master_conape_wa_cs21a96.jsx',
  'WA visible error',
  "alert('No se pudo preparar WhatsApp: '+(e?.message||e))",
  "alert(masterConapeSafeUserError(e?.message||String(e),'No se pudo preparar WhatsApp. Intentá de nuevo.','preparar_whatsapp'))"
);
patch(
  'src/admin_master_conape_review_state_cs21a96.jsx',
  'review import safe helper',
  'const{clean,reviewStepValue,isAcademicDisbursement01,post}=N;',
  'const{clean,reviewStepValue,isAcademicDisbursement01,post,masterConapeSafeUserError}=N;'
);
patch(
  'src/admin_master_conape_review_state_cs21a96.jsx',
  'review visible error',
  '   setMsg(error?.message||String(error));',
  "   setMsg(masterConapeSafeUserError(error?.message||String(error),'No se pudo guardar la revisión. Intentá de nuevo.','guardar_revision'));"
);

console.log('CS21A197R2 exact action safe-error patch applied');
