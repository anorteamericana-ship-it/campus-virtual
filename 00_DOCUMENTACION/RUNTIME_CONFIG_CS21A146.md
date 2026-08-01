# CS21A146 · Configuración central de ambiente

## Objetivo

Separar la selección del backend de Apps Script del código funcional del Campus. Producción continúa siendo el valor predeterminado; QA puede declarar otro despliegue antes de cargar el resto del frontend.

## Producción

Las entradas vigentes cargan `src/runtime_config.js` sin configuración previa. El archivo instala la URL productiva conocida en:

- `window.CAMPUS_RUNTIME_CONFIG.appsScriptUrl`
- `window.APPS_SCRIPT_URL`

No se requiere ningún cambio adicional para producción.

## QA o staging

Antes de `src/runtime_config.js`, declarar explícitamente:

```html
<script>
window.__CAMPUS_RUNTIME_CONFIG__ = {
  environment: 'qa',
  appsScriptUrl: 'https://script.google.com/macros/s/DEPLOYMENT_ID_QA/exec'
};
</script>
<script src="src/runtime_config.js?v=F98.4Z6CS21A146"></script>
```

El URL debe usar HTTPS, host `script.google.com` y ruta `/macros/s/.../exec` o `/dev`.

Una intención no productiva inválida o incompleta no cae silenciosamente al backend productivo. El estado queda como `environment: 'invalid'`, `valid: false` y los `fetch` se bloquean con `CAMPUS_RUNTIME_CONFIG_INVALID`.

## Compatibilidad transitoria

Varios módulos antiguos todavía guardan la URL productiva en constantes locales. Para permitir QA sin modificar simultáneamente todos esos módulos, `runtime_config.js` envuelve `window.fetch` y reescribe únicamente las solicitudes dirigidas exactamente al despliegue productivo conocido. Solicitudes a otros dominios o rutas no se modifican cuando la configuración es válida.

Esta capa es temporal. Las siguientes fases retirarán gradualmente las constantes repetidas y harán que cada módulo lea solamente `window.APPS_SCRIPT_URL`.

## Entradas cubiertas

- `campus.html`
- `login.html`
- `ventas.html`
- `inscripcion.html`

`modulos/examen_oral.html` conserva por ahora su configuración interna y debe migrarse en un cambio separado, porque es un documento monolítico independiente.

## Seguridad

- No cambia el backend productivo.
- No cambia IDs de hojas ni Drive.
- No despliega Apps Script.
- No acepta URLs arbitrarias como backend.
- No persiste la URL QA en almacenamiento del navegador.
- QA requiere una declaración explícita y válida antes del arranque.
- Una configuración QA inválida bloquea red en lugar de consultar producción.

## Validación

Ejecutar:

```bash
node --check src/runtime_config.js
node scripts/test_runtime_config_cs21a146.mjs
```
