import fs from 'node:fs';
import path from 'node:path';

const root = process.argv[2];
if(!root) throw new Error('Uso: node patch_apps_script_documentos_cs21a145.mjs <carpeta Apps Script baseline @417>');

const candidates=[];
function walk(dir){
  for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
    const abs=path.join(dir,entry.name);
    if(entry.isDirectory()) walk(abs);
    else if(/\.(?:gs|js)$/i.test(entry.name)){
      const text=fs.readFileSync(abs,'utf8');
      if(text.includes('function crearUsuarioEstudiante(body)') && text.includes('function _guardarFotoProspecto(cedula, tipo, base64Data)')) candidates.push(abs);
    }
  }
}
walk(root);
if(candidates.length!==1) throw new Error(`Esperaba exactamente 1 archivo backend objetivo; encontre ${candidates.length}.`);

const target=candidates[0];
let src=fs.readFileSync(target,'utf8');
const anyoneBefore=(src.match(/DriveApp\.Access\.ANYONE_WITH_LINK/g)||[]).length;
const nl=src.includes('\r\n')?'\r\n':'\n';
const withNl=s=>s.replace(/\n/g,nl);

if(src.includes('function _ins150CrearPdfIdentidadDesdeFotos_')) throw new Error('CS21A150 backend ya parece aplicado.');
if(src.includes('function _ins145CrearPdfIdentidadDesdeFotos_') || src.includes('function _ins144CrearPdfIdentidadDesdeFotos_')) {
  throw new Error('Usa baseline limpio @417. No acumules parches 144/145/150.');
}

function replaceOnce(text,oldText,newText,label){
  const i=text.indexOf(oldText);
  if(i<0) throw new Error(`No encontre preimagen exacta: ${label}`);
  if(text.indexOf(oldText,i+oldText.length)>=0) throw new Error(`Preimagen duplicada: ${label}`);
  return text.slice(0,i)+newText+text.slice(i+oldText.length);
}

const helperStart=src.indexOf('function _guardarFotoProspecto(cedula, tipo, base64Data) {');
if(helperStart<0) throw new Error('No encontre _guardarFotoProspecto.');
const helperReturn="  return 'https://lh3.googleusercontent.com/d/' + file.getId();";
const returnPos=src.indexOf(helperReturn,helperStart);
if(returnPos<0) throw new Error('No encontre cierre esperado de _guardarFotoProspecto.');
const helperClose=src.indexOf(nl+'}',returnPos+helperReturn.length);
if(helperClose<0) throw new Error('No encontre llave final de _guardarFotoProspecto.');
const insertAt=helperClose+(nl+'}').length;

