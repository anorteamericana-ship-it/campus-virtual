# CS21A196R · SEC-002 · proformas actuales públicas por enlace · rebase

Fecha: 2026-08-30 · Costa Rica

## Base

- PR base: #204 · `security/sec002-identity-evidence-rebase-cs21a195`
- SHA base exacta: `3e761af41c8bf10b869536cdac861af3489265e6`
- evidencia original: PR #188 / CS21A196
- tipo: **CONTRACT / AUDIT ONLY**
- severidad: **P1 · OPEN BLOCKER**

## Hallazgo actual demostrado

PR #188 revisó metadata real de tres proformas PDF creadas entre el 28 y 29 de agosto de 2026:

- 3/3 `shared:true`;
- 3/3 `type:anyone`, `role:reader`;
- `allowFileDiscovery:false`.

Una persona que obtenga el enlace puede leer la proforma sin autenticarse en el Campus.

No se incluyen nombres, cédulas ni IDs de archivos en este contrato.

## Backend histórico

El backend acumulado histórico muestra:

- `generarProformaProspecto` produce `url_programa / url_equipo`;
- `_exportarHojaComoPDF` crea el PDF en Drive;
- el exporter aplica `DriveApp.Access.ANYONE_WITH_LINK` + `DriveApp.Permission.VIEW`;
- devuelve URL Drive por enlace.

No se demostró una respuesta de bytes privados equivalente a CS21A193. El snapshot modular QA fresco sigue pendiente en Issue #111.

## Frontend actual

CS21A175 / PR #147 ya eliminó la propagación del enlace público por WhatsApp:

- Ventas: `WhatsApp · adjuntar PDF`;
- Matrículas Admin: `WhatsApp · adjuntar PDF`.

Pero los dos controles staff `Descargar` todavía dependen de `href={url}`. Quitar la ACL hoy rompería esos consumidores.

## Orden obligatorio

1. obtener snapshot modular QA fresco;
2. definir entrega privada staff-scoped para proforma existente y recién generada;
3. devolver PDF autenticado y acotado sin depender de URL Drive pública;
4. migrar `Descargar` en Ventas y Matrículas Admin a bytes + Blob/ObjectURL;
5. E2 positiva/negativa para Sales según scope, admin, superadmin y no autorizado;
6. inventariar archivos/carpetas de proformas afectados;
7. retirar `anyone/reader` solo después de que ambos consumidores estén verdes;
8. verificar acceso anónimo denegado.

## Gate

`BLOCK_UNTIL_PRIVATE_STAFF_DELIVERY_AND_ACL_MIGRATION_E2`

## No cambia

Frontend runtime, Apps Script, proformas, Drive ACL, WhatsApp ni producción.

**P1 OPEN · CONTRACT ONLY · NO ACL CHANGE · NO PROD · NO AUTO-MERGE**
