# CS21A172 · Apps Script QA snapshot analyzer · 2026-08-29

## Problema que resuelve

Issue #111 exige congelar el **HEAD completo y actual** del proyecto Apps Script QA antes de portar SEC-002/SEC-004.

El 21-ago-2026 hubo evidencia read-only de `clasp pull` sobre el Script ID QA canónico y se observó un proyecto modular de **37 archivos**, con múltiples wrappers `doPost` (`01`, `42/43/46/47/48`, `90`, `95`, `99`).

En la sesión del 29-ago-2026 se volvió a buscar un export persistido y fresco en Drive usando:

- `99_QA_Staging_Guard`;
- `EnglishLabLiveV2`;
- Script ID QA canónico;
- `01_Router`;
- `clasp`;
- `QA_MODULAR`;
- barrido metadata de todos los archivos modificados desde 21-ago.

No apareció un export `.gs/.json/.zip` del HEAD modular actual. Sí aparecen artefactos históricos como:

- `Code_QA_STAGING_CS21A144_COMPLETO.txt` · 29-jul;
- `BACKUP_CAMPUS_QA_MODULAR_ANTES_RUNTIME_CONFIG_CS21A146_2026-08-01.json` · 1-ago;
- instaladores/manifest CS21A144/CS21A146;
- módulos English LAB/Memory Match de primera quincena de agosto.

**Conclusión:** snapshot fresco **NO LOCALIZADO**. Esto no demuestra que no exista en otro medio, pero sí impide usar Drive como fuente actual de instalación.

## Regla de seguridad

CS21A172 no descarga, modifica ni despliega Apps Script.

Su único propósito es convertir un futuro export en evidencia verificable:

1. inventario completo de archivos;
2. SHA-256 por archivo;
3. tamaños;
4. detección de `appsscript.json`;
5. todas las definiciones/reasignaciones detectables de `doPost`;
6. capturas tipo `var previousDoPost = doPost`;
7. candidatos de guard por nombre;
8. metadata opcional de proyecto/deployment/provenance.

### Importante: el orden efectivo NO se adivina

Por defecto el reporte declara:

`effective_order_status = UNPROVEN`

El orden lexicográfico de archivos se incluye solo como inventario. **Nunca se interpreta como orden efectivo de ejecución Apps Script.**

Puede suministrarse un archivo externo de orden con `--order-file`. En ese caso el reporte cambia a:

`SUPPLIED_EXTERNAL_ORDER`

pero conserva una advertencia explícita: el analizador valida que las rutas existan y ordena los hallazgos según esa lista, pero **no demuestra por sí mismo** que la lista represente la cadena runtime real.

Eso mantiene vigente la obligación de Issue #111: demostrar cuál wrapper `doPost` es realmente exterior antes de instalar SEC-004.

## Uso cuando llegue el próximo export

Ejemplo mínimo:

```bash
node scripts/analyze_apps_script_snapshot_cs21a172.mjs ./apps-script-qa-head
```

Con metadata:

```bash
node scripts/analyze_apps_script_snapshot_cs21a172.mjs ./apps-script-qa-head \
  --project-id '<QA_SCRIPT_ID>' \
  --deployment-id '<QA_DEPLOYMENT_ID>' \
  --version '<HEAD_O_VERSION>' \
  --provenance 'clasp pull read-only 2026-08-29'
```

Si existe evidencia externa del orden:

```bash
node scripts/analyze_apps_script_snapshot_cs21a172.mjs ./apps-script-qa-head \
  --order-file ./apps-script-effective-order.txt
```

Salida por defecto:

- `qa-output-apps-script-snapshot/snapshot-analysis.json`
- `qa-output-apps-script-snapshot/snapshot-analysis.md`

## Qué debe comprobarse antes de portar SEC-002/004

El reporte futuro debe permitir afirmar con evidencia:

- conteo exacto de archivos;
- SHA-256 exacto de cada archivo;
- presencia del router base;
- presencia/ausencia de capas 95/99 y cualquier nueva capa posterior;
- número y ubicación de todas las definiciones/reasignaciones `doPost` detectadas;
- alias de wrappers previos;
- manifest Apps Script válido;
- provenance y deployment/version asociados al snapshot.

Después, y solo después:

1. portar los deltas mínimos SEC-002/004 contra esos hashes/preimágenes;
2. volver a correr CS21A172 y comparar manifest antes/después;
3. demostrar la cadena exterior `doPost` con evidencia runtime/source adicional;
4. ejecutar QA positiva/negativa;
5. versionar únicamente el deployment QA existente;
6. mantener PROD fuera de alcance.

## QA sintética del analizador

`scripts/qa_apps_script_snapshot_analyzer_cs21a172.mjs` construye un proyecto temporal con:

- router base;
- wrapper English LAB;
- `99_QA_Staging_Guard`;
- `appsscript.json`.

Verifica:

- conteos de archivos;
- 3 definiciones/reasignaciones `doPost`;
- 2 capturas de `previousDoPost`;
- SHA-256 de 64 hex;
- cambio de hash ante cambio del source;
- `UNPROVEN` sin orden externo;
- `SUPPLIED_EXTERNAL_ORDER` con orden aportado;
- rechazo de rutas inexistentes y duplicadas;
- salida Markdown con manifest.

## Estado

**TOOLING/AUDIT ONLY · NO APPS SCRIPT WRITE · NO DRIVE WRITE · NO PROD.**

CS21A172 no desbloquea por sí mismo Issue #111. Reduce el riesgo y deja preparado el mecanismo de congelamiento verificable para el próximo export real.
