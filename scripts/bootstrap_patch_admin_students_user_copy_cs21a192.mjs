import fs from 'node:fs';

const path='src/admin_students.jsx';
let s=fs.readFileSync(path,'utf8');
function one(label,oldText,newText){const n=s.split(oldText).length-1;if(n!==1)throw new Error(`${label}: expected 1 exact preimage, found ${n}`);s=s.replace(oldText,newText);}
function many(label,oldText,newText,min=1){const n=s.split(oldText).length-1;if(n<min)throw new Error(`${label}: expected >=${min}, found ${n}`);s=s.split(oldText).join(newText);console.log(`${label}: replaced ${n}`);}

one('status header','<span>Estatus guardado en APOLLO, pero CONAPE no se sincronizó</span>','<span>Estatus guardado en el Campus, pero CONAPE quedó pendiente de actualización</span>');
one('status detail','Las hojas 4-7 de CONAPE quedaron sin actualizar. Podés reintentar ahora o sincronizar después.','La actualización de CONAPE quedó pendiente. Podés reintentar ahora o sincronizar después.');
one('group sync success',"setToast({ tipo: 'ok', msg: `CONAPE actualizado — ${n} estudiante${n === 1 ? '' : 's'} confirmados uno por uno en hojas 4, 5, 6 y 7.` });","setToast({ tipo: 'ok', msg: `CONAPE actualizado — ${n} estudiante${n === 1 ? '' : 's'} confirmado${n === 1 ? '' : 's'}.` });");
one('individual CONAPE confirmation',"if(!confirm('Se actualizarán quirúrgicamente las hojas 4, 5, 6 y 7 de CONAPE para este estudiante. ¿Continuar?'))return;","if(!confirm('Se actualizará únicamente este expediente en CONAPE. ¿Continuar?'))return;");
one('already applied CONAPE',"if(estado==='APLICADO_CONAPE'){alert('Este expediente ya fue publicado en las hojas CONAPE.');return;}","if(estado==='APLICADO_CONAPE'){alert('Este expediente ya está actualizado en CONAPE.');return;}");
one('simulation CONAPE warning','<b>No se publicará el nuevo plan en las hojas CONAPE.</b> El expediente quedará <b>PENDIENTE DE APROBACIÓN</b> y la sincronización individual será bloqueada hasta resolver el trámite.','<b>El nuevo plan no se actualizará todavía en CONAPE.</b> El expediente quedará <b>PENDIENTE DE APROBACIÓN</b> y la sincronización individual será bloqueada hasta resolver el trámite.');

one('bitacora initial fallback',"setSyncMsg('Modo local: subí el Apps Script F24 para guardar en base oficial.');","setSyncMsg('No se pudo conectar con la bitácora oficial. El seguimiento queda temporalmente en este navegador.');");
many('bitacora unavailable',"setSyncMsg('Modo local: backend de seguimiento no disponible.');","setSyncMsg('No se pudo conectar con la bitácora oficial. El seguimiento queda temporalmente en este navegador.');",1);
one('bitacora local save',"setSyncMsg('Guardado localmente. Backend F24 no disponible o no aplicado.');","setSyncMsg('Guardado temporalmente en este navegador. La bitácora oficial no está disponible.');");
one('bitacora official description',"? 'Conectada a bitácora oficial del campus. Los registros quedan guardados en la hoja SEGUIMIENTO_ESTUDIANTES.'","? 'Conectada a la bitácora oficial del Campus. Los registros quedan guardados de forma centralizada.'");
one('bitacora local description',": 'Modo local de respaldo. Guarda en este navegador hasta que se suba el Apps Script F24.'",": 'Respaldo temporal en este navegador mientras la bitácora oficial no esté disponible.'");
one('admin comment description','Solo administración autorizada puede leer o modificar este texto. Se guarda en DATOS · COMENTARIO_ADMIN.','Este comentario es interno y queda asociado al expediente del estudiante. Solo administración autorizada puede leerlo o modificarlo.');
one('regenerate letter fallback','El backend no informó una causa específica; verificá que Apps Script y GitHub estén en la misma versión.','No se pudo determinar la causa. Reintentá y, si continúa, revisá el caso antes de emitir la carta.');

one('certificate pending tooltip','Genera solo certificados pendientes: APR + certificado pagado + sin REG_CERTIFICADOS. Omite los ya registrados.','Genera solo certificados pendientes: estudiantes aprobados, certificado pagado y sin certificado registrado. Omite los ya registrados.');
one('certificate fallback tooltip','Generación masiva segura F26: primero muestra vista previa; solo ejecuta con confirmación. Los registros existentes no crean consecutivo nuevo.','Generación masiva segura: primero muestra vista previa y solo ejecuta con confirmación. Los certificados existentes no crean un número nuevo.');
one('certificate regen tooltip','Vuelve a crear los PDF seleccionados usando exactamente el mismo REG_CERTIFICADOS. No genera consecutivos nuevos ni cambia ESTATUS.','Vuelve a crear los PDF seleccionados usando el mismo número de certificado. No genera números nuevos ni cambia el estado académico.');
one('certificate mass rule','Regla segura: los estudiantes con REG_CERTIFICADOS NO generan consecutivo nuevo.','Regla segura: los estudiantes con certificado ya registrado NO generan un número nuevo.');
one('certificate regen confirm','No se crearán consecutivos nuevos. No se cambiará ESTATUS ni REG_CERTIFICADOS.','No se crearán números nuevos. No se cambiará el estado académico ni el número de certificado.');
one('certificate control footer','📁 Control F98.3-C: el nivel activo y el nivel del certificado son datos distintos. Cada botón valida en backend que el REG_CERTIFICADOS pertenece exactamente a la fila académica seleccionada antes de abrir o regenerar un PDF.','El nivel activo y el nivel del certificado son datos distintos. Cada botón comprueba que el número de certificado corresponde a la fila académica seleccionada antes de abrir o regenerar el PDF.');
one('certificate individual confirm','El sistema comprobará que ese número pertenece exactamente a ese nivel. No se cambiará ESTATUS ni se generará un consecutivo nuevo.','El sistema comprueba que el número de certificado corresponde exactamente al nivel seleccionado. No se cambiará el estado académico ni se generará un número nuevo.');

one('academic close description','Recalcula por nivel, separa incompletos y solo cambia ESTATUS con confirmación. Los APR pasan por las validaciones administrativas existentes.','Recalcula por nivel, separa incompletos y solo cambia el estado académico con confirmación. Los estudiantes aprobados pasan por las validaciones administrativas existentes.');
one('CONAPE CA detail','Los estudiantes en <strong>CA</strong> conservan el estado CA y envían a CONAPE la nota vigente registrada en ESTATUS.','Los estudiantes en <strong>CA</strong> conservan su estado y envían a CONAPE la nota vigente registrada en el expediente académico.');
one('grade component description','Convierte la nota 0–100 al peso real del componente y actualiza ESTATUS.','Convierte la nota 0–100 al peso real del componente y actualiza el registro académico.');
one('change-group loading','Cruzando DATOS, ESTATUS, GRUPOS, intentos y pagos…','Preparando expediente académico, grupo, intentos y pagos…');

fs.writeFileSync(path,s,'utf8');
console.log('CS21A192 exact admin_students user-copy patch applied');
