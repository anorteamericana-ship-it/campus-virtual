#!/usr/bin/env node
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const base=path.join(root,'dist','CAMPUS_QA_CS21A183_CANDIDATO_SENTENCE_ORDER_LIVE');
const packageName='CAMPUS_QA_CS21A191_CANDIDATO_HANGMAN_LIVE';
const target=path.join(root,'dist',packageName);
const sourceHeadSha=process.env.SOURCE_HEAD_SHA||process.env.GITHUB_SHA||'local-uncommitted';
const sourceBranch=process.env.SOURCE_BRANCH||process.env.GITHUB_HEAD_REF||'feat/cs21a191-hangman-live';
const verifyOnly=process.argv.includes('--verify');

function sha256(file){return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');}
function copy(relative,destinationRelative=relative){
  const source=path.join(root,relative);
  const destination=path.join(target,destinationRelative);
  assert.equal(fs.existsSync(source),true,`Falta ${relative}`);
  fs.mkdirSync(path.dirname(destination),{recursive:true});
  fs.copyFileSync(source,destination);
}
function files(){
  const out=[];
  const walk=dir=>{for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
    const absolute=path.join(dir,entry.name);
    if(entry.isDirectory())walk(absolute); else if(entry.name!=='SHA256SUMS.txt')out.push(absolute);
  }};
  walk(target);return out.sort((a,b)=>a.localeCompare(b));
}
function writeManifest(){
  fs.writeFileSync(path.join(target,'SHA256SUMS.txt'),files().map(file=>`${sha256(file)}  ./${path.relative(target,file).split(path.sep).join('/')}`).join('\n')+'\n','utf8');
}
function text(relative){return fs.readFileSync(path.join(target,relative),'utf8');}

