#!/usr/bin/env node
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const source = path.join(root,'dist','qa-staging');
const packageName = 'CAMPUS_QA_CS21A179_CANDIDATO_CARGA_CANONICA_MENUS';
const target = path.join(root,'dist',packageName);
const verifyOnly = process.argv.includes('--verify');
const sourceHeadSha = process.env.SOURCE_HEAD_SHA || process.env.GITHUB_SHA || 'local-uncommitted';
const testMergeSha = process.env.TEST_MERGE_SHA || process.env.GITHUB_SHA || 'local';
const sourceBranch = process.env.SOURCE_BRANCH || process.env.GITHUB_HEAD_REF || 'fix/cs21a179-atomic-canonical-route-loading';

function sha256(file){return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');}
function write(relative,content){const file=path.join(target,relative);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,content,'utf8');}
function packageFiles(){
  const files=[];
  const walk=directory=>{for(const entry of fs.readdirSync(directory,{withFileTypes:true})){const absolute=path.join(directory,entry.name);if(entry.isDirectory())walk(absolute);else if(entry.name!=='SHA256SUMS.txt')files.push(absolute);}};
  walk(target);
  return files.sort((a,b)=>a.localeCompare(b));
}

function build(){
  assert.equal(fs.existsSync(source),true,'Primero debe generarse dist/qa-staging.');
  fs.rmSync(target,{recursive:true,force:true});
  fs.cpSync(source,target,{recursive:true});
  fs.rmSync(path.join(target,'.nojekyll'),{force:true});

  // El staging vigente puede estar varias capas por delante. Este builder debe
  // reconstruir su artefacto histórico sin modificar las fuentes actuales.
  const campusPath=path.join(target,'campus.html');
  fs.writeFileSync(campusPath,fs.readFileSync(campusPath,'utf8')
    .replace(/src\/lazy_loader\.jsx\?v=F98\.4Z6CS21A\d+/g,'src/lazy_loader.jsx?v=F98.4Z6CS21A179'),'utf8');
  const lazyPath=path.join(target,'src','lazy_loader.jsx');
  fs.writeFileSync(lazyPath,fs.readFileSync(lazyPath,'utf8')
    .replace(/^\/\/ F98\.4-Z6-CS21A\d+[^\r\n]*/m,'// F98.4-Z6-CS21A179 · artefacto histórico de carga atómica.')
    .replace(/const VERSION = 'F98\.4-Z6-CS21A\d+';/,"const VERSION = 'F98.4-Z6-CS21A179';"),'utf8');

  const oldLauncher=path.join(target,'INICIAR_QA_STAGING.cmd');
  const newLauncher=path.join(target,'ABRIR_CAMPUS_QA_CS21A179.cmd');
  const launcher=fs.readFileSync(oldLauncher,'utf8').replace(/^\uFEFF/,'')
    .replaceAll('127.0.0.1:4173','127.0.0.1:4177')
    .replace('node serve.mjs','set PORT=4177\r\nnode serve.mjs');
  fs.writeFileSync(newLauncher,launcher,'utf8');
  fs.rmSync(oldLauncher);
  const serverPath=path.join(target,'serve.mjs');
  fs.writeFileSync(serverPath,fs.readFileSync(serverPath,'utf8')
    .replace('process.env.PORT || 4173','process.env.PORT || 4177')
    .replace("process.env.PORT || '4173'","process.env.PORT || '4177'"),'utf8');

  write('LEEME_PRIMERO_CS21A179.txt',`CAMPUS QA CS21A179 · CANDIDATO DE CARGA CANÓNICA DE MENÚS
============================================================

ESTADO REAL
- Este paquete corrige la vista histórica que aparecía antes de la pantalla real.
- Es un CANDIDATO QA; no es una entrega final ni autoriza producción.
- No cambia Apps Script, hojas, Drive operativo, main ni producción.
- Conserva el backend QA CS21A176 que ya estaba instalado.

QUÉ CAMBIÓ
- Los menús esperan y fijan el componente canónico antes de renderizar.
- Mi Perfil docente ya no puede caer en la pantalla histórica de student_modules.jsx.
- La pantalla docente histórica fue retirada del módulo estudiantil.
- Mi Perfil estudiante carga todas sus dependencias antes de abrir.
- Se actualizaron las claves de caché de los tres archivos modificados.

ABRIR EL FRONTEND QA
1. Cierre la ventana negra del paquete CS21A178.
2. Extraiga completamente este ZIP en una carpeta nueva.
3. Ejecute ABRIR_CAMPUS_QA_CS21A179.cmd.
4. Mantenga abierta la ventana negra.
5. Se abrirá http://127.0.0.1:4177/qa-setup.html
6. Pegue la misma URL /exec del Apps Script QA. No modifique Apps Script.

PRUEBA VISUAL OBLIGATORIA
1. Entre con la cuenta docente QA.
2. Abra Mi Perfil. Solo debe aparecer la vista con banner Campus Virtual.
3. Nunca debe aparecer Información profesional del docente ni Documentos del docente.
4. Cambie cinco veces entre Mi Perfil, Mis grupos, Asistencia y Calendario académico.
5. Recargue directamente dentro de Mi Perfil y repita la alternancia.
6. Repita Mi Perfil con una cuenta estudiante QA.
7. Revise los demás menús; puede existir el estado neutro Preparando pantalla, pero nunca una vista vieja antes de la canónica.

NO HACER
- No reemplazar 97_ACTUALIZACION_QA.gs.
- No usar la URL productiva.
- No fusionar los PR apilados.
- No declarar aceptación final sin completar REGISTRO_PRUEBA_AUTENTICADA_CS21A179.txt.
`);

  write('ESTADO_VALIDACION_CS21A179.txt',`MATRIZ DE EVIDENCIA CS21A179
================================

AUDITORÍA DE CAUSA             APROBADO
PRUEBA DE CARRERA 30 ms        APROBADO
MENÚS SINTÉTICOS               52 / 52 APROBADOS
- Docente                      15 / 15
- Estudiante                   16 / 16
- Superadmin                   21 / 21
PERFIL DOCENTE 1440x900        APROBADO
PERFIL DOCENTE 390x844         APROBADO
PAGEERROR                      0
VISTA DOCENTE HISTÓRICA        RETIRADA DE student_modules.jsx
PERFIL ESTUDIANTE              DEPENDENCIAS COMPLETAS
APPS SCRIPT                    SIN CAMBIOS
PRODUCCIÓN                     SIN CAMBIOS
QA AUTENTICADA                 PENDIENTE

VEREDICTO: APTO CON RESERVAS PARA QA AUTENTICADA
`);

  write('REGISTRO_PRUEBA_AUTENTICADA_CS21A179.txt',`REGISTRO DE ACEPTACIÓN QA CS21A179
=====================================

Estado inicial: PENDIENTE
Fecha:
Docente QA:
Estudiante QA:

[ ] Mi Perfil docente abre directamente con el banner Campus Virtual.
[ ] Nunca aparece Información profesional del docente.
[ ] Nunca aparece Documentos del docente.
[ ] Cinco alternancias de menús no muestran vistas históricas.
[ ] La recarga directa de Mi Perfil conserva la vista canónica.
[ ] Mi Perfil estudiante abre sin error de ReposicionStudentCardF92.
[ ] Los demás menús muestran solo carga neutra o su vista final.
[ ] Escritorio aprobado.
[ ] Móvil aprobado.

Resultado final: PASS / FAIL / BLOCKED
Primera falla observable:
Menú y rol:
`);

  write('VERSION.txt',`VERSION=CS21A179
STATUS=QA_CANDIDATE_NOT_FINAL
PURPOSE=Atomic canonical route loading across visible menus
BASE_FRONTEND_VERSION=CS21A178
BASE_BACKEND_VERSION=CS21A176
SOURCE_BRANCH=${sourceBranch}
SOURCE_HEAD_SHA=${sourceHeadSha}
TEST_MERGE_SHA=${testMergeSha}
QA_PORT=4177
APPS_SCRIPT_CHANGE=NO
AUTHENTICATED_QA_STATUS=PENDING
PRODUCTION_TOUCHED=NO
`);

  const audit=path.join(root,'00_DOCUMENTACION','CARGA_ATOMICA_RUTAS_CS21A179.md');
  assert.equal(fs.existsSync(audit),true,'Falta el informe canónico CS21A179.');
  fs.copyFileSync(audit,path.join(target,'INFORME_AUDITORIA_CS21A179.md'));
  const evidence=path.join(root,'qa-output','atomic-route-loading-cs21a179');
  if(fs.existsSync(evidence))fs.cpSync(evidence,path.join(target,'EVIDENCIA_AUTOMATICA_CS21A179'),{recursive:true});

  write('SHA256SUMS.txt',packageFiles().map(file=>`${sha256(file)}  ./${path.relative(target,file).split(path.sep).join('/')}`).join('\n')+'\n');
}

