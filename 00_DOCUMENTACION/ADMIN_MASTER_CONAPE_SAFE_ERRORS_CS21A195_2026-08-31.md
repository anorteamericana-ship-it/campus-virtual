# CS21A195 · Panel Maestro CONAPE · errores seguros

Fecha: 2026-08-31

## Base
- PR #210 / `security/admin-private-certificate-delivery-cs21a194`
- base exacta: `c2cfcf7a20335bac19dea2ae82f751374e71fc1d`
- `main` observado: `53df524d0a9eab867d3b307b3e633f366af92a63`

## Hallazgo
El Panel Maestro CONAPE no conserva aperturas de documentos por URL, pero su frontera de estado sí propagaba mensajes técnicos a UI desde errores lanzados por `post()`.

Rutas demostradas:
1. verificación manual de morosidad;
2. actualización del Panel Maestro;
3. carga del comentario/seguimiento de estudiante;
4. guardado del comentario/seguimiento;
5. guardado del semáforo de revisión.

El transporte `post()` puede producir mensajes como respuesta inválida de Apps Script, nombre de operación o detalles del backend. Esos datos son útiles para consola/diagnóstico, no para la interfaz operativa.

## Cambio
Se introduce `masterConapeSafeUserError(raw, fallback, context)` en el core compartido y se consume en data/review-state.

La regla:
- conserva mensajes humanos de negocio;
- oculta códigos técnicos, HTTP, red, Apps Script/backend, nombres de endpoint, tokens, JSON y excepciones;
- registra el detalle oculto en `console.warn`;
- usa copy operativo estable por contexto.

## No cambia
- `post()` ni sus endpoints/payload/token;
- polling de morosidad;
- refrescos;
- edición de comentario;
- semáforo colaborativo;
- lógica especial cuando una revisión ya está cerrada;
- CONAPE, pagos o datos;
- Apps Script;
- Drive ACL;
- `main` o producción.

## Fuera de alcance
Copy técnico no-error como `7-morosidad oficial` se tratará en un corte separado para mantener seguridad y redacción desacopladas.

## Estado
**SOURCE SAFE-ERROR BOUNDARY · BUSINESS LOGIC UNCHANGED · NO PROD · NO AUTO-MERGE**