#!/usr/bin/env node
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const baseName='CAMPUS_QA_CS21A192_CANDIDATO_MEMORY_MATCH_SYNC_REV2';
const packageName='CAMPUS_QA_CS21A193_CANDIDATO_ENGLISH_LAB_CARGA_ESTABLE';
const base=path.join(root,'dist',baseName);
const target=path.join(root,'dist',packageName);
const sourceHeadSha=process.env.SOURCE_HEAD_SHA||process.env.GITHUB_SHA||'local-uncommitted';
const testMergeSha=process.env.TEST_MERGE_SHA||process.env.GITHUB_SHA||'local-uncommitted';
const sourceBranch=process.env.SOURCE_BRANCH||process.env.GITHUB_HEAD_REF||'fix/cs21a193-english-lab-live-loader-access';
const verifyOnly=process.argv.includes('--verify');

const STATIC_EPOCH='F98.4Z6CS21A193';
const CANONICAL_EPOCH='CS21A193';
const PRODUCT_GUARD='src/english_lab_live_product_guard_cs21a187.js';
const CLASSIC_GUARD='src/english_lab_live_classic_sync_guard_cs21a189.js';
const TIMEOUT_GUARD='src/english_lab_live_timeout_style_guard_cs21a190.js';
const AUTHORITATIVE_GUARD='src/english_lab_live_authoritative_sync_guard_cs21a192.js';
const STUDENT_GUARD='src/english_lab_live_student_dependency_guard_cs21a184.js';
const CANONICAL_GUARD='src/english_lab_live_canonical_loader_cs21a193.js';
const APP='src/app.jsx';

const copiedFrontend=[
  'src/lazy_loader.jsx',
  'src/app.jsx',
  'src/english_lab_free_access_cs21a66.js',
  'src/english_lab_games/english_lab_hangman_live_cs21a191.jsx',
  PRODUCT_GUARD,
  CLASSIC_GUARD,
  TIMEOUT_GUARD,
  AUTHORITATIVE_GUARD,
  STUDENT_GUARD,
  CANONICAL_GUARD,
];

function sha256(file){return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');}
function copy(relative,destinationRelative=relative){
  const source=path.join(root,relative);
  const destination=path.join(target,destinationRelative);
  assert.equal(fs.existsSync(source),true,`Falta ${relative}`);
  fs.mkdirSync(path.dirname(destination),{recursive:true});
  fs.copyFileSync(source,destination);
}
function text(relative){return fs.readFileSync(path.join(target,relative),'utf8');}
function write(relative,value){
  const destination=path.join(target,relative);
  fs.mkdirSync(path.dirname(destination),{recursive:true});
  fs.writeFileSync(destination,value,'utf8');
}
function files(){
  const out=[];
  const walk=dir=>{
    for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
      const absolute=path.join(dir,entry.name);
      if(entry.isDirectory()) walk(absolute);
      else if(entry.name!=='SHA256SUMS.txt') out.push(absolute);
    }
  };
  walk(target);
  return out.sort((left,right)=>left.localeCompare(right));
}
function treeManifest(directory){
  const entries=new Map();
  const walk=(absolute,prefix='')=>{
    for(const entry of fs.readdirSync(absolute,{withFileTypes:true}).sort((left,right)=>left.name.localeCompare(right.name))){
      const relative=prefix?`${prefix}/${entry.name}`:entry.name;
      const child=path.join(absolute,entry.name);
      if(entry.isDirectory()) walk(child,relative);
      else entries.set(relative,sha256(child));
    }
  };
  walk(directory);
  return entries;
}
function writeManifest(){
  const lines=files().map(file=>`${sha256(file)}  ./${path.relative(target,file).split(path.sep).join('/')}`);
  write('SHA256SUMS.txt',lines.join('\n')+'\n');
}
function setVersion(source,key,value){
  const cleaned=source
    .replace(new RegExp(`^${key}=.*(?:\\r?\\n|$)`,'gm'),'')
    .replace(/\s*$/,'');
  return `${cleaned}\n${key}=${value}\n`.replace(/^\n/,'');
}
function replaceRequired(source,pattern,replacement,label){
  assert.match(source,pattern,`No se encontró ${label}.`);
  return source.replace(pattern,replacement);
}
function removeScript(source,relative){
  const escaped=relative.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  return source.replace(new RegExp(`\\n?<script(?: type="text/babel" data-plugins="transform-block-scoping")? src="${escaped}\\?v=[^"]+"></script>`,'g'),'');
}
function scriptTag(relative,type='js'){
  return type==='babel'
    ? `<script type="text/babel" data-plugins="transform-block-scoping" src="${relative}?v=${STATIC_EPOCH}"></script>`
    : `<script src="${relative}?v=${STATIC_EPOCH}"></script>`;
}

