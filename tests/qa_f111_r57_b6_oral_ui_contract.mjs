/** F111 R57 B6 draft UI: ensure the existing oral form never writes a
 * make-up into the ordinary ORAL_EVALUACIONES. Source contract only.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
const oral=fs.readFileSync(new URL('../modulos/examen_oral.html',import.meta.url),'utf8');
const solic=fs.readFileSync(new URL('../src/solicitudes_unificadas.jsx',import.meta.url),'utf8');
const app=fs.readFileSync(new URL('../src/app.jsx',import.meta.url),'utf8');
let checks=0;const check=(desc,fn)=>{fn();checks++;console.log('PASS '+checks+' '+desc);};
check('Oral panel has a specific R57 editable flag',()=>assert.match(oral,/function oralRepoR57EditableF111\(\)/));
check('R57 editable condition requires server panel editable flag',()=>assert.match(oral,/state\.panel\?\.reposicion_r57&&state\.panel\?\.editable/));
check('Original F91 repos remain read only',()=>assert.match(oral,/\!\!state\.panel\?\.es_reposicion&&!oralRepoR57EditableF111\(\)/));
check('Oral current payload includes cycle ID',()=>assert.match(oral,/reposicion_id:state\.panel\?\.reposicion_id\|\|''/));
check('Draft action uses existing authenticated oralSaveDraft endpoint',()=>assert.match(oral,/api\('oralSaveDraft',payload\)/));
check('User sees clear warning that official grade remains pending',()=>assert.match(oral,/Repositorio oral independiente R57/));
check('R57 official PDF button remains disabled',()=>assert.match(oral,/pdfBtn\.disabled=!!state\.panel\?\.historico\|\|!!state\.panel\?\.es_reposicion/));
check('Existing oral close handler still blocks all repos until grade rectifier ready',()=>assert.match(oral,/if\(state\.panel\?\.es_reposicion\)return toast\(state\.panel\?\.reposicion_r57\?/));
check('PDF status explicitly signals pending reconciliation',()=>assert.match(oral,/CIERRE Y PDF PENDIENTES DE CONCILIACIÓN/));
check('Teacher lists active oral authorizations independent of candidate zero list',()=>assert.match(solic,/f92Post\('reposListarCiclosR57'\)/));
check('Teacher offers a button for authorized oral cycle',()=>assert.match(solic,/ABRIR EXAMEN ORAL/));
check('Teacher can review R57 draft after deadline without granting a new exam',()=>assert.match(solic,/REVISAR BORRADOR/));
check('Teacher navigation includes exactly the saved cycle ID',()=>assert.match(solic,/reposicion_id:c\.REPOSICION_ID/));
check('Teacher navigates using existing oral screen, not a new unsecured route',()=>assert.match(solic,/onNavigate\('examen_oral',\{/));
check('Existing Exámenes teacher screen passes navigation callback',()=>assert.match(app,/<ReposicionesR57Docente onNavigate=\{onNavigate\}\/>/));
check('No R57 oral action calls backend grade writer from browser',()=>assert.doesNotMatch(solic,/f92Post\('registrarNotaEstatus'/));
console.log('F111_R57_B6_ORAL_UI_PASS checks='+checks);
