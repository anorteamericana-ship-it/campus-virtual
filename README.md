# Campus Virtual · Academia Norteamericana

## Estado operativo vigente

Baseline productivo verificado antes de la actualización documental CS21A143:

- Rama: `main`.
- Commit: `67108928e953fbf044dbcd916dc34a5dd5f1e570`.
- Mensaje: `CS21A142 corrige Ver en Libro para la lección docente (#26)`.
- No se identificaron commits posteriores al corte del 25 de julio de 2026.

La numeración de archivos individuales no sustituye el commit real de `main`. El backend observado en Drive no debe asumirse como desplegado: `00_DOCUMENTACION/BACKEND_OBSERVADO_CS21A131.json` mantiene `deployment_confirmed: false`.

## Leer primero

1. `AGENTS.md`.
2. `00_DOCUMENTACION/HANDOFF_CHAT_CS21A143_2026-07-25.md`.
3. `00_DOCUMENTACION/BIBLIA_OPERATIVA_CS21A143.md`.
4. `00_DOCUMENTACION/SKILL_CAMPUS_VIRTUAL_CS21A143.md`.
5. `00_DOCUMENTACION/MATRIZ_ENTREGA_ROLES_CS21A131.md`.
6. `00_DOCUMENTACION/EQUIPO_VIRTUAL_QA_CS21A137.md`.
7. `00_DOCUMENTACION/QA_REAL_STAGING_CS21A138.md`.
8. `00_DOCUMENTACION/BACKEND_OBSERVADO_CS21A131.json`.

Los documentos CS21A60, CS21A90, CS21A99, CS21A106 y CS21A107 se conservan como historial. No prevalecen sobre `main` ni sobre los punteros CS21A143.

## Estado de entrega

Último supervisor virtual observado sobre `67108928...`:

- Veredicto sintético: **APTO CON RESERVAS**.
- P0: 0.
- P1: 0.
- P2: 6.
- P3: 3.

Además, la revisión documental CS21A143 confirmó cuatro riesgos P2 todavía aplicables en código:

- último desembolso puede quedar obsoleto dentro de la misma vista;
- proyección manual no revalida que el nivel origen continúe en `CA`;
- proyección puede ocultar `conape_sync === false`;
- Ver en Libro puede conservar y repetir la solicitud contextual porque el botón activo no publica el atributo esperado.

Por tanto:

- revisión estática/sintética: **APTO CON RESERVAS**;
- piloto autenticado completo: **INDETERMINADO** hasta verificar backend desplegado, cuentas controladas, permisos de Drive y persistencia en staging.

## Reglas de trabajo

- Consultar GitHub antes de modificar.
- Crear una rama pequeña por causa raíz.
- No cambiar producción directamente.
- No modificar Apps Script sin solicitud expresa, respaldo, staging y mapa de dependencias.
- No probar pagos, notas, asistencia o CONAPE en producción.
- Distinguir código presente, validación estática, prueba sintética, prueba autenticada, deployment confirmado y escritura persistida.
- Revisar `campus.html`, `F96_LAZY`, imports, workflows, eventos y globals antes de retirar archivos.
- Esperar CI y revisar comentarios automáticos antes de fusionar.