function build(){
  assert.equal(fs.existsSync(base),true,'Falta el paquete exacto CS21A192 REV2. Reconstruya primero la cadena 148→183→187→189→190→191/finalize→192 REV2.');
  fs.rmSync(target,{recursive:true,force:true});
  fs.cpSync(base,target,{recursive:true});

  for(const entry of fs.readdirSync(target)){
    if(entry==='SHA256SUMS.txt'||/^(?:LEEME_PRIMERO|REGISTRO_PRUEBA_AUTENTICADA|ABRIR_CAMPUS_QA)_CS21A\d+/i.test(entry)){
      fs.rmSync(path.join(target,entry),{recursive:true,force:true});
    }
  }
  fs.rmSync(path.join(target,'EVIDENCIA_AUTOMATICA'),{recursive:true,force:true});

  [
    ...copiedFrontend,
    '00_DOCUMENTACION/ENGLISH_LAB_MEMORY_MATCH_SYNC_CS21A192.md',
    '00_DOCUMENTACION/ENGLISH_LAB_ENTRADA_CANONICA_CS21A193.md',
  ].forEach(relative=>copy(relative));

  let campus=text('campus.html');
  for(const relative of [PRODUCT_GUARD,CLASSIC_GUARD,TIMEOUT_GUARD,AUTHORITATIVE_GUARD,STUDENT_GUARD,CANONICAL_GUARD]){
    campus=removeScript(campus,relative);
  }
  const lazyPattern=/(<script type="text\/babel" data-plugins="transform-block-scoping" src="src\/lazy_loader\.jsx\?v=[^"]+"><\/script>)/;
  campus=replaceRequired(
    campus,
    lazyPattern,
    [
      '$1','',
      scriptTag(CANONICAL_GUARD),
      scriptTag(PRODUCT_GUARD),
      scriptTag(CLASSIC_GUARD),
      scriptTag(TIMEOUT_GUARD),
      scriptTag(AUTHORITATIVE_GUARD),
      scriptTag(STUDENT_GUARD),
    ].join('\n'),
    'el cargador lazy padre',
  );
  campus=replaceRequired(campus,/src\/english_lab_free_access_cs21a66\.js\?v=[^"]+/g,`src/english_lab_free_access_cs21a66.js?v=${STATIC_EPOCH}`,'la entrada libre de English LAB');
  campus=replaceRequired(campus,/src\/runtime_config\.js\?v=[^"]+/g,`src/runtime_config.js?v=${STATIC_EPOCH}`,'runtime_config.js');
  campus=replaceRequired(campus,/src\/lazy_loader\.jsx\?v=[^"]+/g,`src/lazy_loader.jsx?v=${STATIC_EPOCH}`,'lazy_loader.jsx');
  campus=replaceRequired(campus,/src\/app\.jsx\?v=[^"]+/g,`src/app.jsx?v=${STATIC_EPOCH}`,'app.jsx');
  campus=campus.replace(/styles\/(english_lab_[^"?]+\.css)\?v=[^"]+/g,`styles/$1?v=${STATIC_EPOCH}`);
  write('campus.html',campus);
  write('index.html',campus);

  let runtime=text('src/runtime_config.js');
  runtime=replaceRequired(
    runtime,
    /src\/english_lab_ux_cs21a181\.js\?v=[^'"\s]+/,
    `src/english_lab_ux_cs21a181.js?v=${STATIC_EPOCH}`,
    'la capa UX de English LAB',
  );
  write('src/runtime_config.js',runtime);

  const oldLauncher=path.join(base,'ABRIR_CAMPUS_QA_CS21A192.cmd');
  assert.equal(fs.existsSync(oldLauncher),true,'Falta el launcher CS21A192 en el paquete base.');
  const launcher=fs.readFileSync(oldLauncher,'utf8').replaceAll('4192','4193').replaceAll('CS21A192','CS21A193');
  write('ABRIR_CAMPUS_QA_CS21A193.cmd',launcher);

  let serve=text('serve.mjs');
  assert.match(serve,/4192/,'serve.mjs CS21A192 no contiene el puerto base 4192.');
  serve=serve.replaceAll('4192','4193');
  write('serve.mjs',serve);

  write('LEEME_PRIMERO_CS21A193.txt',`CAMPUS QA CS21A193 - ENGLISH LAB CARGA ESTABLE
=================================================

ESTADO REAL
- Candidato QA aislado. NO producción y NO main.
- Base exacta: ${baseName}.
- Rama: ${sourceBranch}
- SHA fuente: ${sourceHeadSha}
- CS21A192 falló la QA autenticada de entrada: Naty no cargó el adaptador, Chu recibió un aborto de red y el docente quedó con 0 participantes.
- CS21A193 unifica la carga de English LAB Live en un solo manifiesto, un solo dueño y el epoch ${CANONICAL_EPOCH}.
- Un aborto o timeout al comprobar acceso se trata como problema transitorio recuperable; no como denegación financiera.
- CI y pruebas sintéticas NO sustituyen la prueba autenticada con docente, Chu y Naty.

APPS SCRIPT QA - NO MODIFICAR
- El backend QA vigente ya terminó correctamente en CS21A192-MM-CONSISTENCY-2.
- CS21A193 es exclusivamente frontend.
- NO abra, pegue, reemplace ni edite ningún archivo de Apps Script.
- NO cree otra versión del deployment y NO cambie la URL /exec.
- NO toque Code.gs, main, producción ni el deployment productivo.

FRONTEND QA
1. Cierre el servidor anterior del puerto 4192.
2. Extraiga este ZIP completo en una carpeta nueva; no mezcle archivos con CS21A192.
3. Ejecute ABRIR_CAMPUS_QA_CS21A193.cmd.
4. Se abrirá http://127.0.0.1:4193/qa-setup.html
5. Configure, si se solicita, la MISMA URL /exec QA que ya fue verificada. Esto no modifica Apps Script.

PRUEBA OBLIGATORIA DE ENTRADA
1. El docente crea una sala NUEVA Memory Match B1/U01, 6 parejas, Individual, pero todavía NO la inicia.
2. Naty abre English LAB, pulsa Ingresar con código y debe llegar a la pantalla de ingreso sin el error del adaptador CS21A192.
3. Chu repite el flujo. Si la consulta de acceso falla temporalmente, debe ver un mensaje recuperable y Verificar de nuevo; nunca una falsa denegación.
4. Chu pulsa Verificar de nuevo y debe llegar a la entrada de código cuando el backend responda.
5. Ambos ingresan el código. El docente debe mostrar exactamente 2 participantes antes de iniciar.
6. Solo entonces el docente inicia Memory Match.
7. Confirme que docente, Chu y Naty coinciden en turno, jugador, tiempo, cartas y parejas.
8. Repita la entrada a 1440x900 y 390x844.

Si cualquiera falla antes de aparecer como participante, registre pantalla, hora y mensaje exacto. No inicie la sala, no cree otra y no modifique Apps Script.

NO FUSIONAR NI PASAR A PRODUCCIÓN SIN PASS AUTENTICADO.
`);

  write('REGISTRO_PRUEBA_AUTENTICADA_CS21A193.txt',`REGISTRO QA CS21A193 - ENTRADA ENGLISH LAB
============================================
Estado inicial: PENDIENTE
Fecha:
Sala nueva:
URL /exec QA usada (no pegar secretos; solo confirmar misma implementación):
Docente:
Estudiante 1 (Chu):
Estudiante 2 (Naty):

[ ] VERSION.txt muestra CS21A193, puerto 4193 y backend CS21A192-MM-CONSISTENCY-2.
[ ] No se modificó Apps Script ni se creó otra versión del deployment.
[ ] Naty llega desde English LAB a la entrada de código sin error de adaptador.
[ ] Chu llega desde English LAB a la entrada de código sin error de adaptador.
[ ] Un fallo transitorio de acceso muestra recuperación y Verificar de nuevo; no una denegación falsa.
[ ] El reintento no queda bloqueado por caché de NO_CONFIRMADO.
[ ] No aparecen errores de consola ni pantalla en blanco durante la entrada.
[ ] Las 12 dependencias canónicas cargan una sola vez con epoch CS21A193.
[ ] El docente muestra 2 participantes antes de iniciar.
[ ] Docente, Chu y Naty cargan el tablero compartido al iniciar.
[ ] Los tres coinciden en turno, jugador, tiempo, cartas y parejas.
[ ] Desktop 1440x900 usable y sin errores.
[ ] Móvil 390x844 usable, sin errores y sin desborde horizontal.
[ ] Regresiones de Memory Match CS21A192 aprobadas.
[ ] Regresión de Ahorcado CS21A191 aprobada.

Resultado final: PASS / FAIL / BLOCKED
Primera falla observable:
Hora y panel:
Mensaje exacto:
Participantes visibles en docente:
Evidencia (capturas y consola):
`);

  let version=text('VERSION.txt');
  for(const [key,value] of [
    ['VERSION','CS21A193'],
    ['PACKAGE_REVISION','1'],
    ['STATUS','QA_CANDIDATE_NOT_FINAL'],
    ['PURPOSE','English LAB canonical live entry and transient access recovery QA candidate'],
    ['PACKAGE_BASE',baseName],
    ['QA_PORT','4193'],
    ['SOURCE_BRANCH',sourceBranch],
    ['SOURCE_HEAD_SHA',sourceHeadSha],
    ['TEST_MERGE_SHA',testMergeSha],
    ['FRONTEND_LAYER','F98.4-Z6-CS21A193'],
    ['BACKEND_LAYER','CS21A192-MM-CONSISTENCY-2'],
    ['APPS_SCRIPT_CHANGE','NO'],
    ['APPS_SCRIPT_ACTION','DO_NOT_MODIFY'],
    ['APPS_SCRIPT_INSTALL_MODE','NOT_REQUIRED_BACKEND_UNCHANGED'],
    ['ENGLISH_LAB_CANONICAL_EPOCH',CANONICAL_EPOCH],
    ['ENGLISH_LAB_CANONICAL_MANIFEST_COUNT','12'],
    ['ENGLISH_LAB_ENTRY_OWNER','CANONICAL_LOADER_CS21A193'],
    ['ENGLISH_LAB_TRANSIENT_ACCESS_RETRY','true'],
    ['ENGLISH_LAB_AUTHENTICATED_QA_STATUS','PENDING'],
    ['PREVIOUS_AUTHENTICATED_QA','CS21A192_FAIL'],
    ['MEMORY_MATCH_SYNC_VERSION','CS21A192-MM-CONSISTENCY-2'],
    ['MEMORY_MATCH_CACHE_EPOCH',CANONICAL_EPOCH],
    ['MEMORY_MATCH_BROWSER_CACHE_EPOCH',CANONICAL_EPOCH],
    ['MEMORY_MATCH_STYLE_CACHE_EPOCH',STATIC_EPOCH],
    ['MEMORY_MATCH_AUTHENTICATED_QA_STATUS','PENDING_CS21A193'],
  ]) version=setVersion(version,key,value);
  write('VERSION.txt',version.replace(/\s*$/,'')+'\n');

  writeManifest();
}

function verify(){
  for(const relative of [
    'ABRIR_CAMPUS_QA_CS21A193.cmd',
    'LEEME_PRIMERO_CS21A193.txt',
    'REGISTRO_PRUEBA_AUTENTICADA_CS21A193.txt',
    'VERSION.txt','SHA256SUMS.txt','campus.html','serve.mjs',
    ...copiedFrontend,
    '00_DOCUMENTACION/ENGLISH_LAB_MEMORY_MATCH_SYNC_CS21A192.md',
    '00_DOCUMENTACION/ENGLISH_LAB_ENTRADA_CANONICA_CS21A193.md',
    'BACKEND_QA/99O_MEMORY_MATCH_CONSISTENCY_QA_CS21A192.gs',
    'BACKEND_QA/99_CS21A183_SENTENCE_ORDER_COMPLETO.gs',
  ]) assert.equal(fs.existsSync(path.join(target,relative)),true,`Falta ${relative}`);

  for(const relative of copiedFrontend){
    assert.equal(sha256(path.join(root,relative)),sha256(path.join(target,relative)),`${relative} no coincide con la fuente.`);
  }
  for(const relative of [
    'apps_script_patches/99O_MEMORY_MATCH_CONSISTENCY_QA_CS21A192.gs',
    'apps_script_patches/99_CS21A183_SENTENCE_ORDER_COMPLETO.gs',
    'BACKEND_QA/99O_MEMORY_MATCH_CONSISTENCY_QA_CS21A192.gs',
    'BACKEND_QA/99_CS21A183_SENTENCE_ORDER_COMPLETO.gs',
  ]){
    assert.equal(sha256(path.join(base,relative)),sha256(path.join(target,relative)),`${relative} debe permanecer idéntico a CS21A192 REV2.`);
  }
  for(const directory of ['BACKEND_QA','apps_script_patches']){
    const expected=treeManifest(path.join(base,directory));
    const actual=treeManifest(path.join(target,directory));
    assert.deepEqual(actual,expected,`El árbol ${directory} debe permanecer byte por byte idéntico a CS21A192 REV2.`);
  }

  const campus=text('campus.html');
  assert.equal(text('index.html'),campus,'index.html debe ser un alias exacto de campus.html para no saltar CS21A193.');
  const ordered=[CANONICAL_GUARD,PRODUCT_GUARD,CLASSIC_GUARD,TIMEOUT_GUARD,AUTHORITATIVE_GUARD,STUDENT_GUARD,APP];
  let previous=campus.indexOf('src/lazy_loader.jsx');
  assert.ok(previous>=0,'Falta lazy_loader.jsx.');
  for(const relative of ordered){
    const position=campus.indexOf(`${relative}?v=${STATIC_EPOCH}`);
    assert.ok(position>previous,`Orden de carga incorrecto para ${relative}.`);
    assert.equal((campus.match(new RegExp(relative.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'g'))||[]).length,1,`${relative} debe aparecer una sola vez.`);
    previous=position;
  }
  assert.match(campus,new RegExp(`src/english_lab_free_access_cs21a66\\.js\\?v=${STATIC_EPOCH.replaceAll('.','\\.')}`));
  assert.match(campus,new RegExp(`src/runtime_config\\.js\\?v=${STATIC_EPOCH.replaceAll('.','\\.')}`));
  assert.match(text('src/runtime_config.js'),new RegExp(`src/english_lab_ux_cs21a181\\.js\\?v=${STATIC_EPOCH.replaceAll('.','\\.')}`));
  const sourceCampus=fs.readFileSync(path.join(root,'campus.html'),'utf8');
  for(const relative of ['src/runtime_config.js','src/english_lab_free_access_cs21a66.js','src/lazy_loader.jsx',CANONICAL_GUARD,APP]){
    assert.ok(sourceCampus.includes(`${relative}?v=${STATIC_EPOCH}`),`campus.html fuente no publica ${relative} con el epoch CS21A193.`);
    assert.ok(campus.includes(`${relative}?v=${STATIC_EPOCH}`),`El paquete no publica ${relative} con el epoch CS21A193.`);
  }
  assert.ok(sourceCampus.indexOf('src/lazy_loader.jsx')<sourceCampus.indexOf(`${CANONICAL_GUARD}?v=${STATIC_EPOCH}`),'El campus fuente debe instalar CS21A193 después del lazy loader.');
  assert.ok(sourceCampus.indexOf(`${CANONICAL_GUARD}?v=${STATIC_EPOCH}`)<sourceCampus.indexOf(`${APP}?v=${STATIC_EPOCH}`),'El campus fuente debe instalar CS21A193 antes de app.jsx.');
  const lazy=text('src/lazy_loader.jsx');
  assert.match(lazy,/const VERSION = 'F98\.4-Z6-CS21A193'/);
  assert.match(lazy,/const activeLoadMany = window\.anLazyCampus/,'resolveRoute debe consultar el dueño dinámico vigente.');
  assert.match(lazy,/await activeLoadMany\(list\)/,'resolveRoute debe usar el dueño dinámico vigente.');
  assert.doesNotMatch(lazy,/await loadMany\(list\);/,'resolveRoute no debe conservar el cierre léxico CS21A192.');

  const canonical=text(CANONICAL_GUARD);
  const epochs=[...canonical.matchAll(/\?v=([^'"\s`]+)/g)].map(match=>match[1]);
  assert.equal(epochs.length,12,'El manifiesto canónico debe contener exactamente 12 dependencias versionadas.');
  assert.deepEqual([...new Set(epochs)],[CANONICAL_EPOCH],'Todas las dependencias canónicas deben usar un único epoch CS21A193.');

  const access=text('src/english_lab_free_access_cs21a66.js');
  for(const marker of [
    'F98.4-Z6-CS21A193','an_english_lab_access_cs21a193','DEFAULT_ACCESS_TIMEOUT_MS = 60000',
    'TRANSIENT_STATES','CONCLUSIVE_DENIAL_STATES','No pudimos confirmar tu acceso',
    'access.loading || access.refreshing','EnglishLabLiveCanonicalLoaderCS21A193','loader.loadStudent()',
  ]) assert.ok(access.includes(marker),`La entrada English LAB no contiene ${marker}.`);
  assert.doesNotMatch(access,/F98\.4Z6CS20H/,'La entrada no debe solicitar el Live histórico CS20H.');

  const readme=text('LEEME_PRIMERO_CS21A193.txt');
  assert.match(readme,/APPS SCRIPT QA - NO MODIFICAR/);
  assert.match(readme,/NO abra, pegue, reemplace ni edite ningún archivo de Apps Script/);
  assert.match(readme,/CS21A192-MM-CONSISTENCY-2/);
  assert.match(readme,/CI y pruebas sintéticas NO sustituyen/);
  const register=text('REGISTRO_PRUEBA_AUTENTICADA_CS21A193.txt');
  assert.match(register,/Resultado final: PASS \/ FAIL \/ BLOCKED/);
  assert.match(register,/Desktop 1440x900/);
  assert.match(register,/Móvil 390x844/);

  const version=text('VERSION.txt');
  for(const marker of [
    'VERSION=CS21A193','PACKAGE_REVISION=1','STATUS=QA_CANDIDATE_NOT_FINAL',`PACKAGE_BASE=${baseName}`,'QA_PORT=4193',
    `SOURCE_HEAD_SHA=${sourceHeadSha}`,`TEST_MERGE_SHA=${testMergeSha}`,
    'FRONTEND_LAYER=F98.4-Z6-CS21A193','BACKEND_LAYER=CS21A192-MM-CONSISTENCY-2',
    'APPS_SCRIPT_CHANGE=NO','APPS_SCRIPT_ACTION=DO_NOT_MODIFY','APPS_SCRIPT_INSTALL_MODE=NOT_REQUIRED_BACKEND_UNCHANGED',
    'ENGLISH_LAB_CANONICAL_EPOCH=CS21A193','ENGLISH_LAB_CANONICAL_MANIFEST_COUNT=12',
    'ENGLISH_LAB_ENTRY_OWNER=CANONICAL_LOADER_CS21A193','ENGLISH_LAB_TRANSIENT_ACCESS_RETRY=true',
    'ENGLISH_LAB_AUTHENTICATED_QA_STATUS=PENDING','PREVIOUS_AUTHENTICATED_QA=CS21A192_FAIL',
    'MEMORY_MATCH_SYNC_VERSION=CS21A192-MM-CONSISTENCY-2','MEMORY_MATCH_CACHE_EPOCH=CS21A193',
    'MEMORY_MATCH_BROWSER_CACHE_EPOCH=CS21A193','MEMORY_MATCH_STYLE_CACHE_EPOCH=F98.4Z6CS21A193',
    'MEMORY_MATCH_AUTHENTICATED_QA_STATUS=PENDING_CS21A193',
  ]) assert.ok(version.includes(marker),`VERSION.txt no contiene ${marker}`);
  assert.match(text('ABRIR_CAMPUS_QA_CS21A193.cmd'),/127\.0\.0\.1:4193\/qa-setup\.html/);
  assert.match(text('serve.mjs'),/4193/);

  for(const entry of fs.readdirSync(target)){
    if(/^(?:LEEME_PRIMERO|REGISTRO_PRUEBA_AUTENTICADA|ABRIR_CAMPUS_QA)_CS21A(?!193)/i.test(entry)){
      assert.fail(`El paquete conserva un artefacto previo: ${entry}`);
    }
  }
  assert.equal(fs.existsSync(path.join(target,'EVIDENCIA_AUTOMATICA')),false,'El paquete no debe conservar evidencia automática heredada.');

  const manifest=new Map();
  for(const line of text('SHA256SUMS.txt').trim().split(/\r?\n/)){
    const match=line.match(/^([0-9a-f]{64})  \.\/(.+)$/);
    assert.ok(match,`SHA inválida: ${line}`);
    assert.equal(manifest.has(match[2]),false,`Entrada duplicada en manifiesto: ${match[2]}`);
    manifest.set(match[2],match[1]);
  }
  const all=files();
  assert.equal(manifest.size,all.length,'El manifiesto debe cubrir cada archivo exactamente una vez.');
  for(const file of all){
    const relative=path.relative(target,file).split(path.sep).join('/');
    assert.equal(manifest.get(relative),sha256(file),`Hash inválido: ${relative}`);
  }

  console.log(JSON.stringify({
    ok:true,
    package:packageName,
    base:baseName,
    version:'CS21A193',
    port:4193,
    frontendOnly:true,
    backend:'CS21A192-MM-CONSISTENCY-2',
    appsScriptAction:'DO_NOT_MODIFY',
    canonicalEpoch:CANONICAL_EPOCH,
    canonicalManifestEntries:12,
    transientAccessRetry:true,
    previousAuthenticatedQa:'CS21A192_FAIL',
    authenticatedQa:'PENDING',
    files:all.length,
  },null,2));
}

if(!verifyOnly) build();
verify();
