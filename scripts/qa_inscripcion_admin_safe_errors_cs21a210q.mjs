import fs from 'node:fs';

const src=fs.readFileSync('src/inscripcion_admin.jsx','utf8');
const app=fs.readFileSync('src/app.jsx','utf8');
const sidebar=fs.readFileSync('src/sidebar.jsx','utf8');
function must(ok,label){if(!ok){console.error(`FAIL|${label}`);process.exitCode=1;return;}console.log(`OK|${label}`);}

must(app.includes("inscripcion_admin: rolReal === 'superadmin'"),'router keeps Inscripción pública gated to real superadmin');
must(app.includes('<NoAutorizadoCampus rol={rolReal} />'),'router keeps explicit unauthorized fallback');
must(sidebar.includes("...(esSuperadmin ? [{ id: 'inscripcion_admin', label: 'Inscripción pública', icon:'settings'}] : [])") || sidebar.includes("...(esSuperadmin ? [{ id: 'inscripcion_admin', label: 'Inscripción pública', icon: 'settings' }] : [])"),'sidebar keeps Inscripción pública gated to superadmin');

must(src.includes('function insAdminSafeUserError('),'safe-user helper exists');
must(src.includes("console.error('[Inscripción pública admin]'"),'technical detail remains console-only');
must(src.includes("setError(insAdminSafeUserError(err,'No se pudo cargar la configuración de inscripción.'"),'load catch crosses safe boundary');
must(src.includes("setError(insAdminSafeUserError(err,'No se pudo guardar la configuración de inscripción.'"),'save catch crosses safe boundary');
must(src.includes("setError(insAdminSafeUserError(err,'No se pudo actualizar la imagen de inscripción.'"),'image catch crosses safe boundary');
must(src.includes("setError(insAdminSafeUserError(d,'No se pudo guardar la configuración TOEIC del grupo.'"),'TOEIC backend failure crosses safe boundary');
must(src.includes("setError(insAdminSafeUserError(err,'No se pudo guardar la configuración TOEIC del grupo.'"),'TOEIC network failure crosses safe boundary');
must(!/setError\s*\([^\n;]*(?:err|d)\??\.(?:message|mensaje|error)/.test(src),'raw backend/exception values are not sent to visible error setter');
must(!src.includes("setError(err.message || 'Error"),'legacy raw catch copy removed');

for(const fn of ['getInscripcionAdminConfig','saveInscripcionAdminConfig','uploadInscripcionAdminImage','saveInscripcionGroupToeic']){
  must(src.includes(`'${fn}'`),`endpoint contract preserved: ${fn}`);
}
must(src.includes("method: 'POST'"),'POST transport preserved');
must(src.includes('body: JSON.stringify({ fn, token: _insAdminToken(), ...payload })'),'token body contract preserved');
must(src.includes('file.size > 5 * 1024 * 1024'),'5 MB image limit preserved');
must(src.includes("file.type.startsWith('image/')"),'image MIME family validation preserved');
must(src.includes('base64,') && src.includes('mime_type: file.type') && src.includes('nombre_archivo: file.name'),'image upload payload preserved');
must(src.includes('toeic: !!g.toeic') && src.includes('toeic_monto: monto'),'TOEIC payload preserved');
must(src.includes('setCfg(d.config || cfg)'),'successful config assignment preserved');
must(src.includes('setGrupos(Array.isArray(d.grupos) ? d.grupos : grupos)'),'successful TOEIC group refresh preserved');

if(process.exitCode) process.exit(process.exitCode);
console.log('CS21A210Q PASS: Inscripción pública keeps Superadmin gates and uses safe visible error boundaries; backend authorization remains outside source proof');
