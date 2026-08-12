#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';

const app = fs.readFileSync('src/app.jsx', 'utf8');
const sidebar = fs.readFileSync('src/sidebar.jsx', 'utf8');

assert.ok(
  app.includes(`academia_play: esProspectoGratis
        ? <LazyRoute title="English LAB" component="AcademiaPlayView" files={F96_LAZY.academia_play}`),
  'La ruta legacy estudiantil debe conservar AcademiaPlayView únicamente para prospectos gratis.'
);
assert.ok(
  app.includes(`: <LazyRoute title="English LAB" component="EnglishLabLiveStudentView" files={F96_LAZY.english_lab_live}`),
  'El estudiante matriculado que entra por academia_play debe converger a EnglishLabLiveStudentView.'
);
assert.ok(
  app.includes(`academia_play: <LazyRoute title="English LAB" component="EnglishLabLiveTeacherView" files={F96_LAZY.english_lab_live}`),
  'La ruta legacy docente debe converger a EnglishLabLiveTeacherView.'
);

const adminLegacy = `academia_play: <LazyRoute title="English LAB" component="AcademiaPlayView" files={F96_LAZY.academia_play} usuario={usuario} rolReal={rolReal} role={role} onNavigate={navigateTo} />`;
assert.equal(
  app.split(adminLegacy).length - 1,
  1,
  'Administración debe conservar exactamente una ruta legacy AcademiaPlayView.'
);

assert.equal(
  (app.match(/english_lab_live: <LazyRoute title="English LAB Live" component="EnglishLabLive/g) || []).length,
  0,
  'Las rutas canónicas ya no deben publicar el título histórico English LAB Live.'
);
assert.ok(
  (app.match(/english_lab_live: <LazyRoute title="English LAB" component="EnglishLabLive/g) || []).length >= 2,
  'Las rutas canónicas docente/estudiante deben titularse English LAB.'
);

assert.ok(app.includes("!['dashboard','academia_play'].includes(active)"), 'El guard del prospecto gratis debe seguir cerrado.');
assert.ok(app.includes("academia_play: ['academia_play', null], play: ['academia_play', null]"), 'Los hashes legacy de estudiante deben conservar compatibilidad de entrada.');
assert.ok(app.includes("academia_play: ['src/academia_play.jsx?v=F98.4Z6CS12_PLAY22']"), 'El catálogo legacy debe seguir cargable para prospectos/admin.');
assert.ok(app.includes('english_lab_live: F96_ENGLISH_LAB_LIVE_CS21A193'), 'La convergencia debe seguir usando el loader canónico Live.');

assert.equal(
  (sidebar.match(/\{ id: 'english_lab_live', label: 'English LAB', icon: 'english_lab', badge: 'Nuevo' \}/g) || []).length,
  2,
  'CS208 debe preservar las dos entradas visibles canónicas creadas en CS207.'
);
assert.ok(sidebar.includes("{ id: 'academia_play', label: 'English LAB', icon: 'english_lab', badge: 'Gratis' }"), 'El menú gratis debe seguir apuntando a academia_play.');

console.log(JSON.stringify({
  verdict: 'PASS_CS21A208_ENGLISH_LAB_LEGACY_ROUTE_CONVERGENCE',
  old_hash_behavior: {
    free_student: 'ACADEMIA_PLAY',
    enrolled_student: 'ENGLISH_LAB_LIVE',
    teacher: 'ENGLISH_LAB_LIVE',
    admin: 'ACADEMIA_PLAY'
  },
  canonical_visible_label: 'English LAB',
  legacy_hashes_preserved: true,
  academia_play_deleted: false,
  apps_script_change: false
}, null, 2));
