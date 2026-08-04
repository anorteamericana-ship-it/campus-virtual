# Biblia operativa · Campus Virtual · CS21A143

Fecha de corte: 2026-07-25  
Zona horaria: `America/Costa_Rica`  
Repositorio: `anorteamericana-ship-it/campus-virtual`

## 1. Propósito

Esta biblia resume las reglas operativas vigentes para trabajar sobre el Campus Virtual sin confundir documentación histórica, frontend guardado, backend observado, deployment publicado y pruebas reales.

No sustituye la lectura de los archivos actuales del módulo. Su función es fijar precedencia, invariantes y método de entrega.

## 2. Baseline identificado

Rama productiva: `main`  
Commit verificado:

`67108928e953fbf044dbcd916dc34a5dd5f1e570`

Mensaje:

`CS21A142 corrige Ver en Libro para la lección docente (#26)`

No se encontraron commits posteriores al preparar este documento.

## 3. Jerarquía de fuentes

Cuando dos fuentes se contradicen, usar este orden:

1. archivos vigentes de `main` en el commit objetivo;
2. `AGENTS.md`;
3. `HANDOFF_CHAT_CS21A143_2026-07-25.md`;
4. esta biblia;
5. `SKILL_CAMPUS_VIRTUAL_CS21A143.md`;
6. matriz de roles, QA y backend observado vigentes;
7. documentación histórica para contexto, no para imponer versiones;
8. recuerdos, conversaciones o copias locales antiguas: nunca como fuente de verdad.

El backend publicado y el frontend público deben comprobarse por separado. Un archivo guardado en GitHub o Drive no demuestra un deployment.

## 4. Estados que nunca deben mezclarse

Reportar de forma explícita cuál se verificó:

- lectura estática;
- validación de sintaxis;
- prueba sintética local;
- navegador con sesión sintética;
- navegador autenticado;
- backend observado en Drive;
- backend desplegado verificado;
- escritura ejecutada;
- persistencia posterior confirmada;
- frontend público comprobado.

Frases prohibidas sin evidencia suficiente:

- “funciona” cuando solo compila;
- “está desplegado” cuando solo está en Git o Drive;
- “los permisos están seguros” cuando solo se ocultó un botón;
- “la escritura es idempotente” cuando solo se bloqueó el doble clic en una pestaña.

## 5. Reglas de entrega

- No modificar directamente `main`.
- Usar ramas pequeñas y reversibles.
- Abrir PR para cada ajuste coherente.
- Esperar CI y revisar comentarios automáticos.
- No fusionar automáticamente.
- No combinar limpieza general con una corrección funcional.
- No borrar archivos por nombre, edad o apariencia.
- Antes de retirar un archivo revisar `campus.html`, `F96_LAZY`, `anLazyCampus`, imports, workflows, globals de `window`, wrappers e instaladores tardíos.
- Cambiar la versión de caché cuando se modifica un activo cargado por HTML o lazy loader.
- Usar `America/Costa_Rica` en lógica de “hoy”, cronogramas y cortes operativos.

## 6. Seguridad de datos y backend

No inventar ni alterar estudiantes, pagos, notas, asistencia, grupos, estados, certificados o registros CONAPE.

No reemplazar, recortar ni publicar `Code.gs` salvo que exista:

1. solicitud expresa;
2. respaldo completo;
3. tamaño, hash y versión identificados;
4. mapa de endpoints y helpers;
5. inventario de hojas, Drive y propiedades;
6. Apps Script de staging separado;
7. pruebas de lectura;
8. pruebas de escritura controladas;
9. plan de reversión.

La autorización real debe estar en backend. El frontend solo puede reducir errores de uso, no sustituir permisos.

## 7. Frontend vigente y cargas críticas

Puntos de entrada principales:

- `campus.html`.
- `src/app.jsx`.
- `src/lazy_loader.jsx`.
- `src/sidebar.jsx`.
- `src/student_menu_academic_cs21a120.jsx` y su guard.

Versiones relevantes publicadas por CS21A142:

- `resources_panel_state_cs21a65.js` → CS21A142.
- `att77_bridge.js` → CS21A142.
- `teacher_cs21a_planeamiento_grouped.jsx` → CS21A140.
- `app.jsx` → CS21A142.
- `teacher_views.jsx` en lazy loading → CS21A142.
- `admin_students.jsx` en lazy loading → CS21A140.

