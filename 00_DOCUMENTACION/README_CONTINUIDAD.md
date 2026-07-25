# Campus Virtual · Continuidad vigente · CS21A143

Fecha de corte: 2026-07-25  
Zona horaria: `America/Costa_Rica`

## Baseline verificado

- Repositorio: `anorteamericana-ship-it/campus-virtual`.
- Rama productiva: `main`.
- Commit: `67108928e953fbf044dbcd916dc34a5dd5f1e570`.
- Mensaje: `CS21A142 corrige Ver en Libro para la lección docente (#26)`.
- No se identificaron commits posteriores al preparar esta continuidad.

## Documentación vigente

Leer en este orden:

1. `../AGENTS.md`.
2. `HANDOFF_CHAT_CS21A143_2026-07-25.md`.
3. `BIBLIA_OPERATIVA_CS21A143.md`.
4. `SKILL_CAMPUS_VIRTUAL_CS21A143.md`.
5. `MATRIZ_ENTREGA_ROLES_CS21A131.md`.
6. `EQUIPO_VIRTUAL_QA_CS21A137.md`.
7. `QA_REAL_STAGING_CS21A138.md`.
8. `BACKEND_OBSERVADO_CS21A131.json`.

Los documentos anteriores se conservan como historial. Las referencias CS21A60, CS21A90, CS21A99, CS21A106 y CS21A107 no definen el baseline actual.

## Estado técnico resumido

### Frontend

`main` contiene las entregas recientes:

- PR #23: último desembolso CONAPE en Estudiantes.
- PR #24: proyección manual del siguiente nivel como `PE`.
- PR #25: Planeamiento docente en dos filas de 16.
- PR #26: Ver en Libro desde la lección docente.

Puntos de carga relevantes:

- `campus.html` → `app.jsx` CS21A142.
- `campus.html` → `teacher_cs21a_planeamiento_grouped.jsx` CS21A140.
- `F96_LAZY` → `teacher_views.jsx` CS21A142.
- `F96_LAZY` → `admin_students.jsx` CS21A140.

### Backend

La copia observada el 18 de julio de 2026 tenía encabezado `F98.4-Z6-CS21A79`, 52.495 líneas y SHA-256 `f6aa22cbd42c47990a5d72c5cf8d6e5af6bc72ebca356c23aa1058968088e487`.

`deployment_confirmed` permanece en `false`. No afirmar que esa copia es el Apps Script activo.

### QA

El supervisor virtual más reciente para el SHA indicado reportó:

- **APTO CON RESERVAS**.
- P0: 0.
- P1: 0.
- P2: 6.
- P3: 3.

La revisión CS21A143 añadió cuatro P2 confirmados por lectura del código y comentarios automáticos no resueltos:

1. caché de último desembolso no ligada a `refreshKey`;
2. proyección sin revalidar el estado origen `CA`;
3. `conape_sync === false` tratado como éxito normal;
4. solicitud de Ver en Libro potencialmente persistente y repetitiva.

## Estado del piloto

- QA estático y sintético: **APTO CON RESERVAS**.
- Piloto autenticado completo: **INDETERMINADO**.

Todavía se requiere:

- verificar el backend desplegado;
- completar Apps Script de staging separado;
- probar sesiones controladas de estudiante, docente y superadmin;
- confirmar permisos reales de Drive;
- probar iniciar clase, asistencia, cierre, notas y persistencia;
- probar concurrencia desde dos pestañas o dispositivos;
- ejecutar escrituras únicamente en staging.

## Siguiente orden de trabajo

1. Fusionar el PR documental CS21A143 si su diff y CI son correctos.
2. Corregir Ver en Libro en una rama funcional separada y agregar prueba de integración del atributo activo y limpieza de `sessionStorage`.
3. Corregir los tres riesgos de Estudiantes/CONAPE en otra rama pequeña con pruebas de refresco, concurrencia y éxito parcial.
4. Ejecutar auditor de lógica.
5. Ejecutar QA virtual móvil y escritorio.
6. Completar y verificar staging.
7. Ejecutar QA autenticado de solo lectura.
8. Habilitar escrituras QA solo con autorización expresa.
9. Emitir nuevo veredicto del supervisor antes del piloto.

## Protección

- No modificar producción directamente.
- No publicar credenciales.
- No inventar estudiantes, pagos, notas, asistencia o estados.
- No modificar `Code.gs` sin respaldo, mapa de dependencias, staging y prueba controlada.
- No eliminar archivos por antigüedad aparente.
- No afirmar “funciona” si solo compila.
- No afirmar “desplegado” sin comprobar la URL activa.
