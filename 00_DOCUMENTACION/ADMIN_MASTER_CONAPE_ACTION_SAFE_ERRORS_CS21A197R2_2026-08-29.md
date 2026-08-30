# CS21A197R2 · Panel Maestro CONAPE · errores seguros en acciones

Fecha: 2026-08-29
Estado: DRAFT / source candidate / NO PROD
Base: PR #182 · `fix/admin-master-conape-user-copy-cs21a196r2` · `bb77234a660b999027d446f77b668230eff9eb01`

## Hallazgos demostrados
Dos módulos activos del Panel Maestro todavía llevaban detalle técnico a UI:

1. `admin_master_conape_wa_cs21a96.jsx`:
   - al fallar la preparación de WhatsApp mostraba `e.message` concatenado en `alert`.

2. `admin_master_conape_review_state_cs21a96.jsx`:
   - al fallar `setConapeRevisionSemaforo` mostraba `error.message` directamente mediante `setMsg`.

## Cambio
Ambos módulos reutilizan `masterConapeSafeUserError` definido en CS21A194R2.

### WhatsApp
Se conserva:
- popup preventivo;
- lectura opcional `getEstudiante`;
- cálculo de monto/periodo;
- URL `wa.me` y plantilla.

Solo cambia el texto visible de la excepción a un fallback estable.

### Semáforo colaborativo
Se conserva de forma deliberada la inspección interna:
`clean(error?.message).toLowerCase().includes('cerrado')`
porque determina si la UI debe resetear el paso a 0 cuando el movimiento ya fue cerrado por otra operación/persona.

Después de esa decisión, el mensaje visible se sanea con fallback estable. Así no se pierde lógica de concurrencia y tampoco se muestra diagnóstico técnico.

## No cambia
- endpoints `getEstudiante` / `setConapeRevisionSemaforo`;
- payloads;
- plantillas WhatsApp;
- semáforo/pasos;
- reconciliación remota;
- polling;
- CS21A196R2 copy;
- CS21A195R2 truthful refresh;
- Apps Script, Drive ACL ni producción.

**DRAFT · ACTION ERROR BOUNDARY ONLY · NO BUSINESS LOGIC CHANGE · NO PROD · NO AUTO-MERGE**
