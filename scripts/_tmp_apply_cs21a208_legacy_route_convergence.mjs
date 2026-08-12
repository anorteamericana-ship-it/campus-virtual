#!/usr/bin/env node
import fs from 'node:fs';

const path = 'src/app.jsx';
const original = fs.readFileSync(path, 'utf8');

const studentOld = `      academia_play: <LazyRoute title="English LAB" component="AcademiaPlayView" files={F96_LAZY.academia_play} usuario={usuario} rolReal={rolReal} role={role} onNavigate={navigateTo} />,
      english_lab_live: <LazyRoute title="English LAB Live" component="EnglishLabLiveStudentView" files={F96_LAZY.english_lab_live} usuario={usuario} rolReal={rolReal} role={role} onNavigate={navigateTo} />,`;
const studentNew = `      academia_play: esProspectoGratis
        ? <LazyRoute title="English LAB" component="AcademiaPlayView" files={F96_LAZY.academia_play} usuario={usuario} rolReal={rolReal} role={role} onNavigate={navigateTo} />
        : <LazyRoute title="English LAB" component="EnglishLabLiveStudentView" files={F96_LAZY.english_lab_live} usuario={usuario} rolReal={rolReal} role={role} onNavigate={navigateTo} />,
      english_lab_live: <LazyRoute title="English LAB" component="EnglishLabLiveStudentView" files={F96_LAZY.english_lab_live} usuario={usuario} rolReal={rolReal} role={role} onNavigate={navigateTo} />,`;

const teacherOld = `      academia_play: <LazyRoute title="English LAB" component="AcademiaPlayView" files={F96_LAZY.academia_play} usuario={usuario} rolReal={rolReal} role={role} onNavigate={navigateTo} />,
      english_lab_live: <LazyRoute title="English LAB Live" component="EnglishLabLiveTeacherView" files={F96_LAZY.english_lab_live} usuario={usuario} rolReal={rolReal} role={role} onNavigate={navigateTo} />,`;
const teacherNew = `      academia_play: <LazyRoute title="English LAB" component="EnglishLabLiveTeacherView" files={F96_LAZY.english_lab_live} usuario={usuario} rolReal={rolReal} role={role} onNavigate={navigateTo} />,
      english_lab_live: <LazyRoute title="English LAB" component="EnglishLabLiveTeacherView" files={F96_LAZY.english_lab_live} usuario={usuario} rolReal={rolReal} role={role} onNavigate={navigateTo} />,`;

function replaceExactlyOnce(source, oldText, newText, label) {
  const count = source.split(oldText).length - 1;
  if (count !== 1) throw new Error(`CS21A208 esperaba exactamente 1 bloque ${label}; encontró ${count}.`);
  return source.replace(oldText, newText);
}

let updated = replaceExactlyOnce(original, studentOld, studentNew, 'student legacy/live');
updated = replaceExactlyOnce(updated, teacherOld, teacherNew, 'teacher legacy/live');

if (!updated.includes("!['dashboard','academia_play'].includes(active)")) {
  throw new Error('CS21A208 debe preservar el guard cerrado del prospecto gratis.');
}
if (!updated.includes(`academia_play: esProspectoGratis
        ? <LazyRoute title="English LAB" component="AcademiaPlayView" files={F96_LAZY.academia_play}`)) {
  throw new Error('CS21A208 debe preservar AcademiaPlayView únicamente en la rama gratis del estudiante.');
}
const adminLegacy = `academia_play: <LazyRoute title="English LAB" component="AcademiaPlayView" files={F96_LAZY.academia_play} usuario={usuario} rolReal={rolReal} role={role} onNavigate={navigateTo} />`;
const adminLegacyCount = updated.split(adminLegacy).length - 1;
if (adminLegacyCount !== 1) {
  throw new Error(`CS21A208 esperaba 1 ruta legacy administrativa AcademiaPlayView; encontró ${adminLegacyCount}.`);
}
if (!updated.includes(`academia_play: <LazyRoute title="English LAB" component="EnglishLabLiveTeacherView" files={F96_LAZY.english_lab_live}`)) {
  throw new Error('CS21A208 debe converger la ruta legacy docente hacia Live.');
}
if (updated.includes('english_lab_live: <LazyRoute title="English LAB Live"')) {
  throw new Error('CS21A208 no debe conservar el título histórico English LAB Live en rutas canónicas.');
}

fs.writeFileSync(path, updated);
console.log(JSON.stringify({
  ok: true,
  student_legacy_route: 'FREE_ONLY',
  enrolled_student_legacy_route: 'LIVE',
  teacher_legacy_route: 'LIVE',
  admin_legacy_route: 'PRESERVED',
  free_guard_preserved: true
}, null, 2));
