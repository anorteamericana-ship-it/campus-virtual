#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const frontend = fs.readFileSync(path.join(root, 'src/english_lab_free_access_cs21a66.js'), 'utf8');
const backend = fs.readFileSync(path.join(root, 'apps_script_patches/english_lab_access_cs21a144.gs'), 'utf8');
const campus = fs.readFileSync(path.join(root, 'campus.html'), 'utf8');
const live = fs.readFileSync(path.join(root, 'src/english_lab_live.jsx'), 'utf8');

const checks = [
  ['frontend publica recuperación CS21A193', frontend.includes("F98.4-Z6-CS21A193")],
  ['frontend consulta englishLabAccessStatus', frontend.includes("const ENDPOINT = 'englishLabAccessStatus'")],
  ['frontend falla cerrado', frontend.includes('allowed:false') && frontend.includes('NO_CONFIRMADO')],
  ['frontend da 60 segundos al backend', frontend.includes('const DEFAULT_ACCESS_TIMEOUT_MS = 60000')],
  ['hook de timeout solo afecta espera fail-closed', frontend.includes('__CAMPUS_TEST_HOOKS__') && frontend.includes('Nunca cambia allowed')],
  ['frontend distingue estados inconclusos', frontend.includes('TRANSIENT_STATES') && frontend.includes('ESTADO_FINANCIERO_NO_CONFIRMADO')],
  ['frontend conserva denegaciones concluyentes', frontend.includes('CONCLUSIVE_DENIAL_STATES') && frontend.includes('CUENTA_PENDIENTE')],
  ['frontend no persiste fallos temporales', frontend.includes('if (!isConclusiveAccess(state))') && frontend.includes('sessionStorage.removeItem(CACHE_KEY)')],
  ['frontend reintenta con carga real', frontend.includes('loading:true') && frontend.includes('access.loading || access.refreshing')],
  ['frontend no muestra no disponible para fallo temporal', frontend.includes("temporary ? 'No pudimos confirmar tu acceso'")],
  ['frontend protege AcademiaPlayView', frontend.includes('installAcademiaPlayGate')],
  ['frontend protege EnglishLabLiveStudentView', frontend.includes('installLiveGate')],
  ['flujo usa cargador canónico CS21A193', frontend.includes('EnglishLabLiveCanonicalLoaderCS21A193') && frontend.includes('loader.loadStudent()') && !frontend.includes('F98.4Z6CS20H')],
  ['flujo abre pantalla de código', frontend.includes('Ingresar con código') && live.includes('Código de sala') && live.includes('LAB-5937')],
  ['identidad visible no se solicita', frontend.includes('simplifyLiveJoin')],
  ['prematrícula no promete acceso', frontend.includes('syncLegacyProspectPanel') && frontend.includes('requiere matrícula al día')],
  ['backend exige sesión', backend.includes("error:'sesion_requerida'")],
  ['operaciones protegidas fallan cerrado', backend.includes('function _cs21a144Denied_') && backend.includes('out.ok = false')],
  ['backend exige matrícula activa', backend.includes('MATRICULA_NO_ACTIVA')],
  ['backend exige cuenta al día', backend.includes('CUENTA_PENDIENTE') && backend.includes("estado:'AL_DIA'")],
  ['backend usa mora canónica', backend.includes('mora_calculada') && backend.includes('mora_exigible')],
  ['backend fuerza lectura financiera fresca', backend.includes("typeof getEstudianteFresh === 'function'") && backend.includes('getEstudianteFresh({ codigo:codigo })')],
  ['backend fija identidad desde sesión', backend.includes('out.player_id = codigo') && backend.includes('out.player_name = nombre')],
  ['backend preserva salas mixtas', backend.includes('no se compara el grupo de la sala') && !/sesion\s*\.\s*(grupo|cod_grupo)/i.test(backend)],
  ['backend envuelve join/state/answer', ['englishLabLiveJoinRoom','englishLabLiveGetPlayerState','englishLabLiveSubmitAnswer'].every(name => backend.includes(name + ' = function'))],
  ['campus rompe caché CS21A193', campus.includes('english_lab_free_access_cs21a66.js?v=F98.4Z6CS21A193')],
];

const failed = checks.filter(([, ok]) => !ok);
checks.forEach(([label, ok]) => console.log(`${ok ? 'OK' : 'FAIL'}  ${label}`));
if (failed.length) {
  console.error(`\n${failed.length} comprobación(es) fallaron.`);
  process.exit(1);
}
console.log(`\n${checks.length} comprobaciones aprobadas.`);
