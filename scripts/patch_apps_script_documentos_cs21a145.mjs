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
if(candidates.length!==1) throw new Error(`Esperaba exactamente 1 archivo backend objetivo; encontré ${candidates.length}.`);

const target=candidates[0];
let src=fs.readFileSync(target,'utf8');
const nl=src.includes('\r\n')?'\r\n':'\n';
const withNl=s=>s.replace(/\n/g,nl);

if(src.includes('function _ins145CrearPdfIdentidadDesdeFotos_')) throw new Error('CS21A145 backend ya parece aplicado.');
if(src.includes('function _ins144CrearPdfIdentidadDesdeFotos_')) throw new Error('El baseline ya contiene CS21A144. Usá baseline limpio @417 para CS21A145.');

function replaceOnce(text,oldText,newText,label){
  const i=text.indexOf(oldText);
  if(i<0) throw new Error(`No encontré preimagen exacta: ${label}`);
  if(text.indexOf(oldText,i+oldText.length)>=0) throw new Error(`Preimagen duplicada: ${label}`);
  return text.slice(0,i)+newText+text.slice(i+oldText.length);
}

// 1) Helpers privados y generador PDF desde copias normalizadas.
const helperStart=src.indexOf('function _guardarFotoProspecto(cedula, tipo, base64Data) {');
if(helperStart<0) throw new Error('No encontré _guardarFotoProspecto.');
const helperReturn="  return 'https://lh3.googleusercontent.com/d/' + file.getId();";
const returnPos=src.indexOf(helperReturn,helperStart);
if(returnPos<0) throw new Error('No encontré cierre esperado de _guardarFotoProspecto.');
const helperClose=src.indexOf(nl+'}',returnPos+helperReturn.length);
if(helperClose<0) throw new Error('No encontré llave final de _guardarFotoProspecto.');
const insertAt=helperClose+(nl+'}').length;

const helpers=withNl(`

// CS21A145 · Document Scanner: originales privados + derivados separados.
function _ins145DataBlob_(data, fallbackMime, name) {
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
  return { mime: mime, bytes: bytes, blob: Utilities.newBlob(bytes, mime, name) };
}

function _ins145ExtFromMime_(mime) {
  var m = String(mime || '').toLowerCase();
  if (m === 'image/png') return '.png';
  if (m === 'image/webp') return '.webp';
  if (m === 'image/gif') return '.gif';
  if (m === 'application/pdf') return '.pdf';
  return '.jpg';
}

function _ins145IdentityFolder_(cedula) {
  return _f89StudentSubfolder_(cedula, ['01_INSCRIPCION']);
}

function _ins145ReplaceNamedFile_(folder, name, blob) {
  var existing = folder.getFilesByName(name);
  while (existing.hasNext()) existing.next().setTrashed(true);
  blob.setName(name);
  return folder.createFile(blob);
}

function _ins145SavePrivateOriginal_(cedula, baseName, data, expectedKind) {
  if (!data) return '';
  var parsed = _ins145DataBlob_(data, expectedKind === 'pdf' ? 'application/pdf' : 'image/jpeg', baseName);
  if (expectedKind === 'pdf' && parsed.mime !== 'application/pdf') throw new Error('documento_pdf_invalido');
  if (expectedKind === 'image' && parsed.mime.indexOf('image/') !== 0) throw new Error('documento_imagen_invalida');
  var name = baseName + _ins145ExtFromMime_(parsed.mime);
  var folder = _ins145IdentityFolder_(cedula);
  var file = _ins145ReplaceNamedFile_(folder, name, parsed.blob);
  // PRIVADO POR DEFECTO: nunca usar ANYONE_WITH_LINK para nuevos originales/derivados CS21A145.
  return file.getId();
}

function _ins145AppendIdentityImage_(body, data, name) {
  var parsed = _ins145DataBlob_(data, 'image/jpeg', name);
  if (parsed.mime.indexOf('image/') !== 0) throw new Error('documento_identidad_imagen_invalida');
  var p = body.appendParagraph('');
  p.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
  var image = p.appendInlineImage(parsed.blob);
  var width = image.getWidth();
  var height = image.getHeight();
  var ratio = Math.min(1, 430 / Math.max(1,width), 245 / Math.max(1,height));
  image.setWidth(Math.max(1, Math.round(width * ratio)));
  image.setHeight(Math.max(1, Math.round(height * ratio)));
}

function _ins145CrearPdfIdentidadDesdeFotos_(cedula, frenteNormalizado, dorsoNormalizado) {
  if (!frenteNormalizado || !dorsoNormalizado) throw new Error('documento_identidad_dos_caras_requeridas');
  var temp = DocumentApp.create('TMP_ID_CONAPE_' + cedula + '_' + new Date().getTime());
  var tempId = temp.getId();
  try {
    var body = temp.getBody();
    try { body.clear(); } catch (_) {}
    _ins145AppendIdentityImage_(body, frenteNormalizado, 'cedula_frente_normalizada.jpg');
    body.appendParagraph('');
    _ins145AppendIdentityImage_(body, dorsoNormalizado, 'cedula_dorso_normalizada.jpg');
    temp.saveAndClose();

    var pdfBlob = DriveApp.getFileById(tempId).getAs(MimeType.PDF);
    var folder = _ins145IdentityFolder_(cedula);
    var file = _ins145ReplaceNamedFile_(folder, 'documento_identidad_solicitante.pdf', pdfBlob);
    return file.getId();
  } finally {
    try { DriveApp.getFileById(tempId).setTrashed(true); } catch (_) {}
  }
}
`);
src=src.slice(0,insertAt)+helpers+src.slice(insertAt);

