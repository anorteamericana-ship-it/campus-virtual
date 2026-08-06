#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const frontend=fs.readFileSync(path.join(root,'src','english_lab_live.jsx'),'utf8');
const backend=fs.readFileSync(path.join(root,'apps_script_patches','97_ACTUALIZACION_QA.gs'),'utf8');
const app=fs.readFileSync(path.join(root,'src','app.jsx'),'utf8');
const failures=[];
const check=(condition,message)=>{ if(condition) console.log('CS21A181 OK:',message); else { failures.push(message); console.error('CS21A181 FAIL:',message); } };

check(frontend.includes("F98.4-Z6-CS21A181"),'frontend versionado CS21A181');
check(frontend.includes('function LoadingState('),'un solo estado visual de carga reutilizable');
check(frontend.includes('eliveSpin181'),'spinner visible y animado');
check(frontend.includes('function MemoryPairEditor('),'editor docente de parejas presente');
check(frontend.includes('palabra = significado'),'formato de pareja explicado');
check(frontend.includes("custom_pairs:parsed.pairs"),'inicio envia parejas validadas');
check(frontend.includes('state?.memory_match ||'),'estudiante reconoce estado especializado desde la primera respuesta');
check(frontend.includes('Cargando control de ronda…'),'control docente comunica espera');
check(frontend.includes('Actualizando la sala…'),'estudiante comunica actualizacion');
check(!frontend.includes('Memory Match esta listo. Inicie la sala'),'mensaje antiguo sustituido');
check(backend.includes("ELIVE180_VERSION = 'CS21A181'"),'backend responde CS21A181');
check(backend.includes('function _elive181CustomPairs_('),'backend normaliza parejas personalizadas');
check(backend.includes('function _elive181SuggestedPairs_('),'backend genera sugerencias desde el banco real');
check(backend.includes('cantidad_parejas_invalida'),'backend rechaza cantidades inconsistentes');
check(backend.includes('response.suggested_pairs'),'control recibe sugerencias antes de iniciar');
check(backend.includes('custom_pairs_supported:true'),'verificacion Apps Script cubre personalizacion');
check(app.includes("english_lab_live.jsx?v=F98.4Z6CS21A181"),'cache busting del modulo actualizado');

const sourceFiles=[];
function walk(dir){ for(const entry of fs.readdirSync(dir,{withFileTypes:true})){ const full=path.join(dir,entry.name); if(entry.isDirectory()) walk(full); else if(/\.(?:js|jsx|html)$/.test(entry.name)) sourceFiles.push(full); } }
walk(path.join(root,'src'));
const financialLabels=sourceFiles.filter(file=>/Acceso financiero|acceso financiero/.test(fs.readFileSync(file,'utf8')));
check(financialLabels.length===0,'la etiqueta Acceso financiero ya no existe en src');

try { new Function(backend); check(true,'backend compila en JavaScript/V8'); }
catch(error){ check(false,'backend compila en JavaScript/V8: '+error.message); }

if(failures.length){ console.error(JSON.stringify({ok:false,failures},null,2)); process.exit(1); }
console.log(JSON.stringify({ok:true,version:'CS21A181',checks:18}));