## 8. Invariantes del estudiante

### Acceso académico

Estados que habilitan contenido: `CA`, `APR`, `CNV`.

Acceso acumulativo:

- B1 habilita B1.
- B2 habilita B1 y B2.
- I1 habilita B1, B2 e I1.
- I2 habilita los cuatro niveles.

Nunca habilitar niveles futuros ni inferir autorización únicamente desde la interfaz.

### Menú y recursos

- Calendario académico muestra solo Cronograma.
- Tareas está debajo de Evaluaciones.
- Tareas sigue siendo un placeholder honesto hasta que exista flujo completo de publicación, entrega, revisión y retroalimentación.
- Libros y Audios permite `SB` y `WB`; nunca `TB`.
- Planeamiento usa PDFs estudiantiles, no docentes.
- Los 128 PDFs estudiantiles deben conservarse separados del catálogo docente.
- Club I CAN no debe prometer reservas mientras falten endpoints de backend.

## 9. Invariantes del docente

- Un docente solo puede leer o modificar grupos autorizados.
- Mis Grupos y Cronograma deben resolver fechas con `America/Costa_Rica`.
- La protección de doble envío en frontend no sustituye control de concurrencia backend.
- Libros permite `SB`, `TB` y `WB`.
- U01–U16 y sus inicios calibrados deben preservarse.
- Planeamiento tiene 32 lecciones en dos filas de 16.
- `Ver en Libro` debe usar metadatos explícitos de nivel y lección; el texto o código histórico del grupo solo puede ser respaldo.
- Después del salto contextual, el visor debe volver a navegación normal.
- No declarar asistencia, cierre o notas como listos sin prueba autenticada y persistencia confirmada.

## 10. Invariantes de Superadmin

Las siguientes opciones continúan marcadas como `Próximamente`:

- Finanzas.
- Docentes.
- Horas docentes.
- Club I CAN administrativo.
- Configuración.

No presentarlas como terminadas. No eliminarlas sin auditar rutas y dependencias.

Flujos de alto riesgo:

- Consulta individual y actualización académica.
- Estudiantes.
- Matrículas.
- Exámenes y notas.
- CONAPE y Cobranza.
- Importar banco.
- Aplicar pago.
- Permisos y roles.

Para escrituras financieras o académicas revisar idempotencia, dos pestañas, dos dispositivos, reintentos, respuestas tardías y journal backend.

## 11. Cambios recientes preservados

### CS21A139 · Último desembolso CONAPE

- Superadmin → Estudiantes muestra la fecha más reciente detectada.
- Combina movimientos inmediatos y sincronizados.
- Relaciona por código o cédula.
- Puede reflejar un siguiente nivel ya financiado.
- No cambió Apps Script.

### CS21A140 · Proyección manual

- Botón `+` junto al estado `CA`.
- Solo proyecta el siguiente nivel.
- Consulta `getEstudiante` antes de escribir.
- No duplica `PE`.
- Rechaza un nivel existente con otro estado.
- Reutiliza `actualizarEstatus`.
- No cambió Apps Script.

### CS21A140 · Planeamiento docente

- Niveles arriba.
- Lecciones 01–32 en dos filas de 16.
- PDF seleccionado debajo.
- Conserva catálogos y documentos docentes.

### CS21A142 · Ver en Libro

- Metadatos explícitos de nivel, lección y riel.
- Conversión lección → unidad.
- Lección 29 validada como I1 · SB · U15.
- Espera el montaje del visor.
- Limpia la solicitud contextual después del salto.

## 12. Backend observado

Referencia: `BACKEND_OBSERVADO_CS21A131.json`.

Copia observada el 2026-07-18:

- encabezado `F98.4-Z6-CS21A79`;
- 52.495 líneas;
- SHA-256 `f6aa22cbd42c47990a5d72c5cf8d6e5af6bc72ebca356c23aa1058968088e487`;
- deployment no confirmado.

Presentes en esa copia:

