# Traspaso técnico · Campus Virtual · CS21A143

Fecha de corte: 2026-07-25  
Zona horaria operativa: `America/Costa_Rica`  
Repositorio: `anorteamericana-ship-it/campus-virtual`  
Rama productiva: `main`

## 1. Estado verificado en GitHub

Al preparar este documento, `main` continúa exactamente en:

- `67108928e953fbf044dbcd916dc34a5dd5f1e570`
- `CS21A142 corrige Ver en Libro para la lección docente (#26)`

No se encontraron commits posteriores en `main` al momento del corte.

Cambios recientes confirmados por commit:

- PR #23 / CS21A139: muestra el último desembolso CONAPE detectado en Superadmin → Estudiantes, reutilizando datos del Panel Maestro y sin modificar Apps Script.
- PR #24 / CS21A140: permite proyectar manualmente únicamente el nivel siguiente con estado `PE`, con consulta previa del expediente y sin modificar Apps Script.
- PR #25 / CS21A140: reorganiza Planeamiento docente con niveles arriba, 32 lecciones en dos filas de 16 y PDF debajo, sin cambiar los catálogos docentes.
- PR #26 / CS21A142: corrige el salto contextual de `Ver en Libro`; por ejemplo, Lección 29 abre I1 · SB · U15 y después libera la navegación normal del visor.

## 2. Fuente de verdad y precedencia

La fuente de verdad para el frontend es el contenido vigente de `main` en el commit indicado. Ningún documento histórico prevalece sobre los archivos cargados actualmente.

Orden de consulta recomendado:

1. `AGENTS.md`.
2. Este handoff.
3. `00_DOCUMENTACION/BIBLIA_OPERATIVA_CS21A143.md`.
4. `00_DOCUMENTACION/SKILL_CAMPUS_VIRTUAL_CS21A143.md`.
5. `00_DOCUMENTACION/MATRIZ_ENTREGA_ROLES_CS21A131.md`.
6. `00_DOCUMENTACION/EQUIPO_VIRTUAL_QA_CS21A137.md`.
7. `00_DOCUMENTACION/QA_REAL_STAGING_CS21A138.md`.
8. Archivos vigentes de `main` del módulo que se vaya a revisar.
9. Documentos históricos únicamente como contexto de decisiones anteriores.

Deben mantenerse separados estos estados:

- guardado en Git;
- validado estáticamente;
- probado con navegador sintético;
- probado con sesión autenticada;
- backend desplegado verificado;
- escritura real confirmada;
- frontend público verificado.

## 3. Documentación histórica desactualizada

Los siguientes archivos se conservan como historial, pero no describen por sí solos el estado actual:

- `00_DOCUMENTACION/BIBLIA_DELTA_ACTUAL.md`: llega a CS21A60.
- `00_DOCUMENTACION/PROMPT_CONTINUIDAD.md`: llega a CS21A60.
- `00_DOCUMENTACION/SKILL_CAMPUS_VIRTUAL_CS21A90.md`: llega a CS21A90.
- `00_DOCUMENTACION/FUENTE_VERDADERA_CAMPUS_VIRTUAL.md`: referencia CS21A99.
- `00_DOCUMENTACION/FUENTES_DE_VERDAD_Y_CONTRATOS.md`: resume contratos alrededor de CS21A99.
- `00_DOCUMENTACION/README_CONTINUIDAD.md`: antes de este corte apuntaba a CS21A106.
- `README.md`: antes de este corte apuntaba a CS21A107.

No deben borrarse. Cuando exista contradicción, prevalecen `main`, `AGENTS.md` y la documentación CS21A143.

## 4. Puntos de carga relevantes en CS21A142

`campus.html` publica, entre otros:

- `src/resources_panel_state_cs21a65.js?v=F98.4Z6CS21A142`
- `src/att77_bridge.js?v=F98.4Z6CS21A142`
- `src/teacher_cs21a_planeamiento_grouped.jsx?v=F98.4Z6CS21A140`
- `src/app.jsx?v=F98.4Z6CS21A142`

`src/app.jsx` referencia actualmente:

- `src/teacher_views.jsx?v=F98.4Z6CS21A142`
- `src/admin_students.jsx?v=F98.4Z6CS21A140`

Antes de retirar o sustituir un archivo se debe comprobar:

- `campus.html`;
- `F96_LAZY` / `anLazyCampus`;
- imports y cargas dinámicas;
- workflows;
- propiedades de `window`;
- wrappers o instaladores que reemplacen componentes después de cargarlos.

## 5. Estado funcional por rol

### Estudiante

- Calendario académico debe mostrar únicamente Cronograma.
- Tareas aparece debajo de Evaluaciones y continúa como placeholder honesto.
- Libros y Audios permite `SB` y `WB`; nunca `TB`.
- Planeamiento usa los 128 PDFs estudiantiles, separados del catálogo docente.
- Acceso acumulativo autorizado con estados `CA`, `APR` y `CNV`:
  - B1 → B1.
  - B2 → B1 + B2.
  - I1 → B1 + B2 + I1.
  - I2 → B1 + B2 + I1 + I2.
- Nunca habilitar niveles futuros.
- Club I CAN estudiantil sigue parcial mientras falten endpoints del backend observado.

### Docente

