# Campus Virtual Academia Norteamericana · Continuidad vigente

**Corte:** 2026-07-25  
**Zona horaria:** `America/Costa_Rica`  
**Rama productiva:** `main`  
**Commit verificado:** `67108928e953fbf044dbcd916dc34a5dd5f1e570`  
**Último cambio funcional identificado:** CS21A142  
**Consolidación documental:** CS21A143

## Referencias operativas actuales

Leer en este orden:

1. `../AGENTS.md`.
2. `HANDOFF_CHAT_CS21A143_2026-07-25.md`.
3. `BIBLIA_OPERATIVA_CS21A143.md`.
4. `SKILL_CAMPUS_VIRTUAL_CS21A143.md`.
5. `MATRIZ_ENTREGA_ROLES_CS21A131.md`.
6. `EQUIPO_VIRTUAL_QA_CS21A137.md`.
7. `QA_REAL_STAGING_CS21A138.md`.
8. `BACKEND_OBSERVADO_CS21A131.json`.
9. Archivos vigentes de `main`.

## Estado frente a documentos anteriores

Los documentos CS21A60, CS21A90, CS21A99, CS21A106 y CS21A107 se mantienen como historial. No definen la versión actual cuando contradicen `main` o la documentación CS21A143.

En particular:

- `BIBLIA_DELTA_ACTUAL.md` y `PROMPT_CONTINUIDAD.md` llegan a CS21A60.
- `SKILL_CAMPUS_VIRTUAL_CS21A90.md` llega a CS21A90.
- `FUENTE_VERDADERA_CAMPUS_VIRTUAL.md` y `FUENTES_DE_VERDAD_Y_CONTRATOS.md` documentan la etapa CS21A99.
- Este archivo apuntaba previamente a CS21A106.
- El `README.md` raíz apuntaba previamente a CS21A107.

No borrar esos archivos sin una tarea documental específica.

## Cambios recientes confirmados

- PR #23 / CS21A139: último desembolso CONAPE en Estudiantes.
- PR #24 / CS21A140: proyección manual del siguiente nivel como `PE`.
- PR #25 / CS21A140: Planeamiento docente reorganizado.
- PR #26 / CS21A142: corrección contextual de `Ver en Libro`.

Los cuatro cambios fueron frontend y no modificaron Apps Script.

## Puntos de carga vigentes

`campus.html` publica versiones CS21A140/CS21A142 para los módulos recientes, incluyendo:

- `resources_panel_state_cs21a65.js?v=F98.4Z6CS21A142`.
- `att77_bridge.js?v=F98.4Z6CS21A142`.
- `teacher_cs21a_planeamiento_grouped.jsx?v=F98.4Z6CS21A140`.
- `app.jsx?v=F98.4Z6CS21A142`.

`src/app.jsx` carga:

- `teacher_views.jsx?v=F98.4Z6CS21A142`.
- `admin_students.jsx?v=F98.4Z6CS21A140`.

## Límites conocidos

- La copia observada de `Code.gs` no confirma el deployment actual.
- Club I CAN continúa parcial por endpoints ausentes en la copia observada.
- El Apps Script de staging todavía debe crearse y publicarse manualmente.
- No existe evidencia suficiente para declarar completo el flujo docente de iniciar, asistir, cerrar, calificar y persistir.
- Finanzas, Docentes, Horas docentes, Club I CAN administrativo y Configuración siguen como `Próximamente`.

## Regla de continuidad

Antes de modificar:

1. comprobar el SHA real de `main`;
2. identificar archivos y wrappers efectivos;
3. definir invariantes;
4. distinguir lectura, simulación, autenticación, deployment y escritura;
5. usar rama y PR pequeños;
6. ejecutar CI aplicable;
7. no fusionar automáticamente;
8. no tocar Apps Script sin solicitud expresa y staging independiente.

## Siguiente fase recomendada

1. Fusionar el PR documental CS21A143 después de revisión humana.
2. Ejecutar auditoría lógica sin correcciones.
3. Ejecutar QA virtual en escritorio y móvil.
4. Emitir veredicto del supervisor con límites explícitos.
5. Completar staging y pruebas autenticadas controladas.
