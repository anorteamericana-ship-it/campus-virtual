# CS21A166 · Prospectos/Ventas modern integration candidate · 2026-08-29

## Propósito

Demostrar que los cortes modernos de Prospectos/Ventas pueden convivir sobre una sola fuente antes de cualquier decisión de release.

Esta rama **NO es main**, **NO es PROD** y no autoriza merge/publicación.

## Base

La rama se creó desde PR #131 (`security/sec002-ventas-private-delivery-cs21a159`), que ya contenía la cadena moderna:

- #127 · REL-002 token + `scopeAsesor`;
- #128 · copy técnico seguro;
- #129 · retiro de excepción QA hardcodeada / `preview_test` operativo;
- #130 · separar llamada telefónica y WhatsApp;
- #131 · SEC-002 Ventas `docs_extra` + matrícula firmada privada en frontend.

Después se integraron, por merge explícito en esta rama no productiva:

- #123 · UX Prospectos/Ventas;
- #124 · aislamiento DEMO/QA;
- #125 · asesores reales desde `USUARIOS`.

Los tres merges se ejecutaron con `git merge --no-ff` y **no presentaron conflictos**.

## Invariantes combinadas verificadas antes de push

- `ventas.html` no referencia `design_system_05c.css` inexistente;
- `ventas.html` sí carga `ventas_runtime_guard_cs21a152.js`;
- `ventas_dashboard.jsx` conserva `getAsesoresActivos` y `scopeAsesor` en la misma fuente;
- `ventas_data.jsx` conserva token de sesión;
- `ventas_data.jsx` contiene consumidores privados `descargarDocumentoExtraPrivado` y `descargarMatriculaFirmadaPrivada`;
- `preview_test` no reaparece en `ventas_data.jsx`;
- `ventas_drawer.jsx` conserva acciones separadas `tel:` y `wa.me`;
- `ventas_parts.jsx` usa prioridad visible `whatsapp || telefono`.

El primer intento del workflow falló únicamente porque `git diff --check` marcó espacios finales deliberados usados como hard-break Markdown en una auditoría de #123. Los merges y las invariantes de source habían pasado. El segundo intento limitó `diff --check` a source/no documentación y terminó **SUCCESS** completo.

## QA combinada permanente

`scripts/qa_ventas_integration_cs21a166.mjs` ejecuta los siete guards heredados:

1. CS21A151 Prospectos/Ventas UX;
2. CS21A152 demo isolation;
3. CS21A153 asesores reales;
4. CS21A155 REL-002 Sales auth/scope;
5. CS21A157 no hardcoded QA;
6. CS21A158 call vs WhatsApp;
7. CS21A159 private document delivery frontend.

Además comprueba invariantes específicas de integración:

- advisors reales + `scopeAsesor` coexisten;
- no vuelve `preview_test`;
- no vuelven anchors públicos de `signedDoc.url` / `doc.url`;
- teléfono y WhatsApp siguen separados;
- tabla prioriza WhatsApp;
- copy técnico de Prospecto/App/Ventas no vuelve a exponerse;
- runtime guard de demo permanece cargado.

## Bloqueos que esta integración NO resuelve

### E2 Sales

Sigue faltando una cuenta/control QA para comprobar:

- mutación válida de asesor propio;
- denegación cross-advisor;
- Sales no puede activar estudiante;
- admin/superadmin cambian `scopeAsesor` y el mismo scope llega a dashboard, matrículas y drawer.

### SEC-002 backend

Los endpoints privados de documentos siguen pendientes en Apps Script QA. Issue #111 exige exportar primero el proyecto modular QA vigente. No se retiró ACL pública todavía.

### Preview/demo datasets

Los datasets DEMO pueden seguir existiendo como fixtures explícitos de diseño. La integración únicamente garantiza que no sustituyan silenciosamente datos reales en runtime operativo.

## Estado

**INTEGRATION SOURCE CANDIDATE · NON-PROD · MERGES CLEAN · COMBINED QA TO RUN · E2 SALES PENDING · SEC-002 BACKEND PENDING · NO MAIN MERGE AUTHORIZED**
