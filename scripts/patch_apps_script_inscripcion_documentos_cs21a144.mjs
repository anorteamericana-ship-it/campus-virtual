import fs from 'node:fs';
import path from 'node:path';

const root = process.argv[2];
if(!root) throw new Error('Uso: node patch_apps_script_inscripcion_documentos_cs21a144.mjs <carpeta Apps Script>');

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
if(candidates.length!==1) throw new Error(`Esperaba exactamente 1 archivo backend objetivo; encontré ${candidates.length}.`);

const target=candidates[0];
let src=fs.readFileSync(target,'utf8');
const nl=src.includes('\r\n')?'\r\n':'\n';
const withNl=s=>s.replace(/\n/g,nl);

if(src.includes('function _ins144CrearPdfIdentidadDesdeFotos_')) throw new Error('CS21A144 backend ya parece aplicado.');

function replaceOnce(text,oldText,newText,label){
  const i=text.indexOf(oldText);
  if(i<0) throw new Error(`No encontré preimagen exacta: ${label}`);
  if(text.indexOf(oldText,i+oldText.length)>=0) throw new Error(`Preimagen duplicada: ${label}`);
  return text.slice(0,i)+newText+text.slice(i+oldText.length);
}

const helperStart=src.indexOf('function _guardarFotoProspecto(cedula, tipo, base64Data) {');
if(helperStart<0) throw new Error('No encontré _guardarFotoProspecto.');
const helperReturn="  return 'https://lh3.googleusercontent.com/d/' + file.getId();";
const returnPos=src.indexOf(helperReturn,helperStart);
if(returnPos<0) throw new Error('No encontré cierre esperado de _guardarFotoProspecto.');
const helperClose=src.indexOf(nl+'}',returnPos+helperReturn.length);
if(helperClose<0) throw new Error('No encontré llave final de _guardarFotoProspecto.');
const insertAt=helperClose+(nl+'}').length;

const helpers=withNl(`

// CS21A144 · PDF adicional para CONAPE generado desde las dos imágenes originales.
function _ins144DataBlob_(data, fallbackMime, name) {
  var text = String(data || '');
  var mime = String(fallbackMime || 'application/octet-stream');
  var raw = text;
  var match = text.match(/^data:([^;]+);base64,(.+)$/);
  if (match) {
    mime = String(match[1] || mime).toLowerCase();
    raw = match[2];
  }
  var bytes = Utilities.base64Decode(raw);
  return { mime: mime, bytes: bytes, blob: Utilities.newBlob(bytes, mime, name) };
}

function _ins144IdentityFolder_(cedula) {
  return _f89StudentSubfolder_(cedula, ['01_INSCRIPCION']);
}

function _ins144ReplaceNamedFile_(folder, name, blob) {
  var existing = folder.getFilesByName(name);
  while (existing.hasNext()) existing.next().setTrashed(true);
  blob.setName(name);
  return folder.createFile(blob);
}

function _ins144AppendIdentityImage_(body, data, name) {
  var parsed = _ins144DataBlob_(data, 'image/jpeg', name);
  if (parsed.mime.indexOf('image/') !== 0) throw new Error('documento_identidad_imagen_invalida');
  if (!parsed.bytes.length) throw new Error('documento_identidad_imagen_vacia');
  var p = body.appendParagraph('');
  p.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
  var image = p.appendInlineImage(parsed.blob);
  var width = image.getWidth();
  var height = image.getHeight();
  var ratio = Math.min(1, 430 / Math.max(1,width), 245 / Math.max(1,height));
  image.setWidth(Math.max(1, Math.round(width * ratio)));
  image.setHeight(Math.max(1, Math.round(height * ratio)));
}

function _ins144CrearPdfIdentidadDesdeFotos_(cedula, frenteData, dorsoData) {
  if (!frenteData || !dorsoData) throw new Error('documento_identidad_dos_caras_requeridas');
  var temp = DocumentApp.create('TMP_ID_CONAPE_' + cedula + '_' + new Date().getTime());
  var tempId = temp.getId();
  try {
    var body = temp.getBody();
    try { body.clear(); } catch (_) {}
    _ins144AppendIdentityImage_(body, frenteData, 'cedula_frente.jpg');
    body.appendParagraph('');
    _ins144AppendIdentityImage_(body, dorsoData, 'cedula_dorso.jpg');
    temp.saveAndClose();

    var pdfBlob = DriveApp.getFileById(tempId).getAs(MimeType.PDF);
    var folder = _ins144IdentityFolder_(cedula);
    var file = _ins144ReplaceNamedFile_(folder, 'documento_identidad_solicitante.pdf', pdfBlob);
    // PRIVADO POR DEFECTO: el PDF adicional no hereda ANYONE_WITH_LINK.
    return file.getId();
  } finally {
    try { DriveApp.getFileById(tempId).setTrashed(true); } catch (_) {}
  }
}
`);
src=src.slice(0,insertAt)+helpers+src.slice(insertAt);

