# Biblia operativa · Campus Virtual · CS21A143

Fecha de corte: 2026-07-25  
Zona horaria: `America/Costa_Rica`  
Repositorio: `anorteamericana-ship-it/campus-virtual`

## 1. Propósito

Esta es la referencia operativa vigente para continuar el Campus Virtual después de CS21A142. Consolida el estado verificable del frontend, los límites del backend observado, la cobertura QA y los riesgos pendientes.

No reemplaza los archivos vigentes de `main`. Cuando exista una contradicción, prevalecen el código y los puntos de carga reales del commit revisado.

## 2. Baseline verificado

- Rama productiva: `main`.
- Commit: `67108928e953fbf044dbcd916dc34a5dd5f1e570`.
- Mensaje: `CS21A142 corrige Ver en Libro para la lección docente (#26)`.
- No se encontraron commits posteriores al preparar esta biblia.

## 3. Estados de evidencia

Toda afirmación debe etiquetarse mentalmente con uno de estos niveles:

1. **Presente en código:** existe en `main`.
2. **Validado estáticamente:** sintaxis, referencias o invariantes comprobadas sin navegador.
3. **Validado sintéticamente:** servidor local, sesiones simuladas y backend bloqueado o sustituido.
4. **Validado autenticado:** sesión real contra un backend autorizado.
5. **Backend desplegado confirmado:** la URL activa fue comparada y verificada.
6. **Escritura persistida:** la operación se confirmó una sola vez y la lectura posterior demuestra persistencia.

No convertir un nivel de evidencia en otro por inferencia.

## 4. Fuentes de verdad

Orden obligatorio:

1. `main` vigente.
2. `campus.html`.
3. `src/app.jsx` y `F96_LAZY`.
4. imports, cargadores, eventos, wrappers y globals de `window`.
5. workflows activos.
6. backend desplegado verificado.
7. `BACKEND_OBSERVADO_CS21A131.json`, solo como copia observada.
8. esta biblia y el handoff CS21A143.
9. documentos históricos.

## 5. Puntos de carga relevantes

`campus.html` publica:

- `src/resources_panel_state_cs21a65.js?v=F98.4Z6CS21A142`
- `src/att77_bridge.js?v=F98.4Z6CS21A142`
- `src/teacher_cs21a_planeamiento_grouped.jsx?v=F98.4Z6CS21A140`
- `src/app.jsx?v=F98.4Z6CS21A142`

`src/app.jsx` publica mediante `F96_LAZY`:

- `src/teacher_views.jsx?v=F98.4Z6CS21A142`
- `src/admin_students.jsx?v=F98.4Z6CS21A140`

Nunca retirar un archivo sin revisar también `anLazyCampus`, imports, workflows, eventos y sustituciones posteriores del mismo componente.

## 6. Estado funcional por rol

### 6.1 Estudiante

Contratos que deben preservarse:

- Calendario académico muestra únicamente Cronograma.
- Tareas aparece debajo de Evaluaciones.
- Tareas continúa como placeholder honesto sin registros ficticios.
- Libros y Audios permite SB y WB; nunca TB.
- Planeamiento consume PDFs estudiantiles.
- Estados que habilitan contenido: `CA`, `APR`, `CNV`.
- Acceso acumulativo:
  - B1 → B1.
  - B2 → B1 + B2.
  - I1 → B1 + B2 + I1.
  - I2 → B1 + B2 + I1 + I2.
- Nunca habilitar niveles futuros.
- Club I CAN permanece parcial mientras falten endpoints del backend.

Pendientes mínimos antes del piloto:

- sesión real por nivel;
- recarga directa y navegación atrás;
- apertura y descarga de PDFs con permisos reales de Drive;
- audios por unidad;
- evaluaciones y calendario con datos controlados;
- prueba móvil 390×844.

### 6.2 Docente

Contratos que deben preservarse:

- Mis Grupos y Cronograma usan respaldo de fecha `America/Costa_Rica`.
- existe protección frontend contra doble envío en una pestaña;
- Libros y Audios permite SB, TB y WB;
- U01–U16 permanecen disponibles;
- Planeamiento muestra 32 lecciones en dos filas de 16;
- Ver en Libro calcula nivel y unidad desde la lección.

Pendientes críticos:

- iniciar clase;
- pasar lista;
- cerrar clase;
- registrar notas;
- leer persistencia posterior;
- probar dos pestañas o dispositivos;
- confirmar que Ver en Libro libera la navegación después del salto.

### 6.3 Superadmin

Superficies operativas sensibles:

- Panel Maestro.
- Consulta individual.
- Calendario académico.
- Estudiantes.
- Matrículas.
- Exámenes.
- CONAPE y Cobranza.
- Importar banco.
- Aplicar pago.
- Permisos y roles.

Superficies que continúan marcadas como `Próximamente`:

- Finanzas.
- Docentes.
- Horas docentes.
- Club I CAN administrativo.
- Configuración.

No presentarlas como terminadas. No eliminarlas sin trazar referencias y rutas antiguas.

## 7. Backend observado

Copia observada en Drive el 2026-07-18:

- encabezado `F98.4-Z6-CS21A79`;
- 52.495 líneas;
- SHA-256 `f6aa22cbd42c47990a5d72c5cf8d6e5af6bc72ebca356c23aa1058968088e487`;
- `deployment_confirmed: false`.

Presentes en esa copia:

- `getEstudiante`
- `getMaterialLeccion`
- `getBibliotecaNivelEstudiante`
- `getAudioPistaEstudiante`
- `getICANEstudiante`
- `getEvaluacionesEstudiante`
- `getSesionClaseEstudiante`

Ausentes en esa copia:

