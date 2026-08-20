import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'cs21a144-apps-'));
const target=path.join(tmp,'Código.js');
const patcher=path.resolve('scripts/patch_apps_script_inscripcion_documentos_cs21a144.mjs');

const fixture=`function _f89StudentSubfolder_(){ return {}; }
function _guardarFotoProspecto(cedula, tipo, base64Data) {
  if (!base64Data) return '';

  // Limpiar prefijo "data:image/...;base64,"
  var raw = String(base64Data);
  var comaPos = raw.indexOf(',');
  if (comaPos >= 0 && raw.substring(0, 5) === 'data:') raw = raw.substring(comaPos + 1);

  // Carpeta raíz del estudiante
  var inscFolder = _f89StudentSubfolder_(cedula, ['01_INSCRIPCION']);

  // Borrar foto anterior del mismo tipo si existe (re-subida)
  var nombre   = tipo + '.jpg';
  var existing = inscFolder.getFilesByName(nombre);
  while (existing.hasNext()) {
    var f = existing.next();
    f.setTrashed(true);
  }

  // Decodificar y guardar
  var bytes = Utilities.base64Decode(raw);
  var blob  = Utilities.newBlob(bytes, 'image/jpeg', nombre);
  var file  = inscFolder.createFile(blob);

  // Hacer accesible vía link para que el dashboard la muestre
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  return 'https://lh3.googleusercontent.com/d/' + file.getId();
}

function crearUsuarioEstudiante(body) {
  body=body||{};
  var cedLimpia='123';
  var urlFotoCedFrente = '';
  var urlFotoCedDorso  = '';
  var urlFotoTitulo    = '';

  try {
    if (body.foto_ced_frente) {
      urlFotoCedFrente = _guardarFotoProspecto(cedLimpia, 'cedula_frente', body.foto_ced_frente);
    }
    if (body.foto_ced_dorso) {
      urlFotoCedDorso = _guardarFotoProspecto(cedLimpia, 'cedula_dorso', body.foto_ced_dorso);
    }
    if (body.foto_titulo) {
      urlFotoTitulo = _guardarFotoProspecto(cedLimpia, 'titulo', body.foto_titulo);
    }
  } catch (errFoto) {
    // Si fallan las fotos, no abortar el registro — solo loguear
    Logger.log('Error guardando fotos para ' + cedLimpia + ': ' + errFoto.message);
  }
  return {ok:true};
}
`;
fs.writeFileSync(target,fixture,'utf8');

try{
  const run=spawnSync(process.execPath,[patcher,tmp],{encoding:'utf8'});
  if(run.status!==0){
    console.error(run.stdout); console.error(run.stderr);
    process.exit(run.status || 1);
  }
  const out=fs.readFileSync(target,'utf8');
  const checks=[
    [out.includes('function _ins144GuardarPdfIdentidad_'), 'helper PDF listo'],
    [out.includes('function _ins144CrearPdfIdentidadDesdeFotos_'), 'helper dos caras -> PDF'],
    [out.includes("file = _ins144ReplaceNamedFile_(folder, 'documento_identidad_solicitante.pdf'"), 'nombre estable PDF'],
    [out.includes('PRIVADO POR DEFECTO: no usar ANYONE_WITH_LINK para el PDF combinado nuevo.'), 'PDF nuevo privado'],
    [out.includes("error:'documento_identidad_requerido'"), 'backend exige PDF o dos caras para contrato nuevo'],
    [out.includes('body.documento_identidad_pdf\n        ? _ins144GuardarPdfIdentidad_'), 'PDF existente tiene prioridad'],
    [out.includes(': _ins144CrearPdfIdentidadDesdeFotos_'), 'fallback genera desde fotos'],
    [out.includes('if (requiereDocumentoIdentidadConape)'), 'contrato legacy preservado'],
    [out.includes("file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);"), 'fotos legacy no se rompen en este corte'],
  ];
  let fail=false;
  for(const [condition,label] of checks){
    console.log((condition?'PASS ':'FAIL ')+label);
    if(!condition) fail=true;
  }
  const check=spawnSync(process.execPath,['--check',target],{encoding:'utf8'});
  console.log((check.status===0?'PASS ':'FAIL ')+'sintaxis JS del fixture parcheado');
  if(check.status!==0){ console.error(check.stderr); fail=true; }
  if(fail) process.exit(1);
  console.log('CS21A144 Apps Script synthetic QA PASS');
} finally {
  fs.rmSync(tmp,{recursive:true,force:true});
}
