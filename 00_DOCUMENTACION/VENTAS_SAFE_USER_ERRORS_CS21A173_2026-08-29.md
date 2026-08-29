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

Los mensajes de negocio y validaciones locales legibles sí se conservan: formato/tamaño de archivo, grupo obligatorio, monto, comprobante, ausencia de WhatsApp, prospecto no encontrado, etc.

### 2. Fallback demo en grupos reales

`useGruposVx()` tenía un fallback directo a `window.DEMO_GRUPOS` dentro del `catch` de la carga real.

Eso contradecía la política CS21A152: datos demo pueden existir en vista previa explícita, pero nunca sustituir datos operativos cuando falla el runtime real.

La corrección deja este contrato:

- `demo=true` → `DEMO_GRUPOS` permitido;
- runtime real + respuesta válida → grupos reales;
- runtime real + error/excepción → lista vacía, diagnóstico en consola y selector deshabilitado;
- nunca se inventa disponibilidad desde datos demo.

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
3. saneamiento de documentos privados, matrícula firmada, cobro, pagos, detalle y proformas;
4. ausencia de exposición directa de `e.message` en rutas privadas;
5. exactamente una referencia `setGrupos(window.DEMO_GRUPOS)`, correspondiente a `demo=true`;
6. fallo de grupos real => `setGrupos([])`;
7. selector vacío deshabilitado y explicado;
8. dashboard real no propaga `data.error`/`e.message` a la UI;
9. guard CS21A152 sigue presente e intacto.

## Estado

**SOURCE/QA ONLY · NO PROD · NO APPS SCRIPT · NO MERGE AUTOMÁTICO.**