function build(){
  assert.equal(fs.existsSync(base),true,'Falta el paquete acumulado CS21A190/183 antes de aplicar CS21A191.');
  fs.rmSync(target,{recursive:true,force:true});
  fs.cpSync(base,target,{recursive:true});

  for(const stale of ['LEEME_PRIMERO_CS21A183.txt','REGISTRO_PRUEBA_AUTENTICADA_CS21A183.txt','ABRIR_CAMPUS_QA_CS21A183.cmd','SHA256SUMS.txt']){
    fs.rmSync(path.join(target,stale),{recursive:true,force:true});
  }

  [
    'src/english_lab_games/english_lab_game_registry_cs21a191.js',
    'src/english_lab_games/hangman_engine_cs21a191.js',
    'src/english_lab_games/english_lab_hangman_live_cs21a191.jsx',
    'src/english_lab_games/hangman_preview_cs21a191.html',
    'src/english_lab_live_student_dependency_guard_cs21a184.js',
    'styles/english_lab_hangman_cs21a191.css',
    'schemas/english_lab_game_package_cs21a191.schema.json',
    '00_DOCUMENTACION/ENGLISH_LAB_HANGMAN_CS21A191.md',
    'apps_script_patches/99_CS21A183_SENTENCE_ORDER_COMPLETO.gs',
  ].forEach(relative=>copy(relative));
  copy('apps_script_patches/99_CS21A183_SENTENCE_ORDER_COMPLETO.gs','BACKEND_QA/99_CS21A183_SENTENCE_ORDER_COMPLETO.gs');

  const campusPath=path.join(target,'campus.html');
  let campus=fs.readFileSync(campusPath,'utf8');
  campus=campus
    .replace(/\n?<script src="src\/english_lab_live_student_dependency_guard_cs21a184\.js\?v=[^"]+"><\/script>/g,'')
    .replace(/\n?<link rel="stylesheet" href="styles\/english_lab_hangman_cs21a191\.css\?v=[^"]+">/g,'');
  const hangmanStyle='<link rel="stylesheet" href="styles/english_lab_hangman_cs21a191.css?v=CS21A191">';
  assert.ok(campus.includes('</head>'),'campus.html no contiene </head>.');
  campus=campus.replace('</head>',`${hangmanStyle}\n</head>`);
  const guardTag='<script src="src/english_lab_live_student_dependency_guard_cs21a184.js?v=F98.4Z6CS21A191"></script>';
  assert.ok(campus.includes('</body>'),'campus.html no contiene </body>.');
  campus=campus.replace('</body>',`${guardTag}\n</body>`);
  fs.writeFileSync(campusPath,campus,'utf8');

  const oldLauncher=path.join(base,'ABRIR_CAMPUS_QA_CS21A183.cmd');
  const launcherPath=path.join(target,'ABRIR_CAMPUS_QA_CS21A191.cmd');
  let launcher=fs.existsSync(oldLauncher)?fs.readFileSync(oldLauncher,'utf8'):'@echo off\nstart http://127.0.0.1:4191/qa-setup.html\nnode serve.mjs\n';
  launcher=launcher.replaceAll('4181','4191').replaceAll('CS21A183','CS21A191');
  fs.writeFileSync(launcherPath,launcher,'utf8');

  const servePath=path.join(target,'serve.mjs');
  let serve=fs.readFileSync(servePath,'utf8');
  serve=serve.replaceAll("process.env.PORT || 4181","process.env.PORT || 4191").replaceAll("process.env.PORT || '4181'","process.env.PORT || '4191'");
  fs.writeFileSync(servePath,serve,'utf8');

  fs.writeFileSync(path.join(target,'LEEME_PRIMERO_CS21A191.txt'),`CAMPUS QA CS21A191 - AHORCADO LIVE\n===================================\n\nESTADO REAL\n- Candidato QA aislado. NO producción.\n- Rama: ${sourceBranch}\n- SHA fuente: ${sourceHeadSha}\n- Agrega Ahorcado sin cerrar todavía Memory Match.\n- Modos Individual y Equipos, 3-5 rondas, teclado físico/táctil, resolver palabra/frase y ranking.\n- La respuesta canónica permanece en servidor mientras la ronda está abierta.\n- Currículo/unidad: CONFIG_UNIDADES. Contenido jugable inicial: QUESTION_BANK trazado por nivel/unidad. QUESTION_BANK no se declara como Apollo.\n\nAPPS SCRIPT QA - REGLA OBLIGATORIA\n1. NO pegue 99M ni 99N por separado.\n2. Abra el archivo Apps Script objetivo 99_CS21A183_SENTENCE_ORDER_COMPLETO.\n3. Ctrl+A y elimine TODO.\n4. Pegue TODO el contenido de BACKEND_QA/99_CS21A183_SENTENCE_ORDER_COMPLETO.gs.\n5. Guarde. No agregue nada debajo.\n6. Ejecute verificarActualizacionQA() o verificarHangmanRobustnessCS21A191().\n7. Debe devolver hangman_live_supported=true, source_id_shuffle_safe=true y generic_sync_misclassification_guard=true.\n8. Mantenga el deployment QA existente; NO use este backend en producción.\n\nFRONTEND QA\n1. Extraiga completamente el ZIP.\n2. Ejecute ABRIR_CAMPUS_QA_CS21A191.cmd.\n3. Mantenga abierta la ventana del servidor.\n4. Se abrirá http://127.0.0.1:4191/qa-setup.html\n5. Configure la URL /exec QA cuando corresponda.\n\nPRUEBA AHORCADO\n1. Profe > English LAB Live > Ahorcado.\n2. Seleccione B1/U01, 3 rondas, Individual.\n3. Cargue palabras, revise/edite si desea y confirme la revisión.\n4. Cree la sala y haga entrar dos estudiantes por el código LAB estándar.\n5. Inicie.\n6. Letra correcta: suma por apariciones y conserva turno.\n7. Letra repetida: no resta vida.\n8. Letra incorrecta: resta vida y rota turno.\n9. Timeout: rota turno sin restar vida.\n10. Resolver incorrectamente: resta vida y rota.\n11. Resolver correctamente: cierra ronda y revela.\n12. Avance a la siguiente palabra y luego cierre sala.\n13. Repita en Equipos y revise a 390 px.\n\nNO FUSIONAR NI PASAR A PRODUCCIÓN SIN PASS AUTENTICADO.\n`,'utf8');

  fs.writeFileSync(path.join(target,'REGISTRO_PRUEBA_AUTENTICADA_CS21A191.txt'),`REGISTRO QA CS21A191 - AHORCADO\n================================\nEstado inicial: PENDIENTE\nFecha:\nSala:\nDocente:\nEstudiantes:\n\n[ ] verificarHangmanRobustnessCS21A191() ok=true.\n[ ] hangman_live_supported=true.\n[ ] server_authoritative_answer_hidden=true.\n[ ] source_id_shuffle_safe=true.\n[ ] generic_sync_misclassification_guard=true.\n[ ] Sala creada desde nivel/unidad correctos.\n[ ] Dos estudiantes entran por código estándar.\n[ ] Presencia online coincide con ventanas activas.\n[ ] Inicio sincronizado.\n[ ] Letra correcta conserva turno.\n[ ] Letra repetida no penaliza.\n[ ] Letra incorrecta resta una vida y rota.\n[ ] Timeout rota sin restar vida.\n[ ] Resolver incorrecto penaliza una vida y rota.\n[ ] Resolver correcto revela y cierra ronda.\n[ ] Siguiente ronda sincronizada.\n[ ] Ranking individual correcto.\n[ ] Teams reparte y alterna equipos.\n[ ] Móvil 390 px usable.\n[ ] Cierre de sala terminal.\n[ ] Memory Match conserva su comportamiento previo.\n\nResultado final: PASS / FAIL / BLOCKED\nPrimera falla observable:\nEvidencia:\n`,'utf8');

  const versionPath=path.join(target,'VERSION.txt');
  let version=fs.existsSync(versionPath)?fs.readFileSync(versionPath,'utf8'):'';
  version=version
    .replace(/^VERSION=.*$/m,'VERSION=CS21A191')
    .replace(/^STATUS=.*$/m,'STATUS=QA_CANDIDATE_NOT_FINAL')
    .replace(/^QA_PORT=.*$/m,'QA_PORT=4191')
    .replace(/^SOURCE_BRANCH=.*$/m,`SOURCE_BRANCH=${sourceBranch}`)
    .replace(/^SOURCE_HEAD_SHA=.*$/m,`SOURCE_HEAD_SHA=${sourceHeadSha}`);
  const additions=[
    'HANGMAN_VERSION=CS21A191-HANGMAN-1',
    'HANGMAN_ROBUSTNESS=CS21A191-HANGMAN-ROBUSTNESS-1',
    'HANGMAN_GAME_ID=HANGMAN',
    'HANGMAN_ROUNDS=3-5',
    'HANGMAN_DEFAULT_ERRORS=6',
    'HANGMAN_DEFAULT_TURN_SECONDS=15',
    'HANGMAN_SERVER_AUTHORITATIVE=true',
    'HANGMAN_SOURCE_ID_SHUFFLE_SAFE=true',
    'HANGMAN_MEMORY_MATCH_FLAG_SANITIZED=true',
    'HANGMAN_CURRICULUM_SOURCE=CONFIG_UNIDADES',
    'HANGMAN_CONTENT_SOURCE=QUESTION_BANK',
    'HANGMAN_AUTHENTICATED_QA_STATUS=PENDING',
    'APPS_SCRIPT_COMPLETE_FILE=BACKEND_QA/99_CS21A183_SENTENCE_ORDER_COMPLETO.gs',
  ];
  for(const line of additions){const key=line.split('=')[0];version=version.replace(new RegExp(`^${key}=.*$`,'gm'),'').replace(/\s*$/,'')+`\n${line}`;}
  fs.writeFileSync(versionPath,version.replace(/^\n/,'').replace(/\s*$/,'')+'\n','utf8');

  writeManifest();
}

