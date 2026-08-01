# CS21A149 · Segunda ola de limpieza respaldada

## Objetivo

Retirar cinco archivos históricos no cargados, sin tocar los reemplazos canónicos ni el archivo `calendar88_selftest.js`, que sí forma parte de la entrada publicada.

## Respaldo previo

Carpeta de Drive:

`BACKUP_MAESTRO_CAMPUS_VIRTUAL_2026-07-31/06_DESCARTADOS_DUPLICADOS_Y_OBSOLETOS/CS21A149_SEGUNDA_LIMPIEZA_GITHUB`

Archivo:

`cleanup-candidates-cs21a149-second-wave.zip`

SHA-256:

`1b6650adf9a67b0284b5a7d0eb0057fa7295b21494618b171fc38f5006d4b4e3`

El ZIP contiene los cinco archivos, `MANIFEST.txt` y `SHA256SUMS.txt`. Se descomprimió y `sha256sum -c` confirmó todos los archivos antes de abrir este cambio.

## Archivos retirados

### Duplicados exactos

- `src/MATRIC~3.JSX` — mismo blob y mismo SHA-256 que `src/matriculas_calendario.jsx`.
- `src/PANEL_~1.JSX` — mismo blob y mismo SHA-256 que `src/panel_admin_supervision.jsx`.

### Versiones históricas no cargadas

- `src/inscripcion_v1.jsx` — `inscripcion.html` carga `src/inscripcion.jsx`.
- `styles/ADMIN_~2.CSS` — `campus.html` carga `styles/admin_master_dashboard.css`.
- `styles/login_v1.css` — `login.html` carga `styles/login.css`.

Las búsquedas por nombre exacto no localizaron referencias de ejecución desde entradas, bundles, módulos ni workflows.

## Archivo conservado expresamente

`src/calendar88_selftest.js` no pertenece a esta limpieza. `campus.html` lo carga directamente, por lo que permanecerá hasta una auditoría funcional separada del calendario CS21A88.

## Auditoría

`scripts/audit_cleanup_candidates_cs21a149.mjs` verifica:

- ausencia de los cinco archivos retirados;
- existencia de cada reemplazo canónico;
- ausencia de referencias de ejecución a los nombres retirados;
- identidad SHA-256 de los dos duplicados exactos con sus canónicos;
- carga de los archivos vigentes en `campus.html`, `login.html` e `inscripcion.html`;
- conservación explícita de `calendar88_selftest.js`.

El workflow ejecuta además las auditorías anteriores de entrega y de la primera limpieza.

## Seguridad

- Rama apilada sobre el PR #30.
- No modifica `main` directamente.
- No cambia backend, Apps Script, hojas ni datos.
- No despliega producción.
- Debe permanecer como PR borrador hasta revisión humana.
