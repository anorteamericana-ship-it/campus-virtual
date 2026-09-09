# C3 · CONAPE PORTAL · contrato de integración

**Estado:** DISEÑO + C3.1 SOURCE/QA ONLY
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

C3.1 no crea ninguna de esas tablas: solo define el contrato de lectura/parser.

## 3. Arquitectura objetivo

`Portal CONAPE -> capturador privado -> parser C3.1 -> normalizador -> snapshot/eventos -> backend Campus -> Ventas/Admin`

El capturador/autenticación se diseña en C3.2. C3.1 no contiene login, password, cookies, `p_instance`, session ni `p_request` persistentes.

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

## 7. Fail-closed

Bloqueos:

- `BLOCK_SOURCE / APEX_REPORT_NOT_FOUND`;
- `BLOCK_SOURCE / APEX_LOGIN_PAGE`;
- `BLOCK_SOURCE / APEX_SESSION_EXPIRED`;
- `BLOCK_SOURCE / APEX_ORACLE_ERROR`;
- `BLOCK_PARSE / REQUIRED_COLUMN_MISSING`;
- `BLOCK_PARSE / ROW_COUNT_MISMATCH`.

Warnings no bloqueantes:

- `OPTIONAL_COLUMN_MISSING`;
- `UNKNOWN_CONAPE_STATE`;
- `DUPLICATE_SOURCE_IDENTITY`;
- `INVALID_DATE`.

Un login o una sesión expirada nunca debe interpretarse como `0 prospectos`.

## 8. Evidencia y límites

C3.1 alcanza E1 sintética con fixtures anonimizados que reproducen la estructura visible del Interactive Report observada en navegador. No declara E2 ni E3: todavía no existe captura automatizada autenticada ni comparación completa contra el reporte real.

No hay escrituras a CONAPE, Apps Script, Sheets, Drive ni producción en C3.1.
