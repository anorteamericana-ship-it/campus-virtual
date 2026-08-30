# CS21A196 · SEC-002 · Proformas actuales públicas por enlace

Fecha: 2026-08-29
Base exacta: PR #187 / `d374164af09ec2b7c8c8d05a564ba02dfa503945`
Tipo: **CONTRACT / AUDIT ONLY**
Severidad: **P1 · OPEN BLOCKER**

## Hallazgo actual demostrado

Se localizaron proformas PDF reales creadas entre el 28 y 29 de agosto de 2026 y se leyó metadata de Drive para tres muestras.

Resultado:

- 3 muestras revisadas;
- 3/3 `shared:true`;
- 3/3 permiso `type:anyone`, `role:reader`;
- `allowFileDiscovery:false`.

Por tanto, una persona que obtenga el enlace puede leer la proforma sin autenticarse en el Campus.

No se incluyen nombres, cédulas ni IDs de archivos en este documento de auditoría.

## Backend histórico compatible con el hallazgo

El backend acumulado histórico muestra:

- `generarProformaProspecto` genera `url_programa / url_equipo`;
- `_exportarHojaComoPDF` crea el PDF en Drive;
- inmediatamente ejecuta `file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW)`;
- devuelve una URL Drive pública por enlace.

No se demostró en ese backend una respuesta de bytes privados equivalente a CS21A193.

El snapshot modular fresco de Apps Script QA sigue pendiente en Issue #111.

## Estado frontend actual

CS21A175 / PR #147 ya redujo una parte importante del riesgo:

- Ventas ya no mete la URL de la proforma en el mensaje WhatsApp;
- Matrículas Admin tampoco;
- ambos muestran `WhatsApp · adjuntar PDF` y requieren adjuntar manualmente el archivo.

Sin embargo, el botón interno `Descargar` de ambas superficies sigue usando `href={url}` directo.

Por eso el archivo debe permanecer accesible por enlace mientras no exista una ruta privada staff-scoped; retirar ACL ahora rompería esos consumidores.

## Orden de migración

1. obtener snapshot modular QA fresco (#111);
2. definir entrega privada staff-scoped para proforma existente y recién generada;
3. devolver PDF autenticado/limitado sin depender de Drive URL pública;
4. migrar `Descargar` en Ventas y Matrículas Admin a bytes + Blob/ObjectURL;
5. E2 positivo/negativo para Sales según scope, admin, superadmin y no autorizado;
6. inventariar archivos/carpetas de proformas afectados por ACL pública;
7. retirar `anyone/reader` solo después de que ambos consumidores estén verdes;
8. verificar acceso anónimo denegado.

## No cambia

- frontend runtime;
- Apps Script;
- proformas existentes;
- Drive ACL;
- WhatsApp;
- producción.

## Gate

**BLOCK_UNTIL_PRIVATE_STAFF_DELIVERY_AND_ACL_MIGRATION_E2**

NO ACL CHANGE · NO PROD · NO AUTO-MERGE.
