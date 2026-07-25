# Traspaso técnico · Campus Virtual · CS21A143

Fecha de corte: 25 de julio de 2026 (`America/Costa_Rica`)  
Repositorio: `anorteamericana-ship-it/campus-virtual`  
Rama productiva: `main`  
Commit confirmado: `67108928e953fbf044dbcd916dc34a5dd5f1e570`  
Mensaje: `CS21A142 corrige Ver en Libro para la lección docente (#26)`

## 1. Estado verificado

Al preparar este documento no se encontraron commits posteriores al SHA indicado. La descripción de continuidad recibida coincide con el encabezado real de `main`.

Este documento no declara que el Campus completo esté listo para producción. Distingue entre:

1. código presente en `main`;
2. validación estática o sintética;
3. prueba autenticada;
4. backend observado en Drive;
5. backend realmente desplegado;
6. escritura confirmada en staging o producción.

## 2. Fuente de verdad

Orden obligatorio para tomar decisiones:

1. archivos vigentes de `main` en el commit que se esté revisando;
2. `AGENTS.md`;
3. `00_DOCUMENTACION/BIBLIA_OPERATIVA_CS21A143.md`;
4. `00_DOCUMENTACION/SKILL_CAMPUS_VIRTUAL_CS21A143.md`;
5. matriz de entrega, informes QA y backend observado;
6. documentos históricos, únicamente como contexto.

Ningún documento CS21A60, CS21A90, CS21A99, CS21A106 o CS21A107 prevalece sobre los archivos actuales.

## 3. Alcance de la rama documental CS21A143

La rama documental crea o actualiza solamente:

- `00_DOCUMENTACION/HANDOFF_CHAT_CS21A143_2026-07-25.md`;
- `00_DOCUMENTACION/BIBLIA_OPERATIVA_CS21A143.md`;
- `00_DOCUMENTACION/SKILL_CAMPUS_VIRTUAL_CS21A143.md`;
- `README.md`;
- `00_DOCUMENTACION/README_CONTINUIDAD.md`.

No modifica frontend, backend, Apps Script, workflows, hojas, datos, credenciales, WordPress ni despliegues.

## 4. Comprobaciones realizadas sin escribir datos

- SHA real de `main` y últimos commits.
- Reglas de `AGENTS.md`.
- Puntos de carga en `campus.html`.
- mapa `F96_LAZY` en `src/app.jsx`.
- documentación y workflows de auditoría, QA y staging.
- informe automático vigente del supervisor en el issue #21.
- comentarios automáticos no resueltos de los PR #23, #24 y #26.
- lectura estática de los archivos implicados en esos comentarios.

No se usaron credenciales ni se invocaron endpoints de escritura.

## 5. Cambios productivos recientes confirmados

### PR #23 · Último desembolso CONAPE

- Superadmin → Estudiantes muestra la fecha más reciente detectada.
- Reutiliza `getSuperAdminMasterDashboard`.
- cruza movimientos por código o cédula;
- cambio frontend en `src/admin_students.jsx`;
- no modificó Apps Script.

### PR #24 · Proyección manual

- botón `+` junto a Cursando;
- permite crear únicamente el siguiente nivel como `PE`;
- consulta `getEstudiante` antes de escribir;
- reutiliza `actualizarEstatus`;
- no modificó Apps Script.

### PR #25 · Planeamiento docente

- niveles B1, B2, I1 e I2 arriba;
- 32 lecciones en dos filas de 16;
- PDF debajo;
- conserva 128 documentos docentes;
- no modificó Apps Script.

### PR #26 · Ver en Libro

- publica nivel, lección y riel como metadatos;
- calcula la unidad correspondiente;
- publica cargas CS21A142;
- no modificó Apps Script.

La afirmación de navegación libre posterior al salto tiene una reserva P2 pendiente descrita en la sección 10.

## 6. Puntos de carga vigentes

`campus.html` publica, entre otros:

- `src/resources_panel_state_cs21a65.js?v=F98.4Z6CS21A142`;
- `src/att77_bridge.js?v=F98.4Z6CS21A142`;
- `src/teacher_cs21a_planeamiento_grouped.jsx?v=F98.4Z6CS21A140`;
- `src/app.jsx?v=F98.4Z6CS21A142`.

