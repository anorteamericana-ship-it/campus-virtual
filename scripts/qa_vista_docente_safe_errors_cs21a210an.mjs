import fs from 'node:fs';
import crypto from 'node:crypto';

const FILE='src/vista_docente.jsx';
const BASE_BLOB='63c80d004caba982156f5f7ed53c53d1490e7cf7';
const ANCHOR='function VistaDocente({ cedulaOverride, nombreOverride } = {}) {';
const HELPER=`function vistaDocenteSafeUserError(raw, fallback, context = '') {\n  const msg = String(raw == null ? '' : raw).replace(/\\s+/g, ' ').trim();\n  if (msg) console.warn('[VistaDocente] Detalle técnico oculto al docente.', { context, error: msg });\n  return fallback;\n}\n\n`;
const OLD_REFETCH="      .catch(e => setError(e.message || 'Error de conexión.'))";
const NEW_REFETCH=`      .catch(e => setError(vistaDocenteSafeUserError(e && e.message, 'No pudimos cargar tus pendientes. Intentá nuevamente.', 'refetch_docente')))`;
const OLD_INITIAL="      .catch(e => { if (!cancel) setError(e.message || 'Error de conexión.'); })";
const NEW_INITIAL=`      .catch(e => {\n        if (cancel) return;\n        setError(vistaDocenteSafeUserError(e && e.message, 'No pudimos cargar tus pendientes. Intentá nuevamente.', 'carga_docente'));\n      })`;
function sha(text){const b=Buffer.from(text,'utf8');return crypto.createHash('sha1').update(Buffer.from(`blob ${b.length}\0`)).update(b).digest('hex');}
function must(ok,msg){if(!ok)throw new Error(msg);}
const src=fs.readFileSync(FILE,'utf8').replace(/\r\n/g,'\n');
const app=fs.readFileSync('src/app.jsx','utf8');

