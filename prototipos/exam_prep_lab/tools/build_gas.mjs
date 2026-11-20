// Genera los archivos de Apps Script 98 (motor + núcleo) y 99 (banco + manifiesto de audio) a partir de las
// mismas fuentes que usan el prototipo y las pruebas. Una sola implementación: no se reescribe a mano en el backend.
// Uso: node tools/build_gas.mjs <carpeta_destino>
import fs from 'node:fs'; import path from 'node:path'; import crypto from 'node:crypto'; import vm from 'node:vm';
const root = path.dirname(path.dirname(new URL(import.meta.url).pathname));
const out = process.argv[2]; if (!out) { console.error('Falta carpeta destino'); process.exit(2); }
fs.mkdirSync(out, { recursive: true });
const sha = s => crypto.createHash('sha256').update(s).digest('hex');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');

const engine = read('epl_engine.js'), core = read('epl_server_core.js');
const coreBody = `${engine}\n\n${core}\n`;
const f98 = `// GENERADO por prototipos/exam_prep_lab/tools/build_gas.mjs — NO EDITAR A MANO.\n// Fuentes: epl_engine.js sha256=${sha(engine)} · epl_server_core.js sha256=${sha(core)}\n// CUERPO_SHA256=${sha(coreBody)}\n${coreBody}`;
fs.writeFileSync(path.join(out, '98_Cert_Prep_Core.js'), f98);

const forms = {};
for (const f of ['a', 'b']) { const p = path.join(root, 'forms', `form_${f}.json`); if (fs.existsSync(p)) forms[f.toUpperCase()] = JSON.parse(fs.readFileSync(p, 'utf8')); }
const ctx = { window: {} }; vm.runInNewContext(read('audio_manifest.js'), ctx);
const audio = ctx.window.EPL_AUDIO;
const formsJson = JSON.stringify(forms);
const bank = { sha256: sha(formsJson), built_at: new Date().toISOString().slice(0, 10), estado: 'BORRADOR_IA_SIN_REVISION_DOCENTE', forms };
const f99 = `// GENERADO por prototipos/exam_prep_lab/tools/build_gas.mjs — NO EDITAR A MANO.\n// Banco de práctica TOEIC® L&R de la Academia (contenido original, BORRADOR IA sin revisión docente).\n// FORMS_SHA256=${bank.sha256}\nvar CERT_PREP_BANK_V1 = ${JSON.stringify(bank)};\nvar CERT_PREP_AUDIO_V1 = ${JSON.stringify(audio)};\n`;
fs.writeFileSync(path.join(out, '99_Cert_Prep_Bank.js'), f99);
console.log(`98: ${(f98.length / 1024).toFixed(0)} KB · 99: ${(f99.length / 1024).toFixed(0)} KB · formas ${Object.keys(forms).join(',')} · banco ${bank.sha256.slice(0, 12)}`);
