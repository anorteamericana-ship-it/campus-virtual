# C0-SCHEMA62 · contrato de orden de headers PROSPECTOS · 2026-09-08

Base apilada: PR #275 / `adf3a449c7be1a747cc6fcfe29f9cccc934ef25b`.
Evidencia: **E0 estática histórica**. No sustituye la ejecución local `smokeC0MigrateProspectSchema62` ni demuestra el source rehearsal actual.

## Hallazgo

Verificar únicamente `59 → 65`, presencia única de seis columnas y ausencia de duplicados **no basta** para probar que PROSPECTOS quedó con el layout contractual.

La evidencia versionada CS21A150 inserta las seis columnas privadas inmediatamente después del bloque legacy:

1. `FOTO_CED_FRENTE`
2. `FOTO_CED_DORSO`
3. `FOTO_TITULO`

seguido de:

4. `CED_FRENTE_FILE_ID`
5. `CED_DORSO_FILE_ID`
6. `DOC_IDENTIDAD_FILE_ID`
7. `TITULO_FILE_ID`
8. `DOC_IDENTIDAD_MODO`
9. `TITULO_MODO`

El fixture histórico confirma que, antes del patch, el siguiente header era `COMISION_PAGADA`. Por tanto, en ese contrato histórico el bloque privado se inserta **antes de `COMISION_PAGADA`**, no se agrega simplemente al final de la hoja.

Esto no demuestra que el rehearsal C0 actual use exactamente la misma definición; esa afirmación sigue bloqueada hasta congelar su source. Sí demuestra que un chequeo post-migración basado solo en count/membership puede producir un falso PASS.

## Verificación post-C0 corregida

Al ejecutar localmente el instalador v3, capturar arrays completos `headers_before` y `headers_after` y comprobar:

1. `headers_before.length === 59` observado, no supuesto;
2. `headers_after.length === 65` observado;
3. las seis privadas aparecen una sola vez;
4. **invariante de preservación:** al eliminar de `headers_after` exactamente las seis columnas privadas, el array resultante debe ser byte/textualmente igual a `headers_before`, mismo orden y spelling;
5. no comparar “las primeras 59 posiciones” índice por índice: si hay inserción intermedia legítima, los headers posteriores se desplazan seis posiciones;
6. congelar desde el source rehearsal la posición contractual exacta del bloque privado; si el source efectivo conserva CS21A150, exigir la secuencia contigua `FOTO_TITULO → seis privadas → COMISION_PAGADA`;
7. si el source rehearsal define otra posición explícita, documentar la discrepancia de vigencia antes de decidir PASS; no elegir la historia vieja en silencio;
8. cualquier header extra, faltante, renombrado, duplicado o cambio de orden fuera de la inserción contractual = `STOP`.

## Relación con 62 runtime / 59 físico

El número runtime 62 continúa `UNVERIFIED_IN_GITHUB`. No debe usarse para inferir posiciones de columnas. Después del smoke hay que identificar qué representa 62 en el source rehearsal —longitud de header runtime, límite de campos usados, versión intermedia u otra cosa— y reconciliarlo con el array físico final de 65. Si runtime sigue produciendo arrays de ancho 62 contra una hoja física 65, eso exige auditoría de cada `setValues`/`appendRow`/mapeo por headers antes de C1.

## Criterio

`C0_HEADER_LAYOUT=PASS` solo cuando:
- 59 y 65 fueron observados;
- `after - private6 === before` exactamente;
- la posición de private6 coincide con el source rehearsal congelado;
- no hay consumidores efectivos que dependan de un ancho/índice contradictorio.

Hasta entonces: `C0=BLOQUEADO_HUMANO`, C1–C4 `E4=STOP`.

No runtime, Apps Script, Sheets, Drive, Properties, ACL ni deployments fueron modificados. E2/E3/E4: **NO**.
