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
check('Flag-off mode warns no official grade or PDF can be generated',()=>assert.match(oral,/Solo borradores; el cierre y PDF todavía no están habilitados/));
check('Official PDF button requires server-close capability for R57',()=>assert.match(oral,/es_reposicion&&!state\.panel\?\.puede_cerrar/));
check('Legacy oral F91 remains blocked by close handler',()=>assert.match(oral,/if\(state\.panel\?\.es_reposicion&&!state\.panel\?\.reposicion_r57\)/));
check('R57 oral PDF button reflects true closed/archived state',()=>assert.match(oral,/Ver PDF de reposición archivado/));
check('Teacher lists active oral authorizations independent of candidate zero list',()=>assert.match(solic,/f92Post\('reposListarCiclosR57'\)/));
check('Teacher offers a button for authorized oral cycle',()=>assert.match(solic,/ABRIR EXAMEN ORAL/));
check('Teacher can review R57 draft after deadline without granting a new exam',()=>assert.match(solic,/REVISAR BORRADOR/));
check('Teacher navigation includes exactly the saved cycle ID',()=>assert.match(solic,/reposicion_id:c\.REPOSICION_ID/));
check('Teacher navigates using existing oral screen, not a new unsecured route',()=>assert.match(solic,/onNavigate\('examen_oral',\{/));
check('Existing Exámenes teacher screen passes navigation callback',()=>assert.match(app,/<ReposicionesR57Docente onNavigate=\{onNavigate\}\/>/));
check('No R57 oral action calls backend grade writer from browser',()=>assert.doesNotMatch(solic,/f92Post\('registrarNotaEstatus'/));
check('Oral close avoids unsaved R57 changes',()=>assert.match(oral,/state\.panel\?\.reposicion_r57&&state\.dirty/));
check('R57 PDF endpoint includes authorized cycle id',()=>assert.match(oral,/reposicion_id:payload\.reposicion_id\|\|''/));
check('R57 readback uses cycle ID to avoid ordinary oral lookup',()=>assert.match(oral,/cod_estudiante:selectedCode,reposicion_id:payload\.reposicion_id\|\|''/));
check('R57 server controls permission to close',()=>assert.match(oral,/state\.panel\?\.reposicion_r57&&!state\.panel\?\.puede_cerrar/));
console.log('F111_R57_B6_ORAL_UI_PASS checks='+checks);