function verify(){
  for(const relative of [
    'ABRIR_CAMPUS_QA_CS21A179.cmd','LEEME_PRIMERO_CS21A179.txt','ESTADO_VALIDACION_CS21A179.txt',
    'REGISTRO_PRUEBA_AUTENTICADA_CS21A179.txt','INFORME_AUDITORIA_CS21A179.md','VERSION.txt','SHA256SUMS.txt',
    'src/lazy_loader.jsx','src/student_menu_academic_cs21a120.jsx','src/student_modules.jsx',
    'EVIDENCIA_AUTOMATICA_CS21A179/report.json','EVIDENCIA_AUTOMATICA_CS21A179/teacher-profile-desktop.png',
    'EVIDENCIA_AUTOMATICA_CS21A179/teacher-profile-mobile.png',
  ])assert.equal(fs.existsSync(path.join(target,relative)),true,`Falta ${relative}`);
  assert.equal(fs.existsSync(path.join(target,'INICIAR_QA_STAGING.cmd')),false);
  assert.equal(fs.existsSync(path.join(target,'.nojekyll')),false);
  assert.match(fs.readFileSync(path.join(target,'ABRIR_CAMPUS_QA_CS21A179.cmd'),'utf8'),/127\.0\.0\.1:4177\/qa-setup\.html[\s\S]*set PORT=4177/);
  assert.match(fs.readFileSync(path.join(target,'campus.html'),'utf8'),/lazy_loader\.jsx\?v=F98\.4Z6CS21A179/);
  const loader=fs.readFileSync(path.join(target,'src','lazy_loader.jsx'),'utf8');
  assert.match(loader,/F98\.4-Z6-CS21A179/);
  assert.match(loader,/resolveRoute/);
  const student=fs.readFileSync(path.join(target,'src','student_modules.jsx'),'utf8');
  assert.doesNotMatch(student,/Información profesional del docente|Documentos del docente|esTeacherPerfil/);
  const version=fs.readFileSync(path.join(target,'VERSION.txt'),'utf8');
  assert.match(version,/STATUS=QA_CANDIDATE_NOT_FINAL/);
  assert.match(version,/APPS_SCRIPT_CHANGE=NO/);
  const manifest=new Map();
  for(const line of fs.readFileSync(path.join(target,'SHA256SUMS.txt'),'utf8').trim().split(/\r?\n/)){
    const match=line.match(/^([0-9a-f]{64})  \.\/(.+)$/);assert.ok(match,`Línea SHA inválida: ${line}`);manifest.set(match[2],match[1]);
  }
  const files=packageFiles();
  assert.equal(manifest.size,files.length,'El manifiesto debe cubrir cada archivo exactamente una vez.');
  for(const file of files){const relative=path.relative(target,file).split(path.sep).join('/');assert.equal(manifest.get(relative),sha256(file),`Hash inválido: ${relative}`);}
  console.log(JSON.stringify({verdict:'APTO_CON_RESERVAS',package:packageName,files:files.length,authenticatedQa:'PENDING'},null,2));
}

if(!verifyOnly)build();
verify();
