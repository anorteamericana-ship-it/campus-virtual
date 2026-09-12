# C3 · CONAPE PORTAL · contrato de integración

**Estado:** DISEÑO + C3.1/C3.2 SOURCE/QA ONLY
**Base inicial C3.1:** `main@b025b270b8df633efe7d7682666645cf8dfe6030`
**Fuente externa:** Oracle APEX · Prospectación Reclutador · reporte de prospectos
**Regla principal:** CONAPE es fuente externa de verdad; el navegador de Ventas nunca recibe credenciales/cookies/sesión APEX.

## 1. Separación de conceptos

No mezclar:

1. `estado_raw / estado_key`: estado literal observado en CONAPE;
2. etapa comercial interna del Campus (`CONAPE_SOLICITUD`, `CONAPE_DESEMBOLSO`, etc.);
3. acción recomendada al asesor.

Un estado CONAPE desconocido se conserva y se marca; nunca se traduce silenciosamente a una etapa interna.

## 2. Nomenclatura

No reutilizar `CONAPE_SYNC`. El repositorio ya usa `conape_sync`/`CONAPE_SYNC` para otros contratos operativos.

Reservar para esta integración:

- `conapePortal*` en código;
- `CONAPE_PORTAL_ACTUAL` para snapshot futuro;
- `CONAPE_PORTAL_EVENTOS` para historial futuro;
- `CONAPE_PORTAL_RUNS` para auditoría futura.

C3.1/C3.2 no crean ninguna de esas tablas: definen lectura, parser y captura autenticada read-only.

## 3. Arquitectura objetivo

`Portal CONAPE -> capturador privado -> parser C3.1 -> normalizador -> snapshot/eventos -> backend Campus -> Ventas/Admin`

C3.2 implementa el capturador privado únicamente para lectura local autenticada mediante Chrome DevTools Protocol en loopback. No contiene login, password ni tokens de CONAPE y no persiste cookies, `p_instance`, session ni `p_request`.

## 4. Campos canónicos

Campos requeridos por columna:

- `cedula`;
- `estado_raw`;
- `fecha_estado`.

Campos opcionales inicialmente observados/diseñados:

- `primer_apellido`;
- `segundo_apellido`;
- `nombre`;
- `telefono`;
- `correo`;
- `fecha_registro`;
- `usuario_registro`;
- `fecha_aprobacion`;
- `fecha_formalizacion`;
- `ultimo_desembolso`;
- `proximo_desembolso`.

Las columnas se resuelven por encabezado normalizado, nunca por posición fija.

## 5. Estados inicialmente conocidos

C3.1 reconoce únicamente como catálogo inicial:

- `REGISTRO`;
- `INICIO_SOLICITUD`;
- `DOCUMENTOS_PENDIENTES`;
- `ANALISIS`;
- `PASADA_A_BPM`.

`PASADA_A_BPM` no se equipara todavía a aprobación, firma ni formalización. Su significado de negocio debe confirmarse antes de mapearlo.

## 6. Hashes

Cada registro produce:

- `process_hash`: solo campos que describen avance del trámite;
- `record_hash`: registro canónico completo, excluyendo `captured_at`.

Una corrección de teléfono/nombre puede cambiar `record_hash` sin cambiar `process_hash`.

C3.2 genera además `dataset_fingerprint` como SHA-256 de los `record_hash` observados en el recorrido completo. El CLI muestra ese fingerprint pero no imprime PII.

## 7. Fail-closed

Bloqueos del parser:

- `BLOCK_SOURCE / APEX_REPORT_NOT_FOUND`;
- `BLOCK_SOURCE / APEX_LOGIN_PAGE`;
- `BLOCK_SOURCE / APEX_SESSION_EXPIRED`;
- `BLOCK_SOURCE / APEX_ORACLE_ERROR`;
- `BLOCK_PARSE / REQUIRED_COLUMN_MISSING`;
- `BLOCK_PARSE / ROW_COUNT_MISMATCH`.

Bloqueos adicionales del capturador:

- `DEVTOOLS_PORT_INVALID` / `DEVTOOLS_PORT_FILE_MISSING`;
- `CONAPE_TAB_NOT_FOUND`;
- `APEX_REPORT_TIMEOUT`;
- `PAGINATION_LOOP`;
- `PAGINATION_TIMEOUT`;
- `PAGINATION_CLICK_BLOCKED`;
- `PAGINATION_TOTAL_CHANGED`;
- `PAGINATION_TOTAL_MISMATCH`;
- `MAX_PAGES_EXCEEDED`.

Warnings no bloqueantes del parser:

- `OPTIONAL_COLUMN_MISSING`;
- `UNKNOWN_CONAPE_STATE`;
- `DUPLICATE_SOURCE_IDENTITY`;
- `INVALID_DATE`.

Un login, una sesión expirada o una paginación incompleta nunca deben interpretarse como un snapshot completo válido.

## 8. Evidencia y límites C3.1

C3.1 alcanza E1 sintética con fixtures anonimizados que reproducen la estructura visible del Interactive Report observada en navegador. No declara por sí solo E2 ni E3.

No hay escrituras a CONAPE, Apps Script, Sheets, Drive ni producción en C3.1.

## 9. Contrato C3.2 · captura autenticada read-only

El launcher Windows de C3.2:

1. crea un perfil Chromium temporal;
2. abre `online.conape.go.cr` en modo incógnito;
3. expone CDP únicamente en `127.0.0.1` con puerto efímero;
4. espera que el propietario inicie sesión directamente en CONAPE;
5. conecta solo a una pestaña HTTPS del hostname exacto `online.conape.go.cr` y app APEX 302;
6. extrae en memoria el DOM renderizado;
7. entrega cada página al mismo parser C3.1;
8. recorre la paginación APEX usando solamente el control `Siguiente/Next` de la región del reporte;
9. valida fingerprints y, cuando APEX expone total, exige igualdad `total_reportado === filas_capturadas`;
10. imprime únicamente un resumen sin registros personales;
11. cierra el perfil dedicado y lo elimina al finalizar.

C3.2 no acepta credenciales por argumentos y no implementa login automático.

La interacción con `Siguiente/Next` cambia solamente la vista/paginación del Interactive Report; no es una mutación de datos de negocio.

## 10. Nivel de evidencia C3.2

CI demuestra E1 para:

- selección estricta de host/app;
- redacción de session/cookies/authorization;
- parseo de `DevToolsActivePort`;
- agregación multipágina;
- detección de loop/mismatch de paginación;
- salida resumida sin PII;
- sintaxis Node/PowerShell.

Solo una ejecución local exitosa del propietario contra una sesión oficial puede registrarse como **E2 AUTENTICADA LECTURA**.

Hasta esa ejecución no se declara que el portal real completo fue capturado ni que la paginación real coincide con la estructura sintética.

## 11. Fuera de alcance hasta superar E2

- persistencia `CONAPE_PORTAL_ACTUAL/EVENTOS/RUNS`;
- comparación con prospectos/estudiantes del Campus;
- mapeo automático estado CONAPE -> etapa comercial;
- polling programado;
- UI Ventas/Admin;
- login automático;
- escritura en CONAPE;
- Apps Script, Sheets o Drive.