const helpers=withNl(`

// CS21A150 backend: solo documentos finales, privados y sin copias fuente.
function _ins150DataBlob_(data, fallbackMime, name) {
  var text = String(data || '');
  var mime = String(fallbackMime || 'application/octet-stream').toLowerCase();
  var raw = text;
  var match = text.match(/^data:([^;]+);base64,(.+)$/);
  if (match) {
    mime = String(match[1] || mime).toLowerCase();
    raw = match[2];
  }
  var bytes = Utilities.base64Decode(raw);
  if (!bytes.length) throw new Error('documento_vacio');
  return { mime:mime, bytes:bytes, blob:Utilities.newBlob(bytes,mime,name) };
}

function _ins150IdentityFolder_(cedula) {
  return _f89StudentSubfolder_(cedula, ['01_INSCRIPCION']);
}

function _ins150AssertPrivate_(file) {
  if (!file) throw new Error('documento_archivo_no_creado');
  try {
    if (file.getSharingAccess() !== DriveApp.Access.PRIVATE) {
      file.setSharing(DriveApp.Access.PRIVATE, DriveApp.Permission.VIEW);
    }
    if (file.getSharingAccess() !== DriveApp.Access.PRIVATE) {
      throw new Error('documento_no_privado');
    }
  } catch (err) {
    throw new Error('documento_privacidad_no_verificable:' + String(err && err.message || err));
  }
  return file;
}

function _ins150ReplacePrivateFile_(folder, name, blob) {
  var previous=[];
  var existing=folder.getFilesByName(name);
  while(existing.hasNext()) previous.push(existing.next());
  blob.setName(name);
  var file=folder.createFile(blob);
  try {
    _ins150AssertPrivate_(file);
  } catch (err) {
    try { file.setTrashed(true); } catch (_) {}
    throw err;
  }
  previous.forEach(function(oldFile){
    try { if (oldFile.getId() !== file.getId()) oldFile.setTrashed(true); } catch (_) {}
  });
  return file;
}

function _ins150SavePrivateFinalImage_(cedula, name, data) {
  var parsed=_ins150DataBlob_(data,'image/jpeg',name);
  if (parsed.mime !== 'image/jpeg') throw new Error('documento_imagen_final_debe_ser_jpeg');
  var file=_ins150ReplacePrivateFile_(_ins150IdentityFolder_(cedula),name,parsed.blob);
  return file.getId();
}

function _ins150SavePrivatePdf_(cedula, name, data) {
  var parsed=_ins150DataBlob_(data,'application/pdf',name);
  if (parsed.mime !== 'application/pdf') throw new Error('documento_pdf_invalido');
  var file=_ins150ReplacePrivateFile_(_ins150IdentityFolder_(cedula),name,parsed.blob);
  return file.getId();
}

function _ins150AppendIdentityImage_(body, data, name) {
  var parsed=_ins150DataBlob_(data,'image/jpeg',name);
  if (parsed.mime !== 'image/jpeg') throw new Error('documento_identidad_imagen_final_debe_ser_jpeg');
  var p=body.appendParagraph('');
  p.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
  var image=p.appendInlineImage(parsed.blob);
  var width=image.getWidth();
  var height=image.getHeight();
  var ratio=Math.min(1,430/Math.max(1,width),245/Math.max(1,height));
  image.setWidth(Math.max(1,Math.round(width*ratio)));
  image.setHeight(Math.max(1,Math.round(height*ratio)));
}

function _ins150CrearPdfIdentidadDesdeFotos_(cedula, frenteFinal, dorsoFinal) {
  if (!frenteFinal || !dorsoFinal) throw new Error('documento_identidad_dos_caras_requeridas');
  var temp=DocumentApp.create('TMP_ID_CONAPE_' + cedula + '_' + new Date().getTime());
  var tempId=temp.getId();
  try {
    var tempFile=DriveApp.getFileById(tempId);
    _ins150AssertPrivate_(tempFile);
    var body=temp.getBody();
    try { body.clear(); } catch (_) {}
    _ins150AppendIdentityImage_(body,frenteFinal,'cedula_frente.jpg');
    body.appendParagraph('');
    _ins150AppendIdentityImage_(body,dorsoFinal,'cedula_dorso.jpg');
    temp.saveAndClose();
    var pdfBlob=tempFile.getAs(MimeType.PDF);
    var pdfFile=_ins150ReplacePrivateFile_(
      _ins150IdentityFolder_(cedula),
      'documento_identidad_solicitante.pdf',
      pdfBlob
    );
    return pdfFile.getId();
  } finally {
    try { DriveApp.getFileById(tempId).setTrashed(true); } catch (_) {}
  }
}
`);
src=src.slice(0,insertAt)+helpers+src.slice(insertAt);

// El helper legacy de documentos deja de publicar archivos nuevos.
const publicSharing="  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);";
const legacyEnd=insertAt;
const publicSharingPos=src.indexOf(publicSharing,helperStart);

if(publicSharingPos<0 || publicSharingPos>=legacyEnd){
  throw new Error('No encontre ANYONE_WITH_LINK esperado dentro de _guardarFotoProspecto.');
}

src=src.slice(0,helperStart)+src.slice(helperStart,legacyEnd).replace(
  publicSharing,
  "  file.setSharing(DriveApp.Access.PRIVATE, DriveApp.Permission.VIEW);"
)+src.slice(legacyEnd);

