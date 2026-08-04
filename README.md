# Campus Virtual · Academia Norteamericana

## Estado consolidado actual

Rama productiva: `main`  
Baseline frontend verificado al 2026-07-25:

`67108928e953fbf044dbcd916dc34a5dd5f1e570`  
`CS21A142 corrige Ver en Libro para la lección docente (#26)`

CS21A143 corresponde a consolidación documental. No modifica frontend, Apps Script ni datos.

## Fuente de verdad

La fuente oficial del frontend es el contenido vigente de `main`. Los documentos históricos se conservan para contexto, pero no prevalecen sobre los archivos actuales.

Guardar en GitHub, validar sintaxis, probar localmente, publicar Apps Script y comprobar producción son estados distintos.

## Leer primero

1. `AGENTS.md`.
2. `00_DOCUMENTACION/HANDOFF_CHAT_CS21A143_2026-07-25.md`.
3. `00_DOCUMENTACION/BIBLIA_OPERATIVA_CS21A143.md`.
4. `00_DOCUMENTACION/SKILL_CAMPUS_VIRTUAL_CS21A143.md`.
5. `00_DOCUMENTACION/MATRIZ_ENTREGA_ROLES_CS21A131.md`.
6. `00_DOCUMENTACION/EQUIPO_VIRTUAL_QA_CS21A137.md`.
7. `00_DOCUMENTACION/QA_REAL_STAGING_CS21A138.md`.
8. `00_DOCUMENTACION/BACKEND_OBSERVADO_CS21A131.json`.
9. Los archivos vigentes del módulo que se vaya a trabajar.

## Cambios productivos recientes identificados

- CS21A139: último desembolso CONAPE en Superadmin → Estudiantes.
- CS21A140: proyección manual segura del siguiente nivel como `PE`.
- CS21A140: Planeamiento docente con niveles arriba, 32 lecciones en dos filas de 16 y PDF debajo.
- CS21A142: `Ver en Libro` abre nivel, `SB` y unidad correctos y luego libera la navegación.

Estos cambios fueron frontend y no modificaron Apps Script.

## Estado funcional que debe preservarse

### Estudiante

- Calendario académico muestra solo Cronograma.
- Tareas está debajo de Evaluaciones y sigue como placeholder honesto.
- Libros y Audios permite `SB` y `WB`; nunca `TB`.
- Acceso acumulativo únicamente con `CA`, `APR` y `CNV`.
- Planeamiento usa PDFs estudiantiles.

### Docente

- Libros permite `SB`, `TB` y `WB`.
- Se conservan U01–U16.
- Planeamiento muestra 32 lecciones.
- `Ver en Libro` usa contexto explícito y no debe bloquear la navegación posterior.
- Falta validar con staging el flujo completo de iniciar clase, asistencia, cierre, notas y persistencia.

### Superadmin

Continúan como `Próximamente`:

- Finanzas.
- Docentes.
- Horas docentes.
- Club I CAN administrativo.
- Configuración.

No presentarlas como terminadas ni eliminarlas sin auditar dependencias.

## Backend y staging

La copia de backend observada el 2026-07-18 tenía encabezado `F98.4-Z6-CS21A79`, 52.495 líneas y deployment no confirmado. No debe asumirse que coincide con la aplicación web desplegada.

El staging CS21A138 tiene copias QA preparadas, pero todavía requiere crear y publicar un Apps Script independiente y registrar `QA_STAGING_APPS_SCRIPT_URL`.

Nunca probar pagos, notas, asistencia, cierres o CONAPE contra producción.

## Método de trabajo

1. Confirmar el SHA actual de `main`.
2. Leer la documentación vigente.
3. Auditar rutas, lazy loading, wrappers, endpoints y caché.
4. Definir una rama pequeña.
5. No mezclar auditoría con corrección.
6. Ejecutar validaciones específicas.
7. Abrir PR.
8. Esperar CI y revisar comentarios automáticos.
9. No fusionar ni desplegar automáticamente.
10. Reportar por separado lectura estática, prueba sintética, sesión autenticada, backend desplegado y escritura confirmada.

## Próximo objetivo

Preparar un piloto controlado mediante auditoría lógica, QA virtual y pruebas autenticadas de solo lectura. Las escrituras deben ejecutarse únicamente en staging autorizado después de verificar su marcador y aislamiento.
