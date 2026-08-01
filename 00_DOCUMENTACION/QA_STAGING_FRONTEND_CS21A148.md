# CS21A148 · Frontend real para staging QA

## Objetivo

Generar un artefacto aislado a partir del frontend vigente del repositorio, sin reutilizar el `index` monolítico de Apps Script ni copiar manualmente `campus.html` a otra entrada mantenida en GitHub.

## Fuente

El constructor toma directamente del commit evaluado:

- `campus.html`;
- `login.html`;
- `ventas.html`;
- `inscripcion.html`;
- `src/`;
- `styles/`;
- `vendor/`;
- `assets/`;
- `modulos/`.

No incluye documentación, instaladores, respaldos, archivos de auditoría ni prototipos históricos.

## Separación del backend

La URL del Apps Script QA no se escribe en GitHub ni en el artefacto.

Al abrir el paquete:

1. `qa-setup.html` solicita la URL `/exec` del proyecto QA;
2. valida HTTPS, host `script.google.com` y ruta `/macros/s/.../exec` o `/dev`;
3. rechaza el deployment productivo conocido;
4. guarda la dirección únicamente en `sessionStorage`;
5. redirige al login real;
6. `qa-bootstrap.js` instala `environment: 'qa'` antes de `src/runtime_config.js`.

Cuando no existe una URL QA válida, el runtime queda intencionalmente incompleto y la capa CS21A146 bloquea las solicitudes. No hay fallback silencioso hacia producción.

## Archivos generados, no versionados

El contenido de `dist/qa-staging` se genera en CI y se publica únicamente como artefacto temporal:

- `index.html`, alias generado de `campus.html`;
- las cuatro entradas vigentes con bootstrap QA;
- `qa-setup.html`;
- `qa-bootstrap.js`;
- `serve.mjs`;
- `INICIAR_QA_STAGING.cmd`;
- `QA_STAGING_BUILD.json`;
- directorios funcionales del frontend.

`dist/` no debe agregarse al repositorio.

## Uso en Windows

Después de descargar y descomprimir el artefacto:

1. ejecutar `INICIAR_QA_STAGING.cmd`;
2. se abre `http://127.0.0.1:4173/qa-setup.html`;
3. pegar la URL `/exec` del proyecto Apps Script QA;
4. ingresar únicamente con cuentas controladas QA.

Cerrar la pestaña elimina la configuración temporal del backend.

## Validaciones automáticas

El workflow `QA staging frontend CS21A148` comprueba:

- sintaxis de los scripts de construcción y auditoría;
- generación desde las entradas reales;
- orden `qa-bootstrap.js` → `runtime_config.js`;
- existencia de todos los recursos directos y diferidos;
- ausencia del frontend `campus_standalone`;
- ausencia de archivos históricos ya clasificados;
- ausencia de `DEMO_GROUP`, `DEMO_SUSPENSIONS`, `G0001-2026`, Santiago y Ricardo Arias en el sílabus;
- servidor local y respuestas HTTP de las entradas esenciales;
- creación del artefacto con retención limitada.

## Alcance

- No modifica `main`.
- No despliega GitHub Pages.
- No modifica Apps Script.
- No modifica hojas, Drive ni datos.
- No contiene credenciales.
- No contiene la URL QA.
- Debe permanecer como PR apilado hasta resolver CS21A146 y CS21A147.