src=replaceOnce(
  src,
  "  'FOTO_CED_FRENTE','FOTO_CED_DORSO','FOTO_TITULO',",
  "  'FOTO_CED_FRENTE','FOTO_CED_DORSO','FOTO_TITULO',\n  'CED_FRENTE_FILE_ID','CED_DORSO_FILE_ID','DOC_IDENTIDAD_FILE_ID','TITULO_FILE_ID','DOC_IDENTIDAD_MODO','TITULO_MODO',",
  'PROSPECTOS_HEADERS documentos privados CS21A150'
);

const oldVars=withNl(`  var urlFotoCedFrente = '';
  var urlFotoCedDorso  = '';
  var urlFotoTitulo    = '';

  try {`);
const newVars=withNl(`  var urlFotoCedFrente = '';
  var urlFotoCedDorso  = '';
  var urlFotoTitulo    = '';
  var cedFrenteFileId = '';
  var cedDorsoFileId = '';
  var documentoIdentidadFileId = '';
  var tituloFileId = '';
  var documentoIdentidadPdf = body.documento_identidad_pdf || '';
  var tituloPdf = body.titulo_pdf || '';
  var identidadModo = documentoIdentidadPdf ? 'PDF_PASSTHROUGH' : 'FOTOS_FINALES';
  var tituloModo = tituloPdf ? 'PDF_PASSTHROUGH' : 'IMAGEN_FINAL';

  if (body.foto_ced_frente_original || body.foto_ced_dorso_original || body.foto_titulo_original) {
    return { ok:false, error:'documentos_fuente_no_admitidos', mensaje:'Solo se admite el documento final confirmado.' };
  }
  if (documentoIdentidadPdf && (body.foto_ced_frente || body.foto_ced_dorso)) {
    return { ok:false, error:'documento_identidad_modo_ambiguo', mensaje:'Adjunta PDF o fotos finales, no ambos.' };
  }
  if (tituloPdf && body.foto_titulo) {
    return { ok:false, error:'titulo_modo_ambiguo', mensaje:'Adjunta PDF o imagen final, no ambos.' };
  }
  if (!documentoIdentidadPdf && !(body.foto_ced_frente && body.foto_ced_dorso)) {
    return { ok:false, error:'documento_identidad_requerido', mensaje:'Adjunta frente y dorso del documento.' };
  }
  if (!tituloPdf && !body.foto_titulo) {
    return { ok:false, error:'titulo_requerido', mensaje:'Adjunta el titulo o ultimo grado.' };
  }

  try {`);
src=replaceOnce(src,oldVars,newVars,'variables documentos finales');

const oldTail=withNl(`    if (body.foto_ced_frente) {
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
  }`);
const newTail=withNl(`    if (documentoIdentidadPdf) {
      documentoIdentidadFileId = _ins150SavePrivatePdf_(cedLimpia, 'documento_identidad_solicitante.pdf', documentoIdentidadPdf);
    } else {
      cedFrenteFileId = _ins150SavePrivateFinalImage_(cedLimpia, 'cedula_frente.jpg', body.foto_ced_frente);
      cedDorsoFileId = _ins150SavePrivateFinalImage_(cedLimpia, 'cedula_dorso.jpg', body.foto_ced_dorso);
      documentoIdentidadFileId = _ins150CrearPdfIdentidadDesdeFotos_(cedLimpia, body.foto_ced_frente, body.foto_ced_dorso);
    }

    if (tituloPdf) {
      tituloFileId = _ins150SavePrivatePdf_(cedLimpia, 'titulo.pdf', tituloPdf);
    } else {
      tituloFileId = _ins150SavePrivateFinalImage_(cedLimpia, 'titulo.jpg', body.foto_titulo);
    }
  } catch (errFoto) {
    Logger.log('Error guardando documentos CS21A150 para ' + cedLimpia + ': ' + errFoto.message);
    return { ok:false, error:'documentos_no_guardados', mensaje:'No se pudieron guardar los documentos de forma privada. Intenta nuevamente.' };
  }`);
src=replaceOnce(src,oldTail,newTail,'guardar documentos privados finales');

