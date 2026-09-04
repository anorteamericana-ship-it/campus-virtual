# CS21A173 · Ventas · mensajes seguros + aislamiento de grupos · 2026-08-29

## Base

- candidato integrado: PR #141
- head exacto de base: `858be40ed7f40fa321b22b818087e28115fdf334`
- `main` observado: `53df524d0a9eab867d3b307b3e633f366af92a63`

## Problemas encontrados

### 1. Códigos técnicos visibles

El frontend de Ventas ya tenía copy general saneado, pero varias rutas específicas seguían mostrando directamente `r.error`, `r.mensaje` o `Error.message` del backend.

Esto podía convertir códigos de contrato como `integridad_*`, `respuesta_vacia`, `*_requeridos`, `file_id`, errores HTTP o detalles de transporte en texto visible para un asesor.

La corrección no elimina el diagnóstico: el detalle técnico se conserva en `console.warn`/`console.error`, mientras la interfaz recibe un mensaje de recuperación estable.

El filtro cubre además errores técnicos del navegador/red como `TypeError`, `ReferenceError`, `NetworkError`, `Failed to fetch` y equivalentes. Los mensajes de negocio y validaciones locales legibles sí se conservan: formato/tamaño de archivo, grupo obligatorio, monto, comprobante, ausencia de WhatsApp, prospecto no encontrado, etc.

### 2. Fallback demo en grupos reales

`useGruposVx()` tenía un fallback directo a `window.DEMO_GRUPOS` dentro del `catch` de la carga real.

Eso contradecía la política CS21A152: datos demo pueden existir en vista previa explícita, pero nunca sustituir datos operativos cuando falla el runtime real.

La corrección deja este contrato:

- `demo=true` → `DEMO_GRUPOS` permitido;
- runtime real + respuesta válida → grupos reales;
- runtime real + error/excepción → lista vacía, diagnóstico en consola y selector deshabilitado;
- nunca se inventa disponibilidad desde datos demo;
- si el prospecto traía un `grupo_tentativo` que ya no existe en la lista real —incluido el caso de error/lista vacía— la selección se limpia antes del submit.

Esto evita que una falla de carga deje reutilizar silenciosamente un grupo tentativo obsoleto al cobrar/activar.

## Alcance source

Solo:

- `src/ventas_drawer.jsx`
- `src/ventas_dashboard.jsx`

Más QA/documentación propia de CS21A173.

No cambia:

- Apps Script;
- datos;
- ACL;
- roles;
- endpoints;
- producción.

## Gate

`scripts/qa_ventas_safe_user_errors_cs21a173.mjs` comprueba, entre otros:

1. existencia del filtro visible `vxSafeUserError`;
2. que códigos técnicos queden en consola y no en toast/error visible;
3. cobertura de errores técnicos de navegador/red;
4. saneamiento de documentos privados, matrícula firmada, cobro, pagos, detalle y proformas;
5. ausencia de exposición directa de `e.message` en rutas privadas;
6. exactamente una referencia `setGrupos(window.DEMO_GRUPOS)`, correspondiente a `demo=true`;
7. fallo de grupos real => `setGrupos([])`;
8. grupo tentativo inexistente => selección limpiada;
9. selector vacío deshabilitado y explicado;
10. dashboard real no propaga `data.error`/`e.message` a la UI;
11. guard CS21A152 sigue presente e intacto.

## Evidencia local CI de rama

- bootstrap exact-preimage source patch: **SUCCESS**;
- revisión fail-closed de grupo tentativo + errores de navegador: **SUCCESS**;
- `QA Ventas Safe User Errors CS21A173` reforzado: **SUCCESS**.

## Estado

**SOURCE/QA ONLY · NO PROD · NO APPS SCRIPT · NO MERGE AUTOMÁTICO.**
