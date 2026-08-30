import fs from 'node:fs';

const path='src/additional_resources_panel_cs21a68.jsx';
let src=fs.readFileSync(path,'utf8');
function replaceExact(before,after,label){
  const count=src.split(before).length-1;
  if(count!==1) throw new Error(`${label}: expected exactly 1 preimage, found ${count}`);
  src=src.replace(before,after);
}

const anchor='  function resourceName(item) {';
const helper=`  function additionalResourcesSafeUserError(raw, fallback, context = '') {\n    const msg = String(raw?.message ?? raw ?? '').trim();\n    if (!msg) return fallback;\n    const technicalCode = /^[a-z0-9.-]+(?:_[a-z0-9.-]+)+$/i.test(msg);\n    const technicalText = /apps?\\s*script|backend|endpoint|stack|exception|trace|typeerror|referenceerror|syntaxerror|rangeerror|networkerror|failed to fetch|network request failed|<html|\\bjson\\b|\\btoken\\b|unauthorized|forbidden|internal server|http\\s*\\d{3}|status\\s*\\d{3}|respuesta inv[aá]lida|request_id|file_id|base64|sha-?256|mime|url de apps script/i.test(msg);\n    if (technicalCode || technicalText) {\n      console.warn('[AdditionalResources] Detalle técnico oculto al usuario.', { context, error: msg });\n      return fallback;\n    }\n    return msg;\n  }\n\n`;
replaceExact(anchor,helper+anchor,'insert safe-error helper');
replaceExact(
  ".catch(error => { if (live) setState({ loading:false, error:clean(error?.message || error || 'No se pudieron cargar los recursos.'), catalog:null }); });",
  ".catch(error => { if (live) setState({ loading:false, error:additionalResourcesSafeUserError(error, 'No se pudieron cargar los recursos. Intentá de nuevo.', 'cargar_recursos_adicionales'), catalog:null }); });",
  'sanitize catalog catch'
);
fs.writeFileSync(path,src);
console.log('CS21A200E exact additional-resources safe-error patch applied');