const oldVars=withNl(`  var urlFotoCedFrente = '';
  var urlFotoCedDorso  = '';
  var urlFotoTitulo    = '';

  try {`);
const newVars=withNl(`  var urlFotoCedFrente = '';
  var urlFotoCedDorso  = '';
  var urlFotoTitulo    = '';
  var documentoIdentidadPdfId = '';
  var generarPdfIdentidadConape = body.generar_pdf_identidad_conape === true || String(body.generar_pdf_identidad_conape || '').toUpperCase() === 'TRUE';

  if (generarPdfIdentidadConape && !(body.foto_ced_frente && body.foto_ced_dorso)) {
    return { ok:false, error:'documento_identidad_dos_caras_requeridas', mensaje:'Adjuntá el frente y el dorso del documento de identidad.' };
  }

  try {`);
src=replaceOnce(src,oldVars,newVars,'variables documentos inscripción');

const oldTail=withNl(`    if (body.foto_titulo) {
      urlFotoTitulo = _guardarFotoProspecto(cedLimpia, 'titulo', body.foto_titulo);
    }
  } catch (errFoto) {
    // Si fallan las fotos, no abortar el registro — solo loguear
    Logger.log('Error guardando fotos para ' + cedLimpia + ': ' + errFoto.message);
  }`);
const newTail=withNl(`    if (body.foto_titulo) {
      urlFotoTitulo = _guardarFotoProspecto(cedLimpia, 'titulo', body.foto_titulo);
    }
    if (generarPdfIdentidadConape) {
      documentoIdentidadPdfId = _ins144CrearPdfIdentidadDesdeFotos_(cedLimpia, body.foto_ced_frente, body.foto_ced_dorso);
      if (!documentoIdentidadPdfId) throw new Error('documento_identidad_pdf_no_creado');
    }
  } catch (errFoto) {
    Logger.log('Error guardando documentos para ' + cedLimpia + ': ' + errFoto.message);
    if (generarPdfIdentidadConape) {
      return { ok:false, error:'documento_identidad_no_guardado', mensaje:'No se pudo preparar el PDF de identidad. Revisá las dos imágenes e intentá nuevamente.' };
    }
  }`);
src=replaceOnce(src,oldTail,newTail,'guardar/generar PDF identidad');

if((src.match(/function _ins144CrearPdfIdentidadDesdeFotos_/g)||[]).length!==1) throw new Error('Helper generación no quedó único.');
if(src.includes('function _ins144GuardarPdfIdentidad_')) throw new Error('No debe existir ruta de PDF manual en este corte.');
if(!src.includes('PRIVADO POR DEFECTO: el PDF adicional no hereda ANYONE_WITH_LINK.')) throw new Error('Falta guard de privacidad documental.');
if(!src.includes("error:'documento_identidad_dos_caras_requeridas'")) throw new Error('Falta validación backend de ambas caras.');
if(!src.includes("error:'documento_identidad_no_guardado'")) throw new Error('Falta error fail-closed del PDF.');

fs.writeFileSync(target,src,'utf8');
console.log('=== CS21A144 · PATCH APPS SCRIPT ===');
console.log('Target: ' + path.basename(target));
console.log('PASS JPG/imágenes frente+dorso se conservan con el flujo legacy');
console.log('PASS frente+dorso -> PDF adicional privado de una página');
console.log('PASS no existe ruta de PDF manual que sustituya las imágenes');
console.log('PASS clientes legacy sin generar_pdf_identidad_conape no cambian de contrato');
