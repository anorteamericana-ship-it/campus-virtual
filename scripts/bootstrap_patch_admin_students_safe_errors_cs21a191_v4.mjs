import fs from 'node:fs';
import { pathToFileURL } from 'node:url';

await import(pathToFileURL(process.cwd()+'/scripts/bootstrap_patch_admin_students_safe_errors_cs21a191_v3.mjs').href+'?v='+Date.now());

const path='src/admin_students.jsx';
let s=fs.readFileSync(path,'utf8');
const exactTrailing=[
  "setError(adminStudentsSafeUserError(d?.error || d?.mensaje, 'No pudimos cargar los grupos. Intentá de nuevo.', 'cargar_grupos')); ",
  "else setError(adminStudentsSafeUserError(d?.error || d?.mensaje, 'No pudimos cargar la radiografía del grupo. Intentá de nuevo.', 'cargar_radiografia')); ",
  "setError(adminStudentsSafeUserError(data?.error || data?.mensaje, 'No se pudo actualizar el estatus. Intentá de nuevo.', 'actualizar_estatus')); ",
  "setReintentoMsg('⚠ ' + adminStudentsSafeUserError(r?.error || r?.mensaje, 'No se pudo sincronizar CONAPE. Intentá de nuevo.', 'reintentar_conape')); ",
  "alert(adminStudentsSafeUserError(err?.message || String(err), 'No se pudo crear la proyección. Intentá de nuevo.', 'crear_proyeccion')); ",
  "else setError(adminStudentsSafeUserError(d?.mensaje || d?.error, 'No se pudo cargar la vista previa del cierre. Intentá de nuevo.', 'preview_cierre')); ",
  "setError(adminStudentsSafeUserError(d?.mensaje || d?.error, 'No se pudo ejecutar el cierre académico. Intentá de nuevo.', 'ejecutar_cierre')); ",
  "if (!r?.ok) setError(adminStudentsSafeUserError(r?.error || r?.mensaje, 'No fue posible simular el movimiento. Intentá de nuevo.', 'simular_cambio_grupo')); ",
  "alert(adminStudentsSafeUserError(r?.mensaje, r?.ya_aplicado ? 'El movimiento ya estaba aplicado; no se creó un duplicado.' : 'Movimiento aplicado correctamente.', 'resultado_cambio_grupo')); ",
];
let cleaned=0;
for(const oldText of exactTrailing){
  const count=s.split(oldText).length-1;
  if(count!==1) throw new Error(`CS21A191 v4: expected exact trailing-space preimage once, found ${count}: ${oldText}`);
  s=s.replace(oldText,oldText.slice(0,-1));
  cleaned++;
}
fs.writeFileSync(path,s,'utf8');
console.log(`CS21A191 v4: removed trailing whitespace from ${cleaned} exact patched lines`);
