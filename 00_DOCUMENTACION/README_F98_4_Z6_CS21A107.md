# F98.4-Z6-CS21A107 · Panel Maestro restaurado

## Diagnóstico

La tabla básica `Movimientos CONAPE` permanecía en `admin_master_dashboard.jsx` como respaldo. El panel completo intentaba reemplazarla una sola vez, pero el dashboard se carga de forma diferida. Cuando el evento ocurría antes de que el instalador estuviera listo, React conservaba el respaldo antiguo.

CS21A78 también podía competir por el mismo componente mediante una envoltura histórica.

## Corrección

- Se preservan buscador, filtros, combo de grupos, ficha agrupada, columna Detectado, semáforo y cerrados.
- Se conserva el enlace académico A106 contra `6-historial`.
- A107 instala la propiedad global y el binding utilizado por el dashboard.
- Reintenta al cargar módulos, recuperar foco y durante 90 segundos.
- A78 deja de envolver la tabla y actúa como guardia de recuperación.
- Si el módulo principal no se ejecutó por orden de carga, la guardia vuelve a cargarlo con una URL independiente.
- La fotografía de sesión cambia a `an_master_dashboard_snapshot_cs21a107`.

## No modificado

Apps Script, pagos, expedientes, archivos CONAPE y la MÁSCARA de Keylor.

## Diagnóstico en navegador

```javascript
window.__AN_MASTER_CONAPE_MOVEMENTS_BUILD__
// F98.4-Z6-CS21A107

window.__AN_MASTER_CONAPE_FULL_PANEL_ACTIVE__
// true

window.__AN_MASTER_COBRANZA_GROUP_FILTER_RETIRED__
// true
```