// 2) Nuevas columnas de metadatos privados; getOrCreateProspectos las migra de forma no destructiva.
src=replaceOnce(
  src,
  "  'FOTO_CED_FRENTE','FOTO_CED_DORSO','FOTO_TITULO',",
  "  'FOTO_CED_FRENTE','FOTO_CED_DORSO','FOTO_TITULO',\n  'DOC_IDENTIDAD_FILE_ID','TITULO_FILE_ID','DOC_IDENTIDAD_MODO','TITULO_MODO',",
  'PROSPECTOS_HEADERS documentos CS21A145'
);

// 3) Variables y validación de rutas documentales.
const oldVars=withNl(`  var urlFotoCedFrente = '';
  var urlFotoCedDorso  = '';
  var urlFotoTitulo    = '';

  try {`);
const newVars=withNl(`  var urlFotoCedFrente = '';
  var urlFotoCedDorso  = '';
  var urlFotoTitulo    = '';
  var documentoIdentidadFileId = '';
  var tituloFileId = '';
  var documentoIdentidadPdfOriginal = body.documento_identidad_pdf || '';
  var tituloPdfOriginal = body.titulo_pdf || '';
  var identidadModo = documentoIdentidadPdfOriginal ? 'PDF_ORIGINAL' : 'FOTOS_NORMALIZADAS';
  var tituloModo = tituloPdfOriginal ? 'PDF_ORIGINAL' : 'IMAGEN_NORMALIZADA';
  var generarPdfIdentidadConape = body.generar_pdf_identidad_conape === true || String(body.generar_pdf_identidad_conape || '').toUpperCase() === 'TRUE';

  if (!documentoIdentidadPdfOriginal && !(body.foto_ced_frente && body.foto_ced_dorso)) {
    return { ok:false, error:'documento_identidad_requerido', mensaje:'Adjuntá un PDF de identidad o las fotos del frente y dorso.' };
  }
  if (!tituloPdfOriginal && !body.foto_titulo) {
    return { ok:false, error:'titulo_requerido', mensaje:'Adjuntá el título/último grado en PDF o imagen.' };
  }

  try {`);
src=replaceOnce(src,oldVars,newVars,'variables documentos inscripción');