function verify(){
  for(const relative of [
    'ABRIR_CAMPUS_QA_CS21A191.cmd','LEEME_PRIMERO_CS21A191.txt','REGISTRO_PRUEBA_AUTENTICADA_CS21A191.txt',
    'VERSION.txt','SHA256SUMS.txt','campus.html','serve.mjs',
    'src/english_lab_games/english_lab_game_registry_cs21a191.js',
    'src/english_lab_games/hangman_engine_cs21a191.js',
    'src/english_lab_games/english_lab_hangman_live_cs21a191.jsx',
    'src/english_lab_games/hangman_preview_cs21a191.html',
    'src/english_lab_live_student_dependency_guard_cs21a184.js',
    'styles/english_lab_hangman_cs21a191.css',
    'schemas/english_lab_game_package_cs21a191.schema.json',
    'BACKEND_QA/99_CS21A183_SENTENCE_ORDER_COMPLETO.gs',
  ]) assert.equal(fs.existsSync(path.join(target,relative)),true,`Falta ${relative}`);

  assert.match(text('campus.html'),/english_lab_hangman_cs21a191\.css\?v=CS21A191/);
  assert.match(text('campus.html'),/english_lab_live_student_dependency_guard_cs21a184\.js\?v=F98\.4Z6CS21A191/);
  assert.match(text('src/english_lab_live_student_dependency_guard_cs21a184.js'),/english_lab_hangman_live_cs21a191\.jsx\?v=CS21A191/);
  assert.match(text('src/english_lab_games/english_lab_game_registry_cs21a191.js'),/id:'HANGMAN'/);
  assert.match(text('src/english_lab_games/hangman_engine_cs21a191.js'),/GAME_ID = 'HANGMAN'/);
  assert.match(text('src/english_lab_games/english_lab_hangman_live_cs21a191.jsx'),/HangmanTeacherView/);
  assert.match(text('styles/english_lab_hangman_cs21a191.css'),/@media\(max-width:390px\)/);
  const complete=text('BACKEND_QA/99_CS21A183_SENTENCE_ORDER_COMPLETO.gs');
  assert.match(complete,/CS21A191-HANGMAN-1/);
  assert.match(complete,/CS21A191-HANGMAN-ROBUSTNESS-1/);
  assert.match(complete,/delete response\.memory_match/);
  assert.match(complete,/source_id_shuffle_safe/);
  const readme=text('LEEME_PRIMERO_CS21A191.txt');
  assert.match(readme,/Ctrl\+A/);
  assert.match(readme,/NO pegue 99M ni 99N por separado/);
  assert.doesNotMatch(readme,/pegue 99M debajo/i);
  const version=text('VERSION.txt');
  assert.match(version,/VERSION=CS21A191/);
  assert.match(version,/QA_PORT=4191/);
  assert.match(version,/HANGMAN_SERVER_AUTHORITATIVE=true/);
  assert.match(version,/HANGMAN_AUTHENTICATED_QA_STATUS=PENDING/);

  const manifest=new Map();
  for(const line of text('SHA256SUMS.txt').trim().split(/\r?\n/)){
    const match=line.match(/^([0-9a-f]{64})  \.\/(.+)$/);assert.ok(match,`SHA inválida: ${line}`);manifest.set(match[2],match[1]);
  }
  const all=files();assert.equal(manifest.size,all.length,'El manifiesto debe cubrir cada archivo exactamente una vez.');
  for(const file of all){const relative=path.relative(target,file).split(path.sep).join('/');assert.equal(manifest.get(relative),sha256(file),`Hash inválido: ${relative}`);}

  console.log(JSON.stringify({ok:true,package:packageName,version:'CS21A191',port:4191,hangman:true,serverAuthoritative:true,sourceIdShuffleSafe:true,memoryFlagSanitized:true,appsScriptSingleCompleteFile:true,authenticatedQa:'PENDING',files:all.length},null,2));
}

if(!verifyOnly)build();
verify();
