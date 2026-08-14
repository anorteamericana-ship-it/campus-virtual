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
assert.equal((sidebar.match(duplicateBlock) || []).length, 0, 'No debe quedar el bloque doble English LAB + Live para docente/estudiante matriculado.');

assert.ok(
  sidebar.includes("{ id: 'academia_play', label: 'English LAB', icon: 'english_lab', badge: 'Gratis' }"),
  'El prospecto gratis debe conservar su acceso English LAB legacy/controlado.'
);
assert.ok(
  sidebar.includes("{ id: 'academia_play', label: 'English LAB', icon: 'english_lab', badge: 'Piloto' }"),
  'Administración debe conservar por ahora la ruta legacy para catálogo/compatibilidad.'
);

// CS207 protege el destino canónico, no el copy interno del title. CS208 normaliza
// ese title de "English LAB Live" a "English LAB" sin cambiar componente ni loader.
const studentLiveRoute = /english_lab_live:\s*<LazyRoute\s+title="English LAB(?: Live)?"\s+component="EnglishLabLiveStudentView"\s+files=\{F96_LAZY\.english_lab_live\}/;
const teacherLiveRoute = /english_lab_live:\s*<LazyRoute\s+title="English LAB(?: Live)?"\s+component="EnglishLabLiveTeacherView"\s+files=\{F96_LAZY\.english_lab_live\}/;
assert.match(app, studentLiveRoute, 'La ruta Live estudiantil debe seguir montando EnglishLabLiveStudentView con el loader Live.');
assert.match(app, teacherLiveRoute, 'La ruta Live docente debe seguir montando EnglishLabLiveTeacherView con el loader Live.');

// Las rutas legacy ocultas pueden converger por rol en cortes posteriores. Lo que
// CS207 debe preservar es que AcademiaPlay siga disponible donde aún corresponde
// (prospecto gratis / administración), no un número fijo de aliases directos.
assert.ok(app.includes('component="AcademiaPlayView"'), 'AcademiaPlayView debe seguir disponible para compatibilidad controlada.');
assert.ok(app.includes("!['dashboard','academia_play'].includes(active)"), 'El guard del prospecto gratis debe seguir cerrado a dashboard/academia_play.');
assert.ok(app.includes('english_lab_live: F96_ENGLISH_LAB_LIVE_CS21A193'), 'La entrada canónica debe conservar el loader Live compartido.');

const result = {
  verdict: 'PASS_CS21A207_ENGLISH_LAB_CANONICAL_NAVIGATION',
  contract_revision: 'CS21A208-ROUTE-TITLE-TOLERANT',
  visible_navigation: {
    enrolled_student: ['english_lab_live'],
    teacher: ['english_lab_live'],
    free_prospect: ['academia_play'],
    admin_legacy_catalog_preserved: true,
  },
  visible_label: 'English LAB',
  duplicate_visible_navigation: false,
  canonical_live_components_preserved: true,
  legacy_surface_available_where_authorized: true,
  apps_script_change: false,
};
console.log(JSON.stringify(result, null, 2));