- Mis Grupos y Cronograma tienen respaldo de fecha `America/Costa_Rica`.
- Existe protección frontend contra doble envío en una misma pestaña; esto no demuestra idempotencia backend ni concurrencia entre dispositivos.
- Libros y Audios permite `SB`, `TB` y `WB`.
- Deben preservarse U01–U16 y sus saltos calibrados.
- Planeamiento muestra 32 lecciones en dos filas de 16.
- `Ver en Libro` debe abrir nivel, `SB` y unidad correctos, y luego permitir navegación libre.
- Sigue pendiente una prueba controlada completa de iniciar clase, asistencia, cierre, notas y persistencia.

### Superadmin

Se mantienen como `Próximamente` y no deben presentarse como terminadas:

- Finanzas.
- Docentes.
- Horas docentes.
- Club I CAN administrativo.
- Configuración.

Las superficies operativas sensibles deben validar permisos también en backend, no solo ocultar controles en frontend.

## 6. Backend observado y límites

La copia de `Code.gs` observada el 2026-07-18 tenía:

- encabezado `F98.4-Z6-CS21A79`;
- 52.495 líneas;
- SHA-256 `f6aa22cbd42c47990a5d72c5cf8d6e5af6bc72ebca356c23aa1058968088e487`;
- `deployment_confirmed: false`.

Funciones encontradas en esa copia:

- `getEstudiante`;
- `getMaterialLeccion`;
- `getBibliotecaNivelEstudiante`;
- `getAudioPistaEstudiante`;
- `getICANEstudiante`;
- `getEvaluacionesEstudiante`;
- `getSesionClaseEstudiante`.

Funciones no encontradas en esa copia:

- `getAccesoContenidoEstudiante`;
- `getICANPortalEstudiante`;
- `reservarICANSesionEstudiante`;
- `cancelarReservaICANEstudiante`;
- `getICANDocenteReservas`.

La copia observada no demuestra cuál revisión está desplegada actualmente. No reemplazar, recortar ni publicar `Code.gs` sin solicitud expresa, respaldo, mapa de dependencias, staging independiente y pruebas controladas.

## 7. Staging CS21A138

Existe la carpeta privada `QA_STAGING_CAMPUS_2026-07-19` con copias QA. Las escrituras están bloqueadas por defecto.

Sigue pendiente:

1. crear un proyecto Apps Script independiente;
2. instalar el backend completo de staging;
3. configurar propiedades con las copias QA;
4. publicar una aplicación web separada;
5. guardar la URL en `QA_STAGING_APPS_SCRIPT_URL`.

Nunca ejecutar pruebas de pago, nota, asistencia o cierre contra producción.

## 8. Automatización vigente

Workflows relevantes:

- `audit-delivery-cs21a131.yml`.
- `real-qa-staging-cs21a138.yml`.
- `validate-cs21a120.yml`.
- `validate-cs21a122.yml`.
- `validate-teacher-books-cs21a134.yml`.
- `virtual-campus-review-cs21a137.yml`.

La revisión virtual se ejecuta cada seis horas, conserva evidencia durante 14 días y no corrige ni fusiona automáticamente.

Los workflows usan filtros por rutas. Un PR exclusivamente documental puede no activar las validaciones de código; esa ausencia debe declararse y no interpretarse como prueba funcional.

## 9. Incidencias pendientes de reproducción

No considerar confirmados ni corregidos sin revisar datos y backend vigentes:

- filas antiguas de morosidad CONAPE que no siempre se actualizan;
- discrepancia del estudiante 402250384 entre Campus y CONAPE;
- fila reportada `SJ01 | 402250384 | 2026 | 1 | SI`;
- grupo `B1-KJ18-C3-0826` mostrando cero estudiantes;
- cuenta demo docente que debe llamarse Oldemar u Olde sin alterar el perfil real de Keylor;
- problemas anteriores de ingreso con credenciales;
- estado real de la cuenta demo en el backend desplegado.

No crear máscaras nuevas ni modificar al docente real Keylor sin autorización expresa.

## 10. Método de continuidad

Para cada ajuste:

1. verificar el SHA vigente de `main`;
2. leer `AGENTS.md`, este handoff, la biblia y la skill CS21A143;
3. definir invariantes y alcance;
4. auditar referencias completas antes de editar;
5. usar una rama pequeña;
6. modificar solo los archivos necesarios;
7. ejecutar validaciones específicas;
8. abrir PR;
9. esperar CI y revisar comentarios automáticos;
10. no fusionar ni desplegar sin revisión humana;
11. comprobar por separado el frontend público y el backend desplegado cuando corresponda.

## 11. Próximo orden recomendado

1. Completar y fusionar el PR documental CS21A143.
2. Ejecutar auditoría lógica sobre `main` sin preparar correcciones.
3. Ejecutar QA virtual de escritorio 1440×900 y móvil 390×844.
4. Consolidar con el supervisor y emitir un veredicto limitado por la evidencia disponible.
5. Preparar cuentas controladas y staging real.
6. Probar lecturas autenticadas por rol.
7. Probar escrituras únicamente en staging autorizado.
8. Corregir solo defectos reproducidos, cada uno en una rama y PR independientes.

## 12. Veredicto documental de este corte

**APTO CON RESERVAS para continuidad documental.**

La base de código está identificada y los cambios recientes están trazados. El Campus no debe declararse totalmente listo para piloto productivo hasta completar QA autenticado, confirmar el deployment real de Apps Script y validar los flujos críticos de escritura en staging aislado.