must(src.includes(HELPER),'Falta helper AN.');
must(src.includes(NEW_REFETCH),'Falta frontera segura de refetch.');
must(src.includes(NEW_INITIAL),'Falta frontera segura de carga inicial.');
must(!src.includes(OLD_REFETCH) && !src.includes(OLD_INITIAL),'Permanece e.message visible histórico.');
must(!/setError\s*\(\s*e\.message/.test(src),'e.message todavía llega directo a setError.');
must((src.match(/fetchCalendarioDocente\(idDocente\)/g)||[]).length===2,'Cambió consulta de calendario docente.');
must((src.match(/fetchTareasPendientesDocente\(idDocente\)/g)||[]).length===2,'Cambió consulta de pendientes docente.');
must(src.includes('<ErrorState message={error} onRetry={refetch} />'),'Cambió wiring de ErrorState/retry.');
must(src.includes('const sesion = React.useMemo(() => leerSesionDocente(), []);'),'Cambió lectura de sesión docente.');
must(src.includes("window.cerrarSesionServidor") && src.includes("window.location.href = 'login.html'"),'Cambió cierre/redirección de sesión.');
must(app.includes("teacher_views: ['src/vista_docente.jsx") && app.includes("vista_docente: ['src/vista_docente.jsx"),'app dejó de cargar vista_docente en rutas efectivas.');

// F99 SIN_INA: inversión EXACTA de las seis sustituciones auditadas.
// Mantiene la verificación SHA previa CS21A210AN sin aceptar cambios arbitrarios.
const F99_REVERSALS = [
  [
    String.raw`      // La clasificación proviene del PROGRAMA del grupo (columna C);
      // un flag PC heredado o un horario I CAN no obliga a SIN_INA.
      const declarado=String(r.programa||lec.programa||'').trim().toUpperCase().replace(/\s+/g,'_');
      const efectivo=(declarado==='INA'||declarado==='CON_INA')?'INA':(declarado||'SIN_INA');`,
    String.raw`      const declarado=String(r.programa||lec.programa||'').trim().toUpperCase();
      const efectivo=(declarado==='INA'||declarado==='CON_INA'||lec.progress_check===true)?'INA':(declarado||'SIN_INA');`
  ],
  [
    String.raw`  const includesPC = esINA && esPCLec && riel === 'curso';`,
    String.raw`  const includesPC = esPCLec && riel === 'curso' && (esINA || lec.progress_check === true);`
  ],
  [
    String.raw`      if (esINA && !f.retro.trim()) {`,
    String.raw`      if (!f.retro.trim()) {`
  ],
  [
    String.raw`            {lec.riel === 'ican' && programa === 'INA' && (`,
    String.raw`            {lec.riel === 'ican' && (`
  ],
  [
    String.raw`  // Comentario individual obligatorio solo cuando GRUPOS.PROGRAMA es INA.
  const esIcan = String(riel||'').toLowerCase()==='ican';
  const retroObligatoria = !!esINA;`,
    String.raw`  // Regla institucional F98.4-Z6-G: toda sesión requiere comentario individual.
  const esIcan = String(riel||'').toLowerCase()==='ican';
  const retroObligatoria = true;`
  ],
  [
    String.raw`  const retroPlaceholder = !presente
    ? (esIcan
        ? 'Indicá qué se trabajó en I CAN y cómo puede recuperar la participación.'
        : 'Podés avisar qué se vio, tareas y cómo ponerse al día.')
    : (esIcan
        ? 'Retroalimentación individual de la sesión Club I CAN.'
        : 'Comentario sobre la clase y el avance del estudiante.');`,
    String.raw`  const retroPlaceholder = !presente
    ? (esIcan
        ? 'Indicá qué se trabajó en I CAN y cómo puede recuperar la participación (obligatorio).'
        : 'Avisá qué se vio, tareas y lo que debe ponerse al día (obligatorio).')
    : (esIcan
        ? 'Retroalimentación individual de la sesión Club I CAN (obligatorio).'
        : 'Retroalimentación individual de la clase (obligatorio).');`
  ]
];
// F101: deshacer las tres modificaciones de comentarios antes de auditar F100 y F99.
const F101_REVERSALS=[
  ["initialAttendance={}, initialComments={}, requireExplicitAttendance=false",
   "initialAttendance={}, requireExplicitAttendance=false"],
  ["initial[e.code]={presente:status==='P'?true:status==='A'?false:(requireExplicitAttendance?null:true),retro:typeof initialComments?.[e.code]==='string'?initialComments[e.code]:'',pc:''};",
   "initial[e.code]={presente:status==='P'?true:status==='A'?false:(requireExplicitAttendance?null:true),retro:'',pc:''};"],
  ["      return (String(s.retro||'')!==String(initialComments?.[code]||'')) ||",
   "      return (s.retro && s.retro.trim()) ||"]
];
// F100: reverse exactly nine authorized attendance-flow edits BEFORE the F99 INA source audit.
const F100_REVERSALS = [
  ["      if (requireExplicitAttendance && (!f || (f.presente!==true && f.presente!==false))) {\n        errs[s.code] = 'Marcá Presente o Ausente antes de cerrar esta clase.';\n        continue;\n      }\n", ""],
  ["function ModalCierreLeccion({ lec, docenteNombre, registradoPor, onClose, onSuccess, onSolicitudEnviada, submitFn, submitLabel='Guardar asistencia y cerrar clase', initialAttendance={}, requireExplicitAttendance=false }) {", "function ModalCierreLeccion({ lec, docenteNombre, registradoPor, onClose, onSuccess, onSolicitudEnviada, submitFn, submitLabel='Guardar asistencia y cerrar clase' }) {"],
  ["      list.forEach(e => {\n        const known=Object.prototype.hasOwnProperty.call(initialAttendance||{},e.code);\n        const status=known?String(initialAttendance[e.code]||'').toUpperCase():'';\n        initial[e.code]={presente:status==='P'?true:status==='A'?false:(requireExplicitAttendance?null:true),retro:'',pc:''};\n      });", "      list.forEach(e => { initial[e.code] = { presente: true, retro: '', pc: '' }; });"],
  ["    return Object.entries(formData).some(([code,s]) => {\n      const raw=String(initialAttendance?.[code]||'').toUpperCase();\n      const initial=raw==='P'?true:raw==='A'?false:(requireExplicitAttendance?null:true);\n      return (s.retro && s.retro.trim()) ||\n        (s.pc && s.pc.trim()) || s.presente!==initial;\n    });\n  }, [formData, notaDocente, initialAttendance, requireExplicitAttendance]);", "    return Object.values(formData).some(s =>\n      (s.retro && s.retro.trim()) ||\n      (s.pc && s.pc.trim()) ||\n      s.presente === false\n    );\n  }, [formData, notaDocente]);"],
  ["                  data={formData[s.code] || { presente: requireExplicitAttendance?null:true, retro: '', pc: '' }}", "                  data={formData[s.code] || { presente: true, retro: '', pc: '' }}"],
  ["  const retroPlaceholder = presente === false", "  const retroPlaceholder = !presente"],
  ["              background: presente === false ? '#B3261E' : 'transparent',\n              color: presente === false ? 'white' : 'var(--ink-2)',", "              background: !presente ? '#B3261E' : 'transparent',\n              color: !presente ? 'white' : 'var(--ink-2)',"],
  ["            {presente === false ? 'Mensaje para el ausente' : (esIcan ? 'Retroalimentación I CAN' : 'Retroalimentación')}", "            {!presente ? 'Mensaje para el ausente' : (esIcan ? 'Retroalimentación I CAN' : 'Retroalimentación')}"],
  ["            placeholder={presente === false ? `No aplicó el Progress Check (${pcUnidades}) por ausencia. Indicá seguimiento o recuperación.` : `Observación individual de Progress Check para las unidades ${pcUnidades}.`}", "            placeholder={!presente ? `No aplicó el Progress Check (${pcUnidades}) por ausencia. Indicá seguimiento o recuperación.` : `Observación individual de Progress Check para las unidades ${pcUnidades}.`}"]
];
let preF99=src;
F101_REVERSALS.forEach(function(pair,i){
  const occurrences=preF99.split(pair[0]).length-1;
  must(occurrences===1,'F101: cambio '+(i+1)+' ausente o ambiguo ('+occurrences+')');
  preF99=preF99.replace(pair[0],pair[1]);
});
F100_REVERSALS.forEach(function(pair,i){
  const occurrences=preF99.split(pair[0]).length-1;
  must(occurrences===1,'F100: cambio '+(i+1)+' ausente, ambiguo o modificado ('+occurrences+')');
  preF99=preF99.replace(pair[0],pair[1]);
});
F99_REVERSALS.forEach(function(pair,i){
  const matches=preF99.split(pair[0]).length-1;
  must(matches===1,'F99: cambio '+(i+1)+' ausente, ambiguo o modificado ('+matches+')');
  preF99=preF99.replace(pair[0],pair[1]);
});
let restored=preF99.replace(HELPER+ANCHOR,ANCHOR).replace(NEW_REFETCH,OLD_REFETCH).replace(NEW_INITIAL,OLD_INITIAL);
must(sha(restored)===BASE_BLOB,`Reversión AN no reconstruye preimagen exacta: ${sha(restored)}`);
console.log('QA VISTA DOCENTE SAFE ERRORS CS21A210AN PASS');
