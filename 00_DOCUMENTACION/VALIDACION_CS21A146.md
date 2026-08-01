# VALIDACIÓN CS21A146 · Runtime config

## Alcance

Se añadió una configuración central de ambiente para las cuatro entradas HTML vigentes:

- `campus.html`
- `login.html`
- `ventas.html`
- `inscripcion.html`

Producción continúa siendo el valor predeterminado. QA o staging puede declarar un despliegue alterno de Apps Script antes de cargar `src/runtime_config.js`.

## Archivos nuevos

- `src/runtime_config.js`
- `scripts/test_runtime_config_cs21a146.mjs`
- `.github/workflows/runtime-config-cs21a146.yml`
- `00_DOCUMENTACION/RUNTIME_CONFIG_CS21A146.md`

## Cambios de entrada

Las cuatro entradas cargan `src/runtime_config.js` antes del código funcional. Se retiró de `login.html`, `ventas.html` e `inscripcion.html` la asignación inline de la URL productiva.

## Compatibilidad

El wrapper transitorio de `fetch` reescribe exclusivamente solicitudes dirigidas al despliegue productivo conocido cuando existe un override QA válido. No modifica otras solicitudes.

## Fuera de alcance

- no se modificó `src/data.jsx`;
- no se retiraron todavía las constantes productivas repetidas dentro de módulos históricos;
- no se modificó `modulos/examen_oral.html`;
- no se desplegó Apps Script;
- no se cambiaron hojas, Drive ni datos.

## Pruebas automáticas

- sintaxis de `src/runtime_config.js`;
- producción como valor predeterminado;
- override QA explícito;
- rechazo de URLs no válidas;
- compatibilidad con `window.APPS_SCRIPT_URL` preexistente;
- reescritura limitada del URL productivo;
- orden correcto de carga en las cuatro entradas;
- ausencia de la URL productiva repetida dentro de las entradas HTML.
