import fs from 'node:fs';

const src=fs.readFileSync('src/auditoria_academica.jsx','utf8');
function must(ok,label){if(!ok){console.error(`FAIL|${label}`);process.exitCode=1;return;}console.log(`OK|${label}`);}
function count(s,n){return s.split(n).length-1;}

must(src.includes('function aaSafeUserError('),'shared safe-user helper exists');
must(src.includes("console.error('[Auditoría Académica]'"),'technical detail remains console-only');
must(src.includes("setError(aaSafeUserError(d,'No se pudo cargar el diagnóstico de cierre.'"),'close preview backend failure crosses safe boundary');
must(src.includes("setErrorGrupos(aaSafeUserError(d,'No se pudieron cargar los grupos activos.'"),'groups backend failure crosses safe boundary');
must(src.includes("setErrorGrupos(aaSafeUserError(e,'No se pudieron cargar los grupos activos.'"),'groups network failure crosses safe boundary');
must(src.includes("setError(aaSafeUserError(res,'No se pudo cargar la auditoría académica.'"),'unknown audit backend failure crosses safe boundary');
must(count(src,'aaSafeUserError(')===5,'exactly four call sites plus helper');

must(!src.includes("setError((d && (d.mensaje || d.error)) || 'No se pudo cargar el diagnóstico de cierre.')"),'raw close-preview backend sink removed');
must(!src.includes("setErrorGrupos((d && d.error) || 'No se pudieron cargar los grupos activos.')"),'raw groups backend sink removed');
must(!src.includes("setErrorGrupos('Error de red: ' + (e && e.message ? e.message : e))"),'raw groups network sink removed');
must(!src.includes("setError((res && res.error) || 'No se pudo cargar la auditoría académica.')"),'raw unknown audit sink removed');

must(src.includes("res && res.error === 'sesion_requerida'"),'session-required branch preserved');
must(src.includes("setError('Sesión requerida. Iniciá sesión nuevamente.')"),'session-required user copy preserved');
must(src.includes("res && res.error === 'no_autorizado'"),'no-authorized branch preserved');
must(src.includes("setError('No autorizado: tu cuenta no tiene permiso para ver la auditoría académica.')"),'no-authorized user copy preserved');
must(src.includes("setError('Error de conexión. Probá de nuevo en unos segundos.')"),'audit network fallback preserved');

for(const fn of ['getCierreAcademicoNivelPreview','getGruposActivos']) must(src.includes(`'${fn}'`),`endpoint contract preserved: ${fn}`);
must(src.includes('window.fetchAuditoriaAcademicaGrupo({ cod_grupo: codGrupo, nivel })'),'shared academic-audit fetch contract preserved');
must(src.includes("method: 'POST'"),'POST transport preserved');
must(src.includes('body: JSON.stringify({') && src.includes('token,'),'token body contract preserved');
must(src.includes("const AA_NIVELES = ['B1', 'B2', 'I1', 'I2']"),'academic level contract preserved');
must(src.includes("const AA_ESTADOS = [['todas', 'Todas'], ['cerradas', 'Cerradas'], ['pendientes', 'Pendientes'], ['alertas', 'Con alertas']]"),'audit filter states preserved');
must(src.includes('AUDITORÍA ACADÉMICA (solo lectura)'),'read-only source declaration preserved');

if(process.exitCode) process.exit(process.exitCode);
console.log('CS21A210R PASS: Auditoría Académica visible errors are bounded; read-only audit contracts preserved');