src=replaceOnce(
  src,
  withNl(`    FOTO_CED_FRENTE: urlFotoCedFrente,
    FOTO_CED_DORSO: urlFotoCedDorso,
    FOTO_TITULO: urlFotoTitulo,
    COMISION_PAGADA: 'NO',`),
  withNl(`    FOTO_CED_FRENTE: urlFotoCedFrente,
    FOTO_CED_DORSO: urlFotoCedDorso,
    FOTO_TITULO: urlFotoTitulo,
    CED_FRENTE_FILE_ID: cedFrenteFileId,
    CED_DORSO_FILE_ID: cedDorsoFileId,
    DOC_IDENTIDAD_FILE_ID: documentoIdentidadFileId,
    TITULO_FILE_ID: tituloFileId,
    DOC_IDENTIDAD_MODO: identidadModo,
    TITULO_MODO: tituloModo,
    COMISION_PAGADA: 'NO',`),
  'datosProspecto IDs privados'
);

const legacyCallCount=(src.match(/_guardarFotoProspecto\s*\(/g)||[]).length;
if(legacyCallCount!==1) throw new Error('Quedan llamadas activas al helper legacy publico: ' + (legacyCallCount-1));

const guards=[
  ['helper PDF privado','function _ins150CrearPdfIdentidadDesdeFotos_'],
  ['privacidad verificada','function _ins150AssertPrivate_'],
  ['frente final privado',"'cedula_frente.jpg'"],
  ['dorso final privado',"'cedula_dorso.jpg'"],
  ['titulo final privado',"'titulo.jpg'"],
  ['pdf interno',"'documento_identidad_solicitante.pdf'"],
  ['rechazo fuentes','documentos_fuente_no_admitidos'],
  ['ID frente','CED_FRENTE_FILE_ID'],
  ['ID dorso','CED_DORSO_FILE_ID'],
  ['ID PDF','DOC_IDENTIDAD_FILE_ID'],
  ['ID titulo','TITULO_FILE_ID']
];
for(const [label,token] of guards){
  if(!src.includes(token)) throw new Error('Falta guard ' + label);
}
const anyoneAfter=(src.match(/DriveApp\.Access\.ANYONE_WITH_LINK/g)||[]).length;

if(anyoneAfter!==anyoneBefore-1){
  throw new Error(
    'El patch documental debe eliminar exactamente 1 ANYONE_WITH_LINK. Antes=' +
    anyoneBefore + ' despues=' + anyoneAfter
  );
}

const helperAfterStart=src.indexOf(
  'function _guardarFotoProspecto(cedula, tipo, base64Data) {'
);
const helperAfterEnd=src.indexOf(nl+'function ',helperAfterStart+1);
const helperAfterBlock=src.slice(
  helperAfterStart,
  helperAfterEnd>helperAfterStart ? helperAfterEnd : src.length
);

const createAfterStart=src.indexOf(
  'function crearUsuarioEstudiante(body)'
);
const createAfterEnd=src.indexOf(nl+'function ',createAfterStart+1);
const createAfterBlock=src.slice(
  createAfterStart,
  createAfterEnd>createAfterStart ? createAfterEnd : src.length
);

if(helperAfterBlock.includes('DriveApp.Access.ANYONE_WITH_LINK')){
  throw new Error('_guardarFotoProspecto sigue publicando documentos.');
}

if(createAfterBlock.includes('DriveApp.Access.ANYONE_WITH_LINK')){
  throw new Error('crearUsuarioEstudiante contiene publicacion documental.');
}

if(createAfterBlock.includes('_guardarFotoProspecto(')){
  throw new Error('crearUsuarioEstudiante sigue llamando al helper legacy.');
}

fs.writeFileSync(target,src,'utf8');
console.log('=== CS21A152 ? PATCH APPS SCRIPT DOCUMENTOS PRIVADOS SCOPED ===');
console.log('Target: ' + path.basename(target));
console.log('PASS solo imagen final o PDF passthrough; no fuentes duplicadas');
console.log('PASS frente/dorso/titulo finales privados');
console.log('PASS frente+dorso -> documento_identidad_solicitante.pdf privado');
console.log('PASS legacy FOTO_* queda vacio para nuevas altas; se persisten FILE_ID privados');
console.log('PASS privacidad documental scoped; ANYONE ajenos preservados: ' + anyoneAfter);
console.log('PASS baseline esperado @417; este script NO despliega produccion');
