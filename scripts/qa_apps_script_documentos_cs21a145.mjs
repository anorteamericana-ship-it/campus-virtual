import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'cs21a150-apps-'));
const target=path.join(tmp,'Codigo.js');
const patcher=path.resolve('scripts/patch_apps_script_documentos_cs21a145.mjs');

const fixture=`var PROSPECTOS_HEADERS = [
  'TIMESTAMP','CEDULA','NOMBRE',
  'FOTO_CED_FRENTE','FOTO_CED_DORSO','FOTO_TITULO',
  'COMISION_PAGADA'
];
function getOrCreateProspectos(){ return {}; }
function _f89StudentSubfolder_(){ return {}; }
function _prospectosFilaPorHeadersF984X_(){ return []; }
function _qaLegacyPublicAsset_(file) {
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return file.getId();
}

function _guardarFotoProspecto(cedula, tipo, base64Data) {
  if (!base64Data) return '';
  var raw = String(base64Data);
  var comaPos = raw.indexOf(',');
  if (comaPos >= 0 && raw.substring(0, 5) === 'data:') raw = raw.substring(comaPos + 1);
  var inscFolder = _f89StudentSubfolder_(cedula, ['01_INSCRIPCION']);
  var nombre   = tipo + '.jpg';
  var existing = inscFolder.getFilesByName(nombre);
  while (existing.hasNext()) {
    var f = existing.next();
    f.setTrashed(true);
  }
  var bytes = Utilities.base64Decode(raw);
  var blob  = Utilities.newBlob(bytes, 'image/jpeg', nombre);
  var file  = inscFolder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return 'https://lh3.googleusercontent.com/d/' + file.getId();
}

function crearUsuarioEstudiante(body) {
  body=body||{};
  var cedLimpia='123';
  var wsP={ appendRow:function(){} };
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

  var datosProspecto = {
    FOTO_CED_FRENTE: urlFotoCedFrente,
    FOTO_CED_DORSO: urlFotoCedDorso,
    FOTO_TITULO: urlFotoTitulo,
    COMISION_PAGADA: 'NO',
    COMISION_FECHA: ''
  };
  wsP.appendRow(_prospectosFilaPorHeadersF984X_(wsP, datosProspecto));
  return {ok:true};
}
`;

fs.writeFileSync(target,fixture,'utf8');

try{
  const run=spawnSync(process.execPath,[patcher,tmp],{encoding:'utf8'});
  if(run.status!==0){
    console.error(run.stdout);
    console.error(run.stderr);
    process.exit(run.status||1);
  }

  const out=fs.readFileSync(target,'utf8');
  const createStart=out.indexOf('function crearUsuarioEstudiante(body)');
  const createBlock=createStart>=0?out.slice(createStart):'';
  const legacyCalls=(out.match(/_guardarFotoProspecto\s*\(/g)||[]).length;

  const anyoneCount=(out.match(/DriveApp\.Access\.ANYONE_WITH_LINK/g)||[]).length;

  const helperStart=out.indexOf(
    'function _guardarFotoProspecto(cedula, tipo, base64Data) {'
  );

  const helperNext=out.indexOf('\nfunction ',helperStart+1);

  const helperBlock=helperStart>=0
    ? out.slice(
        helperStart,
        helperNext>helperStart ? helperNext : out.length
      )
    : '';

  const checks=[
    [out.includes('function _ins150CrearPdfIdentidadDesdeFotos_'),'helper final -> PDF'],
    [out.includes('function _ins150AssertPrivate_'),'guard privacidad runtime'],
    [out.includes('DriveApp.Access.PRIVATE'),'sharing privado explicito'],
    [anyoneCount===1,'ANYONE_WITH_LINK ajeno preservado'],
    [out.includes('function _qaLegacyPublicAsset_'),'ruta publica ajena preservada'],
    [!helperBlock.includes('DriveApp.Access.ANYONE_WITH_LINK'),'helper documental sin publicacion'],
    [!createBlock.includes('DriveApp.Access.ANYONE_WITH_LINK'),'crearUsuarioEstudiante sin publicacion documental'],
    [legacyCalls===1,'sin llamadas activas al helper legacy'],
    [!createBlock.includes('_guardarFotoProspecto(cedLimpia'),'crearUsuarioEstudiante no publica documentos'],
    [out.includes('documentos_fuente_no_admitidos'),'fuentes/originales rechazados'],
    [!out.includes('_ins145SavePrivateOriginal_'),'sin guardado de copias originales'],
    [out.includes("_ins150SavePrivateFinalImage_(cedLimpia, 'cedula_frente.jpg'"),'frente final unico'],
    [out.includes("_ins150SavePrivateFinalImage_(cedLimpia, 'cedula_dorso.jpg'"),'dorso final unico'],
    [out.includes("_ins150SavePrivateFinalImage_(cedLimpia, 'titulo.jpg'"),'titulo final unico'],
    [out.includes("'documento_identidad_solicitante.pdf'"),'PDF identidad canonico'],
    [out.includes('CED_FRENTE_FILE_ID: cedFrenteFileId'),'ID frente persistido'],
    [out.includes('CED_DORSO_FILE_ID: cedDorsoFileId'),'ID dorso persistido'],
    [out.includes('DOC_IDENTIDAD_FILE_ID: documentoIdentidadFileId'),'ID PDF persistido'],
    [out.includes('TITULO_FILE_ID: tituloFileId'),'ID titulo persistido'],
    [out.includes("DOC_IDENTIDAD_MODO: identidadModo"),'modo identidad persistido'],
    [out.includes("TITULO_MODO: tituloModo"),'modo titulo persistido'],
    [out.includes("FOTO_CED_FRENTE: urlFotoCedFrente"),'columnas legacy preservadas pero vacias'],
    [!out.includes('function _ins145CrearPdfIdentidadDesdeFotos_'),'sin CS21A145 acumulado'],
    [!out.includes('function _ins144CrearPdfIdentidadDesdeFotos_'),'sin CS21A144 acumulado']
  ];

  let fail=false;
  for(const [condition,label] of checks){
    console.log((condition?'PASS ':'FAIL ')+label);
    if(!condition) fail=true;
  }

  const syntax=spawnSync(process.execPath,['--check',target],{encoding:'utf8'});
  console.log((syntax.status===0?'PASS ':'FAIL ')+'sintaxis JS fixture parcheado');
  if(syntax.status!==0){
    console.error(syntax.stderr);
    fail=true;
  }

  if(fail) process.exit(1);
  console.log('CS21A152 Apps Script scoped privacy QA PASS');
} finally {
  fs.rmSync(tmp,{recursive:true,force:true});
}