`src/app.jsx` publica:

- `src/teacher_views.jsx?v=F98.4Z6CS21A142`;
- `src/admin_students.jsx?v=F98.4Z6CS21A140`.

Antes de eliminar o sustituir un archivo se deben revisar `campus.html`, `F96_LAZY`, imports, workflows, globals de `window` y wrappers que sustituyen componentes después de cargarlos.

## 7. Estado por rol

### Estudiante

- Calendario académico: solamente Cronograma.
- Tareas: opción independiente debajo de Evaluaciones; sigue siendo placeholder sin datos ficticios.
- Libros y Audios: SB y WB; nunca TB.
- Planeamiento: PDFs estudiantiles, no docentes.
- Acceso acumulativo autorizado por estados `CA`, `APR` y `CNV`.
- Club I CAN: parcial mientras falten endpoints del backend.

El acceso acumulativo esperado es:

- B1 → B1;
- B2 → B1 + B2;
- I1 → B1 + B2 + I1;
- I2 → B1 + B2 + I1 + I2.

No habilitar niveles futuros.

### Docente

- Mis Grupos y Cronograma tienen guardas de fecha para `America/Costa_Rica`.
- existe protección frontend contra doble envío en una pestaña;
- Libros y Audios permite SB, TB y WB;
- deben conservarse U01–U16;
- Planeamiento muestra 32 lecciones;
- falta QA autenticado completo de iniciar clase, asistencia, cierre, notas y persistencia.

### Superadmin

Continúan como `Próximamente`:

- Finanzas;
- Docentes;
- Horas docentes;
- Club I CAN administrativo;
- Configuración.

No presentarlas como terminadas ni eliminarlas sin trazar dependencias.

## 8. Backend observado

La copia observada el 18 de julio de 2026 se documenta como:

- encabezado `F98.4-Z6-CS21A79`;
- 52.495 líneas;
- SHA-256 `f6aa22cbd42c47990a5d72c5cf8d6e5af6bc72ebca356c23aa1058968088e487`;
- `deployment_confirmed: false`.

Funciones encontradas:

- `getEstudiante`;
- `getMaterialLeccion`;
- `getBibliotecaNivelEstudiante`;
- `getAudioPistaEstudiante`;
- `getICANEstudiante`;
- `getEvaluacionesEstudiante`;
- `getSesionClaseEstudiante`.

Funciones no encontradas:

- `getAccesoContenidoEstudiante`;
- `getICANPortalEstudiante`;
- `reservarICANSesionEstudiante`;
- `cancelarReservaICANEstudiante`;
- `getICANDocenteReservas`.

Esto no prueba qué versión está desplegada en la aplicación web.

## 9. QA automático vigente

El issue #21, actualizado el 25 de julio de 2026 para el mismo commit, reportó:

- veredicto automático: **APTO CON RESERVAS**;
- P0: 0;
- P1: 0;
- P2: 6;
- P3: 3.

P2 del supervisor automático:

1. versiones diferentes de `src/cronograma_todos.jsx` dentro de `F96_LAZY`;
2. versiones diferentes de `src/cronograma_grupo.jsx` dentro de `F96_LAZY`;
3. `getICANPortalEstudiante` usado por frontend y ausente en backend observado;
4. `getICANDocenteReservas` usado por frontend y ausente en backend observado;
5. lógica de fecha potencialmente basada en UTC en varios módulos;
6. múltiples módulos sustituyendo `MaterialesView`.

El informe sintético no demuestra permisos reales de Drive, backend desplegado, datos productivos ni escrituras desde dos dispositivos.

## 10. Riesgos P2 adicionales confirmados estáticamente

Estos comentarios automáticos permanecían abiertos y el código actual conserva la condición señalada. No se reprodujeron en navegador autenticado durante esta rama documental.

### P2-A · Último desembolso puede quedar obsoleto en la misma pantalla

Archivo: `src/admin_students.jsx`.

`useUltimosDesembolsosConape()` tiene dependencias vacías (`[]`), mientras la radiografía sí se actualiza con `refreshKey`. Después de sincronizar CONAPE o actualizar la lista, la fecha puede mantener el snapshot inicial hasta remontar la vista.

Origen: comentario no resuelto del PR #23.

