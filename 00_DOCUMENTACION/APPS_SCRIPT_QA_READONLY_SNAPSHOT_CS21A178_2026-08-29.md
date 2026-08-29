# CS21A178 · export reproducible read-only de Apps Script QA · 2026-08-29

## Motivo

Issue #111 exige congelar el HEAD modular QA vigente antes de portar deltas SEC-002.

El último snapshot demostrado fue un `clasp pull` read-only del 21-ago-2026 con 37 archivos. En el trabajo del 29-ago se reintentó localizar una copia moderna en Google Drive:

- búsqueda por Script ID: sin resultados;
- `01_Router` modificado después del 21-ago: sin resultados;
- cualquier `text/plain` modificado después del 21-ago: sin resultados;
- MIME nativo `application/vnd.google-apps.script`: sin resultados.

Los `.gs` encontrados en Drive son candidatos monolíticos/históricos del 16-ago o anteriores y no deben usarse como fuente actual.

Además, el PR histórico #110 contiene un instalador modular que sabe clonar el proyecto actual, pero mezcla lectura con `push`/deployment y conserva referencias de deployment históricas. No se reutiliza como herramienta de snapshot.

## Herramienta nueva

`scripts/export_apps_script_qa_snapshot_cs21a178.ps1`

Hace únicamente:

1. verifica que existe una sesión `clasp` autorizada, sin persistir la identidad en el snapshot;
2. ejecuta `clasp clone-script` contra el Script ID QA canónico;
3. copia la fuente a un directorio persistente excluyendo `.clasp.json`;
4. exige un mínimo de 37 archivos y la presencia de la frontera modular observada el 21-ago:
   - `01_Router.js`;
   - `44_English_LAB_Live_Base.js`;
   - `95_English_LAB_CS21A144_Al_Dia.js`;
   - `99_QA_Staging_Guard.js`;
5. genera `manifest.json` con SHA-256 por archivo, tamaño, líneas, hash agregado e inventario de referencias/definiciones `doPost`;
6. genera `snapshot-pointer.json` explícitamente `remote_write_performed=false`;
7. empaqueta la evidencia en ZIP local.

No contiene llamadas a:

- `clasp push`;
- create/update deployment;
- deploy/undeploy;
- Apps Script writes.

Tampoco hace `clasp login` automáticamente. Si la sesión local expiró, aborta y muestra el comando oficial de login; el login queda separado del export.

## Uso previsto en Windows

Desde el repo actual:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\export_apps_script_qa_snapshot_cs21a178.ps1
```

Salida por defecto:

`Documents\CampusVirtual\AppsScriptQA\Snapshots\QA_HEAD_<UTC>`

más:

`QA_HEAD_<UTC>.zip`

## Manifest

`scripts/apps_script_qa_snapshot_manifest_cs21a178.mjs` produce:

- `source_file_count`;
- `source_total_bytes`;
- `aggregate_sha256`;
- `files[]` con `path/bytes/lines/sha256`;
- `do_post_inventory[]` con líneas de definición/asignación/referencia;
- baseline esperado y cualquier archivo requerido faltante.

El hash agregado se calcula sobre una representación ordenada `path + bytes + sha256`, de modo que un cambio de archivo, contenido o tamaño altera la evidencia.

## QA sintético

`scripts/qa_apps_script_qa_readonly_snapshot_cs21a178.mjs`:

- bloquea comandos clasp de escritura/deploy en el exporter;
- exige el Script ID QA canónico;
- exige separación de login;
- crea 37 módulos sintéticos con los cuatro baselines;
- ejecuta el analizador real;
- verifica conteo, SHA agregado y detección de `doPost` base/wrapper.

El workflow también parsea PowerShell sin ejecutarlo contra Google.

## Límite honesto

Este corte prepara un **export reproducible**; no sustituye el export real. El snapshot actual seguirá pendiente hasta ejecutar la herramienta en un entorno donde `clasp` esté autenticado contra la cuenta con acceso al proyecto QA.

Después del export real, el siguiente paso canónico de #111 es:

1. revisar manifest + wrappers;
2. reconciliar deltas SEC-002 mínimos contra los módulos exactos;
3. plan/diff sin escritura;
4. solo después, con autorización de instalación QA, port controlado al mismo proyecto/deployment QA.

## Estado

**TOOLING READ-ONLY · NO APPS SCRIPT WRITE · NO PROD · SNAPSHOT REAL TODAVÍA PENDIENTE.**
