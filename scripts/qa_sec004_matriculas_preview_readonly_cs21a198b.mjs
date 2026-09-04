import fs from 'node:fs';

const src = fs.readFileSync('src/matriculas.jsx', 'utf8');
function must(cond, msg) { if (!cond) throw new Error(msg); }

must(src.includes("const MAT_DEMO = (() => {"), 'Debe preservarse MAT_DEMO explícito.');
must(src.includes("q.get('demo') === '1' || !!q.get('preview')"), 'Debe preservarse preview por URL.');

// Defensa dentro del wizard: preview no consulta grupos reales y no puede confirmar POST.
must(src.includes("if (MAT_DEMO) { setGrupos([]); setCargandoGrupos(false); return; }"), 'Wizard demo debe omitir getGruposDisponibles real.');
must(src.includes("if (MAT_DEMO) { setErrGuardar('Modo demostración: esta vista es solo lectura. No se enviaron cambios.'); return; }"), 'confirmar() debe fallar cerrado en demo.');

// Frontera de acciones de la tabla: todos los identificadores demo deben quedar fuera de modales operativos.
must(src.includes("const previewReadOnly = React.useCallback"), 'Debe existir frontera previewReadOnly.');
for (const setter of ['setVerProsp', 'setProformaProsp', 'setConapeProsp', 'setFichaProsp', 'setGenProsp']) {
  must(src.includes(`MAT_DEMO ? previewReadOnly() : ${setter}`), `Debe bloquearse ${setter} en demo.`);
}
must(src.includes("if (MAT_DEMO) { previewReadOnly(); return; }"), 'handleAbrir debe bloquear wizard en demo.');

// Defensa de montaje: estados residuales no pueden montar componentes operativos en preview.
for (const state of ['showWizard', 'fichaProsp', 'verProsp', 'proformaProsp', 'conapeProsp', 'genProsp']) {
  must(src.includes(`${state} && !MAT_DEMO && (`), `El montaje ${state} debe requerir !MAT_DEMO.`);
}

// Producción preservada.
for (const needle of ["?fn=getProspectos", "?fn=getGruposDisponibles", "?fn=actualizarEstatus", 'MatProformasModal', 'MatConapeModal', 'MatGenerarMatriculaModal']) {
  must(src.includes(needle), `Debe preservarse ${needle}.`);
}

console.log('CS21A198B SEC004 MATRICULAS PREVIEW READONLY: PASS');
console.log('DEMO_REAL_BACKEND_READS_FROM_WIZARD=BLOCKED');
console.log('DEMO_OPERATIONAL_MODALS=BLOCKED');
console.log('DEMO_STATUS_WRITE=BLOCKED');
console.log('PRODUCTION_ENDPOINTS=PRESERVED');