- `getAccesoContenidoEstudiante`
- `getICANPortalEstudiante`
- `reservarICANSesionEstudiante`
- `cancelarReservaICANEstudiante`
- `getICANDocenteReservas`

No afirmar que esta lista representa el deployment activo sin comprobar la URL actual.

## 8. QA y staging

### QA virtual CS21A137

- corre cada seis horas;
- usa servidor local y sesiones sintéticas;
- prueba escritorio 1440×900 y móvil 390×844;
- conserva artefactos 14 días;
- no corrige ni fusiona automáticamente.

Último veredicto observado sobre `67108928...`:

- **APTO CON RESERVAS**;
- P0: 0;
- P1: 0;
- P2: 6;
- P3: 3.

### QA real de staging CS21A138

El diseño de staging existe, pero sigue pendiente comprobar la instalación final del Apps Script independiente y el secreto `QA_STAGING_APPS_SCRIPT_URL`.

Las escrituras están bloqueadas por defecto. Nunca habilitarlas si la URL coincide con producción o si el backend no demuestra que usa las copias QA autorizadas.

## 9. Inventario consolidado de riesgos P2

### P2-01 · Versiones distintas de cronograma en `F96_LAZY`

- `src/cronograma_todos.jsx` aparece con versiones diferentes según la superficie.
- `src/cronograma_grupo.jsx` aparece con versiones diferentes según la superficie.

Riesgo: caché o comportamiento diferente entre rutas.

### P2-02 · Endpoints Club I CAN ausentes en backend observado

- `getICANPortalEstudiante`.
- `getICANDocenteReservas`.

Riesgo: interfaz disponible con contrato backend incompleto.

### P2-03 · Fechas potencialmente basadas en UTC

El auditor automático detecta patrones de UTC en múltiples módulos. Cada caso debe revisarse antes de tocar lógica de “hoy”, vencimientos, calendario o corte de operaciones.

### P2-04 · Múltiples sustituciones de `MaterialesView`

Doce módulos pueden participar en sustituciones o wrappers de la misma vista. No simplificar por nombre de archivo.

### P2-05 · Último desembolso puede quedar obsoleto en la misma vista

`useUltimosDesembolsosConape()` se monta una vez, mientras la radiografía usa `refreshKey`.

Prueba requerida: sincronizar o actualizar lista y confirmar que la fecha se renueva sin recargar la ruta completa.

### P2-06 · Proyección manual no revalida el nivel origen

El flujo consulta el expediente fresco, pero valida solo el nivel destino. Debe confirmar que el nivel actual sigue en `CA` inmediatamente antes de `actualizarEstatus`.

Prueba requerida: dos pestañas o dos sesiones con cambio concurrente del estado origen.

### P2-07 · Proyección oculta sincronización CONAPE pendiente

`resp.ok` puede coexistir con `conape_sync === false`.

Prueba requerida: éxito académico local con sincronización CONAPE simulada como pendiente; la UI debe mostrar éxito parcial y ruta de reintento.

### P2-08 · Ver en Libro puede repetir el salto

El script contextual busca `data-active="true"` o `aria-current="page"`, pero `UnitButtons` solo estiliza el botón activo.

Prueba requerida: abrir una lección, cambiar manualmente a otra unidad y generar mutaciones/lazy loads durante más de un ciclo; no debe regresar a la unidad original.

## 10. Riesgos P3 y deuda conocida

- errores potencialmente silenciados por `catch` vacíos o respuestas descartadas;
- módulos administrativos todavía no conectados;
- al menos una pantalla sintética sin etiqueta diagnóstica;
- abundancia de wrappers históricos que aumenta el costo de limpieza.

P3 no significa irrelevante. Puede ocultar P2 cuando impide observar un error real.

## 11. Reglas para cambios funcionales

- Una rama por causa raíz o conjunto inseparable.
- No mezclar documentación, corrección funcional y despliegue de backend en el mismo PR.
- Actualizar versiones de caché en todos los puntos de carga relevantes.
- Agregar prueba que falle antes de la corrección.
- Probar reintento, doble clic, dos pestañas y respuesta tardía.
- Validar permisos en backend, no solo visibilidad frontend.
- No usar producción para pagos, notas, asistencia o CONAPE.
- Revisar comentarios automáticos antes de fusionar.

## 12. Criterio de piloto

El Campus no debe declararse listo para piloto completo hasta cumplir:

- backend desplegado identificado;
- cuentas controladas de estudiante, docente y superadmin;
- permisos reales de Drive;
- ausencia de P0/P1;
- P2 críticos corregidos o aceptados con mitigación explícita;
- operaciones críticas probadas en staging;
- persistencia verificada;
- prueba móvil y escritorio;
- plan de reversión y soporte del piloto.

Veredicto vigente:

- revisión sintética: **APTO CON RESERVAS**;
- piloto autenticado completo: **INDETERMINADO**.

## 13. Documentos que deben leerse primero

1. `AGENTS.md`.
2. `00_DOCUMENTACION/HANDOFF_CHAT_CS21A143_2026-07-25.md`.
3. `00_DOCUMENTACION/BIBLIA_OPERATIVA_CS21A143.md`.
4. `00_DOCUMENTACION/SKILL_CAMPUS_VIRTUAL_CS21A143.md`.
5. `00_DOCUMENTACION/MATRIZ_ENTREGA_ROLES_CS21A131.md`.
6. `00_DOCUMENTACION/EQUIPO_VIRTUAL_QA_CS21A137.md`.
7. `00_DOCUMENTACION/QA_REAL_STAGING_CS21A138.md`.
8. `00_DOCUMENTACION/BACKEND_OBSERVADO_CS21A131.json`.

Los documentos anteriores a CS21A143 se conservan para historia y detalles específicos, pero no definen por sí solos el baseline actual.