### P2-B · Proyección manual no revalida el estado origen

Archivo: `src/admin_students.jsx`.

Antes de crear el siguiente nivel como `PE`, la lectura fresca revisa el nivel destino, pero no confirma que el nivel actual continúe en `CA`. Dos pestañas o administradores podrían operar sobre una fila visual obsoleta.

Origen: comentario no resuelto del PR #24.

### P2-C · Proyección puede ocultar sincronización CONAPE pendiente

Archivo: `src/admin_students.jsx`.

Después de `actualizarEstatus`, el flujo verifica `resp.ok`, pero no trata `conape_sync === false` como éxito parcial. Puede anunciar éxito normal aunque las hojas CONAPE queden pendientes.

Origen: comentario no resuelto del PR #24.

### P2-D · Ver en Libro puede repetir el salto contextual

Archivos:

- `src/teacher_lesson_book_link_cs21a142.js`;
- `src/book_unit_starts_cs21a60.jsx`.

El enlace espera `data-active="true"` o `aria-current="page"` para limpiar la solicitud. Los botones U01–U16 solo expresan el estado activo mediante estilos inline. La solicitud puede permanecer hasta cinco minutos y volver a pulsar la unidad original ante mutaciones o cargas diferidas.

Origen: comentario no resuelto del PR #26.

## 11. Documentación histórica desactualizada

- `BIBLIA_DELTA_ACTUAL.md`: CS21A60.
- `PROMPT_CONTINUIDAD.md`: CS21A60.
- `SKILL_CAMPUS_VIRTUAL.md`: remite a CS21A90.
- `SKILL_CAMPUS_VIRTUAL_CS21A90.md`: CS21A90.
- `FUENTE_VERDADERA_CAMPUS_VIRTUAL.md`: CS21A99.
- `FUENTES_DE_VERDAD_Y_CONTRATOS.md`: continuidad CS21A99.
- `README_CONTINUIDAD.md` anterior: CS21A106.
- `README.md` anterior: CS21A107.
- `HANDOFF_CHAT_CS21A126_2026-07-18.md`: corte CS21A126.
- `MATRIZ_ENTREGA_ROLES_CS21A131.md`: base posterior a CS21A130.

Se conservan como historial; no se deben borrar.

## 12. Staging CS21A138

Existe la carpeta privada `QA_STAGING_CAMPUS_2026-07-19` y guardas de staging. Sigue pendiente confirmar:

1. proyecto Apps Script separado;
2. instalación completa del Code.gs de staging;
3. propiedades apuntando a copias QA;
4. despliegue web separado;
5. secreto `QA_STAGING_APPS_SCRIPT_URL`.

Nunca ejecutar pagos, notas o asistencia contra producción.

## 13. Orden recomendado para el piloto

1. resolver o aceptar explícitamente los riesgos P2-A a P2-D;
2. comparar el backend desplegado con la copia observada;
3. completar staging independiente;
4. ejecutar auditor de lógica;
5. ejecutar QA virtual escritorio 1440×900 y móvil 390×844;
6. ejecutar supervisor;
7. probar cuentas controladas por rol;
8. probar lecturas de recursos y permisos;
9. probar escrituras solamente en staging;
10. realizar piloto limitado con plan de reversión.

## 14. Reglas de continuidad

- No inventar datos ni estados.
- No publicar credenciales.
- No modificar `Code.gs` sin solicitud expresa, respaldo y staging.
- No afirmar “funciona” porque compila.
- No afirmar “desplegado” sin comprobar la URL.
- Usar fechas de `America/Costa_Rica`.
- Probar reintentos, doble clic, dos pestañas y respuestas tardías.
- Mantener aislamiento por rol.
- Cambios pequeños, reversibles, rama, PR, CI y revisión humana.
- Revisar comentarios automáticos antes de fusionar.

## 15. Veredicto de continuidad

- **PR documental CS21A143:** evaluable como cambio de bajo riesgo si su diff contiene únicamente documentación y los punteros son coherentes.
- **Campus para piloto completo:** **APTO CON RESERVAS en revisión sintética**, pero todavía no demostrado mediante QA autenticado y backend desplegado.
- **Escrituras reales:** no autorizadas ni verificadas por este handoff.