- `getEstudiante`;
- `getMaterialLeccion`;
- `getBibliotecaNivelEstudiante`;
- `getAudioPistaEstudiante`;
- `getICANEstudiante`;
- `getEvaluacionesEstudiante`;
- `getSesionClaseEstudiante`.

Ausentes en esa copia:

- `getAccesoContenidoEstudiante`;
- `getICANPortalEstudiante`;
- `reservarICANSesionEstudiante`;
- `cancelarReservaICANEstudiante`;
- `getICANDocenteReservas`.

La ausencia o presencia en esa copia no confirma el deployment web actual.

## 13. Staging real

El entorno `QA_STAGING_CAMPUS_2026-07-19` usa copias privadas y registros `QA-`.

El Apps Script independiente todavía debe crearse y desplegarse manualmente. Hasta entonces:

- el workflow real de lectura puede verificar recursos públicos;
- la autenticación de staging no está completa;
- las escrituras controladas no deben habilitarse;
- producción queda fuera de cualquier prueba destructiva.

## 14. Equipo virtual de revisión

### Auditor de lógica

Mapea:

`rol → menú → ruta → componente → endpoint → helper → hoja/Drive`

Revisa permisos, estados, fechas, carreras, wrappers, endpoints ausentes, fallos silenciosos y caché.

### Ingeniero QA

Prueba:

- escritorio 1440×900;
- móvil 390×844;
- consola y page errors;
- 404/500;
- pantallas vacías;
- overflow horizontal;
- cambio repetido de menú;
- Atrás;
- recarga directa;
- sesión sintética de solo lectura.

### Supervisor

- deduplica;
- separa defectos de hipótesis;
- clasifica P0–P3;
- emite `APTO`, `APTO CON RESERVAS`, `BLOQUEADO` o `INDETERMINADO`;
- declara siempre las limitaciones.

## 15. Workflows y alcance

- `audit-delivery-cs21a131.yml`: contratos estáticos, JSX crítico y validaciones docentes.
- `validate-cs21a120.yml`: contrato estudiantil, planeamiento y responsive.
- `validate-cs21a122.yml`: activos y sintaxis de Club I CAN.
- `validate-teacher-books-cs21a134.yml`: autoridad U01–U16 y toolbar docente.
- `virtual-campus-review-cs21a137.yml`: auditoría estática, navegador y supervisor; cada seis horas y en PR de rutas cubiertas.
- `real-qa-staging-cs21a138.yml`: lecturas reales y autenticación/escritura solo en staging autorizado.

Los filtros `paths` significan que no todos los workflows se ejecutan en todo PR. “No se ejecutó” y “pasó” son estados distintos.

## 16. Formato mínimo de hallazgo

Cada hallazgo debe incluir:

- ID estable;
- severidad P0–P3;
- rol y ruta;
- invariante afectada;
- pasos reproducibles;
- resultado esperado;
- resultado observado;
- archivo, endpoint o evidencia;
- tipo de prueba;
- confianza;
- alcance y limitaciones.

Sin evidencia, registrar como hipótesis.

## 17. Incidencias abiertas conocidas

Requieren reproducción y no deben asumirse como defectos confirmados:

- morosidad CONAPE histórica;
- estudiante 402250384;
- fila `SJ01 | 402250384 | 2026 | 1 | SI`;
- grupo `B1-KJ18-C3-0826` con cero estudiantes;
- cuenta demo Oldemar/Olde;
- problemas de login anteriores;
- deployment real de la cuenta demo;
- flujo completo docente de iniciar, asistir, cerrar, calificar y persistir.

## 18. Regla de numeración

CS21A143 corresponde a consolidación documental. No implica que el frontend o backend hayan avanzado funcionalmente más allá de CS21A142.

La siguiente corrección funcional debe numerarse según la convención acordada en el PR que la implemente, sin reutilizar CS21A143 para afirmar un cambio de código inexistente.

## 19. Criterio para piloto

El Campus puede prepararse para un piloto controlado, pero no declararse completamente listo mientras falten:

- autenticación controlada por rol;
- confirmación del backend desplegado;
- prueba completa docente;
- validación de permisos reales de Drive;
- pruebas de reintento y concurrencia;
- escrituras verificadas únicamente en staging;
- revisión física final en computadora y teléfono.