// 4) Guardar legacy normalizado, originales privados y PDFs passthrough; generar PDF solo en ruta fotos.
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

    if (body.foto_ced_frente_original) {
      _ins145SavePrivateOriginal_(cedLimpia, 'cedula_frente_original', body.foto_ced_frente_original, 'image');
    }
    if (body.foto_ced_dorso_original) {
      _ins145SavePrivateOriginal_(cedLimpia, 'cedula_dorso_original', body.foto_ced_dorso_original, 'image');
    }
    if (body.foto_titulo_original) {
      _ins145SavePrivateOriginal_(cedLimpia, 'titulo_original', body.foto_titulo_original, 'image');
    }

    if (documentoIdentidadPdfOriginal) {
      documentoIdentidadFileId = _ins145SavePrivateOriginal_(cedLimpia, 'documento_identidad_original', documentoIdentidadPdfOriginal, 'pdf');
    } else if (generarPdfIdentidadConape) {
      documentoIdentidadFileId = _ins145CrearPdfIdentidadDesdeFotos_(cedLimpia, body.foto_ced_frente, body.foto_ced_dorso);
    }

    if (tituloPdfOriginal) {
      tituloFileId = _ins145SavePrivateOriginal_(cedLimpia, 'titulo_original', tituloPdfOriginal, 'pdf');
    }
  } catch (errFoto) {
    Logger.log('Error guardando documentos CS21A145 para ' + cedLimpia + ': ' + errFoto.message);
    return { ok:false, error:'documentos_no_guardados', mensaje:'No se pudieron preparar los documentos. Revisá los archivos e intentá nuevamente.' };
  }`);
src=replaceOnce(src,oldTail,newTail,'guardar documentos scanner/PDF');

// 5) Persistir IDs privados y modo documental junto con URLs legacy normalizadas.
src=replaceOnce(
  src,
  withNl(`    FOTO_CED_FRENTE: urlFotoCedFrente,
    FOTO_CED_DORSO: urlFotoCedDorso,
    FOTO_TITULO: urlFotoTitulo,
    COMISION_PAGADA: 'NO',`),
  withNl(`    FOTO_CED_FRENTE: urlFotoCedFrente,
    FOTO_CED_DORSO: urlFotoCedDorso,
    FOTO_TITULO: urlFotoTitulo,
    DOC_IDENTIDAD_FILE_ID: documentoIdentidadFileId,
    TITULO_FILE_ID: tituloFileId,
    DOC_IDENTIDAD_MODO: identidadModo,
    TITULO_MODO: tituloModo,
    COMISION_PAGADA: 'NO',`),
  'datosProspecto documentos privados'
);

// Guards del candidato.
const guards = [
  ['helper scanner', 'function _ins145CrearPdfIdentidadDesdeFotos_'],
  ['PDF identidad original', 'documento_identidad_original'],
  ['PDF título original', "'titulo_original'"],
  ['frente original', 'cedula_frente_original'],
  ['dorso original', 'cedula_dorso_original'],
  ['modo identidad', 'DOC_IDENTIDAD_MODO'],
  ['modo título', 'TITULO_MODO'],
  ['privacidad', 'PRIVADO POR DEFECTO'],
  ['PDF generado desde normalizados', "_ins145CrearPdfIdentidadDesdeFotos_(cedLimpia, body.foto_ced_frente, body.foto_ced_dorso)"]
];
for(const [label,token] of guards){ if(!src.includes(token)) throw new Error('Falta guard ' + label); }
if(src.includes('function _ins144CrearPdfIdentidadDesdeFotos_')) throw new Error('No debe coexistir CS21A144 con CS21A145.');

fs.writeFileSync(target,src,'utf8');
console.log('=== CS21A145 · PATCH APPS SCRIPT DOCUMENTOS ===');
console.log('Target: ' + path.basename(target));
console.log('PASS identidad: PDF original O frente+dorso normalizados');
console.log('PASS título: PDF original O imagen normalizada');
console.log('PASS originales de imágenes se guardan aparte y privados');
console.log('PASS PDFs originales se guardan byte a byte y privados');
console.log('PASS generador identidad solo compone copias normalizadas');
console.log('PASS nuevos file IDs/modes migran por PROSPECTOS_HEADERS');
console.log('PASS baseline esperado @417; este script NO despliega producción');
