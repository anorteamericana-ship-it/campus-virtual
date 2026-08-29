# CS21A174 · SEC-002 · identidad histórica · contrato de migración · 2026-08-29

## Base

- PR base: #145
- base exacta: `7348a29db65d12d6c2a8a566662bd967579f59f7`
- `main` observado: `53df524d0a9eab867d3b307b3e633f366af92a63`

## Hallazgo

El barrido posterior a CS21A173 confirmó que los documentos históricos de identidad siguen teniendo consumidores directos de URL Drive/LH3:

1. `src/ventas_parts.jsx` — `DocsBlock` / `VxDocPhoto`;
2. `src/matriculas_admin.jsx` — bloque `Documentos adjuntos` / `MatDocPhoto`.

Los campos son:

- `FOTO_CED_FRENTE` / `foto_ced_frente`;
- `FOTO_CED_DORSO` / `foto_ced_dorso`;
- `FOTO_TITULO` / `foto_titulo`.

Ambas superficies reconstruyen candidatos `drive.google.com/thumbnail`, `uc?export=view` y `lh3.googleusercontent.com/d/...` a partir del mismo Drive ID.

## Por qué es SEC-002 y no un bug visual aislado

La matriz histórica de PR #110 ya clasificaba `student_identity_and_title_images` como una clase pendiente, con destino `staff-authorized expediente+document_type -> Blob/ObjectURL`.

PR #118 / PROD @419 resolvió el **nuevo flujo de inscripción** para documentos capturados allí. Este corte no reabre ni reemplaza @419: se refiere únicamente a objetos/consumidores históricos que todavía llegan como URL.

El rastreo actual agrega una corrección de inventario importante: la matriz histórica señalaba Matrículas Admin, pero la app de Ventas también consume esos mismos tres campos directamente.

## Regla de seguridad

**No retirar ACL primero y no apagar el consumidor antes de tener entrega privada operativa.**

El orden sigue siendo:

1. export fresco del Apps Script QA modular actual según Issue #111;
2. endpoint mínimo privado autenticado;
3. autorización de rol + scope en servidor;
4. lookup de objeto histórico por expediente/cédula + tipo documental;
5. respuesta sin URL pública, con base64/MIME/tamaño/hash;
6. frontend QA por Blob/ObjectURL temporal;
7. E2 positiva/negativa para Ventas y Admin;
8. migración de objetos existentes;
9. recién entonces prueba de retirada ACL sobre copias QA;
10. PROD en release separado.

## Contrato propuesto

Operación lógica: `descargarDocumentoIdentidadPrivado`.

No existe/instala en este corte. Es un nombre de contrato para el futuro port modular, no una afirmación de runtime.

Entrada lógica:

- sesión/token;
- expediente o cédula;
- `document_type`: `CEDULA_FRENTE`, `CEDULA_DORSO`, `TITULO`.

El servidor debe derivar actor/rol desde sesión y comprobar el scope. El browser nunca debe elegir un Drive ID arbitrario.

Salida privada:

- `data_base64`;
- `mime_type`;
- `size_bytes`;
- `sha256`;
- nombre lógico opcional;
- **sin URL Drive pública**.

## Hallazgo funcional adicional en Ventas

El botón legacy `Subir manualmente` de un slot de identidad no reemplaza realmente ese slot:

- `triggerUpload(docKey)` recuerda `foto_ced_*` solo en estado local;
- `onFilePicked` llama siempre `subirDocumentoExtra(...)`;
- si la llamada sale bien, pinta el `base64` en `[docKey]` únicamente en React;
- al recargar, el archivo pertenece a `docs_extra`, no a `FOTO_CED_*`.

Por tanto, la UI no debe declarar que existe reemplazo persistente del documento de identidad hasta definir un endpoint autenticado específico. Este corte documenta el bug; no inventa una escritura backend.

## Cambio source deliberadamente mínimo

Se reemplaza únicamente documentación/comentarios que recomendaban como “fix de fondo” publicar archivos o usar `setSharing` público. El comportamiento legacy permanece igual temporalmente para no romper operación antes del endpoint privado.

Los comentarios nuevos dejan explícito:

- acceso directo Drive/LH3 = deuda legacy SEC-002;
- no ampliar permisos públicos;
- no retirar ACL hasta migrar consumidor;
- Issue #111 manda el backend.

## Evidencia / guard

`security/sec002_identity_legacy_contract_cs21a174.json` registra:

- ambos consumidores actuales;
- clase documental;
- autorización esperada;
- target privado;
- gates runtime;
- bug de carga manual.

`scripts/qa_sec002_identity_legacy_contract_cs21a174.mjs` bloquea regresiones de documentación que vuelvan a recomendar ACL pública y exige que ambos consumidores permanezcan inventariados mientras el runtime siga legacy.

## Estado

**CONTRACT/ANTI-REGRESSION ONLY · LEGACY RUNTIME STILL PUBLIC-URL DEPENDENT · BACKEND PRIVATE ENDPOINT PENDING · ACL UNCHANGED · NO PROD.**
