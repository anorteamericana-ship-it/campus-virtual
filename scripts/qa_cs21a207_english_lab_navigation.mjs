#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';

const sidebar = fs.readFileSync('src/sidebar.jsx', 'utf8');
const app = fs.readFileSync('src/app.jsx', 'utf8');

const canonicalVisible = /\{ id: 'english_lab_live', label: 'English LAB', icon: 'english_lab', badge: 'Nuevo' \}/g;
const canonicalMatches = sidebar.match(canonicalVisible) || [];
assert.equal(canonicalMatches.length, 2, 'Docente y estudiante matriculado deben tener exactamente una entrada canónica English LAB cada uno.');

assert.equal(
  (sidebar.match(/\{ id: 'english_lab_live', label: 'English LAB Live', icon: 'english_lab'/g) || []).length,
  0,
  'La etiqueta visible English LAB Live no debe coexistir con English LAB en sidebar.'
);

const duplicateBlock = /mostrarAcademiaPlay \? \[\s*\{ id: 'academia_play', label: 'English LAB', icon: 'english_lab', badge: 'Piloto' \},\s*\{ id: 'english_lab_live'/g;
assert.equal((sidebar.match(duplicateBlock) || []).length, 0, 'No debe quedar el bloque doble Academia Play + Live para docente/estudiante matriculado.');

assert.ok(
  sidebar.includes("{ id: 'academia_play', label: 'English LAB', icon: 'english_lab', badge: 'Gratis' }"),
  'El prospecto gratis debe conservar su acceso English LAB legacy/controlado.'
);
assert.ok(
  sidebar.includes("{ id: 'academia_play', label: 'English LAB', icon: 'english_lab', badge: 'Piloto' }"),
  'Administración debe conservar por ahora la ruta legacy para catálogo/compatibilidad.'
);

const studentLiveRoute = 'english_lab_live: <LazyRoute title="English LAB Live" component="EnglishLabLiveStudentView"';
const teacherLiveRoute = 'english_lab_live: <LazyRoute title="English LAB Live" component="EnglishLabLiveTeacherView"';
const studentLegacyRoute = 'academia_play: <LazyRoute title="English LAB" component="AcademiaPlayView"';
assert.ok(app.includes(studentLiveRoute), 'La ruta Live estudiantil debe seguir montando EnglishLabLiveStudentView.');
assert.ok(app.includes(teacherLiveRoute), 'La ruta Live docente debe seguir montando EnglishLabLiveTeacherView.');
assert.ok((app.match(/academia_play: <LazyRoute title="English LAB" component="AcademiaPlayView"/g) || []).length >= 2, 'Las rutas legacy directa deben preservarse para compatibilidad y prospectos.');
assert.ok(app.includes("!['dashboard','academia_play'].includes(active)"), 'El guard del prospecto gratis debe seguir cerrado a dashboard/academia_play.');
assert.ok(app.includes('english_lab_live: F96_ENGLISH_LAB_LIVE_CS21A193'), 'La entrada canónica debe conservar el loader Live compartido.');

const result = {
  verdict: 'PASS_CS21A207_ENGLISH_LAB_CANONICAL_NAVIGATION',
  visible_navigation: {
    enrolled_student: ['english_lab_live'],
    teacher: ['english_lab_live'],
    free_prospect: ['academia_play'],
    admin_legacy_catalog_preserved: true,
  },
  visible_label: 'English LAB',
  duplicate_visible_navigation: false,
  direct_legacy_routes_preserved: true,
  apps_script_change: false,
};
console.log(JSON.stringify(result, null, 2));
