#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const frontend = fs.readFileSync(path.join(root, 'src/english_lab_free_access_cs21a66.js'), 'utf8');
const backend = fs.readFileSync(path.join(root, 'apps_script_patches/english_lab_access_cs21a144.gs'), 'utf8');
const campus = fs.readFileSync(path.join(root, 'campus.html'), 'utf8');

const checks = [
  ['frontend publica CS21A144', frontend.includes("F98.4-Z6-CS21A144")],
  ['frontend consulta englishLabAccessStatus', frontend.includes("const ENDPOINT = 'englishLabAccessStatus'")],
  ['frontend falla cerrado', frontend.includes("allowed:false") && frontend.includes("NO_CONFIRMADO")],
  ['frontend protege AcademiaPlayView', frontend.includes('installAcademiaPlayGate')],
  ['frontend protege EnglishLabLiveStudentView', frontend.includes('installLiveGate')],
  ['flujo carga sala dentro de LAB', frontend.includes("anLazyCampus.loadOne(LIVE_FILE)")],
  ['flujo acepta código LAB-####', frontend.includes('/^LAB-\\d{4}$/')],
  ['identidad visible no se solicita', frontend.includes('simplifyLiveJoin')],
  ['backend exige sesión', backend.includes("error:'sesion_requerida'")],
  ['backend exige matrícula activa', backend.includes('MATRICULA_NO_ACTIVA')],
  ['backend exige cuenta al día', backend.includes('CUENTA_PENDIENTE') && backend.includes("estado:'AL_DIA'")],
  ['backend usa mora canónica', backend.includes('mora_calculada') && backend.includes('mora_exigible')],
  ['backend fija identidad desde sesión', backend.includes('out.player_id = codigo') && backend.includes('out.player_name = nombre')],
  ['backend no restringe grupo de estudiante', backend.includes('DELIBERADAMENTE NO se compara COD_GRUPO')],
  ['backend envuelve join/state/answer', ['englishLabLiveJoinRoom','englishLabLiveGetPlayerState','englishLabLiveSubmitAnswer'].every(name => backend.includes(name + ' = function'))],
  ['campus rompe caché CS21A144', campus.includes('english_lab_free_access_cs21a66.js?v=F98.4Z6CS21A144')],
];

const failed = checks.filter(([, ok]) => !ok);
checks.forEach(([label, ok]) => console.log(`${ok ? 'OK' : 'FAIL'}  ${label}`));
if (failed.length) {
  console.error(`\n${failed.length} comprobación(es) fallaron.`);
  process.exit(1);
}
console.log(`\n${checks.length} comprobaciones aprobadas.`);
