#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const frontendPath = path.join(root, 'src', 'english_lab_ux_cs21a181.js');
const backendPath = path.join(root, 'apps_script_patches', '98_ACTUALIZACION_QA_CS21A181.gs');
const runtimePath = path.join(root, 'src', 'runtime_config.js');
const livePath = path.join(root, 'src', 'english_lab_live.jsx');
const frontend = fs.readFileSync(frontendPath, 'utf8');
const backend = fs.readFileSync(backendPath, 'utf8');
const runtime = fs.readFileSync(runtimePath, 'utf8');
const live = fs.readFileSync(livePath, 'utf8');
const failures = [];

function check(condition, message) {
  if (condition) console.log(`CS21A181 OK: ${message}`);
  else {
    failures.push(message);
    console.error(`CS21A181 FAIL: ${message}`);
  }
}

try {
  new Function(frontend);
  check(true, 'frontend aditivo compila como JavaScript plano');
} catch (error) {
  check(false, `frontend aditivo compila: ${error.message}`);
}

try {
  new Function(backend);
  check(true, 'backend aditivo compila en JavaScript/V8');
} catch (error) {
  check(false, `backend aditivo compila: ${error.message}`);
}

try {
  new Function(runtime);
  check(true, 'runtime_config conserva sintaxis valida');
} catch (error) {
  check(false, `runtime_config conserva sintaxis valida: ${error.message}`);
}

check(frontend.includes("F98.4-Z6-CS21A181"), 'frontend versionado CS21A181');
check(frontend.includes('elive-cs181-spinner'), 'un unico spinner reutilizable esta definido');
check(frontend.includes('elive-cs181-load-track'), 'barra visual de carga esta definida');
check(frontend.includes('setTimeout(function ()') && frontend.includes('}, 260);'), 'indicador evita parpadeos en polling rapido');
check(frontend.includes("replace(/Acceso financiero/g, 'Acceso')"), 'la palabra financiero se elimina en English LAB');
check(frontend.includes("var name = 'EnglishLabLiveTeacherView'"), 'la capa envuelve la vista docente oficial');
check(frontend.includes('Palabras sugeridas'), 'editor docente usa el rotulo solicitado');
check(frontend.includes('palabra = significado'), 'editor explica el formato de pareja');
check(frontend.includes('custom_pairs:parsed.pairs'), 'inicio de sala envia parejas editadas');
check(frontend.includes("clean(info.fn).toLowerCase() === 'englishlabmemorymatchstartroom'"), 'solo se intercepta el inicio de Memory Match');
check(frontend.includes('state.dirty = true'), 'ediciones del docente no se sobrescriben con polling');
check(backend.includes("ELIVE181_VERSION = 'CS21A181'"), 'backend responde CS21A181');
check(backend.includes('function _elive181CustomPairs_('), 'backend normaliza parejas personalizadas');
check(backend.includes('function _elive181SuggestedPairs_('), 'backend obtiene sugerencias del banco real');
check(backend.includes('cantidad_parejas_invalida'), 'backend rechaza listas incompletas');
check(backend.includes('response.suggested_pairs'), 'control docente recibe sugerencias antes de iniciar');
check(backend.includes('custom_pairs_supported:true'), 'verificacion Apps Script cubre personalizacion');
check(runtime.includes('english_lab_ux_cs21a181.js?v=F98.4Z6CS21A181'), 'runtime carga la capa aditiva');
check(live.includes("const VERSION = 'F98.4-Z6-CS21A180'"), 'motor CS21A180 permanece intacto');
check(!backend.includes('QA-STU-005') && !backend.includes('QA-STU-008'), 'backend no contiene excepciones por estudiante');

if (failures.length) {
  console.error(JSON.stringify({ok:false, version:'CS21A181', failures}, null, 2));
  process.exit(1);
}
console.log(JSON.stringify({ok:true, version:'CS21A181', checks:23}));
