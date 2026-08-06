#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const cleanupPath = path.join(root, 'src', 'english_lab_visual_cleanup_cs21a182.js');
const runtimePath = path.join(root, 'src', 'runtime_config.js');
const ux181Path = path.join(root, 'src', 'english_lab_ux_cs21a181.js');
const livePath = path.join(root, 'src', 'english_lab_live.jsx');
const cleanup = fs.readFileSync(cleanupPath, 'utf8');
const runtime = fs.readFileSync(runtimePath, 'utf8');
const ux181 = fs.readFileSync(ux181Path, 'utf8');
const live = fs.readFileSync(livePath, 'utf8');
const failures = [];

function check(condition, message) {
  if (condition) console.log(`CS21A182 OK: ${message}`);
  else {
    failures.push(message);
    console.error(`CS21A182 FAIL: ${message}`);
  }
}

try {
  new Function(cleanup);
  check(true, 'la capa visual compila como JavaScript plano');
} catch (error) {
  check(false, `la capa visual compila: ${error.message}`);
}

try {
  new Function(runtime);
  check(true, 'runtime_config conserva sintaxis válida');
} catch (error) {
  check(false, `runtime_config conserva sintaxis válida: ${error.message}`);
}

check(cleanup.includes('F98.4-Z6-CS21A182'), 'la capa está versionada CS21A182');
check(cleanup.includes('routeLooksRelevant'), 'la limpieza se limita a rutas English LAB');
check(cleanup.includes('.elive-main-grid,.elive-join-grid,.aplay-shell,.ap-view,.ap-practice-wrap,.ap-live-room'), 'cubre creación, sala activa, práctica individual y demo heredada');
check(cleanup.includes("hideClosestCardByLabel(root, 'Banco pedagógico'"), 'oculta el diagnóstico interno del banco docente Live');
check(cleanup.includes('hideMessagePreview(root, audit)'), 'retira la vista previa redundante del mensaje');
check(cleanup.includes('Controlá la actividad y el avance del grupo.'), 'simplifica el encabezado docente Live');
check(cleanup.includes('Creá una sala, compartí el código y dirigí la actividad en vivo.'), 'simplifica la vista de creación Live');
check(cleanup.includes('Seguimiento por juegos completados al 100%.'), 'elimina la nota repetida del mapa de progreso');
check(cleanup.includes('English LAB todavía no está habilitado para este usuario.'), 'limpia el mensaje de acceso restringido');
check(cleanup.includes('Juegos por unidad'), 'reemplaza lenguaje interno de banco curricular');
check(cleanup.includes('Estamos preparando el contenido de esta actividad.'), 'oculta el nombre técnico ACADEMIA_PLAY_BANK al estudiante');
check(cleanup.includes('.ap-live-preview,.ap-stats-grid,.ap-medal-shelf,.ap-bank-unit-summary'), 'retira controles, sincronización y resúmenes internos del estudiante');
check(cleanup.includes('/Próximamente|Live Trivia/'), 'retira tarjetas sin función y la sala demo ficticia');
check(cleanup.includes('Las actividades en vivo están en English LAB Live'), 'sustituye la sala demo heredada por una guía segura');
check(cleanup.includes('.ap-card-tags') && cleanup.includes('.ap-area-stats'), 'reduce metadatos repetidos de tarjetas y áreas');
check(cleanup.includes('@media(max-width:760px)'), 'incluye ajuste móvil explícito');
check(!cleanup.includes('[data-cs21a182-clean="true"] button{width:100%'), 'no fuerza ancho completo sobre fichas o tarjetas de juego');
check(cleanup.includes('MutationObserver'), 'reaplica la limpieza tras renders diferidos');
check(cleanup.includes('getLastAudit'), 'expone evidencia diagnóstica sin mostrarla al usuario');
check(cleanup.includes('studentInternal:0') && cleanup.includes('demoCards:0'), 'audita por separado paneles internos y demos');
check(cleanup.includes('replaceLegacyTeacherDemo'), 'retira la maqueta docente del English LAB individual');
check(cleanup.includes('La sala docente está en English LAB Live'), 'explica al docente dónde crear salas reales');
check(cleanup.includes('href="#english_lab_live"'), 'ofrece acceso directo al módulo Live real');
check(cleanup.includes('enforceAdminMode'), 'evita que administración navegue a vistas demo de estudiante o docente');
check(cleanup.includes('Banco de juegos') && cleanup.includes('Seguimiento de práctica y participación.'), 'humaniza el panel administrativo sin quitar funciones');
check(cleanup.includes('teacherDemo:0') && cleanup.includes('adminModes:0'), 'audita maqueta docente y selector administrativo');
check(!cleanup.includes('PLAY-4821') && !cleanup.includes('Camila Otoya'), 'la capa no reproduce códigos ni personas ficticias');
check(!cleanup.includes('global.fetch =') && !cleanup.includes('window.fetch ='), 'no intercepta solicitudes');
check(!cleanup.includes('APPS_SCRIPT_URL') && !cleanup.includes('englishLabAccessStatus'), 'no modifica backend ni acceso');
check(runtime.includes('english_lab_ux_cs21a181.js?v=F98.4Z6CS21A181'), 'mantiene la capa CS21A181');
check(runtime.includes('english_lab_visual_cleanup_cs21a182.js?v=F98.4Z6CS21A182'), 'runtime carga CS21A182 después de CS21A181');
check(ux181.includes('custom_pairs:parsed.pairs'), 'CS21A181 conserva parejas editables');
check(live.includes("const VERSION = 'F98.4-Z6-CS21A180'"), 'el motor Live CS21A180 permanece intacto');
check(!cleanup.includes('QA-STU-') && !cleanup.includes('120180140'), 'no contiene excepciones por usuario');

if (failures.length) {
  console.error(JSON.stringify({ok:false, version:'CS21A182', failures}, null, 2));
  process.exit(1);
}
console.log(JSON.stringify({ok:true, version:'CS21A182', checks:36}));
