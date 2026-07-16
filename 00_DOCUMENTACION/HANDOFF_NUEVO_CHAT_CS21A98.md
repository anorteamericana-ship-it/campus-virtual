# Handoff para nuevo chat · F98.4-Z6-CS21A98

## Punto de partida

La versión vigente del Panel Maestro CONAPE es CS21A98. No reconstruir desde CS21A90 ni reactivar módulos monolíticos eliminados.

## Reglas activas

- El semáforo se guarda por movimiento/ciclo, no globalmente por estudiante.
- El cierre del desembolso 01 reinicia el semáforo.
- Los cambios remotos se consultan por endpoint delta; no recargar el dashboard integral.
- El combo de grupo usa la hoja `GRUPOS` como fuente oficial.
- No crear hojas ni triggers para este flujo.

## Archivos frontend

- `campus.html`
- `src/admin_master_conape_review_state_cs21a96.jsx`
- `src/admin_master_conape_panel_cs21a96.jsx`
- `src/admin_master_conape_data_cs21a96.jsx`
- `src/admin_master_conape_view_cs21a96.jsx`

## Backend

Archivo integral entregado fuera del repositorio: `Code_F98_4_Z6_CS21A98_COMPLETO.gs`.

Endpoints principales:

- `getSuperAdminMasterDashboard`
- `actualizarPanelConapeAhora`
- `setConapeRevisionSemaforo`
- `getConapeRevisionChanges`

## Pendiente de operación

Publicar una nueva versión del deployment existente, mantener la misma URL, recargar con Ctrl+F5 y probar con dos sesiones Superadmin en equipos diferentes.
